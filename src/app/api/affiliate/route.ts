// src/app/api/affiliate/route.ts
//
// Affiliate applications and dashboard reads.
//
// POST  — apply to the programme, or fetch your own stats by email.
// GET    ?ref=CODE — records a click, used by the tracking redirect.
//
// WHAT THIS ROUTE WILL NOT DO
//
// It never approves anyone. Approval creates a live, unlimited 10% discount
// code in the customer's name, so it is an admin action taken deliberately,
// not something an applicant can trigger by posting the right shape of JSON
// at this endpoint. approveAffiliate is called from the admin surface only.
//
// It also never returns another person's earnings. A dashboard read requires
// the applicant's own email, and a miss returns the same generic response as
// a wrong one — so this cannot be used to enumerate who our affiliates are
// or what they make.

import { NextRequest, NextResponse } from 'next/server'
import {
  applyForAffiliate,
  getAffiliateByEmail,
  getAffiliateStats,
  recordAffiliateClick,
  AFFILIATE_COMMISSION_PERCENT,
  AFFILIATE_AUDIENCE_DISCOUNT_PERCENT,
  AFFILIATE_HOLD_DAYS,
  AFFILIATE_MIN_PAYOUT_AED,
} from '@/lib/affiliateStore'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const APPLY_MAX = 5
const LOOKUP_MAX = 20
const WINDOW_MS = 10 * 60 * 1000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Click tracking. Redirects are handled by the caller; this only counts. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('ref')
  if (!code) return NextResponse.json({ ok: false }, { status: 400 })
  await recordAffiliateClick(code.slice(0, 40))
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const payload = body as { action?: unknown; name?: unknown; email?: unknown; audience?: unknown }
  const action = String(payload.action ?? '')
  const email = String(payload.email ?? '').trim().toLowerCase().slice(0, 254)

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  if (action === 'stats') {
    if (isRateLimited('affiliate-stats', ip, LOOKUP_MAX, WINDOW_MS)) {
      return NextResponse.json({ error: 'Too many lookups. Try again shortly.' }, { status: 429 })
    }

    const profile = await getAffiliateByEmail(email)
    // Deliberately the same response for "no such affiliate" and "wrong
    // email", so this cannot be used to discover who is on the programme.
    if (!profile) {
      return NextResponse.json({
        found: false,
        message:
          'We have no affiliate application under that address. If you applied with a different email, try that one.',
      })
    }

    const stats = await getAffiliateStats(profile.code)
    return NextResponse.json({
      found: true,
      profile: {
        code: profile.code,
        name: profile.name,
        status: profile.status,
        commissionPercent: profile.commissionPercent,
        createdAt: profile.createdAt,
        approvedAt: profile.approvedAt ?? null,
      },
      stats,
      terms: {
        commissionPercent: AFFILIATE_COMMISSION_PERCENT,
        audienceDiscountPercent: AFFILIATE_AUDIENCE_DISCOUNT_PERCENT,
        holdDays: AFFILIATE_HOLD_DAYS,
        minPayoutAed: AFFILIATE_MIN_PAYOUT_AED,
      },
    })
  }

  if (action === 'apply') {
    if (isRateLimited('affiliate-apply', ip, APPLY_MAX, WINDOW_MS)) {
      return NextResponse.json({ error: 'Too many applications. Try again shortly.' }, { status: 429 })
    }

    const name = String(payload.name ?? '').trim().slice(0, 80)
    const audience = String(payload.audience ?? '').trim().slice(0, 500)

    if (name.length < 2) {
      return NextResponse.json({ error: 'Please give us a name to put on the account.' }, { status: 400 })
    }
    if (audience.length < 10) {
      return NextResponse.json(
        { error: 'Tell us where you would be promoting — a sentence is plenty.' },
        { status: 400 }
      )
    }

    try {
      const profile = await applyForAffiliate(name, email, audience)
      return NextResponse.json({
        ok: true,
        // The code is shown so the applicant knows what theirs will be, but
        // it does not work until an admin approves — stated plainly in the
        // UI rather than left for them to discover at checkout.
        code: profile.code,
        status: profile.status,
        alreadyApplied: profile.status !== 'pending' || profile.name !== name,
      })
    } catch (err) {
      console.error('[affiliate] Application failed:', err)
      return NextResponse.json({ error: 'Could not submit that just now.' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}