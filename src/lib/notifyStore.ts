// src/lib/notifyStore.ts
//
// Same shape of problem as newsletter signups (lib/newsletter route): no
// inventory webhook from Shopify is wired up yet to auto-detect "back in
// stock" and fire emails automatically. Until that exists, this captures
// interest per product (so demand isn't silently lost the way newsletter
// signups used to be — see app/api/newsletter/route.ts's own comment) and
// gives you a manual, token-protected way to notify everyone on a
// product's list once you've restocked it — see
// app/api/notify/trigger/route.ts.
//
// When you do wire up a Shopify inventory webhook, that webhook handler
// should just call notifyAndClear() for the restocked product's slug —
// everything else here stays the same.
import { redis } from '@/lib/redis'

const REQUESTS_KEY = (slug: string) => `notify:requests:${slug}` // sorted set, score = requestedAt

export interface NotifyRequest {
  email: string
  requestedAt: number
}

export async function addNotifyRequest(slug: string, email: string): Promise<{ isNew: boolean }> {
  const key = REQUESTS_KEY(slug)
  const existingScore = await redis.zscore(key, email)
  await redis.zadd(key, { score: Date.now(), member: email })
  return { isNew: existingScore === null }
}

export async function listNotifyRequests(slug: string): Promise<string[]> {
  const emails = (await redis.zrange(REQUESTS_KEY(slug), 0, -1)) as string[]
  return emails
}

export async function clearNotifyRequests(slug: string): Promise<void> {
  await redis.del(REQUESTS_KEY(slug))
}

export async function notifyRequestCount(slug: string): Promise<number> {
  return redis.zcard(REQUESTS_KEY(slug))
}