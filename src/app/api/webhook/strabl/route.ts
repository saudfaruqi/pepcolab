// src/app/api/webhook/strabl/route.ts
//
// MOVED HERE FROM src/app/api/strabl/route.ts.
// STRABL's dashboard has the webhook URL registered as
// https://www.pepcolab.com/api/webhook/strabl — but the old handler only
// existed at /api/strabl. Every webhook STRABL has ever sent (order_created,
// order_failed, everything) has been hitting a 404 on this server. Nothing
// here has ever run in production.
//
// Also fixed: the payload shape. The old handler destructured
// { webhookEventType, orderUuid, payload } — that doesn't match STRABL's
// documented schema at all. The real shape is:
//   { type, orderUpdate: { orderUuid, ..., failureReason?, meta? }, customerUpdate }
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createShopifyOrder, markShopifyOrderPaid } from '@/lib/shopifyAdmin'
import { saveOrderRecord, type OrderRecord } from '@/lib/orderStore'

// Use a Set for deduplication - in production, use Redis or similar
const processedIds = new Set<string>()

function verifyWebhook(webhookId: string, timestamp: string, signature: string, rawBody: string) {
  const secret = process.env.STRABL_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook] STRABL_WEBHOOK_SECRET not set, skipping verification')
    return // Skip verification if secret is not set (dev mode)
  }

  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    throw new Error('Webhook timestamp too old or invalid')
  }

  const signingInput = `${webhookId}.${timestamp}.${rawBody}`
  const expectedHex = crypto.createHmac('sha256', secret).update(signingInput).digest('hex')
  const expected = `v1=${expectedHex}`

  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    throw new Error('Webhook signature mismatch')
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const webhookId = req.headers.get('x-webhook-id') || ''
  const timestamp = req.headers.get('x-webhook-timestamp') || ''
  const signature = req.headers.get('x-webhook-signature') || ''

  try {
    verifyWebhook(webhookId, timestamp, signature, rawBody)
  } catch (err: any) {
    // TEMP DEBUG: log every header STRABL actually sends, so we can see
    // whether x-webhook-id / x-webhook-timestamp / x-webhook-signature are
    // even the right names, and what format the timestamp is really in
    // (seconds vs ms), instead of guessing. Remove once verification is
    // confirmed working.
    const allHeaders: Record<string, string> = {}
    req.headers.forEach((value, key) => { allHeaders[key] = value })
    console.warn('[webhook] Verification rejected:', err.message)
    console.warn('[webhook] DEBUG raw headers:', JSON.stringify(allHeaders, null, 2))
    console.warn('[webhook] DEBUG raw body:', rawBody.slice(0, 2000))
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (webhookId && processedIds.has(webhookId)) {
    return new NextResponse(null, { status: 204 })
  }
  if (webhookId) processedIds.add(webhookId)

  if (processedIds.size > 1000) {
    const toDelete = Math.floor(processedIds.size / 2)
    let count = 0
    for (const id of processedIds) {
      if (count >= toDelete) break
      processedIds.delete(id)
      count++
    }
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Real documented shape: { type, orderUpdate: {...}, customerUpdate: {...} }
  const { type, orderUpdate = {}, customerUpdate = {} } = event
  const orderUuid = orderUpdate.orderUuid
  const orderShortCode = orderUpdate.orderShortCode || ''

  // Builds the /track-order lookup record from whatever this event gave us.
  // Called for every event type below (including failures) so a customer
  // can look up an order regardless of how it ended — this is the piece
  // that was missing before: order_failed used to only log to the server
  // console, so a customer with a failed payment had literally nothing to
  // look up.
  const buildOrderRecord = (status: OrderRecord['status']): OrderRecord => {
    const products = (orderUpdate.products || []).map((item: any) => ({
      title: item.title || 'Product',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      variantOptions: item.extra || [],
    }))
    const total = products.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0)
    const firstName = customerUpdate.firstName || ''
    const lastName = customerUpdate.lastName || ''

    return {
      orderShortCode,
      orderUuid: orderUuid || '',
      status,
      failureReason: orderUpdate.failureReason || undefined,
      email: (customerUpdate.email || '').toLowerCase().trim(),
      customerName: [firstName, lastName].filter(Boolean).join(' ') || undefined,
      products,
      currency: 'AED', // STRABL webhook payloads observed so far are AED-only per merchant config
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  switch (type) {
    case 'order_created':
    case 'order_updated': {
      try {
        const shippingAddress = customerUpdate.shipping || {}

        const lineItems = (orderUpdate.products || []).map((item: any) => {
          let variantId = item.externalVariantId || item.externalProductId || ''
          if (variantId.includes('gid://')) {
            const match = variantId.match(/(\d+)$/)
            if (match) variantId = match[1]
          }
          return { variant_id: variantId, quantity: item.quantity || 1 }
        })

        if (lineItems.length === 0) {
          console.warn('[webhook] No line items in STRABL order, skipping')
          break
        }

        const email = customerUpdate.email || ''
        if (!email) console.warn('[webhook] No customer email found in STRABL order')

        const phone = customerUpdate.phoneNumber || ''
        const address1 = shippingAddress.address_1 || ''
        const address2 = shippingAddress.address_2 || ''
        const city = shippingAddress.city || ''
        const postalCode = shippingAddress.postcode || ''
        const countryCode = shippingAddress.country || 'AE'
        const firstName = customerUpdate.firstName || shippingAddress.first_name || ''
        const lastName = customerUpdate.lastName || shippingAddress.last_name || ''

        const shopifyOrder = await createShopifyOrder(
          lineItems,
          countryCode,
          {
            email,
            firstName,
            lastName,
            shippingAddress: { address1, address2, city, postalCode, countryCode },
            phone,
          },
          orderShortCode
        )

        await markShopifyOrderPaid(shopifyOrder.id, orderUuid)
        await saveOrderRecord(buildOrderRecord(type === 'order_created' ? 'created' : 'updated'))
      } catch (err: any) {
        console.error('[webhook] ❌ Failed to create Shopify order:', err.message, err.stack)
        return NextResponse.json(
          { error: 'Shopify order creation failed', details: err.message },
          { status: 500 }
        )
      }
      break
    }

    case 'order_failed':
      // This is the field we've been missing entirely — STRABL's own stated
      // reason for the failure, straight from their backend, no guessing.
      console.error(
        `[webhook] ⚠️ Payment failed — strabl:${orderUuid} — reason: ${orderUpdate.failureReason} — meta:`,
        JSON.stringify(orderUpdate.meta)
      )
      await saveOrderRecord(buildOrderRecord('failed'))
      break

    case 'order_refunded':
      console.info(`[webhook] 🔄 Order refunded — strabl:${orderUuid}`)
      await saveOrderRecord(buildOrderRecord('refunded'))
      break

    case 'order_chargeback':
      console.info(`[webhook] 🔄 Chargeback — strabl:${orderUuid}`)
      await saveOrderRecord(buildOrderRecord('chargeback'))
      break

    case 'order_abandoned':
      // Deliberately NOT saved to the lookup store — an abandoned cart was
      // never a real order attempt from the customer's point of view, and
      // surfacing it in /track-order would be confusing ("I never placed
      // this order").
      console.info(`[webhook] 🛒 Order abandoned — strabl order: ${orderShortCode}`)
      break

    default:
      console.log(`[webhook] ⚠️ Unhandled event type: ${type}`)
  }

  return new NextResponse(null, { status: 204 })
}