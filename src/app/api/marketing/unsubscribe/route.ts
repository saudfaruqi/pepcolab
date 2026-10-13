// src/app/api/marketing/unsubscribe/route.ts
//
// The target of the List-Unsubscribe header on every campaign email.
//
// POST — Gmail/Apple "Unsubscribe" button (RFC 8058 one-click). The mail
//        client POSTs with no user interaction, so this must unsubscribe
//        immediately and return 200 with no page.
// GET  — someone opened the link in a browser: send them to the normal
//        /unsubscribe page, which confirms and does the same thing.
import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken'
import { suppressMarketingEmail } from '@/lib/emailPreferences'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

const SUBSCRIBERS_KEY = 'newsletter:subscribers'

function params(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase()
  const token = req.nextUrl.searchParams.get('token') || ''
  return { email, token }
}

export async function POST(req: NextRequest) {
  const { email, token } = params(req)
  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: 'Invalid unsubscribe link.' }, { status: 400 })
  }
  try {
    await suppressMarketingEmail(email)
    await redis.zrem(SUBSCRIBERS_KEY, email)
  } catch (err) {
    console.error('[marketing/unsubscribe] Failed:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const { email, token } = params(req)
  const url = new URL('/unsubscribe', req.nextUrl.origin)
  if (email) url.searchParams.set('email', email)
  if (token) url.searchParams.set('token', token)
  return NextResponse.redirect(url)
}
