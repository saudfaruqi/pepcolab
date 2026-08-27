// src/app/api/newsletter/export/route.ts
//
// Admin-only. Returns the full subscriber list as CSV (email, subscribed_at)
// so you can hand it to Mailchimp/Klaviyo/whatever ESP you land on, without
// needing a database viewer to get at the data.
//
// Protected by a shared secret rather than real auth since there's no admin
// login system in this app — visit:
//   https://www.pepcolab.com/api/newsletter/export?token=YOUR_SECRET
// Set NEWSLETTER_EXPORT_TOKEN in Vercel to a long random string (e.g.
// `openssl rand -hex 32`) before using this — without it configured, this
// route refuses to run at all rather than defaulting to open.
import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

const SUBSCRIBERS_KEY = 'newsletter:subscribers'

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(req: NextRequest) {
  const configuredToken = process.env.NEWSLETTER_EXPORT_TOKEN
  if (!configuredToken) {
    return NextResponse.json(
      { error: 'NEWSLETTER_EXPORT_TOKEN is not configured on the server.' },
      { status: 500 }
    )
  }

  const token = req.nextUrl.searchParams.get('token')
  if (token !== configuredToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // withScores gives us [email, score, email, score, ...] pairs, oldest
    // subscriber first.
    const raw = await redis.zrange(SUBSCRIBERS_KEY, 0, -1, { withScores: true })

    const rows: string[] = ['email,subscribed_at']
    for (let i = 0; i < raw.length; i += 2) {
      const email = String(raw[i])
      const score = Number(raw[i + 1])
      const subscribedAt = new Date(score).toISOString()
      rows.push(`${csvEscape(email)},${subscribedAt}`)
    }

    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pepcolab-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    console.error('[newsletter export] Failed:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}