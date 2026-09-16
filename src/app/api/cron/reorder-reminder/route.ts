// src/app/api/cron/reorder-reminder/route.ts
//
// The revenue email. Runs daily (add to vercel.json alongside the existing
// crons) and prompts customers whose last order is around the point where a
// research group tends to need a fresh batch.
//
// TIMING RATIONALE
// The site's own documentation states reconstituted material is used within
// 28 days at 2-8 C. REORDER_REMINDER_DAYS defaults to 28 — measured from
// ORDER DATE, which is the only timestamp this system reliably has, since
// dispatch is not tracked anywhere.
//
// Order date runs a few days ahead of the customer's own clock (which starts
// when the parcel arrives), so 28 from ordering lands at roughly 26 from
// delivery — just before the reconstitution window closes, while the current
// vial is still in use and a gap in supply is still avoidable. Sending after
// the window has closed makes it a chase rather than a service.
//
// Adjust REORDER_REMINDER_DAYS once you can see from repeat orders what the
// real reorder interval looks like. That data will exist within a couple of
// months; until then this is a reasoned estimate, not a measured one.
//
// SAFETY: reorderReminderSentAt is stamped on the record before we move on,
// so a re-run cannot double-send. Orders that were refunded, charged back or
// failed are excluded — prompting someone to reorder something they sent
// back is the kind of email that loses a customer permanently.
//
// FIXES (Sep 2026)
//  - The button linked to /api/cart/restore/<code>, a JSON endpoint, so
//    customers landed on raw data. It now uses buildOrderAgainUrl(): the cart
//    (?restore=) for normal orders, the GLP product page for payment-link
//    orders, which can't be rebuilt in the cart.
//  - Opted-out addresses (lib/emailPreferences.ts) are skipped. Previously the
//    email's own "Stop reorder reminders" link had no effect.
//  - Customers who have already ordered again since are not reminded.

import { NextRequest, NextResponse } from 'next/server'
import { getOrdersDueForReorderReminder, getOrdersForEmail, saveOrderRecord, isPaidOrder } from '@/lib/orderStore'
import { sendReorderReminderEmail } from '@/lib/accountEmails'
import { buildOrderAgainUrl, relatedProductsSection } from '@/lib/lifecycleEmails'
import { loadCatalogue, buildJourney, type CatalogueItem } from '@/lib/customerJourney'
import { isMarketingSuppressed } from '@/lib/emailPreferences'
import { buildUnsubscribeUrl } from '@/lib/unsubscribeToken'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const REMINDER_DAYS = Number(process.env.REORDER_REMINDER_DAYS) || 28
const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = Date.now()
  const windowStart = now - (REMINDER_DAYS + 4) * DAY_MS
  const windowEnd = now - REMINDER_DAYS * DAY_MS

  const candidates = await getOrdersDueForReorderReminder(windowStart, windowEnd)

  let sent = 0
  let skipped = 0
  const catalogues = new Map<string, Promise<CatalogueItem[]>>()
  const catalogueFor = (currency: string) => {
    const key = (currency || 'AED').toUpperCase()
    if (!catalogues.has(key)) catalogues.set(key, loadCatalogue(key))
    return catalogues.get(key)!
  }

  for (const order of candidates) {
    if (!isPaidOrder(order)) { skipped++; continue }
    if (!order.email || !order.products?.length) { skipped++; continue }

    const orderedMs = new Date(order.createdAt).getTime()
    if (!orderedMs || now - orderedMs < REMINDER_DAYS * DAY_MS) { skipped++; continue }

    if (await isMarketingSuppressed(order.email)) { skipped++; continue }

    // Already ordered again since this one? Then a reminder is noise.
    const history = await getOrdersForEmail(order.email, 20)
    const reorderedSince = history.some(
      (o) => o.orderShortCode !== order.orderShortCode && isPaidOrder(o) && new Date(o.createdAt).getTime() > orderedMs
    )
    if (reorderedSince) {
      await saveOrderRecord({ ...order, reorderReminderSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      skipped++
      continue
    }

    const again = buildOrderAgainUrl(order)

    let unsubscribeUrl: string | undefined
    try {
      unsubscribeUrl = buildUnsubscribeUrl(order.email)
    } catch {
      unsubscribeUrl = undefined
    }

    try {
      await sendReorderReminderEmail({
        to: order.email,
        customerName: order.customerName,
        orderShortCode: order.orderShortCode,
        products: order.products,
        currency: order.currency,
        reorderUrl: again.url,
        rebuildsCart: again.kind === 'cart',
        related: relatedProductsSection(
          buildJourney(order, await catalogueFor(order.currency), 'reorder'),
          'Also worth adding'
        ),
        unsubscribeUrl,
      })

      await saveOrderRecord({
        ...order,
        reorderReminderSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      sent++
    } catch (err) {
      console.error(`[reorder-reminder] Failed for ${order.orderShortCode}:`, err)
    }
  }

  return NextResponse.json({ success: true, candidates: candidates.length, sent, skipped })
}