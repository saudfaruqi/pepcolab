// src/lib/shopifyAdmin.ts
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10'

function adminUrl(resource: string) {
  return `https://${DOMAIN}/admin/api/${API_VERSION}/${resource}`
}

function adminHeaders() {
  if (!TOKEN) throw new Error('SHOPIFY_ADMIN_TOKEN is not configured')
  return {
    'X-Shopify-Access-Token': TOKEN,
    'Content-Type': 'application/json',
  }
}

export interface AdminLineItemInput {
  variant_id?: string
  title?: string
  price: string   // required
  quantity: number
}

export interface CustomerInfoInput {
  email: string
  firstName: string
  lastName: string
  shippingAddress: {
    address1: string
    address2?: string
    city: string
    postalCode: string
    countryCode: string
  }
  phone?: string
}

export async function createShopifyOrder(
  lineItems: AdminLineItemInput[],
  countryCode: string,
  customerInfo?: CustomerInfoInput,
  strablOrderShortCode?: string,
  options?: {
    // 'voided' is Shopify's status for "no money was ever actually taken" —
    // used for failed/abandoned STRABL attempts so they're visible in the
    // Orders list for follow-up, but Shopify's own sales/revenue reports
    // exclude voided orders by default, so they don't skew real numbers.
    financialStatus?: 'pending' | 'voided'
    extraTags?: string[]
  }
) {
  const tags = ['strabl-pending']
  if (strablOrderShortCode) tags.push(`strabl-order-${strablOrderShortCode}`)
  if (options?.extraTags) tags.push(...options.extraTags)

  const orderData: any = {
    line_items: lineItems,
    financial_status: options?.financialStatus || 'pending',
    send_receipt: false,
    send_fulfillment_receipt: false,
    tags: tags.join(', '),
    shipping_address: { country_code: countryCode },
  }

  if (customerInfo) {
    orderData.email = customerInfo.email
    orderData.shipping_address = {
      address1: customerInfo.shippingAddress.address1,
      address2: customerInfo.shippingAddress.address2 || '',
      city: customerInfo.shippingAddress.city,
      postal_code: customerInfo.shippingAddress.postalCode,
      country_code: customerInfo.shippingAddress.countryCode,
      first_name: customerInfo.firstName,
      last_name: customerInfo.lastName,
    }
    if (customerInfo.phone) {
      orderData.shipping_address.phone = customerInfo.phone
    }
    // Also add billing address same as shipping for simplicity
    orderData.billing_address = { ...orderData.shipping_address }
  }

  const res = await fetch(adminUrl('orders.json'), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ order: orderData }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Shopify order create failed: ${res.status} ${body}`)
  }

  const data = await res.json()
  return data.order as { id: string; name?: string }
}

export async function fetchShopifyOrder(orderId: string) {
  const res = await fetch(adminUrl(`orders/${orderId}.json`), {
    headers: adminHeaders(),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Shopify order fetch failed: ${res.status} ${body}`)
  }
  const data = await res.json()
  return data.order
}

export async function markShopifyOrderPaid(orderId: string, strablOrderUuid: string) {
  // BUG FIX (Aug 2026): this previously sent kind: 'capture'. A 'capture'
  // transaction is Shopify's second half of a two-step Shopify-native
  // authorize→capture flow, and REQUIRES a parent_id pointing at an
  // existing 'authorization' transaction already on the order. But
  // createShopifyOrder() never creates one — the order is created with
  // financial_status: 'pending' and no transactions block at all — so
  // there was never a parent to capture against. Every single call here
  // failed with "422 Unable to find parent transaction", which is why
  // STRABL orders have been sitting as "Payment pending / Unfulfilled" in
  // Shopify regardless of order — this wasn't specific to the 4 orders
  // that triggered the alert, it's every order that has gone through this
  // path.
  //
  // 'sale' is the correct transaction kind for money that was ALREADY
  // taken by an external gateway (STRABL, in this case) — it records a
  // complete one-step payment with no Shopify-native authorization
  // required beforehand, which is exactly this situation. No parent_id
  // needed. Omitting `amount` defaults to the order's full total, which is
  // correct here since STRABL only ever charges the full order amount.
  const res = await fetch(adminUrl(`orders/${orderId}/transactions.json`), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      transaction: {
        kind: 'sale',
        status: 'success',
        gateway: 'STRABL',
        message: `Paid via STRABL. Order UUID: ${strablOrderUuid}`,
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mark order paid failed: ${res.status} ${body}`)
  }
  return res.json()
}