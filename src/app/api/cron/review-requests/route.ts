// src/app/api/cron/review-requests/route.ts
//
// Triggered daily by Vercel Cron (see vercel.json). Finds completed orders
// placed REVIEW_REQUEST_DELAY_DAYS ago that haven't had a request sent yet,
// and sends one per order (using the first product on it — most orders here
// are single-item; a multi-item order just gets asked about the first).
//
// There's no real "delivered" signal available (no Shopify fulfillment
// webhook wired up), so this uses order-confirmation date + a fixed delay
// as a proxy — standard practice, just worth knowing it's an estimate, not
// a true delivery-confirmed trigger.
import { NextRequest, NextResponse } from 'next/server'
import { getCompletedOrdersInWindow, saveOrderRecord } from '@/lib/orderStore'
import { sendReviewRequestEmail } from '@/lib/orderEmails'

const DELAY_DAYS = Number(process.env.REVIEW_REQUEST_DELAY_DAYS) || 5
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  // Vercel Cron sends this header automatically on scheduled invocations;
  // matches it against CRON_SECRET (set that in Vercel env vars) so this
  // endpoint can't be triggered by anyone who finds the URL.
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  // A window, not a single instant — covers the case where this didn't run
  // exactly on schedule one day, so an order doesn't fall through the gap
  // between "too new yesterday" and "already past the window today".
  const windowEnd = now - DELAY_DAYS * DAY_MS
  const windowStart = windowEnd - 2 * DAY_MS

  const orders = await getCompletedOrdersInWindow(windowStart, windowEnd)
  const eligible = orders.filter((o) => !o.reviewRequestSentAt && o.email && o.products.length > 0)

  let sent = 0
  for (const order of eligible) {
    try {
      await sendReviewRequestEmail({
        to: order.email,
        orderShortCode: order.orderShortCode,
        productTitle: order.products[0].title,
      })
      await saveOrderRecord({ ...order, reviewRequestSentAt: new Date().toISOString() })
      sent++
    } catch (err) {
      console.error(`[review-request cron] Failed for ${order.orderShortCode}:`, err)
    }
  }

  return NextResponse.json({ checked: orders.length, sent })
}