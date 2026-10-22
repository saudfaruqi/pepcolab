// src/lib/crm/pending.ts
//
// Consent ticked before the order exists. At checkout (and sometimes on the
// order-confirmed page) the browser knows the checkout reference but no
// order or contact exists yet. The choice is held here under that reference,
// with its evidence, and written as consent events when the STRABL webhook
// creates the order and its contact (app/api/webhook/strabl/route.ts).
import { redis } from '@/lib/redis'
import type { Channel, CapturePoint, ConsentEvidence } from './types'

export interface PendingConsent {
  channel: Channel
  wordingVersion: string
  capturePoint: CapturePoint
  evidence: ConsentEvidence
  occurredAt: string
}

const KEY = (ref: string) => `crm:pending:${ref}`
const TTL = 60 * 60 * 24 * 3

export async function savePendingConsents(ref: string, items: PendingConsent[]): Promise<void> {
  if (!ref || !items.length) return
  await redis.rpush(KEY(ref), ...items.map((i) => JSON.stringify(i)))
  await redis.expire(KEY(ref), TTL)
}

/** Reads and clears the pending choices for a checkout. */
export async function takePendingConsents(ref: string): Promise<PendingConsent[]> {
  if (!ref) return []
  try {
    const raw = ((await redis.lrange(KEY(ref), 0, -1)) as unknown[]) || []
    if (raw.length) await redis.del(KEY(ref))
    return raw.map((r) => (typeof r === 'string' ? JSON.parse(r) : r) as PendingConsent)
  } catch (err) {
    console.error('[crm/pending] read failed:', err)
    return []
  }
}
