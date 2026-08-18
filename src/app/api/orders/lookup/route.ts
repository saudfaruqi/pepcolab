// src/app/api/orders/lookup/route.ts
//
// No login, no session. Customer proves ownership of the order by knowing
// BOTH the STRABL order short code AND the email it was placed under —
// same trust model as most airline/parcel "track my order" pages.
//
// Deliberately returns the same generic error whether the code doesn't
// exist or the email doesn't match, so this can't be used to enumerate
// valid order codes or confirm which email an order belongs to.
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord } from '@/lib/orderStore'

// Best-effort in-memory rate limit — same pattern/caveat as the webhook
// route's processedIds dedup: fine for a single instance, resets on
// redeploy, not a substitute for real rate limiting at the edge if this
// ever gets abused. Good enough to stop casual brute-forcing of 6-char
// STRABL codes.
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 10
const WINDOW_MS = 10 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  entry.count += 1
  if (entry.count > MAX_ATTEMPTS) return true

  if (attempts.size > 5000) {
    for (const [key, val] of attempts) {
      if (now > val.resetAt) attempts.delete(key)
    }
  }

  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again in a few minutes.' },
      { status: 429 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const orderCode = String(body.orderCode || '').trim()
  const email = String(body.email || '').trim().toLowerCase()

  if (!orderCode || !email) {
    return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 })
  }

  const record = await getOrderRecord(orderCode)

  const GENERIC_NOT_FOUND = {
    error: "We couldn't find an order matching that order number and email.",
  }

  if (!record || record.email !== email) {
    return NextResponse.json(GENERIC_NOT_FOUND, { status: 404 })
  }

  // Only return what a customer needs to see — no internal ids, no full
  // shipping address (which the webhook payload does contain). variantId
  // is fine to include: it's a public Shopify catalog reference, not PII,
  // and is what lets /track-order offer a real "add to cart" reorder
  // action instead of only display.
  return NextResponse.json({
    order: {
      orderShortCode: record.orderShortCode,
      status: record.status,
      failureReason: record.failureReason || null,
      customerName: record.customerName || null,
      products: record.products,
      currency: record.currency,
      total: record.total,
      createdAt: record.createdAt,
    },
  })
}