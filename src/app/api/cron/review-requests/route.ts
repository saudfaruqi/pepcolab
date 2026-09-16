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
import { getCompletedOrdersInWindow, saveOrderRecord, isPaidOrder } from '@/lib/orderStore'
import { isMarketingSuppressed } from '@/lib/emailPreferences'
import { sendReviewRequestEmail } from '@/lib/orderEmails'

// Default moved from 5 to 10 days (Sep 2026): the "Did your order arrive
// safely?" check-in (cron: customer-care) now goes out around day 4–6, and
// two emails in the same week reads as pestering. Day 10 also gives the
// customer time to actually open and use what they received.
const DELAY_DAYS = Number(process.env.REVIEW_REQUEST_DELAY_DAYS) || 10
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
  // Refunded / charged-back / failed orders stay in the completed index after
  // their status changes, so status must be re-checked here.
  const eligible = orders.filter((o) => !o.reviewRequestSentAt && o.email && o.products.length > 0 && isPaidOrder(o))

  let sent = 0
  for (const order of eligible) {
    if (await isMarketingSuppressed(order.email)) continue
    try {
      await sendReviewRequestEmail({
        to: order.email,
        orderShortCode: order.orderShortCode,
        productTitle: order.products[0].title,
        customerName: order.customerName,
      })
      await saveOrderRecord({ ...order, reviewRequestSentAt: new Date().toISOString() })
      sent++
    } catch (err) {
      console.error(`[review-request cron] Failed for ${order.orderShortCode}:`, err)
    }
  }

  return NextResponse.json({ checked: orders.length, sent })
}