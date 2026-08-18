// src/lib/unsubscribeToken.ts
//
// One-click unsubscribe links need to work without a login — this signs the
// email so only links we actually generated (in future campaign sends) are
// honored, rather than trusting a bare ?email= query param from anyone.
import crypto from 'crypto'

function secret(): string {
  const s = process.env.NEWSLETTER_UNSUB_SECRET || process.env.SMTP_PASS
  if (!s) throw new Error('NEWSLETTER_UNSUB_SECRET is not configured')
  return s
}

export function signUnsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', secret()).update(email.trim().toLowerCase()).digest('hex').slice(0, 24)
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = signUnsubscribeToken(email)
    // Constant-time compare — this is a low-stakes token (worst case is an
    // unwanted unsubscribe, not data exposure), but no reason not to.
    return (
      expected.length === token.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
    )
  } catch {
    return false
  }
}

export function buildUnsubscribeUrl(email: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'
  const token = signUnsubscribeToken(email)
  return `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}