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