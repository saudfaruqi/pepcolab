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
  variant_id: string // numeric Shopify variant id, NOT the gid
  quantity: number
}

export async function createShopifyOrder(
  lineItems: AdminLineItemInput[],
  countryCode: string
) {
  const res = await fetch(adminUrl('orders.json'), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      order: {
        line_items: lineItems,
        financial_status: 'pending',
        send_receipt: false,
        send_fulfillment_receipt: false,
        tags: 'strabl-pending',
        shipping_address: { country_code: countryCode },
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Shopify order create failed: ${res.status} ${body}`)
  }
  const data = await res.json()
  return data.order
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
  const res = await fetch(adminUrl(`orders/${orderId}/transactions.json`), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      transaction: {
        kind: 'capture',
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

// ─── Customer & shipping info ──────────────────────────────────────────────
// STRABL's customerUpdate.shipping object uses snake_case keys that don't
// match Shopify's address schema, so each field is mapped explicitly.
// Adjust the source key names once you've confirmed them against a real
// sandbox payload (console.log('[webhook raw]', rawBody) in route.ts).

export interface StrablCustomerUpdate {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  shipping?: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    phone?: string
  }
}

export interface OrderCustomerInfo {
  email?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  shipping?: {
    first_name?: string
    last_name?: string
    address_1?: string
    address_2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    phone?: string
  }
}

export async function createPaidShopifyOrder(
  lineItems: AdminLineItemInput[],
  countryCode: string,
  customer: OrderCustomerInfo,
  strablOrderUuid: string
) {
  const shipping = customer.shipping
  const shippingAddress = {
    first_name: shipping?.first_name ?? customer.firstName,
    last_name:  shipping?.last_name  ?? customer.lastName,
    address1:   shipping?.address_1,
    address2:   shipping?.address_2,
    city:       shipping?.city,
    province:   shipping?.state,
    zip:        shipping?.postcode,
    country:    shipping?.country ?? countryCode,
    phone:      shipping?.phone ?? customer.phoneNumber,
  }

  const res = await fetch(adminUrl('orders.json'), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      order: {
        line_items: lineItems,
        email: customer.email,
        financial_status: 'paid',
        send_receipt: true,
        tags: 'strabl-paid',
        shipping_address: shippingAddress,
        transactions: [{
          kind: 'capture',
          status: 'success',
          gateway: 'STRABL',
          message: `Paid via STRABL. Order UUID: ${strablOrderUuid}`,
        }],
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Shopify order create failed: ${res.status} ${body}`)
  }
  const data = await res.json()
  return data.order
}

export async function updateShopifyOrderCustomerInfo(
  orderId: string,
  customer: StrablCustomerUpdate = {},
  shipping: StrablCustomerUpdate['shipping'] = customer.shipping
) {
  const shippingAddress = shipping
    ? {
        first_name: shipping.first_name ?? customer.firstName,
        last_name:  shipping.last_name  ?? customer.lastName,
        address1:   shipping.address_1,
        address2:   shipping.address_2,
        city:       shipping.city,
        province:   shipping.state,
        zip:        shipping.postcode,
        country:    shipping.country,
        phone:      shipping.phone ?? customer.phoneNumber,
      }
    : undefined

  const res = await fetch(adminUrl(`orders/${orderId}.json`), {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({
      order: {
        id: orderId,
        email: customer.email,
        ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
      },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Shopify order customer update failed: ${res.status} ${body}`)
  }
  return res.json()
}