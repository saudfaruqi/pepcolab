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
  //
  // BUG FIX 2 (Aug 2026): switching to kind:'sale' alone still 422'd with
  // {"errors":{"kind":["sale is not a valid transaction"]}} (seen on
  // SOR-MVFIBK). This is a known, undocumented Shopify REST quirk: a
  // transaction with kind 'sale' or 'capture' created via the API (as
  // opposed to one Shopify's own checkout generated) is rejected unless
  // `source: 'external'` is also set. Shopify never documents this in the
  // transaction resource reference — confirmed only by other developers
  // hitting the identical error message.
  const res = await fetch(adminUrl(`orders/${orderId}/transactions.json`), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      transaction: {
        kind: 'sale',
        status: 'success',
        gateway: 'STRABL',
        source: 'external',
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
// ─────────────────────────────────────────────────────────────────────────
// ORDER EDITING (Oct 2026)
//
// Used by the admin "Change item" action (app/api/admin/orders/amend). When a
// customer swaps strength after paying — 20mg → 30mg on SOR-LLCQZU's original
// order — the Shopify order has to change too, or stock is wrong twice over:
// the 20mg that is staying on the shelf was decremented, and the 30mg that is
// leaving was not.
//
// Shopify only allows line-item changes on an existing order through the
// GraphQL order-editing flow (begin → change → commit). REST has no
// equivalent. The access token needs the `write_order_edits` scope; without
// it these calls fail with ACCESS_DENIED, which the caller reports in the
// admin rather than throwing — the order record is still updated.
// ─────────────────────────────────────────────────────────────────────────

async function adminGraphql<T = any>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(adminUrl('graphql.json'), {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ query, variables }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Shopify GraphQL ${res.status}: ${text.slice(0, 300)}`)
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Shopify GraphQL returned non-JSON: ${text.slice(0, 200)}`)
  }
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e: any) => e.message).join('; ')}`)
  }
  return json.data as T
}

function throwUserErrors(step: string, errors: { field?: string[]; message: string }[] | undefined) {
  if (errors && errors.length) {
    throw new Error(`${step}: ${errors.map((e) => e.message).join('; ')}`)
  }
}

function orderGid(id: string): string {
  return String(id).startsWith('gid://') ? String(id) : `gid://shopify/Order/${id}`
}

function variantGid(id: string): string {
  if (String(id).startsWith('gid://')) return String(id)
  return `gid://shopify/ProductVariant/${id}`
}

