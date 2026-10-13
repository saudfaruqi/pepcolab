// src/app/api/admin/marketing/audience/route.ts
//
// POST { audience } or { id } → who this would go to, with anyone who will be
// skipped flagged and the reason shown. For a campaign that has started
// sending, returns the frozen recipient list with each person's result.
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/marketing/adminGuard'
import { sanitizeAudience } from '@/lib/marketing/sanitize'
import { resolveAudience } from '@/lib/marketing/audience'
import { getCampaign, getSnapshot, getResults, listExcluded, lastMarketingSentAt } from '@/lib/marketing/store'
import { isMarketingSuppressed } from '@/lib/emailPreferences'
import { DEFAULT_MIN_GAP_HOURS } from '@/lib/marketing/send'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const minGapHours = Number.isFinite(Number(body?.minGapHours)) ? Number(body.minGapHours) : DEFAULT_MIN_GAP_HOURS

  const campaign = body?.id ? await getCampaign(String(body.id)) : null
  const snapshot = campaign ? await getSnapshot(campaign.id) : null
  // Manually removed people are still listed (the editor shows them
  // unticked so they can be added back); the send itself honours the removal.
  const spec = sanitizeAudience(body?.audience ?? campaign?.audience)
  const recipients = snapshot ?? (await resolveAudience({ ...spec, excludeEmails: [] }))
  const results = campaign && snapshot ? await getResults(campaign.id) : new Map()
  const excluded = new Set(await listExcluded())

  const rows = await Promise.all(
    recipients.map(async (r) => {
      let flag: string | null = null
      if (excluded.has(r.email)) flag = 'excluded'
      else if (await isMarketingSuppressed(r.email)) flag = 'unsubscribed'
      else if (minGapHours > 0) {
        const last = await lastMarketingSentAt(r.email)
        if (last && Date.now() - last < minGapHours * 3600 * 1000) flag = 'mailed recently'
      }
      return { ...r, flag, result: results.get(r.email) ?? null }
    })
  )

  return NextResponse.json({
    success: true,
    frozen: Boolean(snapshot),
    total: rows.length,
    willSend: rows.filter((r) => !r.flag && !r.result).length,
    recipients: rows,
  })
}
