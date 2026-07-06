// src/app/api/checkout/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createShopifyOrder } from '@/lib/shopifyAdmin'

function numericVariantId(gid: string): string {
  // Extract the numeric ID from the GID
  const match = gid.match(/(\d+)$/)
  if (!match) throw new Error(`Invalid variant gid: ${gid}`)
  return match[1]
}

export async function POST(req: NextRequest) {
  try {
    const { lines, customer } = await req.json()

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'No cart lines provided' }, { status: 400 })
    }

    if (!customer || !customer.email || !customer.shippingAddress) {
      return NextResponse.json({ error: 'Customer information is required' }, { status: 400 })
    }

    if (!customer.shippingAddress.address1 || !customer.shippingAddress.city || !customer.shippingAddress.postalCode) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 })
    }

    const lineItems = lines.map((l: { variantId: string; quantity: number }) => ({
      variant_id: numericVariantId(l.variantId),
      quantity: l.quantity,
    }))

    const order = await createShopifyOrder(
      lineItems,
      customer.shippingAddress.countryCode || 'AE',
      {
        email: customer.email,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        shippingAddress: {
          address1: customer.shippingAddress.address1,
          address2: customer.shippingAddress.address2 || '',
          city: customer.shippingAddress.city,
          postalCode: customer.shippingAddress.postalCode,
          countryCode: customer.shippingAddress.countryCode || 'AE',
        },
        phone: customer.phone || '',
      }
    )

    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    console.error('[checkout] create order failed:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Could not create order' 
    }, { status: 502 })
  }
}