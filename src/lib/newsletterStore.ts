// src/lib/newsletterStore.ts
//
// Centralizes newsletter subscriber storage — previously duplicated (and
// inconsistently) across app/api/newsletter/route.ts,
// app/api/newsletter/export/route.ts, and now the admin dashboard.
//
// SELF-HEALING MIGRATION: in production, `newsletter:subscribers` was
// found holding a Redis SET, not the ZSET this app's code has always
// assumed (score = signup timestamp, used for CSV export and now the
// admin dashboard's "subscribed" column). Every zadd/zscore/zrange call
// against a key of the wrong type fails with WRONGTYPE — which means
// every newsletter signup through Footer.tsx has almost certainly been
// silently 500ing (caught, logged server-side only, generic error shown
// to the visitor) since whichever deploy first shipped the zset-based
// code against that already-existing key. `ensureZset()` below runs
// before every read/write here: if the key exists and isn't a zset, it
// pulls the emails out with SMEMBERS (the one thing a plain set supports),
// deletes the key, and rebuilds it as a zset. The original signup dates
// aren't recoverable from a plain set (no score field exists there), so
// migrated members get "migration time" as their date — the most honest
// answer available, not a guess dressed up as the real one.
import { redis } from '@/lib/redis'

export const SUBSCRIBERS_KEY = 'newsletter:subscribers'

let migrationChecked = false // one TYPE check per server instance, not per request

async function ensureZset(): Promise<void> {
  if (migrationChecked) return
  try {
    const type = await redis.type(SUBSCRIBERS_KEY)
    if (type === 'zset' || type === 'none') {
      migrationChecked = true
      return
    }

    console.warn(
      `[newsletterStore] "${SUBSCRIBERS_KEY}" is a Redis "${type}", not the expected zset — migrating in place.`
    )
    const members = type === 'set' ? await redis.smembers(SUBSCRIBERS_KEY) : []
    await redis.del(SUBSCRIBERS_KEY)
    if (members.length > 0) {
      const now = Date.now()
      // redis.zadd's types require at least one score/member pair as a
      // direct argument, not just spread from an array — destructuring out
      // a guaranteed-present first element (members.length > 0 above) satisfies
      // that, with the rest spread covering however many more there are.
      const [first, ...rest] = members.map((email) => ({ score: now, member: email }))
      await redis.zadd(SUBSCRIBERS_KEY, first, ...rest)
    }
    console.warn(`[newsletterStore] Migrated ${members.length} subscriber(s) into a zset.`)
    migrationChecked = true
  } catch (err) {
    // Don't rethrow and don't set migrationChecked — let the caller's own
    // zadd/zscore/zrange run and surface its real error if the key is
    // still in a bad state, and let the next request retry the check.
    console.error('[newsletterStore] Migration check failed:', err)
  }
}

export interface Subscriber {
  email: string
  subscribedAt: number
}

// Returns whether this was a first-time signup (vs. a re-subscribe) so
// the caller can decide whether to fire the admin notification email.
export async function addSubscriber(email: string): Promise<{ isNew: boolean }> {
  await ensureZset()
  const existingScore = await redis.zscore(SUBSCRIBERS_KEY, email)
  const isNew = existingScore === null
  await redis.zadd(SUBSCRIBERS_KEY, { score: Date.now(), member: email })
  return { isNew }
}

export async function listSubscribers(): Promise<Subscriber[]> {
  await ensureZset()
  const raw = await redis.zrange(SUBSCRIBERS_KEY, 0, -1, { withScores: true, rev: true })
  const subscribers: Subscriber[] = []
  for (let i = 0; i < raw.length; i += 2) {
    subscribers.push({ email: String(raw[i]), subscribedAt: Number(raw[i + 1]) })
  }
  return subscribers
}