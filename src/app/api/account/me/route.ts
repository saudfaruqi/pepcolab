// src/app/api/account/me/route.ts
//
// Who is signed in, if anyone. Powers the site-wide signed-in state.
//
// Deliberately cheap and deliberately thin: it is called once per page load
// by CustomerProvider, so it does the minimum needed to render a nav item and
// prefill a form field.
//
// Returns 200 with signedIn:false rather than 401 for a signed-out visitor.
// Being signed out is the normal state, not an error, and a 401 on every
// anonymous page load fills the console with noise that hides real problems.
import { NextRequest, NextResponse } from 'next/server'
import {
  verifySessionToken, shouldRenewSession, issueSessionToken,
  sessionCookieOptions, CUSTOMER_COOKIE_NAME, SESSION_TTL_SECONDS,
} from '@/lib/customerAuth'
import { getOrdersForEmail } from '@/lib/orderStore'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value
  const email = verifySessionToken(token)
  if (!email) {
    return NextResponse.json({ signedIn: false })
  }

  let orderCount = 0
  let name: string | null = null
  try {
    const orders = await getOrdersForEmail(email, 50)
    orderCount = orders.length
    name = orders.find(o => o.customerName)?.customerName ?? null
  } catch {
    // A store failure must not sign someone out of the UI — they are still
    // authenticated, we just can't decorate the nav with their order count.
  }

  const response = NextResponse.json({
    signedIn: true,
    email,
    name,
    firstName: name ? name.trim().split(/\s+/)[0] : null,
    orderCount,
  })

  // SLIDING RENEWAL. This endpoint runs on every page load, which makes it
  // the natural place to extend an active session. Someone who uses the site
  // at all is now effectively never signed out, so they never wait on a
  // sign-in email again — while an abandoned session still lapses normally.
  if (shouldRenewSession(token)) {
    response.cookies.set(
      CUSTOMER_COOKIE_NAME,
      issueSessionToken(email),
      sessionCookieOptions(SESSION_TTL_SECONDS)
    )
  }

  return response
}