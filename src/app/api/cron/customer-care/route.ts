// src/app/api/cron/customer-care/route.ts
//
// AFTER-ORDER CARE — daily (see vercel.json). Three personalised emails in
// one route, so the project needs only one extra cron entry. Every email is
// built from what the customer bought (lib/customerJourney.ts).
//
// 1. ARRIVED OK? + handling notes for their formats + related products
//    AFTERCARE_WORKING_DAYS_AFTER_DISPATCH working days after "Mark as
//    dispatched" (default 2: most orders land the next working day, this
//    gives a day's margin). If the order was never marked dispatched,
//    AFTERCARE_WORKING_DAYS_AFTER_ORDER working days after ordering (default 3).
//
// 2. MORE FROM YOUR RESEARCH AREA — CROSS_SELL_DAYS after ordering
//    (default 18, between the day-10 review request and the day-28 reorder
//    reminder). Skipped when there's nothing relevant in stock to suggest.
//
// 3. WIN-BACK — WINBACK_DAYS after a customer's most recent paid order
//    (default 60), only if they haven't ordered since. Once per customer
//    per year.
//
// All three are non-essential: opted-out addresses are skipped. Runs are
// idempotent — safe to trigger by hand:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://www.pepcolab.com/api/cron/customer-care
import { NextRequest, NextResponse } from 'next/server'
import {
  getCompletedOrdersInWindow, getOrdersForEmail, saveOrderRecord, isPaidOrder, type OrderRecord,
} from '@/lib/orderStore'
import { sendAftercareEmail, sendCrossSellEmail, sendWinbackEmail } from '@/lib/lifecycleEmails'
import { loadCatalogue, buildJourney, workingDaysSince, type CatalogueItem } from '@/lib/customerJourney'
import { isMarketingSuppressed } from '@/lib/emailPreferences'
import { buildUnsubscribeUrl } from '@/lib/unsubscribeToken'
import { redis } from '@/lib/redis'
import { sweepAffiliateHolds } from '@/lib/affiliateStore'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY_MS = 24 * 60 * 60 * 1000
const AFTER_DISPATCH = Number(process.env.AFTERCARE_WORKING_DAYS_AFTER_DISPATCH) || 2
const AFTER_ORDER = Number(process.env.AFTERCARE_WORKING_DAYS_AFTER_ORDER) || 3
const AFTERCARE_LOOKBACK_DAYS = 21 // older than this, "did it arrive?" is too late to be useful
const CROSS_SELL_DAYS = Number(process.env.CROSS_SELL_DAYS) || 18
const CROSS_SELL_WINDOW_DAYS = 7
const WINBACK_DAYS = Number(process.env.WINBACK_DAYS) || 60
const WINBACK_WINDOW_DAYS = 7
const WINBACK_MARKER_PREFIX = 'lifecycle:winback-sent:'
const WINBACK_MARKER_TTL_SECONDS = 60 * 60 * 24 * 365

function unsubscribeUrlFor(email: string): string | undefined {
  try {
    return buildUnsubscribeUrl(email)
  } catch {
    return undefined
  }
}

/** Catalogue per currency, loaded at most once per run. */
function catalogueCache() {
  const cache = new Map<string, Promise<CatalogueItem[]>>()
  return (currency: string) => {
    const key = (currency || 'AED').toUpperCase()
    if (!cache.has(key)) cache.set(key, loadCatalogue(key))
    return cache.get(key)!
  }
}

function aftercareDue(order: OrderRecord, now: Date): boolean {
  if (order.shippedAt) {
    const shipped = new Date(order.shippedAt)
    return !isNaN(shipped.getTime()) && workingDaysSince(shipped, now) >= AFTER_DISPATCH
  }
  const created = new Date(order.createdAt)
  return !isNaN(created.getTime()) && workingDaysSince(created, now) >= AFTER_ORDER
}

async function runAftercare(now: Date, catalogueFor: ReturnType<typeof catalogueCache>) {
  const orders = await getCompletedOrdersInWindow(now.getTime() - AFTERCARE_LOOKBACK_DAYS * DAY_MS, now.getTime())
  let sent = 0
  let skipped = 0

  for (const order of orders) {
    if (order.aftercareEmailSentAt || !order.email || !order.products?.length) { skipped++; continue }
    if (!isPaidOrder(order) || !aftercareDue(order, now)) { skipped++; continue }
    if (await isMarketingSuppressed(order.email)) { skipped++; continue }

    try {
      const journey = buildJourney(order, await catalogueFor(order.currency), 'arrival-check')
      await sendAftercareEmail(order, journey, unsubscribeUrlFor(order.email))
      await saveOrderRecord({ ...order, aftercareEmailSentAt: new Date().toISOString() })
      sent++
    } catch (err) {
      console.error(`[customer-care] Aftercare failed for ${order.orderShortCode}:`, err)
    }
  }
  return { checked: orders.length, sent, skipped }
}

