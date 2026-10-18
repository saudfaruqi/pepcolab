// src/app/api/checkout/heard-from/route.ts
//
// POST from /checkout/success: { ref, answer, detail?, items? }
// Joins the "How did you hear about us?" answer to the order — see
// lib/heardFrom.ts for how. First answer wins; an order that already has one
// is never overwritten.
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { getOrderRecord, getRecentOrders, saveOrderRecord, type OrderRecord } from '@/lib/orderStore'
import {
  HEARD_FROM_OPTIONS,
  cleanCheckoutRef,
  orderForCheckoutRef,
  savePendingHeardFrom,
  type HeardFrom,
} from '@/lib/heardFrom'

export const dynamic = 'force-dynamic'

const MATCH_WINDOW_MS = 6 * 60 * 60 * 1000

function itemKey(items: { name: string; quantity: number }[]): string {
  return items
    .map((i) => `${i.name.trim().toLowerCase()}×${Math.max(1, Math.round(i.quantity))}`)
    .sort()
    .join('|')
}

async function attach(order: OrderRecord, value: HeardFrom, ref: string): Promise<boolean> {
  if (order.heardFrom) return false
  await saveOrderRecord({ ...order, heardFrom: value, checkoutRef: order.checkoutRef || ref, updatedAt: new Date().toISOString() })
  return true
}

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

  // 1. The webhook already linked this checkout to an order.
  const code = await orderForCheckoutRef(ref)
  if (code) {
    const order = await getOrderRecord(code)
    if (order) {
      await attach(order, value, ref)
      return NextResponse.json({ ok: true })
    }
  }

  // 2. Fallback: a unique recent order with exactly these items, not yet
  //    answered and not linked to a different checkout.
  const items: { name: string; quantity: number }[] = Array.isArray(body?.items)
    ? body.items
        .slice(0, 30)
        .filter((i: any) => typeof i?.name === 'string' && i.name.trim())
        .map((i: any) => ({ name: String(i.name).slice(0, 200), quantity: Number(i.quantity) || 1 }))
    : []
  if (items.length) {
    const key = itemKey(items)
    const since = Date.now() - MATCH_WINDOW_MS
    const recent = await getRecentOrders(40)
    const matches = recent.filter(
      (o) =>
        new Date(o.createdAt).getTime() >= since &&
        !o.heardFrom &&
        !o.topUpFor &&
        (!o.checkoutRef || o.checkoutRef === ref) &&
        itemKey(o.products.map((p) => ({ name: p.title, quantity: p.quantity }))) === key
    )
    if (matches.length === 1) {
      await attach(matches[0], value, ref)
      return NextResponse.json({ ok: true })
    }
  }

  // 3. The order is not in yet: leave the answer for the webhook.
  await savePendingHeardFrom(ref, value)
  return NextResponse.json({ ok: true, pending: true })
}
