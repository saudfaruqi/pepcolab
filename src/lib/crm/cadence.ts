// src/lib/crm/cadence.ts
//
// Marketing cadence ceiling (brief B8): at most 2 marketing emails per
// contact per rolling 7 days, across every marketing send — campaigns,
// lifecycle emails and the guide follow-up series. Service emails (order,
// dispatch, delivery, replies) are never counted or limited.
import { redis } from '@/lib/redis'
import { hashEmail, isEmailMarketable } from './store'

export const MAX_MARKETING_PER_WEEK = 2
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const KEY = (email: string) => `crm:mkt:${hashEmail(email)}`

export async function marketingSendsLastWeek(email: string, now = Date.now()): Promise<number> {
  const key = KEY(email)
  await redis.zremrangebyscore(key, 0, now - WEEK_MS)
  return (await redis.zcard(key)) || 0
}

export async function recordMarketingSend(email: string, now = Date.now()): Promise<void> {
  const key = KEY(email)
  await redis.zadd(key, { score: now, member: `${now}-${Math.random().toString(36).slice(2, 8)}` })
  await redis.expire(key, 60 * 60 * 24 * 8)
}

export type MarketingBlock = 'no_consent' | 'cadence'

/** null when a marketing email may go to this address now; otherwise why not. Fails closed. */
export async function marketingBlockFor(email: string): Promise<MarketingBlock | null> {
  try {
    if (!(await isEmailMarketable(email))) return 'no_consent'
    if ((await marketingSendsLastWeek(email)) >= MAX_MARKETING_PER_WEEK) return 'cadence'
    return null
  } catch (err) {
    console.error('[crm/cadence] check failed — not sending:', err)
    return 'no_consent'
  }
}
