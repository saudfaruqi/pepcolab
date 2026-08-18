

// src/app/api/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createShopifyOrder } from '@/lib/shopifyAdmin'

function numericVariantId(gid: string): string {
  const match = gid.match(/(\d+)$/)
  if (!match) throw new Error(`Invalid variant gid: ${gid}`)
  return match[1]
}

export async function POST(req: NextRequest) {
  try {
    const { lines, country = 'AE' } = await req.json()

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'No cart lines provided' }, { status: 400 })
    }

    const lineItems = lines.map((l: { variantId: string; quantity: number; price: number }) => ({
      variant_id: numericVariantId(l.variantId),
      quantity: l.quantity,
      price: Number(l.price ?? 0).toFixed(2),
    }))

    const order = await createShopifyOrder(lineItems, country)

    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    console.error('[checkout] create order failed:', err)
    return NextResponse.json({ error: 'Could not create order' }, { status: 502 })
  }
}