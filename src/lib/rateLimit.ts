// src/lib/rateLimit.ts
//
// Best-effort, in-memory, per-instance rate limiting. Same caveat as the
// original in orders/lookup/route.ts: fine for a single serverless
// instance, resets on redeploy/cold-start, and doesn't coordinate across
// concurrently-running instances — not a substitute for real rate limiting
// at the edge (Vercel Firewall / Upstash Ratelimit) if any of these routes
// ever gets seriously abused. Good enough to stop casual scripted spam,
// which is the actual threat model for a contact form and review box.
//
// One shared Map keyed by `${bucket}:${ip}` so unrelated routes (contact,
// reviews, order lookup) don't share a budget with each other — hammering
// the contact form shouldn't also lock a visitor out of submitting a
// review.

interface Entry {
  count: number
  resetAt: number
}

const buckets = new Map<string, Entry>()

// Opportunistic cleanup so this Map can't grow unbounded across a long-lived
// instance — runs inline on writes rather than a separate timer, since
// serverless functions don't reliably keep timers alive between invocations.
function sweep() {
  if (buckets.size < 5000) return
  const now = Date.now()
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key)
  }
}

export function getClientIp(req: Request): string {
  const headers = (req as any).headers as Headers
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/**
 * @param bucket   Logical namespace for this limit, e.g. 'contact', 'review-submit'
 * @param ip       Client IP (see getClientIp)
 * @param max      Max requests allowed within the window
 * @param windowMs Window length in milliseconds
 * @returns true if the caller IS rate-limited (i.e. should be rejected)
 */
export function isRateLimited(bucket: string, ip: string, max: number, windowMs: number): boolean {
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const entry = buckets.get(key)

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    sweep()
    return false
  }

  entry.count += 1
  return entry.count > max
}