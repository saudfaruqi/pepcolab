// src/app/api/admin/marketing/preview/route.ts
// POST { campaign } → the email exactly as a sample customer would receive it.
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/marketing/adminGuard'
import { sanitizeCampaignInput } from '@/lib/marketing/sanitize'
import { renderCampaign, sampleRecipient } from '@/lib/marketing/render'
import type { Campaign } from '@/lib/marketing/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const now = new Date().toISOString()
  const campaign: Campaign = { id: 'cmp_preview', status: 'draft', createdAt: now, updatedAt: now, ...sanitizeCampaignInput(body?.campaign) }
  const r = sampleRecipient()
  if (body?.sample && typeof body.sample === 'object') {
    r.firstName = typeof body.sample.firstName === 'string' ? body.sample.firstName.slice(0, 40) : r.firstName
    r.lastProduct = typeof body.sample.lastProduct === 'string' ? body.sample.lastProduct.slice(0, 80) : r.lastProduct
  }
  const rendered = renderCampaign(campaign, r)
  return NextResponse.json({ success: true, subject: rendered.subject, html: rendered.html, text: rendered.text })
}
