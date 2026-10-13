// src/app/api/admin/orders/amend/route.ts
//
// "Change item" on a paid order, and folding a top-up payment into it.
//
// WHY THIS EXISTS (Oct 2026)
// A customer ordered a GLP 20mg pen, then asked for 30mg and paid the AED 100
// difference through a separate STRABL Payment Link. Nothing in the system
// knew those two payments were one order:
//   - the top-up arrived as its own order, listed "to ship", and would have
//     received its own review / aftercare / reorder emails;
//   - the Shopify order still held a 20mg pen, so stock was wrong;
//   - the delivery panel (Orcaflo) still said 20mg, so the driver brought
//     the wrong item.
//
// POST { action: 'amend', orderShortCode, productIndex, newVariantId,
//        topUpOrderShortCode? }
//   1. Re-reads the chosen variant from the live catalogue — the price used
//      is Shopify's, never one sent by the browser.
//   2. Swaps the line on the Shopify order (stock: old back in, new out).
//   3. Rewrites the line on our order record and logs an amendment.
//   4. If a top-up is linked: marks it topUpFor the original, so it leaves
//      "to ship" and every customer email; tags and closes it in Shopify.
//   5. Flags the order for a manual Orcaflo update and emails the alert
//      inbox with exactly what to change. Orcaflo has no edit API.
//
// POST { action: 'orcaflo-done', orderShortCode }
//   Clears the "update Orcaflo" flag once someone has changed it by hand.
//
// A Shopify failure never blocks the rest: the record is still updated and
// the error is shown in the admin, because the record and the driver alert
// are what stop the wrong parcel going out.
//
// AUTH: admin session cookie, same as the rest of /admin.
import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderRecord,
  saveOrderRecord,
  PAID_ORDER_STATUSES,
  type OrderAmendment,
  type OrderRecord,
} from '@/lib/orderStore'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { getProducts } from '@/lib/shopify'
import { swapShopifyOrderLine, markShopifyTopUpOrder } from '@/lib/shopifyAdmin'
import { sendMailSafe } from '@/lib/mailer'
import { formatAddressLines } from '@/lib/addressNormalise'

export const dynamic = 'force-dynamic'

const ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'

