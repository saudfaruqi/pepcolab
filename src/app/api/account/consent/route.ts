// src/app/api/account/consent/route.ts
//
// Marketing preferences on the account page (brief B4: toggles; switching
// one off writes "withdrawn"). Signed-in customers only.
//   GET  → { email: bool, whatsapp: bool, hasPhone: bool, joinLink }
//   POST { channel: 'email'|'whatsapp', on: bool }
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/customerAuth'
import { getClientIp } from '@/lib/rateLimit'
import { getOrdersForEmail } from '@/lib/orderStore'
import { upsertContact, findContactByEmail, getCurrentConsent, grantConsent, withdrawConsent, isMarketable } from '@/lib/crm/store'
import { EMAIL_WORDING_VERSION, WHATSAPP_WORDING_VERSION } from '@/lib/crm/types'
import { isWhatsAppConfigured, whatsAppJoinLink } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

async function contactFor(email: string) {
  const existing = await findContactByEmail(email)
  if (existing) return existing
  const order = (await getOrdersForEmail(email, 1))[0]
  return upsertContact({ email, phone: order?.phone, countryCode: order?.shippingAddress?.countryCode, source: 'account' })
}

export async function GET(req: NextRequest) {
  const email = verifySessionToken(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value)
  if (!email) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const contact = await contactFor(email)
  if (!contact) return NextResponse.json({ email: false, whatsapp: false, hasPhone: false })
  const cur = await getCurrentConsent(contact.id)
  return NextResponse.json({
    email: await isMarketable(contact, 'email', cur),
    whatsapp: await isMarketable(contact, 'whatsapp', cur),
    hasPhone: Boolean(contact.phoneE164),
    whatsappAvailable: isWhatsAppConfigured(),
    joinLink: isWhatsAppConfigured() ? whatsAppJoinLink() : null,
  })
}

export async function POST(req: NextRequest) {
  const email = verifySessionToken(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value)
  if (!email) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const channel = b?.channel === 'email' ? 'email' : b?.channel === 'whatsapp' ? 'whatsapp' : null
  if (!channel || typeof b?.on !== 'boolean') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const contact = await contactFor(email)
  if (!contact) return NextResponse.json({ error: 'Could not find your details.' }, { status: 404 })
  if (channel === 'whatsapp' && !contact.phoneE164) {
    return NextResponse.json({ error: 'We do not have a phone number for you yet. It is added with your next order.' }, { status: 400 })
  }
  const ip = getClientIp(req)
  const evidence = {
    ip: ip && ip !== 'unknown' ? ip : undefined,
    userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || undefined,
    pageUrl: typeof b?.pageUrl === 'string' ? b.pageUrl.slice(0, 500) : undefined,
  }
  if (b.on) {
    const ev = await grantConsent(contact, channel, 'account_page', channel === 'email' ? EMAIL_WORDING_VERSION : WHATSAPP_WORDING_VERSION, evidence)
    if (!ev) {
      return NextResponse.json(
        { error: 'You unsubscribed earlier, so we cannot switch this back on automatically. Reply to any of our emails and we will do it for you.' },
        { status: 409 }
      )
    }
  } else {
    await withdrawConsent(contact, channel, 'account_page', evidence)
  }
  return NextResponse.json({ ok: true })
}
