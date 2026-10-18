// src/app/api/checkout/heard-from/route.ts
//
// POST from /checkout/success: { ref, answer, detail?, items? }
// Joins the "How did you hear about us?" answer to the order — see
// lib/heardFrom.ts for how. First answer wins; an order that already has one
// is never overwritten.
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { saveOrderRecord } from '@/lib/orderStore'
import {
  HEARD_FROM_OPTIONS,
  cleanCheckoutRef,
  cleanCheckoutItems,
  resolveCheckoutOrder,
  savePendingHeardFrom,
  type HeardFrom,
} from '@/lib/heardFrom'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (isRateLimited('heard-from', getClientIp(req), 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const ref = cleanCheckoutRef(body?.ref)
  const answer = typeof body?.answer === 'string' ? body.answer : ''
  if (!ref || !HEARD_FROM_OPTIONS.some((o) => o.value === answer)) {
    return NextResponse.json({ error: 'Invalid answer.' }, { status: 400 })
  }
  const detail =
    answer === 'other' && typeof body?.detail === 'string'
      ? body.detail.replace(/[<>]/g, '').trim().slice(0, 120) || undefined
      : undefined
  const value: HeardFrom = { answer, ...(detail ? { detail } : {}), at: new Date().toISOString() }

  const order = await resolveCheckoutOrder(ref, cleanCheckoutItems(body?.items), (o) => Boolean(o.heardFrom))
  if (order) {
    if (!order.heardFrom) {
      await saveOrderRecord({ ...order, heardFrom: value, checkoutRef: order.checkoutRef || ref, updatedAt: new Date().toISOString() })
    }
    return NextResponse.json({ ok: true })
  }

  // The order is not in yet: leave the answer for the webhook.
  await savePendingHeardFrom(ref, value)
  return NextResponse.json({ ok: true, pending: true })
}
