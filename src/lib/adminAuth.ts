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

// ROLES (Oct 2026 clean-up brief, B6): owner (Mohammed), admin (Saud),
// agent (the VA). Agents can view contacts, log interactions and record
// consent events; they cannot export or delete, and see only the Contacts
// area of the admin.
//
// Users come from ADMIN_USERS, a JSON array in Vercel:
//   [{"name":"mohammed","role":"owner","password":"…"},
//    {"name":"saud","role":"admin","password":"…"},
//    {"name":"va","role":"agent","password":"…"}]
// Until ADMIN_USERS is set, the original single ADMIN_PASSWORD keeps
// working and signs in as the owner.
export type AdminRole = 'owner' | 'admin' | 'agent'
export interface AdminUser {
  name: string
  role: AdminRole
}

interface ConfiguredUser extends AdminUser {
  password: string
}

function configuredUsers(): ConfiguredUser[] {
  const raw = process.env.ADMIN_USERS
  if (raw) {
    try {
      const list = JSON.parse(raw) as ConfiguredUser[]
      return list
        .filter((u) => u && typeof u.name === 'string' && typeof u.password === 'string' && u.password.length >= 8)
        .map((u) => ({
          name: u.name.trim().toLowerCase(),
          role: (['owner', 'admin', 'agent'] as const).includes(u.role) ? u.role : 'agent',
          password: u.password,
        }))
    } catch {
      console.error('[adminAuth] ADMIN_USERS is not valid JSON — no named users configured')
    }
  }
  if (process.env.ADMIN_PASSWORD) return [{ name: 'owner', role: 'owner', password: process.env.ADMIN_PASSWORD }]
  return []
}

/** True when named users are configured (the login form then asks for a name). */
export function hasNamedUsers(): boolean {
  return Boolean(process.env.ADMIN_USERS)
}

// True only when both admin env vars are actually set — used to give a
// clear "not configured" error instead of a confusing "wrong password"
// when someone forgets to set them in Vercel.
export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_SESSION_SECRET && configuredUsers().length > 0)
}

// Constant-time password check. Buffer lengths must match for
// timingSafeEqual, so a length mismatch (the common case — most guesses
// won't be the right length) is checked separately rather than padding,
// which would leak length information anyway if we got it wrong.
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  if (x.length !== y.length) return false
  return crypto.timingSafeEqual(x, y)
}

/** Checks a name + password. With only ADMIN_PASSWORD set, the name may be blank. */
export function verifyCredentials(name: string, candidate: string): AdminUser | null {
  const users = configuredUsers()
  const n = (name || '').trim().toLowerCase()
  for (const u of users) {
    const nameOk = hasNamedUsers() ? u.name === n : !n || u.name === n
    if (nameOk && safeEqual(candidate, u.password)) return { name: u.name, role: u.role }
  }
  return null
}

/** Backwards-compatible single-password check (owner). */
export function verifyPassword(candidate: string): boolean {
  return Boolean(verifyCredentials('', candidate))
}

export function createSessionToken(user: AdminUser = { name: 'owner', role: 'owner' }): string {
  const payload = JSON.stringify({ exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000, u: user.name, r: user.role })
  const encoded = Buffer.from(payload, 'utf8').toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

/** The signed-in staff member, or null. Sessions issued before roles existed are the owner. */
export function getAdminSession(token: string | undefined | null): AdminUser | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  try {
    if (!safeEqual(sig, sign(encoded))) return null
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
    const role: AdminRole = (['owner', 'admin', 'agent'] as const).includes(payload.r) ? payload.r : 'owner'
    return { name: typeof payload.u === 'string' ? payload.u : 'owner', role }
  } catch {
    return null
  }
}

/**
 * Staff session with full admin access (owner or admin). Every existing
 * /admin page and /api/admin route uses this, so agents are kept out of
 * orders, marketing, reviews and the rest; the Contacts area checks
 * getAdminSession() and the role itself.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  const s = getAdminSession(token)
  return Boolean(s && s.role !== 'agent')
}
