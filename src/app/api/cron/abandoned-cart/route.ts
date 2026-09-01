// src/app/api/cron/abandoned-cart/route.ts
//
// Triggered periodically by Vercel Cron (add to vercel.json — see below).
// Finds checkouts marked 'abandoned' and sends the two-stage recovery
// email: a first nudge ~1 hour after abandonment, then a final reminder
// ~24 hours after abandonment, using OrderRecord.recoveryEmailStage to
// avoid re-sending either one.
//
// Mirrors app/api/cron/review-requests/route.ts's window + index pattern.
// The supporting pieces (getAbandonedOrdersInWindow, recoveryEmailStage,
// the /api/cart/restore/[code] link the email points at) already existed
// in this codebase — this route is the piece that was missing, so
// sendAbandonedCartEmail (lib/orderEmails.ts) was defined but never
// actually called.
import { NextRequest, NextResponse } from 'next/server'
import { getAbandonedOrdersInWindow, saveOrderRecord } from '@/lib/orderStore'
import { sendAbandonedCartEmail } from '@/lib/orderEmails'

const STAGE1_DELAY_HOURS = Number(process.env.ABANDONED_CART_STAGE1_HOURS) || 1
const STAGE2_DELAY_HOURS = Number(process.env.ABANDONED_CART_STAGE2_HOURS) || 24
const HOUR_MS = 60 * 60 * 1000
// How wide a window each cron tick covers — must be >= how often the cron
// actually runs, or a checkout can fall through the gap between ticks.
// Vercel Cron's minimum interval is every minute on paid plans / hourly on
// Hobby; this assumes the job is scheduled roughly hourly (see vercel.json
// snippet below) and gives a little slack either side.
const WINDOW_SLACK_MS = 1.5 * HOUR_MS

async function sendStage(stage: 1 | 2, delayHours: number) {
  const now = Date.now()
  const windowEnd = now - delayHours * HOUR_MS
  const windowStart = windowEnd - WINDOW_SLACK_MS

  const orders = await getAbandonedOrdersInWindow(windowStart, windowEnd)
  const eligible = orders.filter((o) => {
    if (o.status !== 'abandoned') return false // customer came back and paid — index just says "was ever abandoned"
    if (!o.email || o.products.length === 0) return false
    const stageSent = o.recoveryEmailStage || 0
    return stage === 1 ? stageSent === 0 : stageSent === 1 // stage 2 only after stage 1 actually went out
  })

  let sent = 0
  for (const order of eligible) {
    try {
      await sendAbandonedCartEmail({
        to: order.email,
        orderShortCode: order.orderShortCode,
        products: order.products,
        total: order.total,
        currency: order.currency,
        stage,
      })
      await saveOrderRecord({ ...order, recoveryEmailStage: stage })
      sent++
    } catch (err) {
      console.error(`[abandoned-cart cron] Stage ${stage} failed for ${order.orderShortCode}:`, err)
    }
  }

  return { checked: orders.length, eligible: eligible.length, sent }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stage1 = await sendStage(1, STAGE1_DELAY_HOURS)
  const stage2 = await sendStage(2, STAGE2_DELAY_HOURS)

  return NextResponse.json({ stage1, stage2 })
}

/* Add this to vercel.json's "crons" array (create the file if the project
   doesn't have one yet — none was present in the exported project):

  {
    "crons": [
      { "path": "/api/cron/review-requests", "schedule": "0 9 * * *" },
      { "path": "/api/cron/abandoned-cart",  "schedule": "0 * * * *" }
    ]
  }

  That runs it once an hour, which is what STAGE1_DELAY_HOURS=1 assumes.
  On the Hobby plan Vercel Cron can't run more often than daily — if
  that's the current plan, either upgrade or lower expectations for
  stage-1 timing accordingly (it'll still work, just check in daily
  instead of hourly, so the stage-1 nudge effectively goes out same-day
  rather than within the hour). Also reuses CRON_SECRET, same as the
  review-requests cron. */