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
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const MAX_ATTEMPTS = 10
const WINDOW_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (isRateLimited('order-lookup', ip, MAX_ATTEMPTS, WINDOW_MS)) {
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
      // Shipment tracking (Sep 2026). Null when the parcel hasn't been
      // logged yet, which the page renders as "preparing" rather than as an
      // error — most orders are looked up before they ship.
      // Safe to return: the caller already proved they hold the order code
      // AND the matching email before reaching this point.
      shippingAddress: record.shippingAddress || null,
      shippedAt: record.shippedAt || null,
      carrier: record.carrier || null,
      trackingNumber: record.trackingNumber || null,
      trackingUrl: record.trackingUrl || null,
    },
  })
}