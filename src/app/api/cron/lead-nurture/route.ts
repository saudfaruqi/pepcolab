// src/app/api/cron/lead-nurture/route.ts
//
// Daily (vercel.json). Sends the next follow-up email to every /learn lead
// whose step is due: days 2, 5, 9 and 14 after sign-up (lib/leadEmails.ts).
// Only leads who ticked the opt-in are ever in the queue; unsubscribed
// addresses are dropped from it here. Idempotent — safe to run by hand:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://www.pepcolab.com/api/cron/lead-nurture
import { NextRequest, NextResponse } from 'next/server'
import { getDueLeads, saveLead } from '@/lib/leadStore'
import { sendSeriesEmail, NURTURE_OFFSETS_DAYS, LAST_STEP } from '@/lib/leadEmails'
import { isMarketingSuppressed } from '@/lib/emailPreferences'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const due = await getDueLeads(started, 200)
  const result = { due: due.length, sent: 0, stopped: 0, failed: 0 }

  for (const lead of due) {
    if (Date.now() - started > 50_000) break // leave the rest for tomorrow

    if (!lead.emailOptIn || (await isMarketingSuppressed(lead.email).catch(() => false))) {
      await saveLead({ ...lead, emailOptIn: false, nextAt: null, updatedAt: new Date().toISOString() })
      result.stopped++
      continue
    }

    const step = lead.step + 1
    if (step > LAST_STEP) {
      await saveLead({ ...lead, nextAt: null, updatedAt: new Date().toISOString() })
      continue
    }

    try {
      await sendSeriesEmail(lead, step)
      const signedUp = new Date(lead.createdAt).getTime() || Date.now()
      const nextOffset = NURTURE_OFFSETS_DAYS[step + 1]
      // Never schedule into the past: a lead who joined the series late
      // (opted in on a second guide) gets the rest at least two days apart.
      const nextAt =
        nextOffset === undefined ? null : Math.max(signedUp + nextOffset * DAY_MS, Date.now() + 2 * DAY_MS)
      await saveLead({ ...lead, step, nextAt, updatedAt: new Date().toISOString() })
      result.sent++
    } catch (err) {
      console.error('[cron/lead-nurture] send failed:', lead.email, err)
      result.failed++
    }
  }

  return NextResponse.json(result)
}
