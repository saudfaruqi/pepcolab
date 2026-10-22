// src/app/api/learn/lead/route.ts
//
// POST from the /learn guide form. Saves the lead and emails the guide.
// The follow-up series runs only when the visitor ticked the email-v1 opt-in
// (lib/learnGuides.ts EMAIL_OPT_IN_TEXT); the opt-in is stored with its
// wording version and evidence (ip, user agent, page) on the lead record.
//
// Body: { email, firstName?, guide, source?, researchArea?, emailOptIn, pageUrl? }
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { getLead, saveLead, type LeadRecord } from '@/lib/leadStore'
import { getLearnGuide, cleanSource, RESEARCH_AREAS, EMAIL_OPT_IN_VERSION } from '@/lib/learnGuides'
import { sendGuideEmail, NURTURE_OFFSETS_DAYS } from '@/lib/leadEmails'
import { isMarketingSuppressed } from '@/lib/emailPreferences'
import { syncLead } from '@/lib/crm/sync'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DAY_MS = 24 * 60 * 60 * 1000

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited('learn-lead', ip, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests — please try again in a few minutes.' }, { status: 429 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: real visitors never see or fill this field.
  if (str(body?.company, 200)) return NextResponse.json({ ok: true })

  const email = str(body?.email, 200).toLowerCase()
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })

  const guide = getLearnGuide(str(body?.guide, 60))
  if (!guide) return NextResponse.json({ error: 'Unknown guide.' }, { status: 400 })

  const firstName = str(body?.firstName, 60).replace(/[<>"]/g, '')
  const source = cleanSource(str(body?.source, 60), guide.source)
  const areaRaw = str(body?.researchArea, 40)
  const researchArea = RESEARCH_AREAS.some((a) => a.value === areaRaw) ? areaRaw : undefined
  const wantsSeries = body?.emailOptIn === true
  const now = new Date()
  const optInEvidence = wantsSeries
    ? {
        at: now.toISOString(),
        wording: EMAIL_OPT_IN_VERSION,
        ip: ip && ip !== 'unknown' ? ip : undefined,
        userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || undefined,
        pageUrl: str(body?.pageUrl, 500) || undefined,
      }
    : undefined

  const existing = await getLead(email)
  const suppressed = await isMarketingSuppressed(email).catch(() => false)

  let lead: LeadRecord
  if (existing) {
    const optIn = (existing.emailOptIn || wantsSeries) && !suppressed
    // A returning lead who newly opts in starts the series; one already in it
    // keeps their place.
    const startSeries = optIn && !existing.emailOptIn
    lead = {
      ...existing,
      firstName: firstName || existing.firstName,
      updatedAt: now.toISOString(),
      sources: Array.from(new Set([...existing.sources, source])),
      guides: Array.from(new Set([...existing.guides, guide.slug])),
      emailOptIn: optIn,
      researchArea: researchArea || existing.researchArea,
      optIn: startSeries ? optInEvidence : existing.optIn,
      step: startSeries ? 0 : existing.step,
      nextAt: !optIn
        ? null
        : startSeries
          ? now.getTime() + NURTURE_OFFSETS_DAYS[1] * DAY_MS
          : existing.nextAt,
    }
  } else {
    const optIn = wantsSeries && !suppressed
    lead = {
      email,
      firstName,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      sources: [source],
      guides: [guide.slug],
      emailOptIn: optIn,
      step: 0,
      nextAt: optIn ? now.getTime() + NURTURE_OFFSETS_DAYS[1] * DAY_MS : null,
      researchArea,
      optIn: optIn ? optInEvidence : undefined,
    }
  }

  await saveLead(lead)
  // Contact + email-v1 consent event in the CRM (best-effort; the lead
  // record keeps the same evidence and the nightly sync retries).
  await syncLead(email).catch((err) => console.error('[learn/lead] CRM sync failed:', err))

  // The guide itself is the service requested, so it is sent even to an
  // address that unsubscribed from marketing.
  try {
    await sendGuideEmail(lead, guide)
  } catch (err) {
    console.error('[learn/lead] guide email failed:', err)
    return NextResponse.json(
      { error: 'We saved your request but could not send the email just now. Please try again shortly.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
