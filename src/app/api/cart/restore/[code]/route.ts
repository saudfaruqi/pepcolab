// src/app/api/cart/restore/[code]/route.ts
//
// Backs the abandoned-cart recovery email's "Complete Your Order" link.
// Given an order short code, returns just enough to rebuild a real
// Storefront cart client-side: variant GIDs + quantities.
//
// Deliberately narrow: only serves records whose status is still
// 'abandoned' (someone poking at an old completed-order code gets nothing
// back, same as an expired link), and only returns variantId/quantity —
// not email, phone, address, or anything else in the record. This is meant
// to be safe to call from an unauthenticated client-side fetch off a link
// that could end up in a forwarded email or a browser history entry.
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord } from '@/lib/orderStore'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = (params.code || '').trim()
  if (!code) {
    return NextResponse.json({ error: 'Missing order code' }, { status: 400 })
  }

  const record = await getOrderRecord(code)

  // Same response for "not found" and "not abandoned" — don't let this
  // endpoint be used to probe which order codes exist or what state
  // they're in.
  if (!record || record.status !== 'abandoned') {
    return NextResponse.json({ items: [], currency: 'AED' })
  }

  const items = record.products
    .filter((p) => Boolean(p.variantId))
    .map((p) => ({ variantId: p.variantId as string, quantity: p.quantity }))

  // How many line items couldn't be restored automatically (no variant GID
  // captured — mainly Payment Link orders) so the client can tell the
  // customer "we restored most of it" instead of just silently dropping
  // items with no explanation.
  const skipped = record.products.length - items.length

  return NextResponse.json({ items, skipped, currency: record.currency })
}