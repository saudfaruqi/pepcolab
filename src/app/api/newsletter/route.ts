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

const ADMIN_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
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

  try {
    const { isNew } = await addSubscriber(email)

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