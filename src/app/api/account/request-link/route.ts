// src/app/api/account/request-link/route.ts
//
// Step 1 of passwordless sign-in: email in, magic link out.
//
// OPEN TO EVERYONE (Sep 2026)
// An earlier version only sent the link if an order already existed under
// that address. That has been removed: anyone can create an account, whether
// or not they have ordered yet. A researcher who signs up before their first
// purchase is a good outcome, and the previous behaviour meant they got a
// success message and no email — the worst possible combination.
//
// Removing the gate also removes the enumeration problem it was working
// around. Because the link now goes out for any valid address, the response
// no longer reveals anything about who has ordered, and it can say plainly
// what happened instead of hedging.
//
// The account page handles a signed-in customer with no orders — it shows an
// empty state pointing at the catalogue, not an error.
import { NextRequest, NextResponse } from 'next/server'
import { buildMagicLinkUrl, isCustomerAuthConfigured, normaliseEmail } from '@/lib/customerAuth'
import { sendSignInEmail } from '@/lib/accountEmails'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const MAX_PER_WINDOW = 5
const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_EMAIL = 4
const EMAIL_WINDOW_MS = 60 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const ok = NextResponse.json({
    success: true,
    message: 'Sign-in link sent \u2014 check your inbox.',
  })

  try {
    const ip = getClientIp(req)
    // Rate limited by IP so this can't be used to spam inboxes at volume.
    if (isRateLimited('account-link', ip, MAX_PER_WINDOW, WINDOW_MS)) {
      return NextResponse.json(
        { success: false, message: 'Too many sign-in requests. Please wait a few minutes.' },
        { status: 429 }
      )
    }

    if (!isCustomerAuthConfigured()) {
      console.error('[account] CUSTOMER_SESSION_SECRET is not configured')
      return NextResponse.json(
        { success: false, message: 'Accounts are temporarily unavailable. Please contact hello@pepcolab.com.' },
        { status: 503 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const email = normaliseEmail(typeof body?.email === 'string' ? body.email : '')
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Second rate limit, keyed on the ADDRESS rather than the sender. The IP
    // limit above stops one machine spraying many inboxes; this stops many
    // machines targeting one inbox, which is the version that actually
    // harasses a real person.
    if (isRateLimited('account-link-email', email, MAX_PER_EMAIL, EMAIL_WINDOW_MS)) {
      // Still a success response: telling the sender they've hit a per-address
      // limit confirms that someone else is requesting links for it.
      return ok
    }

    await sendSignInEmail({ to: email, magicLinkUrl: buildMagicLinkUrl(email) })

    return ok
  } catch (err) {
    console.error('[account/request-link]', err)
    return ok
  }
}