function normText(v: string): string {
  return (v || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function strengthOf(v: string): string | null {
  const m = (v || '').match(/(\d+(?:\.\d+)?)\s*mc?g\b/i)
  return m ? m[1] : null
}

export interface LineToReplace {
  /** The line's title as recorded on our side, e.g. "GLP 20mg Pen". */
  title: string
  /** Storefront GID or numeric id, when we know it. */
  variantId?: string
}

/**
 * Picks which Shopify line item is the one being replaced.
 *
 * Exact variant id first. Otherwise: if the order has a single live line it
 * is that one; if it has several, the one whose strength AND name agree with
 * our recorded title — and only if exactly one does. Anything ambiguous
 * returns null so a human edits Shopify instead of the wrong line changing.
 */
function pickLine(
  lines: { id: string; quantity: number; title: string; variantTitle: string | null; variant: { id: string } | null }[],
  target: LineToReplace
) {
  const live = lines.filter((l) => l.quantity > 0)
  if (target.variantId) {
    const want = variantGid(target.variantId.replace(/^gid:\/\/shopify\/ProductVariant\//, ''))
    const byVariant = live.filter((l) => l.variant?.id === want)
    if (byVariant.length === 1) return byVariant[0]
  }
  if (live.length === 1) return live[0]

  const wantMg = strengthOf(target.title)
  const wantName = normText(target.title.replace(/\d+(?:\.\d+)?\s*mc?g\b/gi, ' ').replace(/\b(pen|vial|nasal\s+spray|spray)\b/gi, ' '))
  const scored = live.filter((l) => {
    const full = `${l.title} ${l.variantTitle || ''}`
    const mg = strengthOf(full)
    if (wantMg && mg && wantMg !== mg) return false
    const name = normText(l.title.replace(/\d+(?:\.\d+)?\s*mc?g\b/gi, ' ').replace(/\b(pen|vial|nasal\s+spray|spray)\b/gi, ' '))
    return Boolean(name) && Boolean(wantName) && (wantName.includes(name) || name.includes(wantName))
  })
  return scored.length === 1 ? scored[0] : null
}

/**
 * Replaces one line on an existing Shopify order with a catalogue variant.
 *
 * The old line goes to quantity 0 WITH restock (the unit is back on the
 * shelf); the new variant is added at the same quantity (Shopify decrements
 * its stock on commit). The customer is not emailed by Shopify — they have
 * already been told by us.
 *
 * Shopify will show the order as partially paid afterwards when the new item
 * costs more. That is deliberate and correct: the difference was paid on the
 * separate top-up order, so the two orders together hold exactly what the
 * customer paid. Marking this one paid as well would count that money twice.
 */
export async function swapShopifyOrderLine(
  orderId: string,
  target: LineToReplace,
  newVariantId: string,
  quantity: number,
  staffNote: string
): Promise<{ removedLineTitle: string }> {
  const begin = await adminGraphql<any>(
    /* GraphQL */ `
      mutation begin($id: ID!) {
        orderEditBegin(id: $id) {
          calculatedOrder {
            id
            lineItems(first: 50) {
              nodes { id quantity title variantTitle variant { id } }
            }
          }
          userErrors { field message }
        }
      }
    `,
    { id: orderGid(orderId) }
  )
  throwUserErrors('orderEditBegin', begin.orderEditBegin?.userErrors)
  const calc = begin.orderEditBegin?.calculatedOrder
  if (!calc?.id) throw new Error('orderEditBegin returned no calculated order')

  const line = pickLine(calc.lineItems?.nodes || [], target)
  if (!line) {
    throw new Error(
      `Couldn't tell which Shopify line is "${target.title}" — the order has ${calc.lineItems?.nodes?.length ?? 0} lines. Edit this order in Shopify by hand.`
    )
  }

  const setQty = await adminGraphql<any>(
    /* GraphQL */ `
      mutation setQty($id: ID!, $lineItemId: ID!) {
        orderEditSetQuantity(id: $id, lineItemId: $lineItemId, quantity: 0, restock: true) {
          calculatedOrder { id }
          userErrors { field message }
        }
      }
    `,
    { id: calc.id, lineItemId: line.id }
  )
  throwUserErrors('orderEditSetQuantity', setQty.orderEditSetQuantity?.userErrors)

  const add = await adminGraphql<any>(
    /* GraphQL */ `
      mutation add($id: ID!, $variantId: ID!, $quantity: Int!) {
        orderEditAddVariant(id: $id, variantId: $variantId, quantity: $quantity, allowDuplicates: true) {
          calculatedOrder { id }
          userErrors { field message }
        }
      }
    `,
    { id: calc.id, variantId: variantGid(newVariantId.replace(/^gid:\/\/shopify\/ProductVariant\//, '')), quantity }
  )
  throwUserErrors('orderEditAddVariant', add.orderEditAddVariant?.userErrors)

  const commit = await adminGraphql<any>(
    /* GraphQL */ `
      mutation commit($id: ID!, $staffNote: String) {
        orderEditCommit(id: $id, notifyCustomer: false, staffNote: $staffNote) {
          order { id }
          userErrors { field message }
        }
      }
    `,
    { id: calc.id, staffNote }
  )
  throwUserErrors('orderEditCommit', commit.orderEditCommit?.userErrors)

  return { removedLineTitle: [line.title, line.variantTitle].filter(Boolean).join(' / ') }
}

/**
 * Marks a Shopify order as a top-up of another order: tags it, writes a note
 * pointing at the original, and closes (archives) it so it drops out of the
 * unfulfilled queue. Nothing is refunded or cancelled — the money it holds is
 * real and stays reported against it.
 */
export async function markShopifyTopUpOrder(orderId: string, originalShortCode: string): Promise<void> {
  const id = orderGid(orderId)
  const tags = await adminGraphql<any>(
    /* GraphQL */ `
      mutation tag($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
      }
    `,
    { id, tags: ['order-topup', `topup-for-${originalShortCode}`] }
  )
  throwUserErrors('tagsAdd', tags.tagsAdd?.userErrors)

  const note = await adminGraphql<any>(
    /* GraphQL */ `
      mutation note($input: OrderInput!) {
        orderUpdate(input: $input) { userErrors { field message } }
      }
    `,
    { input: { id, note: `Top-up payment for ${originalShortCode}. Not a separate delivery — do not fulfil.` } }
  )
  throwUserErrors('orderUpdate', note.orderUpdate?.userErrors)

  const close = await adminGraphql<any>(
    /* GraphQL */ `
      mutation close($input: OrderCloseInput!) {
        orderClose(input: $input) { userErrors { field message } }
      }
    `,
    { input: { id } }
  )
  throwUserErrors('orderClose', close.orderClose?.userErrors)
}
