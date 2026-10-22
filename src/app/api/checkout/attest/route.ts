// src/app/api/checkout/attest/route.ts
//
// POST { ref, attestedAt, consents? } from the cart checkout, just before the
// STRABL handoff. Records that the customer ticked the research attestation
// (lib/attestation.ts) so the webhook can copy it onto the order, and — if
// they ticked either optional box — the email-v1 / whatsapp-v1 consent with
// its evidence (ip, user agent, page), written to the CRM when the webhook
// creates the order and contact (lib/crm/pending.ts).
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { saveAttestation, isCheckoutRef, cleanAttestedAt } from '@/lib/attestation'
import { savePendingConsents, type PendingConsent } from '@/lib/crm/pending'
import { EMAIL_WORDING_VERSION, WHATSAPP_WORDING_VERSION } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (isRateLimited('checkout-attest', getClientIp(req), 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const ref = body?.ref
  const attestedAt = cleanAttestedAt(body?.attestedAt)
  if (!isCheckoutRef(ref) || !attestedAt) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  try {
    await saveAttestation(ref, attestedAt)
    const ip = getClientIp(req)
    const evidence = {
      ip: ip && ip !== 'unknown' ? ip : undefined,
      userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || undefined,
      pageUrl: typeof body?.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : undefined,
    }
    const now = new Date().toISOString()
    const pending: PendingConsent[] = []
    if (body?.consents?.email === true) {
      pending.push({ channel: 'email', wordingVersion: EMAIL_WORDING_VERSION, capturePoint: 'checkout', evidence, occurredAt: now })
    }
    if (body?.consents?.whatsapp === true) {
      pending.push({ channel: 'whatsapp', wordingVersion: WHATSAPP_WORDING_VERSION, capturePoint: 'checkout', evidence, occurredAt: now })
    }
    await savePendingConsents(ref, pending)
  } catch (err) {
    console.error('[checkout/attest] save failed:', err)
    return NextResponse.json({ error: 'Could not record attestation.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
