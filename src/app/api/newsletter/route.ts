// src/app/api/newsletter/route.ts
//
// Was previously entirely missing — Footer.tsx's subscribe form has been
// silently no-op'ing (see the comment there) with no way to tell how long
// or how many signups were lost.
//
// No ESP (Mailchimp/Klaviyo) is wired up yet, so this stores subscribers
// in the same Upstash Redis used by orderStore.ts and emails an admin
// notification per signup via the existing SMTP config (lib/mailer.ts).
// That's enough to stop losing signups today. When you're ready to run
// actual campaigns, swap the redis.sadd() call below for a real ESP's
// subscribe API call — everything else here stays the same.
import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { sendMailSafe } from '@/lib/mailer'

const SUBSCRIBERS_KEY = 'newsletter:subscribers' // Redis sorted set: member=email, score=subscribedAt (ms)
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
    // A sorted set (score = subscribe timestamp) rather than a plain set —
    // lets /api/newsletter/export report when each person signed up, and
    // lets a future "export only what's new since my last export" filter
    // use ZRANGEBYSCORE. zscore existing-check first so re-subscribing
    // doesn't re-trigger the admin notification email or bump the date.
    const existingScore = await redis.zscore(SUBSCRIBERS_KEY, email)
    const isNew = existingScore === null

    await redis.zadd(SUBSCRIBERS_KEY, { score: Date.now(), member: email })

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