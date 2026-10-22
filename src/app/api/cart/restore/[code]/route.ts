// src/app/api/cart/restore/[code]/route.ts
//
// Backs the abandoned-cart recovery email's "Complete Your Order" link.
// Given an order short code, returns just enough to rebuild a real
// Storefront cart client-side: variant GIDs + quantities.
//
// Also backs "order again" links (reorder reminder, win-back) since Sep
// 2026 — those previously pointed at this JSON route directly and showed the
// customer raw data.
//
// Deliberately narrow: only serves abandoned checkouts and paid orders
// (failed/refunded/charged-back codes get nothing back), and only returns
// variantId/quantity — not email, phone, address, or anything else in the
// record. This is meant to be safe to call from an unauthenticated
// client-side fetch off a link that could end up in a forwarded email or a
// browser history entry.
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord, isPaidOrder } from '@/lib/orderStore'
import { PRODUCT_WITHDRAWAL_ACTIVE, RETIRED_HANDLES, isWithdrawnDeviceTitle, bpc157VialLive } from '@/lib/retired-paths'

/**
 * A saved line for a product withdrawn from the catalogue, or for a device
 * format. Records only hold the title, so the title is slugified and
 * compared with the withdrawn handles ("Reta+Cagri 20mg" → "reta-cagri-20mg").
 */
function isWithdrawnItem(p: { title: string; variantOptions?: string[] }): boolean {
  // Dormant while the withdrawal switch (lib/retired-paths.ts) is off.
  if (!PRODUCT_WITHDRAWAL_ACTIVE) return false
  const text = [p.title, ...(p.variantOptions || [])].join(' ')
  if (isWithdrawnDeviceTitle(text) || /\bglp\b/i.test(text)) return true
  const slug = (p.title || '').toLowerCase().replace(/\+/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  for (const h of RETIRED_HANDLES) {
    if (slug === h || slug.startsWith(`${h}-`)) return true
  }
  if (!bpc157VialLive() && (slug === 'bpc-157' || /^bpc-157-\d/.test(slug))) return true
  return false
}

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = (params.code || '').trim()
  if (!code) {
    return NextResponse.json({ error: 'Missing order code' }, { status: 400 })
  }

  const record = await getOrderRecord(code)

  // Same response for "not found" and "not abandoned" — don't let this
  // endpoint be used to probe which order codes exist or what state
  // they're in.
  // Abandoned checkouts (recovery emails) AND paid orders (reorder reminder,
  // win-back). Only product variant IDs and quantities are returned — no
  // address, email or price — so exposing a paid order's lines by code is safe.
  if (!record || (record.status !== 'abandoned' && !isPaidOrder(record))) {
    return NextResponse.json({ items: [], currency: 'AED' })
  }

  const available = record.products.filter((p) => !isWithdrawnItem(p))
  const items = available
    .filter((p) => Boolean(p.variantId))
    .map((p) => ({ variantId: p.variantId as string, quantity: p.quantity }))

  // How many line items couldn't be restored automatically (no variant GID
  // captured — mainly Payment Link orders) so the client can tell the
  // customer "we restored most of it" instead of just silently dropping
  // items with no explanation.
  const skipped = record.products.length - items.length
  // Withdrawn products are never restored; they count as skipped so the
  // customer is told part of the order could not be brought back.

  return NextResponse.json({ items, skipped, currency: record.currency })
}