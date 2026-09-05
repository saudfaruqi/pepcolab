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
import type { CleanAddress } from '@/lib/addressNormalise'

// BUG FIX (Aug 2026): added 'awaiting_payment_mark'. Previously, when
// createShopifyOrder() succeeded but the follow-up markShopifyOrderPaid()
// call threw (see shopifyAdmin.ts fix — this failed on essentially every
// order), the webhook handler's catch block saved status 'processing' with
// no record of the Shopify order that had, in fact, already been created.
// A STRABL retry would then see no 'created'/'updated' record, assume
// nothing existed yet, and call createShopifyOrder() again — a real
// duplicate order in Shopify, every retry, for as long as mark-paid kept
// failing. 'awaiting_payment_mark' + shopifyOrderId below closes that gap:
// once the Shopify order exists, that fact is saved BEFORE attempting to
// mark it paid, so a retry can find and reuse it instead of creating a
// second one.
export type OrderStatus = 'created' | 'updated' | 'awaiting_payment_mark' | 'processing' | 'failed' | 'abandoned' | 'refunded' | 'chargeback'

export interface OrderRecord {
  orderShortCode: string
  orderUuid: string
  status: OrderStatus
  // Set as soon as createShopifyOrder() succeeds, before the mark-paid
  // attempt — see the OrderStatus comment above for why this ordering
  // matters. Lets a retry skip re-creating the Shopify order.
  shopifyOrderId?: string
  failureReason?: string
  email: string
  phone?: string
  customerName?: string
  products: {
    title: string
    price: number
    quantity: number
    variantOptions?: string[]
    variantId?: string // Shopify Storefront GID, when STRABL gave us one — needed to rebuild a real Storefront cart for abandoned-cart restore links. Absent for Payment Link orders.
  }[]
  currency: string
  total: number
  createdAt: string // ISO timestamp of the underlying order, not this record
  updatedAt: string // ISO timestamp this record was last written
  reviewRequestSentAt?: string // set once the post-delivery review-request email has gone out — prevents re-sending on every cron run
  recoveryEmailStage?: 0 | 1 | 2 // abandoned-cart recovery: 0 = none sent, 1 = first reminder sent, 2 = final reminder sent
  // SHIPPING ADDRESS (Sep 2026)
  //
  // STRABL has always sent this and the webhook has always forwarded it to
  // Shopify — but it was never written to our own record, so the only place
  // an address existed was inside Shopify. That is why anything
  // address-related meant opening Shopify by hand.
  //
  // Stored NORMALISED (see lib/addressNormalise.ts): STRABL's address2
  // repeats address1 and the city, and buries the postcode inline as
  // "pin_code 95959" while postalCode sits empty. Cleaning on write means
  // every consumer sees the same tidy record instead of each one guessing.
  shippingAddress?: CleanAddress

  // SHIPMENT TRACKING (Sep 2026)
  //
  // Set by POST /api/admin/tracking when you hand a parcel to the courier.
  // These exist so the customer can see where their order is; they do NOT
  // trigger any email. That separation is deliberate — an automatic dispatch
  // email fires from a state that must always be maintained, whereas
  // tracking degrades gracefully: an order with no tracking simply shows as
  // Confirmed, which is true.
  //
  // shippedAt is what makes an order "shipped" for display purposes. Nothing
  // downstream is timed off it — the reorder cron keys off createdAt, so a
  // parcel you forget to log still gets its reminder.
  shippedAt?: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  reorderReminderSentAt?: string // set once the reorder prompt has gone out — prevents the cron re-sending every run
}

const KEY_PREFIX = 'order-lookup:'
const RECORD_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year — orders shouldn't vanish from lookup
// Sorted set of completed order short codes, score = createdAt (ms). Lets
// the review-request cron ask "which completed orders were placed N days
// ago" without scanning every key — Redis has no native "list all keys
// matching prefix, sorted by field" operation.
const COMPLETED_INDEX_KEY = 'order-lookup:completed-index'
// Same idea, for abandoned checkouts — lets the abandoned-cart recovery
// cron ask "which checkouts went abandoned N hours ago" without scanning.
// A record's status can change later (customer comes back and pays) —
// callers must still check record.status themselves when reading these
// back, this index just narrows down which keys to look at.
const ABANDONED_INDEX_KEY = 'order-lookup:abandoned-index'
// CUSTOMER ACCOUNTS (Sep 2026): per-email index of that customer's order
// short codes, score = createdAt (ms), so /account can list someone's order
// history without scanning every key. One sorted set per email address.
//
// This is written for EVERY status, not just completed ones — a customer
// looking at their account should see a failed or abandoned attempt too,
// because "where did my order go" is exactly the question that brings them
// there. The account page decides what to show; the index just records.
const EMAIL_INDEX_PREFIX = 'order-lookup:by-email:'

