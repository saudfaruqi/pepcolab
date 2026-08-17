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
import { sendMailSafe } from '@/lib/mailer'
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from '@/lib/orderEmails'

const ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'

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

  // Dedup check happens up front (cheap, avoids reprocessing true
  // duplicates), but marking a webhookId as processed is deferred until
  // after we know order creation actually succeeded — see syncFailed
  // below. Previously this was marked processed immediately on receipt,
  // which meant a failed order-creation attempt could never actually be
  // retried: STRABL's retry of the same webhookId would just hit this
  // dedup check and get silently swallowed as a "duplicate" — the 500
  // response was retried, but the retry never did any real work.
  if (webhookId && processedIds.has(webhookId)) {
    return new NextResponse(null, { status: 204 })
  }

  if (processedIds.size > 1000) {
    const toDelete = Math.floor(processedIds.size / 2)
    let count = 0
    for (const id of processedIds) {
      if (count >= toDelete) break
      processedIds.delete(id)
      count++
    }
  }

  let syncFailed = false

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

  // Shared by order_created/updated, order_failed, and order_abandoned —
  // all three now create a real Shopify order (see below), just with
  // different financial_status/tags, so this extraction avoids writing
  // the same address/line-item mapping three times.
  const buildShopifyOrderInputs = () => {
    const shippingAddress = customerUpdate.shipping || {}

    const lineItems = (orderUpdate.products || []).map((item: any) => {
      let variantId = item.externalVariantId || item.externalProductId || ''
      if (variantId.includes('gid://')) {
        const match = variantId.match(/(\d+)$/)
        if (match) variantId = match[1]
      }
      return { variant_id: variantId, quantity: item.quantity || 1 }
    })

    const email = customerUpdate.email || ''
    const phone = customerUpdate.phoneNumber || ''
    const address1 = shippingAddress.address_1 || ''
    const address2 = shippingAddress.address_2 || ''
    const city = shippingAddress.city || ''
    const postalCode = shippingAddress.postcode || ''
    const countryCode = shippingAddress.country || 'AE'
    const firstName = customerUpdate.firstName || shippingAddress.first_name || ''
    const lastName = customerUpdate.lastName || shippingAddress.last_name || ''

    return {
      lineItems,
      countryCode,
      customerInfo: {
        email,
        firstName,
        lastName,
        shippingAddress: { address1, address2, city, postalCode, countryCode },
        phone,
      },
    }
  }

  switch (type) {
    case 'order_created':
    case 'order_updated': {
      try {
        const { lineItems, countryCode, customerInfo } = buildShopifyOrderInputs()

        if (lineItems.length === 0) {
          console.warn('[webhook] No line items in STRABL order, skipping')
          break
        }
        if (!customerInfo.email) console.warn('[webhook] No customer email found in STRABL order')

        const shopifyOrder = await createShopifyOrder(
          lineItems,
          countryCode,
          customerInfo,
          orderShortCode
        )

        await markShopifyOrderPaid(shopifyOrder.id, orderUuid)
        const record = buildOrderRecord(type === 'order_created' ? 'created' : 'updated')
        await saveOrderRecord(record)

        // This is the actual fix for "how does the customer find their
        // order code again" — it previously only ever appeared transiently
        // on STRABL's own post-checkout page. checkout/success has always
        // claimed "you'll receive a confirmation email shortly"; now it's
        // true. Best-effort — a failed email should never fail the webhook
        // itself (the order is already real either way).
        if (record.email) {
          await sendOrderConfirmationEmail({
            to: record.email,
            orderShortCode: record.orderShortCode,
            products: record.products,
            total: record.total,
            currency: record.currency,
          })
        }
      } catch (err: any) {
        console.error('[webhook] ❌ Failed to create Shopify order:', err.message, err.stack)
        syncFailed = true

        // This is the important one: STRABL has already taken the
        // customer's money at this point, but the Shopify order — the
        // thing that actually gets it packed and shipped — doesn't exist.
        // This has to reach a human, not just a log line, or the order
        // silently vanishes until the customer complains.
        await sendMailSafe({
          to: ALERT_EMAIL,
          subject: `⚠️ Order sync FAILED — payment taken, no Shopify order (${orderShortCode || orderUuid})`,
          text: `A STRABL payment succeeded but creating the Shopify order failed. The customer HAS been charged — this order needs to be created manually.

STRABL order: ${orderShortCode || '(no short code)'}
STRABL order UUID: ${orderUuid || '(none)'}
Customer email: ${customerUpdate.email || '(none)'}
Customer name: ${[customerUpdate.firstName, customerUpdate.lastName].filter(Boolean).join(' ') || '(none)'}
Products: ${JSON.stringify(orderUpdate.products || [], null, 2)}

Error: ${err.message}

STRABL will retry this webhook automatically (it received a 500). If retries keep failing, check the Shopify admin token, variant IDs, and API status, then create this order manually in Shopify and mark it paid (gateway: STRABL, message referencing the order UUID above).`,
        })
      }
      break
    }

    case 'order_failed': {
      // This is the field we've been missing entirely — STRABL's own stated
      // reason for the failure, straight from their backend, no guessing.
      console.error(
        `[webhook] ⚠️ Payment failed — strabl:${orderUuid} — reason: ${orderUpdate.failureReason} — meta:`,
        JSON.stringify(orderUpdate.meta)
      )
      const failedRecord = buildOrderRecord('failed')
      await saveOrderRecord(failedRecord)

      // Reassures the customer no money was taken and gives them the order
      // code + a track-order link, rather than leaving them wondering what
      // happened after being bounced off STRABL's checkout page.
      if (failedRecord.email) {
        await sendPaymentFailedEmail({
          to: failedRecord.email,
          orderShortCode: failedRecord.orderShortCode,
        })
      }

      // Also create a real Shopify order so failed attempts are visible in
      // the Orders list for follow-up, not just in /track-order. financial_
      // status 'voided' means no money was taken — Shopify's own sales
      // reports exclude voided orders from revenue by default, so this
      // doesn't skew real numbers. Tagged 'strabl-failed' so it's easy to
      // filter out (or specifically find) in the admin.
      //
      // This is visibility, not a money-critical path — if it fails, log
      // and move on rather than alerting or blocking the webhook response
      // (unlike order_created/updated above, where a failure means a paid
      // order silently doesn't exist).
      try {
        const { lineItems, countryCode, customerInfo } = buildShopifyOrderInputs()
        if (lineItems.length > 0) {
          await createShopifyOrder(lineItems, countryCode, customerInfo, orderShortCode, {
            financialStatus: 'voided',
            extraTag: 'strabl-failed',
          })
        }
      } catch (err: any) {
        console.error('[webhook] Failed to create voided order for failed payment:', err.message)
      }
      break
    }

    case 'order_refunded':
      console.info(`[webhook] 🔄 Order refunded — strabl:${orderUuid}`)
      await saveOrderRecord(buildOrderRecord('refunded'))
      break

    case 'order_chargeback':
      console.info(`[webhook] 🔄 Chargeback — strabl:${orderUuid}`)
      await saveOrderRecord(buildOrderRecord('chargeback'))
      break

    case 'order_abandoned': {
      console.info(`[webhook] 🛒 Order abandoned — strabl order: ${orderShortCode}`)
      await saveOrderRecord(buildOrderRecord('abandoned'))

      // Same reasoning as order_failed above: real but voided Shopify
      // order, tagged for filtering, so abandoned carts are visible for
      // manual recovery follow-up (call/email the customer) instead of
      // only existing in server logs.
      try {
        const { lineItems, countryCode, customerInfo } = buildShopifyOrderInputs()
        if (lineItems.length > 0) {
          await createShopifyOrder(lineItems, countryCode, customerInfo, orderShortCode, {
            financialStatus: 'voided',
            extraTag: 'strabl-abandoned',
          })
        }
      } catch (err: any) {
        console.error('[webhook] Failed to create voided order for abandoned checkout:', err.message)
      }
      break
    }

    default:
      console.log(`[webhook] ⚠️ Unhandled event type: ${type}`)
  }

  if (syncFailed) {
    // Deliberately NOT added to processedIds — see comment above the dedup
    // check. Returning 500 tells STRABL this delivery didn't succeed, and
    // because we didn't mark it processed, the retry will actually attempt
    // order creation again instead of being swallowed as a duplicate.
    return NextResponse.json({ error: 'Order sync failed, will retry' }, { status: 500 })
  }

  if (webhookId) processedIds.add(webhookId)
  return new NextResponse(null, { status: 204 })
}