function authorised(req: NextRequest): boolean {
  try {
    return verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch {
    return false
  }
}

function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

function code(v: unknown): string {
  return typeof v === 'string' ? v.trim().toUpperCase() : ''
}

function money(n: number, currency: string) {
  return `${currency} ${n.toFixed(2)}`
}

function numericId(id: string): string {
  const m = String(id).match(/(\d+)$/)
  return m ? m[1] : String(id)
}

/** Finds a variant in the live catalogue by Storefront GID or numeric id. */
async function findCatalogueVariant(variantId: string) {
  const products = (await getProducts(250, 'AE')) as any[]
  const want = numericId(variantId)
  for (const p of products) {
    for (const v of p.variants || []) {
      if (numericId(v.id) === want) {
        return {
          variantId: String(v.id),
          productTitle: String(p.title),
          variantTitle: String(v.title),
          price: Number(v.price),
          availableForSale: Boolean(v.availableForSale),
        }
      }
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => ({}))
  const action = body?.action === 'orcaflo-done' ? 'orcaflo-done' : 'amend'
  const orderShortCode = code(body?.orderShortCode)
  if (!orderShortCode) return fail('orderShortCode is required.')

  const order = await getOrderRecord(orderShortCode)
  if (!order) return fail('Order not found.', 404)

  // ── Orcaflo updated by hand ───────────────────────────────────────────
  if (action === 'orcaflo-done') {
    const now = new Date().toISOString()
    const amendments = (order.amendments || []).map((a) => (a.orcafloUpdatedAt ? a : { ...a, orcafloUpdatedAt: now }))
    await saveOrderRecord({ ...order, amendments, orcafloUpdatePending: false, updatedAt: now })
    return NextResponse.json({ success: true, orderShortCode })
  }

  // ── Change item ───────────────────────────────────────────────────────
  if (order.topUpFor) return fail(`${orderShortCode} is a top-up payment for ${order.topUpFor}. Change the item on ${order.topUpFor} instead.`)
  if (!PAID_ORDER_STATUSES.has(order.status)) return fail(`Only paid orders can be changed (this one is "${order.status}").`)
  if (order.shippedAt) return fail('This order is already marked as dispatched. Undo dispatch first if it has not actually left.')

  const productIndex = Number(body?.productIndex)
  if (!Number.isInteger(productIndex) || productIndex < 0 || productIndex >= order.products.length) {
    return fail('Pick which item to change.')
  }
  const newVariantIdRaw = typeof body?.newVariantId === 'string' ? body.newVariantId.trim() : ''
  if (!newVariantIdRaw) return fail('Pick the new item.')

  let variant: Awaited<ReturnType<typeof findCatalogueVariant>>
  try {
    variant = await findCatalogueVariant(newVariantIdRaw)
  } catch (err) {
    console.error('[admin/amend] catalogue load failed:', err)
    return fail('Could not load the catalogue from Shopify. Try again in a minute.', 502)
  }
  if (!variant) return fail('That item is no longer in the catalogue.')
  if (!Number.isFinite(variant.price) || variant.price <= 0) return fail('That item has no price in Shopify.')

  const oldLine = order.products[productIndex]
  const quantity = oldLine.quantity || 1
  const newTitle = `${variant.productTitle} — ${variant.variantTitle}`
  if (oldLine.variantId && numericId(oldLine.variantId) === numericId(variant.variantId)) {
    return fail('That is the item already on the order.')
  }
  const priceDifference = Math.round((variant.price * quantity - oldLine.price * quantity) * 100) / 100

  // ── Top-up validation (before anything is written) ───────────────────
  const warnings: string[] = []
  let topUp: OrderRecord | null = null
  const topUpCode = code(body?.topUpOrderShortCode)
  if (topUpCode) {
    if (topUpCode === orderShortCode) return fail('The top-up must be a different order from the one being changed.')
    topUp = await getOrderRecord(topUpCode)
    if (!topUp) return fail(`Top-up order ${topUpCode} not found.`)
    if (!PAID_ORDER_STATUSES.has(topUp.status)) return fail(`Top-up order ${topUpCode} is not paid (status "${topUp.status}").`)
    if (topUp.topUpFor && topUp.topUpFor !== orderShortCode) {
      return fail(`${topUpCode} is already linked as a top-up for ${topUp.topUpFor}.`)
    }
    if (topUp.amendments?.length) return fail(`${topUpCode} has its own item changes, so it is a real order, not a top-up.`)
    if (topUp.shippedAt) return fail(`${topUpCode} is marked as dispatched, so it is a real parcel, not a top-up.`)
    const sameCustomer =
      (topUp.email && order.email && topUp.email.toLowerCase() === order.email.toLowerCase()) ||
      (topUp.phone && order.phone && topUp.phone.replace(/\D/g, '').slice(-9) === order.phone.replace(/\D/g, '').slice(-9))
    if (!sameCustomer) warnings.push(`${topUpCode} was paid with a different email/phone from ${orderShortCode}. Check it is the same customer.`)
    if (topUp.currency !== order.currency) warnings.push(`Currencies differ (${topUp.currency} vs ${order.currency}).`)
    if (Math.abs(topUp.total - priceDifference) >= 0.01) {
      warnings.push(
        `The top-up paid ${money(topUp.total, topUp.currency)} but the price difference is ${money(priceDifference, order.currency)}.`
      )
    }
  } else if (priceDifference > 0) {
    warnings.push(`No top-up linked: the new item costs ${money(priceDifference, order.currency)} more and that has not been recorded as paid.`)
  } else if (priceDifference < 0) {
    warnings.push(`The new item is ${money(-priceDifference, order.currency)} cheaper. Refund the difference in STRABL if you owe it.`)
  }

  // ── 1. Shopify: swap the line so stock is right ──────────────────────
  let shopifyEdited = false
  let shopifyError: string | undefined
  if (order.shopifyOrderId) {
    try {
      await swapShopifyOrderLine(
        order.shopifyOrderId,
        { title: oldLine.title, variantId: oldLine.variantId },
        variant.variantId,
        quantity,
        `Changed from "${oldLine.title}" to "${newTitle}" via PepcoLab admin${topUp ? ` — difference paid on ${topUp.orderShortCode}` : ''}.`
      )
      shopifyEdited = true
    } catch (err) {
      shopifyError = err instanceof Error ? err.message : String(err)
      console.error(`[admin/amend] Shopify edit failed for ${orderShortCode}:`, err)
      if (/access|scope|denied/i.test(shopifyError)) {
        shopifyError += ' (the Shopify admin token needs the write_order_edits scope)'
      }
    }
  } else {
    shopifyError = 'No Shopify order is linked to this record, so stock was not changed.'
  }

  // ── 2. Our record ────────────────────────────────────────────────────
  const now = new Date().toISOString()
  const amendment: OrderAmendment = {
    at: now,
    from: { title: oldLine.title, price: oldLine.price, quantity },
    to: { title: newTitle, price: variant.price, quantity, variantId: variant.variantId },
    priceDifference,
    topUpOrderShortCode: topUp?.orderShortCode,
    topUpAmount: topUp?.total,
    shopifyEdited,
    shopifyError,
  }
  const products = order.products.map((p, i) =>
    i === productIndex
      ? {
          title: newTitle,
          price: variant!.price,
          quantity,
          variantOptions: [variant!.variantTitle],
          variantId: variant!.variantId,
        }
      : p
  )
  // total = what the customer has actually paid across this order and its
  // top-ups. Without a top-up, nothing extra was paid, so it doesn't move.
  // A top-up already folded into this order (re-used on a second change) is
  // not counted twice.
  const alreadyFolded = topUp?.topUpFor === orderShortCode
  const total = Math.round((order.total + (topUp && !alreadyFolded ? topUp.total : 0)) * 100) / 100
  const updated: OrderRecord = {
    ...order,
    products,
    total,
    amendments: [...(order.amendments || []), amendment],
    orcafloUpdatePending: true,
    updatedAt: now,
  }
  await saveOrderRecord(updated)

  // ── 3. Fold the top-up in ────────────────────────────────────────────
  if (topUp) {
    await saveOrderRecord({ ...topUp, topUpFor: orderShortCode, updatedAt: now })
    if (topUp.shopifyOrderId) {
      try {
        await markShopifyTopUpOrder(topUp.shopifyOrderId, orderShortCode)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[admin/amend] Could not tag/close top-up ${topUp.orderShortCode} in Shopify:`, err)
        warnings.push(`Top-up linked, but Shopify order for ${topUp.orderShortCode} couldn't be tagged/closed: ${msg}`)
      }
    }
  }

  // ── 4. Tell whoever updates Orcaflo ──────────────────────────────────
  const addressLine = order.shippingAddress ? formatAddressLines(order.shippingAddress).join(', ') : ''
  await sendMailSafe({
    to: ALERT_EMAIL,
    subject: `🚚 UPDATE ORCAFLO: ${order.customerName || order.email} — ${oldLine.title} → ${newTitle} (${orderShortCode})`,
    text: `An order was changed in the PepcoLab admin. The driver's sheet in Orcaflo still shows the OLD item until someone edits it there by hand.

Customer: ${order.customerName || '(no name)'}
Phone: ${order.phone || '(none)'}
${addressLine ? `Address: ${addressLine}\n` : ''}Order: ${orderShortCode}

IN ORCAFLO
  1. Cancel the existing order for ${order.customerName || 'this customer'}: ${quantity} × ${oldLine.title} (sold ${money(oldLine.price * quantity, order.currency)})
  2. Create a new order: ${quantity} × ${newTitle}, sold ${money(variant.price * quantity, order.currency)}, same customer, phone and address
  Payment method: Card — ${topUp ? `the difference was paid online on ${topUp.orderShortCode} (${money(topUp.total, topUp.currency)}). Nothing to collect at the door.` : priceDifference > 0 ? `NO top-up was linked. ${money(priceDifference, order.currency)} is unpaid.` : 'nothing extra to collect.'}

Shopify stock: ${shopifyEdited ? 'updated automatically.' : `NOT updated — ${shopifyError}`}

When Orcaflo is updated, click "Orcaflo updated" on the order in /admin.`,
  })

  return NextResponse.json({
    success: true,
    orderShortCode,
    shopifyEdited,
    shopifyError,
    priceDifference,
    warnings,
  })
}