export function emailIndexKey(email: string): string {
  return `${EMAIL_INDEX_PREFIX}${email.trim().toLowerCase()}`
}

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
    if (record.status === 'abandoned') {
      await redis.zadd(ABANDONED_INDEX_KEY, {
        score: new Date(record.createdAt).getTime() || Date.now(),
        member: record.orderShortCode.trim().toUpperCase(),
      })
    }

    // Per-customer index. zadd is idempotent on member, so re-saving a
    // record as its status changes updates the score rather than duplicating.
    if (record.email) {
      await redis.zadd(emailIndexKey(record.email), {
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

// Most recent completed orders, newest first — powers the admin dashboard's
// order/customer list (app/admin). COMPLETED_INDEX_KEY can grow without
// bound, so this is a capped "recent activity" view, not a full export;
// bump `limit` (or add real pagination) if the dashboard needs to go back
// further than that.
export async function getRecentOrders(limit: number = 200): Promise<OrderRecord[]> {
  try {
    const codes = (await redis.zrange(COMPLETED_INDEX_KEY, 0, limit - 1, { rev: true })) as string[]
    if (codes.length === 0) return []
    const records = await Promise.all(codes.map((code) => getOrderRecord(code)))
    return records.filter((r): r is OrderRecord => r !== null)
  } catch (err) {
    console.error('[orderStore] Failed to query recent orders:', err)
    return []
  }
}

// Abandoned checkouts with createdAt between [startMs, endMs] — used by the
// abandoned-cart recovery cron. Callers must re-check record.status: a
// short code stays in this index forever once abandoned even if the
// customer later comes back and pays, since the index is just "was ever
// abandoned in this window," not "is currently abandoned."
export async function getAbandonedOrdersInWindow(startMs: number, endMs: number): Promise<OrderRecord[]> {
  try {
    const codes = (await redis.zrange(ABANDONED_INDEX_KEY, startMs, endMs, { byScore: true })) as string[]
    if (codes.length === 0) return []
    const records = await Promise.all(codes.map((code) => getOrderRecord(code)))
    return records.filter((r): r is OrderRecord => r !== null)
  } catch (err) {
    console.error('[orderStore] Failed to query abandoned orders in window:', err)
    return []
  }
}

/**
 * Every order placed with a given email, newest first.
 *
 * CUSTOMER ACCOUNTS (Sep 2026). Reads the per-email sorted set written by
 * saveOrderRecord above, then fetches each record. Capped because an account
 * page never needs more than a page of history, and an unbounded fan-out of
 * Redis gets is the kind of thing that only hurts once you have a customer
 * worth keeping.
 */
export async function getOrdersForEmail(email: string, limit = 50): Promise<OrderRecord[]> {
  if (!email) return []
  try {
    const codes = (await redis.zrange(emailIndexKey(email), 0, limit - 1, {
      rev: true,
    })) as string[]
    if (!codes?.length) return []

    const records = await Promise.all(codes.map((code) => getOrderRecord(code)))
    return records
      .filter((r): r is OrderRecord => Boolean(r))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (err) {
    console.error('[orderStore] Failed to read orders for email:', err)
    return []
  }
}

/**
 * Orders whose reorder window is now open, for the reorder-reminder cron.
 *
 * Timed from ORDER DATE, not dispatch. There is no dispatch tracking in this
 * system, so order date is the only timestamp that is always real. It runs a
 * couple of days ahead of actual delivery, which the cron's day offset
 * accounts for — a reminder that lands slightly early is useful, one keyed
 * off a field nobody maintains would never land at all.
 */
export async function getOrdersDueForReorderReminder(
  startMs: number,
  endMs: number
): Promise<OrderRecord[]> {
  try {
    const codes = (await redis.zrange(COMPLETED_INDEX_KEY, startMs, endMs, { byScore: true })) as string[]
    if (!codes?.length) return []
    const records = await Promise.all(codes.map((code) => getOrderRecord(code)))
    return records.filter((r): r is OrderRecord =>
      Boolean(r && !r.reorderReminderSentAt && r.email)
    )
  } catch (err) {
    console.error('[orderStore] Failed to read reorder-reminder candidates:', err)
    return []
  }
}


/**
 * Abandoned checkouts, newest first — for the admin recovery screen.
 *
 * ADDED Sep 2026, because a whole class of these was invisible and
 * unrecoverable.
 *
 * The abandoned-cart cron skips any record with no products:
 *   if (!order.email || order.products.length === 0) continue
 *
 * That guard is right for an automated CART email — you cannot send someone
 * "you left these items behind" with no items. But STRABL emits abandoned
 * records that carry a name, an email and a phone number with an empty
 * products array, so those people were dropped entirely. Nothing was sent,
 * nothing was flagged, and nobody could see they existed.
 *
 * They are often the most recoverable leads on the list: someone who reached
 * checkout and gave you a phone number. This lister returns everything so a
 * human can decide, and marks which ones the automation can and cannot help
 * with.
 */
export async function listAbandonedOrders(limit = 100): Promise<OrderRecord[]> {
  try {
    const codes = (await redis.zrange(ABANDONED_INDEX_KEY, 0, limit - 1, { rev: true })) as string[]
    if (!codes?.length) return []
    const records = await Promise.all(codes.map((code) => getOrderRecord(code)))
    return records
      .filter((r): r is OrderRecord => Boolean(r) && r!.status === 'abandoned')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (err) {
    console.error('[orderStore] Failed to list abandoned orders:', err)
    return []
  }
}