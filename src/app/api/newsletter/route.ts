// src/app/api/newsletter/route.ts
//
// Was previously entirely missing — Footer.tsx's subscribe form has been
// silently no-op'ing (see the comment there) with no way to tell how long
// or how many signups were lost.
//
// Storage now lives in lib/newsletterStore.ts (shared with the CSV export
// route and the admin dashboard's subscriber list) — see that file for
// why every signup here was almost certainly failing until its
// self-healing migration was added.
//
// No ESP (Mailchimp/Klaviyo) is wired up yet — this is enough to stop
// losing signups today. When you're ready to run actual campaigns, swap
// the addSubscriber() call in lib/newsletterStore.ts for a real ESP's
// subscribe API call — everything else here stays the same.
import { NextRequest, NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/newsletterStore'
import { sendMailSafe } from '@/lib/mailer'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { upsertContact, grantConsent } from '@/lib/crm/store'
import { EMAIL_WORDING_VERSION } from '@/lib/crm/types'

const ADMIN_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// CONSENT (Oct 2026 clean-up brief, B4): the footer form has one unticked
// box with the email-v1 wording. Signing up requires it; the tick is stored
// in the CRM as a granted email consent event, capture footer_form, with
// evidence {ip, user agent, page}.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited('newsletter', ip, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const email = String(body.email || '').trim().toLowerCase()
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: 'Tick the box to confirm you would like research updates.' }, { status: 400 })
  }

  try {
    const { isNew } = await addSubscriber(email)
    const contact = await upsertContact({ email, source: 'newsletter' })
    if (contact) {
      await grantConsent(contact, 'email', 'footer_form', EMAIL_WORDING_VERSION, {
        ip: ip && ip !== 'unknown' ? ip : undefined,
        userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || undefined,
        pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : undefined,
      })
    }

    if (isNew) {
      await sendMailSafe({
        to: ADMIN_EMAIL,
        subject: `📬 New newsletter signup: ${email}`,
        text: `${email} subscribed to the PepcoLab newsletter.`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[newsletter] Failed to store subscriber:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}