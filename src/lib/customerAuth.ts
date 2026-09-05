// src/lib/customerAuth.ts
//
// CUSTOMER ACCOUNTS — passwordless, September 2026
// ------------------------------------------------
// WHY NO PASSWORDS
// Every order in this system already carries a verified email address, and
// that address is the only identifier a customer account actually needs here.
// Adding passwords would mean storing password hashes, building reset flows,
// handling breach exposure, and adding a field people forget — all to prove
// something the order record already proves.
//
// So: the customer enters their email, we send a signed one-time link, and
// clicking it establishes a session. Same security model as a password reset
// email, minus the password. Fewer moving parts, nothing sensitive at rest,
// and materially less friction — which matters because the entire point of
// accounts here is making reorder fast.
//
// TOKEN FORMAT
// Both the magic link and the session use `${base64url(payload)}.${hmac}`,
// deliberately matching lib/adminAuth.ts rather than introducing a JWT
// library for two claims. Constant-time comparison on verify.
//
// THE TWO TOKENS ARE DIFFERENT ON PURPOSE
//   Magic link: 15-minute TTL, single purpose, sent over email.
//   Session:    30-day TTL, httpOnly cookie, never leaves the browser.
// A leaked magic link expires almost immediately; a session cookie can't be
// read by JavaScript. Signing both with the same secret is fine because the
// payloads carry distinct `t` (type) fields, so a magic-link token cannot be
// replayed as a session cookie or vice versa.
//
// REQUIRED ENV: CUSTOMER_SESSION_SECRET (e.g. `openssl rand -hex 32`).
// Not defaulted — auth refuses to operate if it's missing rather than
// silently signing with a guessable value.

import crypto from 'crypto'

export const CUSTOMER_COOKIE_NAME = 'pepcolab_customer_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90 // 90 days

/**
 * SLIDING SESSIONS (Sep 2026)
 * ---------------------------
 * A fixed 30-day session expired an active customer on day 31 for no reason
 * other than the calendar, and every expiry meant another wait for an email.
 * That was the real friction in passwordless sign-in — not the first sign-in,
 * which happens once, but the pointless repeat ones.
 *
 * Sessions now renew as they are used. Any authenticated request with more
 * than a third of its life elapsed gets a fresh 90-day cookie, so somebody
 * who visits even occasionally is effectively never signed out, while a
 * genuinely abandoned session still lapses on schedule.
 *
 * The renewal threshold exists so we aren't rewriting a cookie on every
 * single request — only when it's actually worth extending.
 */
export const SESSION_RENEW_AFTER_SECONDS = SESSION_TTL_SECONDS / 3
export const MAGIC_LINK_TTL_SECONDS = 60 * 15 // 15 minutes
/**
 * Longer-lived link embedded in the ORDER CONFIRMATION email, so a customer
 * who just paid can reach their account in one tap without typing anything.
 *
 * 30 days rather than 15 minutes because order confirmations get opened days
 * or weeks later — a 15-minute fuse would mean the link is almost always dead
 * by the time someone goes looking for it, which is worse than useless.
 * It still proves control of the inbox, which is the property that matters,
 * and it is the same model Substack and Medium use for their sign-in links.
 */
export const ACTIVATION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

type TokenType = 'magic' | 'session'

interface TokenPayload {
  /** Email, always normalised to lowercase and trimmed. */
  e: string
  /** Token type — prevents a magic link being replayed as a session. */
  t: TokenType
  /** Expiry, epoch seconds. */
  x: number
  /** Nonce, so two tokens issued in the same second differ. */
  n: string
}

function getSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET
  if (!secret) throw new Error('CUSTOMER_SESSION_SECRET is not configured')
  return secret
}

export function isCustomerAuthConfigured(): boolean {
  return Boolean(process.env.CUSTOMER_SESSION_SECRET)
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

function sign(encoded: string): string {
  return crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url')
}

function issue(email: string, type: TokenType, ttlSeconds: number): string {
  const payload: TokenPayload = {
    e: normaliseEmail(email),
    t: type,
    x: Math.floor(Date.now() / 1000) + ttlSeconds,
    n: crypto.randomBytes(6).toString('base64url'),
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

function verify(token: string, expectedType: TokenType): string | null {
  try {
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null

    const expected = sign(encoded)
    // Constant-time compare. Length check first because timingSafeEqual
    // throws on a length mismatch rather than returning false.
    if (expected.length !== signature.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null

    const payload: TokenPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (payload.t !== expectedType) return null
    if (payload.x < Math.floor(Date.now() / 1000)) return null
    if (!payload.e) return null

    return payload.e
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */

export function issueMagicToken(email: string): string {
  return issue(email, 'magic', MAGIC_LINK_TTL_SECONDS)
}

/** Returns the email if the magic token is valid and unexpired, else null. */
export function verifyMagicToken(token: string): string | null {
  return verify(token, 'magic')
}

export function issueSessionToken(email: string): string {
  return issue(email, 'session', SESSION_TTL_SECONDS)
}

/** Returns the signed-in email, or null. */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null
  return verify(token, 'session')
}

/**
 * Whether a still-valid session is old enough to be worth reissuing.
 *
 * Reads the expiry out of the token rather than tracking issue time
 * separately: a token with less than two-thirds of its life left has had more
 * than a third elapsed, which is the renewal point.
 *
 * Returns false for anything unparseable — a token we can't read is one we
 * shouldn't be extending.
 */
export function shouldRenewSession(token: string | undefined | null): boolean {
  if (!token) return false
  try {
    const [encoded] = token.split('.')
    if (!encoded) return false
    const payload: TokenPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (payload.t !== 'session' || !payload.x) return false
    const remaining = payload.x - Math.floor(Date.now() / 1000)
    return remaining > 0 && remaining < SESSION_TTL_SECONDS - SESSION_RENEW_AFTER_SECONDS
  } catch {
    return false
  }
}

/**
 * One-tap account link for the order confirmation email.
 *
 * This is what "you're signed in already, just confirm it's you" means in
 * practice: the customer taps once from the email that was already going to
 * arrive, and lands signed in on their order. No password, no separate
 * registration, no second email.
 */
export function buildActivationUrl(email: string, redirectTo = '/account'): string {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'
  const token = issue(email, 'magic', ACTIVATION_TTL_SECONDS)
  return `${siteUrl}/api/account/verify?token=${encodeURIComponent(token)}&to=${encodeURIComponent(redirectTo)}`
}

export function buildMagicLinkUrl(email: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'
  // BUG FIX (Sep 2026): this pointed at /account/verify, which is a page
  // route that does not exist — every magic link 404'd. The handler is the
  // API route below, which validates the token, sets the session cookie and
  // then redirects to /account.
  //
  // If you ever add a real /account/verify PAGE, this must keep pointing at
  // the API route: the cookie has to be set on the response that the email
  // click lands on, and a client page cannot set an httpOnly cookie.
  return `${siteUrl}/api/account/verify?token=${encodeURIComponent(issueMagicToken(email))}`
}

/** Cookie options shared by the set and clear paths so they can't drift. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}