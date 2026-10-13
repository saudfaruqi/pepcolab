// src/lib/marketing/store.ts
//
// Redis storage for marketing campaigns, their per-recipient results, the
// global exclusion list and the "last mailed" register used for the
// frequency cap. Same Upstash instance as orders (lib/redis.ts).
import crypto from 'crypto'
import { redis } from '@/lib/redis'
import type { Campaign, Recipient, RecipientResult } from './types'

const CAMPAIGN_KEY = (id: string) => `marketing:campaign:${id}`
const CAMPAIGN_INDEX = 'marketing:campaigns'
const SNAPSHOT_KEY = (id: string) => `marketing:campaign:${id}:snapshot`
const RESULTS_KEY = (id: string) => `marketing:campaign:${id}:results`
const SEND_LOCK_KEY = (id: string) => `marketing:campaign:${id}:lock`
const LAST_SENT_KEY = 'marketing:last-sent'
const EXCLUDED_KEY = 'marketing:excluded'
const EXCLUDED_SEEDED_KEY = 'marketing:excluded-seeded-v1'

// Internal test and spam addresses already present in the order records.
// Seeded into the exclusion list once; editable from /admin/marketing after.
const INITIAL_EXCLUSIONS = [
  'saudfaruqi123@gmail.com',
  'saudafaruqi@gmail.com',
  'adsteam@blackhatstrategy.com',
]

export function newCampaignId(): string {
  return `cmp_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`
}

export async function saveCampaign(c: Campaign): Promise<void> {
  await redis.set(CAMPAIGN_KEY(c.id), c)
  await redis.zadd(CAMPAIGN_INDEX, { score: new Date(c.createdAt).getTime() || Date.now(), member: c.id })
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (!/^cmp_[a-z0-9]+$/i.test(id)) return null
  return (await redis.get<Campaign>(CAMPAIGN_KEY(id))) ?? null
}

export async function listCampaigns(limit = 100): Promise<Campaign[]> {
  const ids = (await redis.zrange(CAMPAIGN_INDEX, 0, limit - 1, { rev: true })) as string[]
  if (!ids?.length) return []
  const all = await Promise.all(ids.map((id) => getCampaign(id)))
  return all.filter((c): c is Campaign => Boolean(c))
}

export async function deleteCampaign(id: string): Promise<void> {
  await redis.del(CAMPAIGN_KEY(id), SNAPSHOT_KEY(id), RESULTS_KEY(id))
  await redis.zrem(CAMPAIGN_INDEX, id)
}

// ── Recipient snapshot ────────────────────────────────────────────────────
// Frozen when sending starts, so the audience can't shift between batches
// (a new order mid-send must not make someone appear or disappear).
export async function saveSnapshot(id: string, recipients: Recipient[]): Promise<void> {
  await redis.set(SNAPSHOT_KEY(id), recipients)
}

export async function getSnapshot(id: string): Promise<Recipient[] | null> {
  return (await redis.get<Recipient[]>(SNAPSHOT_KEY(id))) ?? null
}

// ── Per-recipient results ─────────────────────────────────────────────────
export async function recordResult(id: string, r: RecipientResult): Promise<void> {
  await redis.hset(RESULTS_KEY(id), { [r.email]: JSON.stringify(r) })
}

export async function clearResults(id: string, emails: string[]): Promise<void> {
  if (emails.length) await redis.hdel(RESULTS_KEY(id), ...emails)
}

export async function getResults(id: string): Promise<Map<string, RecipientResult>> {
  const raw = (await redis.hgetall<Record<string, unknown>>(RESULTS_KEY(id))) || {}
  const map = new Map<string, RecipientResult>()
  for (const [email, v] of Object.entries(raw)) {
    try {
      map.set(email, (typeof v === 'string' ? JSON.parse(v) : v) as RecipientResult)
    } catch {
      // A malformed entry is treated as "not processed" and retried.
    }
  }
  return map
}

// ── Send lock (one batch at a time per campaign) ──────────────────────────
export async function acquireSendLock(id: string): Promise<boolean> {
  const ok = await redis.set(SEND_LOCK_KEY(id), '1', { nx: true, ex: 120 })
  return ok === 'OK'
}

export async function releaseSendLock(id: string): Promise<void> {
  await redis.del(SEND_LOCK_KEY(id))
}

// ── Frequency cap register ────────────────────────────────────────────────
export async function markMarketingSent(email: string): Promise<void> {
  await redis.zadd(LAST_SENT_KEY, { score: Date.now(), member: email.trim().toLowerCase() })
}

export async function lastMarketingSentAt(email: string): Promise<number | null> {
  const score = await redis.zscore(LAST_SENT_KEY, email.trim().toLowerCase())
  return score === null || score === undefined ? null : Number(score)
}

// ── Global exclusion list ─────────────────────────────────────────────────
export async function listExcluded(): Promise<string[]> {
  if (!(await redis.get(EXCLUDED_SEEDED_KEY))) {
    if (INITIAL_EXCLUSIONS.length) await redis.sadd(EXCLUDED_KEY, INITIAL_EXCLUSIONS[0], ...INITIAL_EXCLUSIONS.slice(1))
    await redis.set(EXCLUDED_SEEDED_KEY, new Date().toISOString())
  }
  const members = (await redis.smembers(EXCLUDED_KEY)) as string[]
  return (members || []).map((m) => String(m)).sort()
}

export async function setExcluded(emails: string[]): Promise<string[]> {
  const clean = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))))
  await redis.del(EXCLUDED_KEY)
  if (clean.length) await redis.sadd(EXCLUDED_KEY, clean[0], ...clean.slice(1))
  await redis.set(EXCLUDED_SEEDED_KEY, new Date().toISOString())
  return clean.sort()
}
