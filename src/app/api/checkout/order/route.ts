// app/api/checkout/order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPendingCheckout } from '@/lib/checkoutSession'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 })

  const pending = getPendingCheckout(ref)
  if (!pending) {
    return NextResponse.json({ error: 'Checkout session expired. Please try again.' }, { status: 404 })
  }

  const baseUrl = process.env.SERVER_BASE_URL

  const cartData = {
    currency: pending.currencyCode,
    country: pending.country,
    lineItems: pending.lines.map(l => ({
      title: l.title,
      description: l.variantTitle || l.title,
      price: l.price,
      quantity: l.quantity,
      variantId: l.variantId,
      image: l.image || '',
      url: `${baseUrl}/products/${l.slug}`,
    })),
    extra: { checkoutRef: ref },
    merchantUrls: {
      successUrl: `${baseUrl}/checkout/success?ref=${ref}`,
      failureUrl: `${baseUrl}/checkout/failure?ref=${ref}`,
      cancelUrl: `${baseUrl}/checkout/cancel?ref=${ref}`,
    },
  }

  return NextResponse.json({ cartData })
}