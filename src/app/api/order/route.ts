

// src/app/api/checkout/order/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { fetchShopifyOrder } from '@/lib/shopifyAdmin'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('order_id')
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  try {
    const order = await fetchShopifyOrder(orderId)
    const baseUrl = process.env.SERVER_BASE_URL

    const cartData = {
      currency: order.currency,
      country: order.shipping_address?.country_code || 'AE',
      lineItems: order.line_items.map((item: any) => ({
        title: item.title,
        description: item.variant_title || item.title,
        price: parseFloat(item.price),
        quantity: item.quantity,
        productId: String(item.product_id),
        variantId: String(item.variant_id),
        sku: item.sku || '',
        image: item.image?.src || '',
        url: `${baseUrl}/products/${item.handle || ''}`,
        variantOptions: item.variant_title ? [item.variant_title] : [],
      })),
      extra: { shopifyOrderId: orderId },
      merchantUrls: {
        successUrl: `${baseUrl}/checkout/success?order=${orderId}`,
        failureUrl: `${baseUrl}/checkout/failure?order=${orderId}`,
        cancelUrl: `${baseUrl}/checkout/cancel?order=${orderId}`,
      },
    }

    return NextResponse.json({ cartData })
  } catch (err) {
    console.error('[checkout] fetch order failed:', err)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
}