// src/app/api/account/verify/route.ts
//
// Step 2: exchange a valid magic-link token for a session cookie.
//
// GET rather than POST because this is opened directly from an email client.
// The token carries a 15-minute expiry and a nonce, and it is swapped
// immediately for an httpOnly session cookie that JavaScript cannot read.
import { NextRequest, NextResponse } from 'next/server'
import {
  verifyMagicToken, issueSessionToken, sessionCookieOptions,
  CUSTOMER_COOKIE_NAME, SESSION_TTL_SECONDS,
} from '@/lib/customerAuth'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const email = token ? verifyMagicToken(token) : null

  if (!email) {
    // Expired or tampered — send them back to request a fresh link rather
    // than showing a dead end.
    return NextResponse.redirect(new URL('/account/login?expired=1', req.url))
  }

  // Honour an optional ?to= destination so an activation link from the order
  // confirmation can land the customer on the page they actually wanted.
  // Restricted to same-site relative paths — an open redirect on an
  // authenticated endpoint is a phishing gift.
  const requested = req.nextUrl.searchParams.get('to') || '/account'
  const destination = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/account'

  const response = NextResponse.redirect(new URL(destination, req.url))
  response.cookies.set(
    CUSTOMER_COOKIE_NAME,
    issueSessionToken(email),
    sessionCookieOptions(SESSION_TTL_SECONDS)
  )
  return response
}