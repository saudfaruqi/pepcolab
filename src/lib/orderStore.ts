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
// Requires Vercel KV: run `vercel env pull` after adding the KV
// integration in the Vercel dashboard (Storage tab) so KV_REST_API_URL /
// KV_REST_API_TOKEN exist locally. If you'd rather not add a KV
// dependency, this file is the only place that would need to change —
// swap the two functions below for reads/writes against whatever store
// you prefer (Postgres, Supabase, etc). Everything else (webhook route,
// lookup API, /track-order page) only calls saveOrderRecord/getOrderRecord.

import { kv } from '@vercel/kv'

export type OrderStatus = 'created' | 'updated' | 'failed' | 'refunded' | 'chargeback'

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
}

const KEY_PREFIX = 'order-lookup:'
const RECORD_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year — orders shouldn't vanish from lookup

function keyFor(orderShortCode: string): string {
  return `${KEY_PREFIX}${orderShortCode.trim().toUpperCase()}`
}

export async function saveOrderRecord(record: OrderRecord): Promise<void> {
  if (!record.orderShortCode) {
    console.warn('[orderStore] Refusing to save record with no orderShortCode')
    return
  }
  try {
    await kv.set(keyFor(record.orderShortCode), record, { ex: RECORD_TTL_SECONDS })
  } catch (err) {
    // Never let a lookup-store failure break the actual order/webhook flow —
    // this is a nice-to-have UI feature, not the source of truth.
    console.error('[orderStore] Failed to save order record:', err)
  }
}

export async function getOrderRecord(orderShortCode: string): Promise<OrderRecord | null> {
  try {
    const record = await kv.get<OrderRecord>(keyFor(orderShortCode))
    return record ?? null
  } catch (err) {
    console.error('[orderStore] Failed to read order record:', err)
    return null
  }
}