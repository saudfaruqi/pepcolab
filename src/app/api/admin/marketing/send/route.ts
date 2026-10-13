// src/app/api/admin/marketing/send/route.ts
//
// POST { id, action: 'test', to }                 one [TEST] copy to `to`
// POST { id, action: 'batch', minGapHours? }      next batch; call until done
// POST { id, action: 'requeue-failed' }           retry failed recipients
//
// Saves nothing about the campaign's content — save the draft first.
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/marketing/adminGuard'
import { getCampaign } from '@/lib/marketing/store'
import { sendBatch, sendTest, requeueFailed, validateForSend } from '@/lib/marketing/send'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return fail('Unauthorized', 401)
  const body = await req.json().catch(() => ({}))
  const campaign = await getCampaign(String(body?.id || ''))
  if (!campaign) return fail('Campaign not found.', 404)

  try {
    if (body?.action === 'test') {
      const to = String(body?.to || '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return fail('Enter a valid email address for the test.')
      const problem = validateForSend(campaign)
      if (problem) return fail(problem)
      await sendTest(campaign, to)
      return NextResponse.json({ success: true })
    }

    if (body?.action === 'batch') {
      if (campaign.status === 'sent') return fail('This campaign has already been sent.', 409)
      const minGapHours = Number.isFinite(Number(body?.minGapHours)) ? Number(body.minGapHours) : undefined
      const result = await sendBatch(campaign.id, { minGapHours })
      return NextResponse.json({ success: true, ...result })
    }

    if (body?.action === 'requeue-failed') {
      const count = await requeueFailed(campaign.id)
      return NextResponse.json({ success: true, requeued: count })
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Send failed.', 500)
  }

  return fail('Unknown action.')
}
