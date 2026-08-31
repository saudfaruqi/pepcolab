// src/app/api/referral/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateReferral, FRIEND_DISCOUNT_PERCENT, REFERRER_REWARD_PERCENT } from '@/lib/referralStore'
import { sendReferralWelcomeEmail } from '@/lib/referralEmails'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const MAX_SUBMISSIONS = 8
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (isRateLimited('referral-create', ip, MAX_SUBMISSIONS, WINDOW_MS)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const name = String(body?.name || '').trim()
    const email = String(body?.email || '').trim()

    if (!name || name.length > 60) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
    }
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const profile = await getOrCreateReferral(name, email)
    const referralUrl = `${SITE_URL}/referrals?ref=${encodeURIComponent(profile.code)}`

    // Best-effort — a missing SMTP config shouldn't stop the visitor from
    // getting their code back and seeing it on-screen immediately.
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM) {
      await sendReferralWelcomeEmail({
        to: email,
        name,
        code: profile.code,
        friendDiscountPercent: FRIEND_DISCOUNT_PERCENT,
        rewardPercent: REFERRER_REWARD_PERCENT,
      })
    }

    return NextResponse.json({
      code: profile.code,
      referralUrl,
      friendDiscountPercent: FRIEND_DISCOUNT_PERCENT,
      rewardPercent: REFERRER_REWARD_PERCENT,
      referralCount: profile.referralCount,
    })
  } catch (error) {
    console.error('[referral] Error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
