// src/app/api/cron/abandoned-cart/route.ts
//
// Triggered daily by Vercel Cron, same as review-requests (see vercel.json
// — this project runs crons once a day, e.g. review-requests at 10:00,
// this one at 11:00). Finds checkouts marked 'abandoned' and sends the
// two-stage recovery email: a first nudge once a checkout has been
// abandoned for at least STAGE1_DELAY_HOURS, then a final reminder once
// it's been at least STAGE2_DELAY_HOURS, using recoveryEmailStage to
// avoid re-sending either one.
//
// NOTE ON TIMING: with a once-daily cron, "stage 1 after 1 hour" doesn't
// really mean within-the-hour delivery — it means "the next time this
// cron runs, if it's been over an hour, send it." In practice that's
// same-day-ish rather than fast. If genuinely fast (sub-hour) recovery
// nudges matter, this needs a more frequent schedule (Vercel Cron's
// minimum interval is per-minute on Pro+, daily-only on Hobby) — worth
// checking which plan this project is on before assuming stage 1 fires
// quickly. The defaults below (1h / 24h) are reasonable regardless of
// how often the cron actually runs; they just describe eligibility, not
// exact delivery time.
//
// Deliberately does NOT use a tight [windowStart, windowEnd] like
// review-requests' cron does — that pattern assumes the cron interval and
// the window width stay in lockstep, which breaks silently (orders fall
// through the gap) the moment one changes without the other. Instead this
// pulls every abandoned order from the last LOOKBACK_DAYS and filters by
// elapsed time + stage in code, which stays correct no matter how often
// the job actually runs.
//
// The supporting pieces (getAbandonedOrdersInWindow, recoveryEmailStage,
// the /api/cart/restore/[code] link the email points at) already existed
// in this codebase — this route is the piece that was missing, so
// sendAbandonedCartEmail (lib/orderEmails.ts) was defined but never
// actually called.
import { NextRequest, NextResponse } from 'next/server'
import { getAbandonedOrdersInWindow, saveOrderRecord, type OrderRecord } from '@/lib/orderStore'
import { sendAbandonedCartEmail } from '@/lib/orderEmails'

const STAGE1_DELAY_HOURS = Number(process.env.ABANDONED_CART_STAGE1_HOURS) || 1
const STAGE2_DELAY_HOURS = Number(process.env.ABANDONED_CART_STAGE2_HOURS) || 24
const LOOKBACK_DAYS = Number(process.env.ABANDONED_CART_LOOKBACK_DAYS) || 10 // stop trying after this long — a week+ old cart isn't "recoverable," it's stale
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

function hoursSinceAbandoned(order: OrderRecord): number {
  return (Date.now() - new Date(order.createdAt).getTime()) / HOUR_MS
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const orders = await getAbandonedOrdersInWindow(now - LOOKBACK_DAYS * DAY_MS, now)

  let stage1Sent = 0
  let stage2Sent = 0

  for (const order of orders) {
    if (order.status !== 'abandoned') continue // customer came back and paid — index just says "was ever abandoned"
    if (!order.email || order.products.length === 0) continue

    const stageSent = order.recoveryEmailStage || 0
    const hoursElapsed = hoursSinceAbandoned(order)

    let stageToSend: 1 | 2 | null = null
    if (stageSent === 0 && hoursElapsed >= STAGE1_DELAY_HOURS) stageToSend = 1
    else if (stageSent === 1 && hoursElapsed >= STAGE2_DELAY_HOURS) stageToSend = 2
    if (!stageToSend) continue

    try {
      await sendAbandonedCartEmail({
        to: order.email,
        orderShortCode: order.orderShortCode,
        products: order.products,
        total: order.total,
        currency: order.currency,
        stage: stageToSend,
      })
      await saveOrderRecord({ ...order, recoveryEmailStage: stageToSend })
      if (stageToSend === 1) stage1Sent++
      else stage2Sent++
    } catch (err) {
      console.error(`[abandoned-cart cron] Stage ${stageToSend} failed for ${order.orderShortCode}:`, err)
    }
  }

  return NextResponse.json({ checked: orders.length, stage1Sent, stage2Sent })
}

/* vercel.json — add alongside the existing review-requests entry:

  {
    "crons": [
      { "path": "/api/cron/review-requests", "schedule": "0 10 * * *" },
      { "path": "/api/cron/abandoned-cart",  "schedule": "0 11 * * *" }
    ]
  }

  Reuses CRON_SECRET, same as review-requests. */