async function runCrossSell(now: Date, catalogueFor: ReturnType<typeof catalogueCache>) {
  const windowEnd = now.getTime() - CROSS_SELL_DAYS * DAY_MS
  const orders = await getCompletedOrdersInWindow(windowEnd - CROSS_SELL_WINDOW_DAYS * DAY_MS, windowEnd)
  let sent = 0
  let skipped = 0

  for (const order of orders) {
    if (order.crossSellEmailSentAt || !order.email || !order.products?.length) { skipped++; continue }
    if (!isPaidOrder(order)) { skipped++; continue }
    if (await isMarketingSuppressed(order.email)) { skipped++; continue }

    // One cross-sell per customer per window: if they placed a newer order,
    // that order will get its own at the right time.
    const history = await getOrdersForEmail(order.email, 20)
    const orderedMs = new Date(order.createdAt).getTime()
    const newer = history.some(
      (o) => o.orderShortCode !== order.orderShortCode && isPaidOrder(o) && new Date(o.createdAt).getTime() > orderedMs
    )

    try {
      let didSend = false
      if (!newer) {
        const journey = buildJourney(order, await catalogueFor(order.currency), 'cross-sell')
        didSend = await sendCrossSellEmail(order, journey, unsubscribeUrlFor(order.email))
      }
      // Stamp either way so the order isn't re-evaluated every day.
      await saveOrderRecord({ ...order, crossSellEmailSentAt: new Date().toISOString() })
      if (didSend) sent++
      else skipped++
    } catch (err) {
      console.error(`[customer-care] Cross-sell failed for ${order.orderShortCode}:`, err)
    }
  }
  return { checked: orders.length, sent, skipped }
}

async function runWinback(now: Date, catalogueFor: ReturnType<typeof catalogueCache>) {
  const windowEnd = now.getTime() - WINBACK_DAYS * DAY_MS
  const orders = await getCompletedOrdersInWindow(windowEnd - WINBACK_WINDOW_DAYS * DAY_MS, windowEnd)

  const seen = new Set<string>()
  let sent = 0
  let skipped = 0

  for (const order of orders) {
    const email = (order.email || '').trim().toLowerCase()
    if (!email || seen.has(email)) { skipped++; continue }
    seen.add(email)

    if (!isPaidOrder(order) || !order.products?.length) { skipped++; continue }
    if (await isMarketingSuppressed(email)) { skipped++; continue }

    const marker = `${WINBACK_MARKER_PREFIX}${email}`
    try {
      if (await redis.get(marker)) { skipped++; continue }
    } catch (err) {
      console.error('[customer-care] Could not read win-back marker, skipping:', err)
      skipped++
      continue
    }

    // Only customers whose LATEST paid order is this old.
    const history = await getOrdersForEmail(email, 50)
    const latestPaid = history.find(isPaidOrder)
    if (!latestPaid || new Date(latestPaid.createdAt).getTime() > windowEnd) { skipped++; continue }

    try {
      // Claim the marker before sending so an overlapping run can't double-send.
      const claimed = await redis.set(marker, new Date().toISOString(), { nx: true, ex: WINBACK_MARKER_TTL_SECONDS })
      if (!claimed) { skipped++; continue }
      const journey = buildJourney(latestPaid, await catalogueFor(latestPaid.currency), 'win-back')
      await sendWinbackEmail(latestPaid, journey, unsubscribeUrlFor(email))
      sent++
    } catch (err) {
      console.error(`[customer-care] Win-back failed for ${latestPaid.orderShortCode}:`, err)
    }
  }
  return { checked: orders.length, sent, skipped }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const catalogueFor = catalogueCache()
  const aftercare = await runAftercare(now, catalogueFor)
  const crossSell = await runCrossSell(now, catalogueFor)
  const winback = await runWinback(now, catalogueFor)

  // Affiliate commission leaves its refund hold here rather than being
  // recomputed on every dashboard read, so the pending → approved move
  // happens once and is recorded in the ledger. Isolated from the email
  // runs above: a failure here must not cost anyone their aftercare email,
  // and the sweep is safely repeatable on the next run.
  let affiliateHolds = 0
  try {
    affiliateHolds = await sweepAffiliateHolds()
  } catch (err) {
    console.error('[customer-care] Affiliate hold sweep failed:', err)
  }

  return NextResponse.json({ success: true, aftercare, crossSell, winback, affiliateHolds })
}