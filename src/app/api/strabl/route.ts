import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { markShopifyOrderPaid } from '@/lib/shopifyAdmin'

const processedIds = new Set<string>() // swap for Redis/DB in production

function verifyWebhook(webhookId: string, timestamp: string, signature: string, rawBody: string) {
  const secret = process.env.STRABL_WEBHOOK_SECRET
  if (!secret) return // skip verification only if explicitly unset

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
    console.warn('[webhook] rejected:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (processedIds.has(webhookId)) {
    return new NextResponse(null, { status: 204 })
  }
  processedIds.add(webhookId)

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { webhookEventType, orderUuid, payload = {} } = event
  const shopifyOrderId = payload.extra?.shopifyOrderId

  console.log(`[webhook] type=${webhookEventType} strabl=${orderUuid} shopify=${shopifyOrderId || 'n/a'}`)

  switch (webhookEventType) {
    case 'order_created':
    case 'order_updated':
      if (shopifyOrderId) {
        try {
          await markShopifyOrderPaid(shopifyOrderId, orderUuid)
        } catch (err) {
          console.error('[webhook] mark paid failed:', err)
          return NextResponse.json({ error: 'Shopify update failed' }, { status: 500 })
        }
      }
      break
    case 'order_failed':
      console.warn(`[webhook] payment failed — strabl:${orderUuid} shopify:${shopifyOrderId}`)
      break
    case 'order_refunded':
    case 'order_chargeback':
    case 'order_abandoned':
      console.info(`[webhook] ${webhookEventType} — strabl:${orderUuid}`)
      break
    default:
      console.log(`[webhook] unhandled event: ${webhookEventType}`)
  }

  return new NextResponse(null, { status: 204 })
}