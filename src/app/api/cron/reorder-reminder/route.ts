// src/app/api/cron/reorder-reminder/route.ts
//
// The revenue email. Runs daily (add to vercel.json alongside the existing
// crons) and prompts customers whose last order is around the point where a
// research group tends to need a fresh batch.
//
// TIMING RATIONALE
// The site's own documentation states reconstituted material is used within
// 28 days at 2-8 C. REORDER_REMINDER_DAYS defaults to 28 — measured from
// ORDER DATE, which is the only timestamp this system reliably has, since
// dispatch is not tracked anywhere.
//
// Order date runs a few days ahead of the customer's own clock (which starts
// when the parcel arrives), so 28 from ordering lands at roughly 26 from
// delivery — just before the reconstitution window closes, while the current
// vial is still in use and a gap in supply is still avoidable. Sending after
// the window has closed makes it a chase rather than a service.
//
// Adjust REORDER_REMINDER_DAYS once you can see from repeat orders what the
// real reorder interval looks like. That data will exist within a couple of
// months; until then this is a reasoned estimate, not a measured one.
//
// SAFETY: reorderReminderSentAt is stamped on the record before we move on,
// so a re-run cannot double-send. Orders that were refunded, charged back or
// failed are excluded — prompting someone to reorder something they sent
// back is the kind of email that loses a customer permanently.
import { NextRequest, NextResponse } from 'next/server'
import { getOrdersDueForReorderReminder, saveOrderRecord } from '@/lib/orderStore'
import { sendReorderReminderEmail } from '@/lib/accountEmails'
import { buildUnsubscribeUrl } from '@/lib/unsubscribeToken'

const REMINDER_DAYS = Number(process.env.REORDER_REMINDER_DAYS) || 28
const DAY_MS = 24 * 60 * 60 * 1000
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'

const EXCLUDED_STATUSES = new Set(['refunded', 'chargeback', 'failed', 'abandoned'])

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  // A generous window rather than a single day, so an order doesn't fall
  // through the gap if a scheduled run is missed — same approach as the
  // review-request cron.
  const windowStart = now - (REMINDER_DAYS + 4) * DAY_MS
  const windowEnd = now - REMINDER_DAYS * DAY_MS

  const candidates = await getOrdersDueForReorderReminder(windowStart, windowEnd)

  let sent = 0
  let skipped = 0

  for (const order of candidates) {
    if (EXCLUDED_STATUSES.has(order.status)) { skipped++; continue }
    if (!order.email || !order.products?.length) { skipped++; continue }

    // getOrdersDueForReorderReminder already bounded this by the completed
    // index (order date), so the window check is done. This is just a guard
    // against a record with an unparseable createdAt.
    const orderedMs = new Date(order.createdAt).getTime()
    if (!orderedMs || now - orderedMs < REMINDER_DAYS * DAY_MS) { skipped++; continue }

    // Reuses the existing abandoned-cart restore route: one link that
    // rebuilds the exact cart and drops the customer straight into it.
    const reorderUrl = `${SITE_URL}/api/cart/restore/${encodeURIComponent(order.orderShortCode)}`

    let unsubscribeUrl: string | undefined
    try {
      unsubscribeUrl = buildUnsubscribeUrl(order.email)
    } catch {
      // Unsubscribe secret not configured — send without the link rather
      // than dropping the email entirely.
      unsubscribeUrl = undefined
    }

    await sendReorderReminderEmail({
      to: order.email,
      customerName: order.customerName,
      orderShortCode: order.orderShortCode,
      products: order.products,
      currency: order.currency,
      reorderUrl,
      unsubscribeUrl,
    })

    await saveOrderRecord({
      ...order,
      reorderReminderSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    sent++
  }

  return NextResponse.json({ success: true, candidates: candidates.length, sent, skipped })
}