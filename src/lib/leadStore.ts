// src/lib/leadStore.ts
//
// Leads from the /learn guide pages (Meta ads → guide → email).
//
// One record per email address, however many guides they request:
//   lead:<email>      → LeadRecord
//   leads:all         → zset of emails, score = first sign-up time
//   leads:nurture     → zset of emails due a follow-up email, score = due time
//
// The follow-up series only runs for leads who ticked the opt-in box
// (`emailOptIn`). Everyone gets the guide they asked for — that is the
// service they requested, not marketing.
import { redis } from '@/lib/redis'

export interface LeadRecord {
  email: string
  firstName: string
  createdAt: string
  updatedAt: string
  /** Attribution values in the order seen, e.g. ["fb-coa", "fb-store"]. */
  sources: string[]
  /** Guide slugs requested. */
  guides: string[]
  /** Opted in to the follow-up series and future guides. */
  emailOptIn: boolean
  /** Index of the last follow-up email sent (0 = guide delivery only). */
  step: number
  /** When the next follow-up is due (ms), or null when the series is over. */
  nextAt: number | null
  /** What the visitor said they research, from the optional dropdown. */
  researchArea?: string
}

const KEY = (email: string) => `lead:${email.trim().toLowerCase()}`
const ALL = 'leads:all'
const NURTURE = 'leads:nurture'

export async function getLead(email: string): Promise<LeadRecord | null> {
  return (await redis.get<LeadRecord>(KEY(email))) ?? null
}

export async function saveLead(lead: LeadRecord): Promise<void> {
  const email = lead.email.trim().toLowerCase()
  await redis.set(KEY(email), { ...lead, email })
  await redis.zadd(ALL, { score: new Date(lead.createdAt).getTime() || Date.now(), member: email })
  if (lead.emailOptIn && lead.nextAt) {
    await redis.zadd(NURTURE, { score: lead.nextAt, member: email })
  } else {
    await redis.zrem(NURTURE, email)
  }
}

/** Leads whose next follow-up is due now. */
export async function getDueLeads(now = Date.now(), limit = 100): Promise<LeadRecord[]> {
  const emails = (await redis.zrange(NURTURE, 0, now, { byScore: true, offset: 0, count: limit })) as string[]
  if (!emails?.length) return []
  const records = await Promise.all(emails.map((e) => getLead(e)))
  return records.filter((r): r is LeadRecord => Boolean(r))
}

export async function listLeads(limit = 2000): Promise<LeadRecord[]> {
  const emails = (await redis.zrange(ALL, 0, limit - 1, { rev: true })) as string[]
  if (!emails?.length) return []
  const records = await Promise.all(emails.map((e) => getLead(e)))
  return records.filter((r): r is LeadRecord => Boolean(r))
}

export async function countLeads(): Promise<number> {
  return (await redis.zcard(ALL)) || 0
}
