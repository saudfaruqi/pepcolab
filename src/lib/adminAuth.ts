// src/lib/adminAuth.ts
//
// Minimal password gate for /admin. No user accounts, no database table —
// just one shared password (ADMIN_PASSWORD) and a signed, expiring session
// cookie so you don't have to re-enter it on every request. Same shape as
// the token-protected routes elsewhere in this app (discounts/admin,
// notify/trigger, newsletter/export), just cookie-based instead of
// header-based since this is a page you browse, not a route you curl.
//
// Session token format: `${base64url(payload)}.${hmac-sha256(payload)}`,
// verified with a constant-time comparison. This is intentionally NOT a
// JWT library — there's exactly one claim (an expiry), so a hand-rolled
// signed token is less surface area than pulling in `jose` for one field.
//
// Requires two env vars, set in Vercel:
//   ADMIN_PASSWORD        — the password you type in at /admin/login
//   ADMIN_SESSION_SECRET  — random string used to sign the session cookie
//                            (e.g. `openssl rand -hex 32`). Different from
//                            ADMIN_PASSWORD on purpose: rotating the
//                            session secret invalidates every logged-in
//                            session without changing the password anyone
//                            has to remember, and vice versa.
// Neither is defaulted — login refuses to work at all if either is
// missing, rather than silently accepting anything.
import crypto from 'crypto'

export const ADMIN_COOKIE_NAME = 'pepcolab_admin_session'
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured')
  }
  return secret
}

function sign(encodedPayload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url')
}

// True only when both admin env vars are actually set — used to give a
// clear "not configured" error instead of a confusing "wrong password"
// when someone forgets to set them in Vercel.
export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET)
}

// Constant-time password check. Buffer lengths must match for
// timingSafeEqual, so a length mismatch (the common case — most guesses
// won't be the right length) is checked separately rather than padding,
// which would leak length information anyway if we got it wrong.
export function verifyPassword(candidate: string): boolean {
  const configured = process.env.ADMIN_PASSWORD
  if (!configured) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(configured)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function createSessionToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000 })
  const encoded = Buffer.from(payload, 'utf8').toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [encoded, sig] = parts
  try {
    const expectedSig = sign(encoded)
    const a = Buffer.from(sig)
    const b = Buffer.from(expectedSig)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false
    return true
  } catch {
    // Malformed cookie (tampered, truncated, stale format after a secret
    // rotation) — treat exactly like "not logged in", never throw.
    return false
  }
}