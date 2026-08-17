// src/lib/orderStore.ts
//
// Stores a normalized, customer-facing record of every STRABL order event
// (created, failed, refunded, etc), keyed by the STRABL order short code
// (e.g. "SOR-A5EVGI") — the code customers actually see and have in hand,
// unlike the internal Shopify order id/name.
//
// Why not just read this back from Shopify? Because failed payments never
// create a Shopify order at all (see webhook route) — there'd be nothing
// to look up. Storing the webhook payload directly means /track-order
// works for successful AND failed/refunded orders without a second round
// trip to Shopify, and without polluting Shopify's order data with
// payment attempts that never actually became real orders.
//
// Requires the Upstash Redis integration (Vercel dashboard → Storage →
// Upstash). Vercel KV itself was sunset — see lib/redis.ts for details on
// the credential env vars. If you'd rather not add a Redis dependency,
// this file is the only place that would need to change — swap the two
// functions below for reads/writes against whatever store you prefer
// (Postgres, Supabase, etc). Everything else (webhook route, lookup API,
// /track-order page) only calls saveOrderRecord/getOrderRecord.

import { redis } from '@/lib/redis'

export type OrderStatus = 'created' | 'updated' | 'failed' | 'abandoned' | 'refunded' | 'chargeback'

export interface OrderRecord {
  orderShortCode: string
  orderUuid: string
  status: OrderStatus
  failureReason?: string
  email: string
  customerName?: string
  products: {
    title: string
    price: number
    quantity: number
    variantOptions?: string[]
  }[]
  currency: string
  total: number
  createdAt: string // ISO timestamp of the underlying order, not this record
  updatedAt: string // ISO timestamp this record was last written
  reviewRequestSentAt?: string // set once the post-delivery review-request email has gone out — prevents re-sending on every cron run
}

const KEY_PREFIX = 'order-lookup:'
const RECORD_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year — orders shouldn't vanish from lookup
// Sorted set of completed order short codes, score = createdAt (ms). Lets
// the review-request cron ask "which completed orders were placed N days
// ago" without scanning every key — Redis has no native "list all keys
// matching prefix, sorted by field" operation.
const COMPLETED_INDEX_KEY = 'order-lookup:completed-index'

function keyFor(orderShortCode: string): string {
  return `${KEY_PREFIX}${orderShortCode.trim().toUpperCase()}`
}

export async function saveOrderRecord(record: OrderRecord): Promise<void> {
  if (!record.orderShortCode) {
    console.warn('[orderStore] Refusing to save record with no orderShortCode')
    return
  }
  try {
    await redis.set(keyFor(record.orderShortCode), record, { ex: RECORD_TTL_SECONDS })
    if (record.status === 'created' || record.status === 'updated') {
      await redis.zadd(COMPLETED_INDEX_KEY, {
        score: new Date(record.createdAt).getTime() || Date.now(),
        member: record.orderShortCode.trim().toUpperCase(),
      })
    }
  } catch (err) {
    // Never let a lookup-store failure break the actual order/webhook flow —
    // this is a nice-to-have UI feature, not the source of truth.
    console.error('[orderStore] Failed to save order record:', err)
  }
}

export async function getOrderRecord(orderShortCode: string): Promise<OrderRecord | null> {
  try {
    const record = await redis.get<OrderRecord>(keyFor(orderShortCode))
    return record ?? null
  } catch (err) {
    console.error('[orderStore] Failed to read order record:', err)
    return null
  }
}

// Completed orders with createdAt between [startMs, endMs] — used by the
// review-request cron to find orders that are now old enough to ask for a
// review, without re-scanning orders that are too new or already handled.
export async function getCompletedOrdersInWindow(startMs: number, endMs: number): Promise<OrderRecord[]> {
  try {
    const codes = (await redis.zrange(COMPLETED_INDEX_KEY, startMs, endMs, { byScore: true })) as string[]
    if (codes.length === 0) return []
    const records = await Promise.all(codes.map((code) => getOrderRecord(code)))
    return records.filter((r): r is OrderRecord => r !== null)
  } catch (err) {
    console.error('[orderStore] Failed to query completed orders in window:', err)
    return []
  }
}