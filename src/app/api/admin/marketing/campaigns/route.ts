// src/app/api/admin/marketing/campaigns/route.ts
//
// GET            → every campaign, newest first
// POST           → create (from a template key or a duplicate) or save a draft
//   { action: 'create', templateKey }           new draft from a template
//   { action: 'duplicate', id }                 new draft copied from any campaign
//   { action: 'save', id, campaign }            update a draft
// DELETE ?id=    → delete a draft (sent campaigns are kept as a record)
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/marketing/adminGuard'
import { listCampaigns, getCampaign, saveCampaign, deleteCampaign, newCampaignId } from '@/lib/marketing/store'
import { sanitizeCampaignInput } from '@/lib/marketing/sanitize'
import { CAMPAIGN_TEMPLATES } from '@/lib/marketing/templates'
import type { Campaign } from '@/lib/marketing/types'

export const dynamic = 'force-dynamic'

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return fail('Unauthorized', 401)
  return NextResponse.json({ success: true, campaigns: await listCampaigns() })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return fail('Unauthorized', 401)
  const body = await req.json().catch(() => ({}))
  const now = new Date().toISOString()

  if (body?.action === 'create') {
    const t = CAMPAIGN_TEMPLATES.find((x) => x.key === body.templateKey) ?? CAMPAIGN_TEMPLATES[CAMPAIGN_TEMPLATES.length - 1]
    const campaign: Campaign = {
      id: newCampaignId(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      ...sanitizeCampaignInput({ ...t, offer: null }),
    }
    await saveCampaign(campaign)
    return NextResponse.json({ success: true, campaign })
  }

  if (body?.action === 'duplicate') {
    const source = await getCampaign(String(body.id || ''))
    if (!source) return fail('Campaign not found.', 404)
    const campaign: Campaign = {
      id: newCampaignId(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      // A sent campaign's code has usually expired, so the copy starts
      // without one — create a fresh code for the new send.
      ...sanitizeCampaignInput({ ...source, name: `${source.name} (copy)`, offer: null }),
    }
    await saveCampaign(campaign)
    return NextResponse.json({ success: true, campaign })
  }

  if (body?.action === 'save') {
    const existing = await getCampaign(String(body.id || ''))
    if (!existing) return fail('Campaign not found.', 404)
    if (existing.status !== 'draft') return fail('This campaign has already been sent, so it can no longer be edited. Duplicate it to send again.', 409)
    const campaign: Campaign = { ...existing, ...sanitizeCampaignInput(body.campaign), updatedAt: now }
    await saveCampaign(campaign)
    return NextResponse.json({ success: true, campaign })
  }

  return fail('Unknown action.')
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return fail('Unauthorized', 401)
  const id = req.nextUrl.searchParams.get('id') || ''
  const existing = await getCampaign(id)
  if (!existing) return fail('Campaign not found.', 404)
  if (existing.status !== 'draft') return fail('Sent campaigns are kept as a record and can’t be deleted.', 409)
  await deleteCampaign(id)
  return NextResponse.json({ success: true })
}
