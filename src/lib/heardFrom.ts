// src/lib/heardFrom.ts
//
// "How did you hear about us?" — asked on /checkout/success (Meta Ads
// Strategy, Oct 2026: the one attribution signal that survives iOS, ad
// blockers and declined cookies). STRABL's hosted checkout cannot carry an
// extra question, so it is asked after payment and joined to the order.
//
// JOINING THE ANSWER TO THE ORDER
// STRABL returns to /checkout/success with no order data. The browser keeps
// a checkout reference (the analytics transaction id) and also sends it to
// STRABL in cart.extra.ref. Then, whichever arrives second does the join:
//   - webhook first (the usual case): it records checkout-ref:<ref> → order
//     code, and the answer is written straight onto that order;
//   - answer first: it waits under heard-from:pending:<ref> and the webhook
//     picks it up when it builds the order record.
// If STRABL turns out not to echo cart.extra back, the answer is matched to
// a recent order with exactly the same items instead, and only when that
// match is unique.

import { redis } from '@/lib/redis'

export { HEARD_FROM_OPTIONS, heardFromLabel } from '@/lib/heardFromOptions'

export interface HeardFrom {
  answer: string
  /** Free text for "Somewhere else". */
  detail?: string
  at: string
}

const REF_KEY = (ref: string) => `checkout-ref:${ref}`
const PENDING_KEY = (ref: string) => `heard-from:pending:${ref}`
const TTL = 60 * 60 * 24 * 3

export function cleanCheckoutRef(raw: unknown): string {
  const v = typeof raw === 'string' ? raw.trim() : ''
  return /^PL-\d{10,16}-[A-Z0-9]{4,10}$/.test(v) ? v : ''
}

export async function rememberCheckoutRef(ref: string, orderShortCode: string): Promise<void> {
  if (!ref || !orderShortCode) return
  try {
    await redis.set(REF_KEY(ref), orderShortCode.trim().toUpperCase(), { ex: TTL })
  } catch (err) {
    console.error('[heardFrom] could not store checkout ref:', err)
  }
}

export async function orderForCheckoutRef(ref: string): Promise<string | null> {
  if (!ref) return null
  return (await redis.get<string>(REF_KEY(ref))) ?? null
}

export async function savePendingHeardFrom(ref: string, value: HeardFrom): Promise<void> {
  await redis.set(PENDING_KEY(ref), value, { ex: TTL })
}

/** Reads and clears a waiting answer. */
export async function takePendingHeardFrom(ref: string): Promise<HeardFrom | undefined> {
  if (!ref) return undefined
  try {
    const v = await redis.get<HeardFrom>(PENDING_KEY(ref))
    if (v) await redis.del(PENDING_KEY(ref))
    return v ?? undefined
  } catch {
    return undefined
  }
}
