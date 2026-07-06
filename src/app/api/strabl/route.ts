// app/api/strabl/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createPaidShopifyOrder, type AdminLineItemInput } from '@/lib/shopifyAdmin'
import { getPendingCheckout, deletePendingCheckout } from '@/lib/checkoutSession'
import { markCheckoutComplete, markCheckoutFailed } from '@/lib/checkoutStatus' // new, see #4

const processedIds = new Set<string>()

function numericVariantId(gid: string): string {
  const match = gid.match(/(\d+)$/)
  if (!match) throw new Error(`Invalid variant gid: ${gid}`)
  return match[1]
}

function verifySignature(rawBody: string, signatureHeader: string) {
  const secret = process.env.STRABL_WEBHOOK_SECRET
  if (!secret) return
  if (!signatureHeader) throw new Error('Missing X-Client-Signature header')

  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('base64')
  const expectedBuf = Buffer.from(expected)
  const receivedBuf = Buffer.from(signatureHeader)

  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    throw new Error('Webhook signature mismatch')
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-client-signature') || ''

  try {
    verifySignature(rawBody, signature)
  } catch (err: any) {
    console.warn('[webhook] rejected:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, orderUpdate = {}, customerUpdate = {} } = event
  const orderUuid = orderUpdate.orderUuid
  const checkoutRef: string | undefined = orderUpdate.extra?.checkoutRef

  const dedupeKey = `${orderUuid}:${type}`
  if (processedIds.has(dedupeKey)) return new NextResponse(null, { status: 204 })
  processedIds.add(dedupeKey)

  console.log('[webhook raw]', rawBody)
  console.log(`[webhook] type=${type} strabl=${orderUuid} ref=${checkoutRef || 'n/a'} paymentStatus=${orderUpdate.paymentStatus}`)

  switch (type) {
    case 'order_created':
      console.log(`[webhook] checkout started — strabl:${orderUuid} ref:${checkoutRef || 'n/a'}`)
      break

    case 'order_updated': {
      const isPaid = orderUpdate.paymentStatus?.toLowerCase() === 'paid'
      if (!isPaid) {
        console.log(`[webhook] order_updated — paymentStatus=${orderUpdate.paymentStatus} — not creating order`)
        break
      }
      if (!checkoutRef) {
        console.error('[webhook] paid event with no checkoutRef')
        return NextResponse.json({ error: 'Missing checkoutRef' }, { status: 400 })
      }

      const pending = getPendingCheckout(checkoutRef)
      if (!pending) {
        console.error('[webhook] no pending checkout for ref', checkoutRef)
        return NextResponse.json({ error: 'Unknown or expired checkout session' }, { status: 404 })
      }

      try {
        const lineItems: AdminLineItemInput[] = pending.lines.map(l => ({
          variant_id: numericVariantId(l.variantId),
          quantity: l.quantity,
        }))
        const order = await createPaidShopifyOrder(lineItems, pending.country, customerUpdate, orderUuid)
        deletePendingCheckout(checkoutRef)
        markCheckoutComplete(checkoutRef, order.id)
        console.log(`[webhook] order created — shopify:${order.id} strabl:${orderUuid}`)
      } catch (err) {
        console.error('[webhook] order create failed:', err)
        return NextResponse.json({ error: 'Shopify order create failed' }, { status: 500 })
      }
      break
    }

    case 'order_failed':
      if (checkoutRef) markCheckoutFailed(checkoutRef)
      console.warn(`[webhook] payment failed — strabl:${orderUuid} ref:${checkoutRef || 'n/a'}`)
      break

    case 'order_cancelled':
    case 'order_refunded':
    case 'order_chargeback':
    case 'order_abandoned':
      console.info(`[webhook] ${type} — strabl:${orderUuid} ref:${checkoutRef || 'n/a'}`)
      break

    default:
      console.log(`[webhook] unhandled event: ${type}`)
  }

  return new NextResponse(null, { status: 204 })
}