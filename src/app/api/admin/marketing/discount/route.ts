// src/app/api/admin/marketing/discount/route.ts
//
// POST { id, prefix, percent, days } → creates a real discount code
// (lib/discountStore — the same codes the cart already validates) and
// attaches it to the draft campaign.
//
// One code per campaign, shared by everyone on it, limited to the number of
// people the campaign can reach so it cannot spread far beyond them.
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/marketing/adminGuard'
import { getCampaign, saveCampaign } from '@/lib/marketing/store'
import { createDiscountCode, getDiscountCode } from '@/lib/discountStore'
import { resolveAudience } from '@/lib/marketing/audience'

export const dynamic = 'force-dynamic'

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return fail('Unauthorized', 401)
  const body = await req.json().catch(() => ({}))
  const campaign = await getCampaign(String(body?.id || ''))
  if (!campaign) return fail('Campaign not found.', 404)
  if (campaign.status !== 'draft') return fail('Codes can only be added to a draft.', 409)

  const percent = Math.round(Number(body?.percent))
  const days = Math.round(Number(body?.days))
  if (!Number.isFinite(percent) || percent < 1 || percent > 50) return fail('Discount must be between 1% and 50%.')
  if (!Number.isFinite(days) || days < 1 || days > 60) return fail('Validity must be between 1 and 60 days.')

  const prefix = String(body?.prefix || 'PEPCO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'PEPCO'
  let code = ''
  for (let i = 0; i < 6; i++) {
    const candidate = `${prefix}${percent}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
    if (!(await getDiscountCode(candidate))) {
      code = candidate
      break
    }
  }
  if (!code) return fail('Could not generate a unique code. Try again.', 500)

  // End of the last valid day, Dubai time (UTC+4).
  const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  end.setUTCHours(19, 59, 59, 0)

  const audienceSize = (await resolveAudience(campaign.audience)).length
  await createDiscountCode({
    code,
    type: 'percent',
    value: percent,
    maxRedemptions: Math.max(audienceSize, 1),
    expiresAt: end.toISOString(),
  })

  campaign.offer = { code, percent, expiresAt: end.toISOString() }
  campaign.updatedAt = new Date().toISOString()
  await saveCampaign(campaign)
  return NextResponse.json({ success: true, campaign })
}
