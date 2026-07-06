// src/app/api/strabl/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createShopifyOrder, markShopifyOrderPaid } from '@/lib/shopifyAdmin'

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

  // Verify webhook signature
  try {
    verifyWebhook(webhookId, timestamp, signature, rawBody)
  } catch (err: any) {
    console.warn('[webhook] Verification rejected:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Deduplicate webhook events
  if (processedIds.has(webhookId)) {
    return new NextResponse(null, { status: 204 })
  }
  processedIds.add(webhookId)

  // Clean up old processed IDs occasionally (keep last 1000)
  if (processedIds.size > 1000) {
    const toDelete = Math.floor(processedIds.size / 2)
    let count = 0
    for (const id of processedIds) {
      if (count >= toDelete) break
      processedIds.delete(id)
      count++
    }
  }

  // Parse webhook payload
  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { webhookEventType, orderUuid, payload = {} } = event

  switch (webhookEventType) {
    case 'order_created':
    case 'order_updated':
      try {
        // Extract customer info from STRABL payload
        const customer = payload.customer || {}
        const shippingAddress = payload.shipping_address || {}
        const billingAddress = payload.billing_address || shippingAddress
        
        // Extract line items from STRABL payload
        const lineItems = payload.line_items?.map((item: any) => {
          // STRABL might send the variant ID in different formats
          let variantId = item.variant_id || item.variantId || item.productId || ''
          
          // If it's a GID, extract the numeric ID
          if (variantId.includes('gid://')) {
            const match = variantId.match(/(\d+)$/)
            if (match) {
              variantId = match[1]
            }
          }
          
          return {
            variant_id: variantId,
            quantity: item.quantity || 1,
          }
        }) || []

        if (lineItems.length === 0) {
          console.warn('[webhook] No line items in STRABL order, skipping')
          break
        }

        // Get customer email - try multiple sources
        const email = customer.email || payload.email || shippingAddress.email || ''

        if (!email) {
          console.warn('[webhook] No customer email found in STRABL order')
        }

        // Get phone number
        const phone = shippingAddress.phone || customer.phone || payload.phone || ''

        // Get shipping address
        const address1 = shippingAddress.address1 || shippingAddress.address || shippingAddress.line1 || ''
        const address2 = shippingAddress.address2 || shippingAddress.line2 || ''
        const city = shippingAddress.city || ''
        const postalCode = shippingAddress.postal_code || shippingAddress.postalCode || shippingAddress.zip || ''
        const countryCode = shippingAddress.country_code || shippingAddress.countryCode || shippingAddress.country || 'AE'
        const firstName = shippingAddress.first_name || shippingAddress.firstName || customer.first_name || customer.firstName || ''
        const lastName = shippingAddress.last_name || shippingAddress.lastName || customer.last_name || customer.lastName || ''

        // Create the order in Shopify with customer info from STRABL
        const shopifyOrder = await createShopifyOrder(
          lineItems,
          countryCode,
          {
            email: email,
            firstName: firstName,
            lastName: lastName,
            shippingAddress: {
              address1: address1,
              address2: address2,
              city: city,
              postalCode: postalCode,
              countryCode: countryCode,
            },
            phone: phone,
          }
        )

        // Mark as paid immediately (payment already happened on STRABL)
        await markShopifyOrderPaid(shopifyOrder.id, orderUuid)

      } catch (err: any) {
        console.error('[webhook] ❌ Failed to create Shopify order:', err.message, err.stack)
        return NextResponse.json({ 
          error: 'Shopify order creation failed',
          details: err.message 
        }, { status: 500 })
      }
      break

    case 'order_failed':
      console.warn(`[webhook] ⚠️ Payment failed — strabl:${orderUuid}`)
      // Log the failure for monitoring
      break

    case 'order_refunded':
      console.info(`[webhook] 🔄 Order refunded — strabl:${orderUuid}`)
      // Handle refund logic here if needed
      break

    case 'order_chargeback':
      console.info(`[webhook] 🔄 Chargeback — strabl:${orderUuid}`)
      // Handle chargeback logic here if needed
      break

    case 'order_abandoned':
      console.info(`[webhook] 🛒 Order abandoned — strabl:${orderUuid}`)
      // You might want to send an abandoned cart email
      break

    default:
      console.log(`[webhook] ⚠️ Unhandled event type: ${webhookEventType}`)
  }

  return new NextResponse(null, { status: 204 })
}