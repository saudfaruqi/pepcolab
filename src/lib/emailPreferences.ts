// src/lib/emailPreferences.ts
//
// MARKETING OPT-OUTS (Sep 2026)
//
// One list of addresses that have asked to stop non-essential email. Before
// this existed, the "Stop reorder reminders" link only removed the address
// from the newsletter list — which nothing else checked — so the reorder,
// review and win-back emails kept going to people who had opted out.
//
// Every non-essential email (reorder reminder, review request, aftercare
// check-in, win-back) must call isMarketingSuppressed() before sending.
// Transactional email (order confirmation, payment failed, dispatch, sign-in
// link) is not affected — customers always need those.

import { redis } from '@/lib/redis'

const SUPPRESSED_KEY = 'email:suppressed'

function normalise(email: string): string {
  return email.trim().toLowerCase()
}

/** Adds an address to the opt-out list. Idempotent. */
export async function suppressMarketingEmail(email: string): Promise<void> {
  const value = normalise(email)
  if (!value) return
  await redis.zadd(SUPPRESSED_KEY, { score: Date.now(), member: value })
}

/**
 * True if the address has opted out. Fails CLOSED: if Redis can't be read,
 * the email is treated as suppressed, because skipping one reminder is far
 * cheaper than emailing someone who asked us to stop.
 */
export async function isMarketingSuppressed(email: string): Promise<boolean> {
  const value = normalise(email)
  if (!value) return true
  try {
    const score = await redis.zscore(SUPPRESSED_KEY, value)
    return score !== null && score !== undefined
  } catch (err) {
    console.error('[emailPreferences] Could not read opt-out list — skipping send:', err)
    return true
  }
}