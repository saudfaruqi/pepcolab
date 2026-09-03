// src/app/api/account/orders/route.ts
//
// The signed-in customer's order history.
//
// The email comes from the SIGNED SESSION COOKIE only — never from a query
// parameter or request body. That is the whole security model here: there is
// no way to request someone else's orders, because the caller never gets to
// name whose orders they want.
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/customerAuth'
import { getOrdersForEmail } from '@/lib/orderStore'

export async function GET(req: NextRequest) {
  const email = verifySessionToken(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value)
  if (!email) {
    return NextResponse.json({ success: false, message: 'Not signed in.' }, { status: 401 })
  }

  const orders = await getOrdersForEmail(email, 50)

  // Trimmed to what the account page renders. Internal fields (orderUuid,
  // shopifyOrderId, failureReason, email bookkeeping) stay server-side —
  // there is no reason to ship them to a browser.
  return NextResponse.json({
    success: true,
    email,
    orders: orders.map(o => ({
      orderShortCode: o.orderShortCode,
      status: o.status,
      createdAt: o.createdAt,
      shippedAt: o.shippedAt ?? null,
      carrier: o.carrier ?? null,
      trackingNumber: o.trackingNumber ?? null,
      trackingUrl: o.trackingUrl ?? null,
      currency: o.currency,
      total: o.total,
      products: (o.products ?? []).map(p => ({
        title: p.title,
        price: p.price,
        quantity: p.quantity,
        variantOptions: p.variantOptions ?? [],
        variantId: p.variantId ?? null,
      })),
    })),
  })
}