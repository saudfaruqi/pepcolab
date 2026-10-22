// src/app/api/crm/confirm/route.ts
//
// POST { t } from /preferences/confirm — the customer pressed Confirm on the
// page an order email's "Yes, email me updates" link opened (brief B5).
// Writes granted email consent, capture transactional_email, wording
// email-v1. Each link works once and expires after 30 days.
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { verifyOptInToken, consumeOptInToken } from '@/lib/crm/optinLinks'
import { getContact, grantConsent, getCurrentConsent } from '@/lib/crm/store'
import { EMAIL_WORDING_VERSION } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited('crm-confirm', ip, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  const b = await req.json().catch(() => ({}))
  const payload = verifyOptInToken(String(b?.t || ''))
  if (!payload) return NextResponse.json({ error: 'This link has expired or is not valid.' }, { status: 400 })
  const contact = await getContact(payload.c)
  if (!contact) return NextResponse.json({ error: 'This link is no longer valid.' }, { status: 404 })

  const cur = await getCurrentConsent(contact.id)
  if (cur.email?.action === 'granted') return NextResponse.json({ ok: true, already: true })
  if (!(await consumeOptInToken(payload))) return NextResponse.json({ error: 'This link has already been used.' }, { status: 409 })

  const ev = await grantConsent(contact, 'email', 'transactional_email', EMAIL_WORDING_VERSION, {
    ip: ip && ip !== 'unknown' ? ip : undefined,
    userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || undefined,
    pageUrl: typeof b?.pageUrl === 'string' ? b.pageUrl.slice(0, 500) : undefined,
  })
  if (!ev) {
    return NextResponse.json(
      { error: 'This address previously unsubscribed. Reply to any of our emails if you would like to hear from us again.' },
      { status: 409 }
    )
  }
  return NextResponse.json({ ok: true })
}
