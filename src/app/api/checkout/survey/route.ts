// src/app/api/checkout/survey/route.ts
//
// POST from /checkout/success: { ref, items }
// Returns what Google Customer Reviews' opt-in needs for THIS order — order
// code, email, delivery country and an estimated delivery date — or 404
// while the STRABL webhook has not created the order yet (the page retries).
//
// Only a paid order created in the last 24 hours is ever returned, and only
// to a browser holding that checkout's reference, so this cannot be used to
// look up other customers' emails.
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { isPaidOrder } from '@/lib/orderStore'
import { cleanCheckoutRef, cleanCheckoutItems, resolveCheckoutOrder } from '@/lib/heardFrom'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

/** Two working days out, skipping Saturday and Sunday (UAE and UK weekends). */
function estimatedDelivery(from: Date): string {
  const d = new Date(from)
  let added = 0
  while (added < 2) {
    d.setUTCDate(d.getUTCDate() + 1)
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) added++
  }
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  if (isRateLimited('checkout-survey', getClientIp(req), 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const ref = cleanCheckoutRef(body?.ref)
  if (!ref) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const order = await resolveCheckoutOrder(ref, cleanCheckoutItems(body?.items))
  if (!order || !isPaidOrder(order) || !order.email || Date.now() - new Date(order.createdAt).getTime() > DAY_MS) {
    return NextResponse.json({ error: 'Not ready' }, { status: 404 })
  }

  const country = (order.shippingAddress?.countryCode || '').toUpperCase()
  return NextResponse.json({
    orderId: order.orderShortCode,
    email: order.email,
    deliveryCountry: /^[A-Z]{2}$/.test(country) ? country : 'AE',
    estimatedDeliveryDate: estimatedDelivery(new Date(order.createdAt)),
  })
}
