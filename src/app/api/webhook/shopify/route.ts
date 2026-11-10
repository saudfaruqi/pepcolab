// src/app/api/webhook/shopify/route.ts
//
// CASH ON DELIVERY ORDER INGESTION (Nov 2026).
//
// Online payments are completed in STRABL and reach us through
// /api/webhook/strabl. COD cannot be completed there — it is a Shopify manual
// payment method — so the cart sends COD customers to Shopify's own checkout.
// Those orders never touch STRABL, which means without this route they would
// exist only inside Shopify: no /track-order record, no CRM contact, no
// confirmation email, and no "to ship" row in the admin.
//
// WHAT TO REGISTER IN SHOPIFY
//   Settings → Notifications → Webhooks
//     orders/create   → https://<site>/api/webhook/shopify
//     orders/paid     → https://<site>/api/webhook/shopify
//     orders/cancelled→ https://<site>/api/webhook/shopify
//   Copy the signing secret into SHOPIFY_WEBHOOK_SECRET.
//
// Non-COD Shopify orders are deliberately ignored here. That includes every
// order this app itself creates for a STRABL payment (tagged strabl-*), so
// the two ingestion paths cannot double-process the same sale.
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { redis } from '@/lib/redis'
import { saveOrderRecord, getOrderRecord, type OrderRecord, type OrderStatus } from '@/lib/orderStore'
import { normaliseAddress } from '@/lib/addressNormalise'
import { cleanCheckoutRef, rememberCheckoutRef } from '@/lib/heardFrom'
import { takeAttestation } from '@/lib/attestation'
import { syncContactFromOrder } from '@/lib/crm/sync'
import { optInBlockFor } from '@/lib/crm/optinLinks'
import { sendOrderConfirmationEmail } from '@/lib/orderEmails'
import { notifyOrderConfirmedWhatsApp } from '@/lib/whatsappOrderUpdates'

export const dynamic = 'force-dynamic'

const WEBHOOK_TTL_SECONDS = 60 * 60 * 24 * 3

function verifyHmac(rawBody: string, header: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) {
    // Refuse to trust unsigned order data in production. In development a
    // missing secret is common while wiring things up, so allow it but say so.
    if (process.env.NODE_ENV === 'production') {
      console.error('[shopify-webhook] SHOPIFY_WEBHOOK_SECRET is not set — rejecting webhook')
      return false
    }
    console.warn('[shopify-webhook] SHOPIFY_WEBHOOK_SECRET not set — skipping verification (development)')
    return true
  }
  if (!header) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header))
  } catch {
    return false
  }
}

/** Shopify retries deliveries; act on each webhook id once. Best-effort. */
async function claimDelivery(webhookId: string): Promise<boolean> {
  if (!webhookId) return true
  try {
    const res = await redis.set(`shopify-webhook:${webhookId}`, '1', {
      nx: true,
      ex: WEBHOOK_TTL_SECONDS,
    })
    return res === 'OK'
  } catch (err) {
    // A Redis blip must not drop real order events — process them and accept
    // the small chance of a duplicate email (which is separately guarded).
    console.error('[shopify-webhook] dedup claim failed:', err)
    return true
  }
}

/** Release a claim so Shopify's retry of a failed delivery can be processed. */
async function releaseDelivery(webhookId: string): Promise<void> {
  if (!webhookId) return
  try {
    await redis.del(`shopify-webhook:${webhookId}`)
  } catch (err) {
    console.error('[shopify-webhook] dedup release failed:', err)
  }
}

function tagsOf(order: any): string[] {
  return String(order?.tags || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

function noteAttributesOf(order: any): Record<string, string> {
  const out: Record<string, string> = {}
  for (const attr of Array.isArray(order?.note_attributes) ? order.note_attributes : []) {
    const name = String(attr?.name || '').trim().toLowerCase()
    if (name) out[name] = String(attr?.value ?? '')
  }
  return out
}

function isStrablOrder(order: any): boolean {
  const tags = tagsOf(order)
  return tags.some(
    (t) => t === 'strabl-pending' || t.startsWith('strabl-') || t === 'order-topup' || t.startsWith('topup-for-')
  )
}

function isCodOrder(order: any): boolean {
  const note = noteAttributesOf(order)
  if (note.checkout_channel === 'cod') return true

  const tags = tagsOf(order)
  if (tags.includes('cod') || tags.includes('cash-on-delivery')) return true

  const gateway = [
    order?.gateway,
    order?.payment_gateway,
    ...(Array.isArray(order?.payment_gateway_names) ? order.payment_gateway_names : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return /cash on delivery|\bcod\b/.test(gateway)
}

/** Shopify order name ("#1001") → a stable lookup code ("1001"). */
function shortCodeOf(order: any): string {
  return String(order?.name || order?.order_number || order?.id || '')
    .replace(/^#/, '')
    .trim()
    .toUpperCase()
}

function validIso(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined
}

function buildProducts(order: any) {
  return (Array.isArray(order?.line_items) ? order.line_items : []).map((li: any) => ({
    title: li?.title || li?.name || 'Product',
    price: Number(li?.price) || 0,
    quantity: Number(li?.quantity) || 1,
    variantOptions:
      li?.variant_title && li.variant_title !== 'Default Title' ? [String(li.variant_title)] : undefined,
    variantId: li?.variant_id ? `gid://shopify/ProductVariant/${li.variant_id}` : undefined,
  }))
}

function buildAddress(order: any) {
  const shipping = order?.shipping_address
  if (!shipping) return undefined
  const countryCode = String(shipping.country_code || order?.customer?.default_address?.country_code || 'AE')
    .trim()
    .toUpperCase()
    .slice(0, 2)
  if (!shipping.address1 && !shipping.city) return undefined
  return normaliseAddress({
    address1: shipping.address1 || '',
    address2: shipping.address2 || '',
    city: shipping.city || '',
    postalCode: shipping.zip || '',
    countryCode,
  })
}

async function upsertCodOrder(order: any): Promise<OrderRecord> {
  const code = shortCodeOf(order)
  const existing = await getOrderRecord(code)
  const note = noteAttributesOf(order)
  const checkoutRef = cleanCheckoutRef(note.checkout_ref) || existing?.checkoutRef
  if (checkoutRef && !existing?.checkoutRef) {
    await rememberCheckoutRef(checkoutRef, code)
  }

  const researchAttestedAt =
    existing?.researchAttestedAt ||
    validIso(note.research_attested_at) ||
    (checkoutRef ? (await takeAttestation(checkoutRef)) ?? undefined : undefined)

  const products = buildProducts(order)
  const totalFromLines = products.reduce(
    (sum: number, p: { price: number; quantity: number }) => sum + p.price * p.quantity,
    0
  )
  const totalPrice = Number(order?.total_price)
  const email = String(order?.email || order?.contact_email || order?.customer?.email || '')
    .trim()
    .toLowerCase()
  const shipping = order?.shipping_address || {}
  const phone = String(order?.phone || order?.customer?.phone || shipping.phone || '').trim()
  const customerName =
    [order?.customer?.first_name || shipping.first_name, order?.customer?.last_name || shipping.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || undefined

  // A later orders/create retry must never downgrade an already-collected COD
  // order back to pending, nor reopen a cancelled/refunded one.
  const status: OrderStatus =
    existing?.status === 'cod_collected' || existing?.status === 'refunded' || existing?.status === 'chargeback'
      ? existing.status
      : 'cod_pending'

  return {
    ...(existing ?? {}),
    orderShortCode: code,
    orderUuid: String(order?.id || existing?.orderUuid || ''),
    status,
    shopifyOrderId: String(order?.id || existing?.shopifyOrderId || ''),
    email,
    phone: phone || undefined,
    customerName,
    products: products.length ? products : existing?.products ?? [],
    currency: String(order?.currency || existing?.currency || 'AED'),
    total:
      Number.isFinite(totalPrice) && totalPrice > 0
        ? totalPrice
        : products.length
          ? totalFromLines
          : existing?.total ?? 0,
    createdAt: existing?.createdAt || String(order?.created_at || '') || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shippingAddress: buildAddress(order) || existing?.shippingAddress,
    paymentMethod: 'cod',
    checkoutRef,
    researchAttestedAt,
  }
}

async function handleCodCreated(order: any): Promise<void> {
  const record = await upsertCodOrder(order)
  await saveOrderRecord(record)

  try {
    await syncContactFromOrder(record)
  } catch (err) {
    console.error('[shopify-webhook] CRM sync failed (order unaffected):', err)
  }

  // WhatsApp "order confirmed" — independent of the email setting below, only
  // to customers who agreed to WhatsApp messages, at most once per order.
  if (record.status === 'cod_pending') await notifyOrderConfirmedWhatsApp(record)

  // Shopify already sends its own order confirmation unless it has been
  // disabled. Sending ours as well would duplicate the email, so this is
  // opt-in: set SHOPIFY_COD_SEND_CONFIRMATION=true after turning Shopify's
  // notification off (Settings → Notifications → Order confirmation).
  const sendOwn = process.env.SHOPIFY_COD_SEND_CONFIRMATION === 'true'
  if (sendOwn && record.email && !record.confirmationEmailSentAt) {
    try {
      await sendOrderConfirmationEmail({
        to: record.email,
        orderShortCode: record.orderShortCode,
        products: record.products,
        total: record.total,
        currency: record.currency,
        customerName: record.customerName,
        optIn: await optInBlockFor(record.email),
        paymentMethod: 'cod',
      })
      await saveOrderRecord({ ...record, confirmationEmailSentAt: new Date().toISOString() })
    } catch (err) {
      console.error('[shopify-webhook] COD confirmation email failed:', err)
    }
  }
}

async function handleCodPaid(order: any): Promise<void> {
  const code = shortCodeOf(order)
  let existing = await getOrderRecord(code)

  // Shopify normally sends orders/create before orders/paid, but webhook
  // ordering is not guaranteed. If the paid event lands first, create the
  // record from its own payload rather than dropping the collection.
  if (!existing) {
    existing = await upsertCodOrder(order)
    await saveOrderRecord(existing)
  }
  if (existing.paymentMethod !== 'cod') return
  if (existing.status === 'cod_collected') return

  const updated: OrderRecord = {
    ...existing,
    status: 'cod_collected',
    codCollectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await saveOrderRecord(updated)
  try {
    await syncContactFromOrder(updated)
  } catch (err) {
    console.error('[shopify-webhook] CRM sync failed on COD collection:', err)
  }
}

async function handleCodCancelled(order: any): Promise<void> {
  const code = shortCodeOf(order)
  const existing = await getOrderRecord(code)
  if (!existing || existing.paymentMethod !== 'cod') return
  if (existing.status === 'refunded' || existing.status === 'cod_collected') return

  const updated: OrderRecord = {
    ...existing,
    status: 'refunded',
    updatedAt: new Date().toISOString(),
  }
  await saveOrderRecord(updated)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256')

  if (!verifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const topic = String(req.headers.get('x-shopify-topic') || '').toLowerCase()
  const webhookId = String(req.headers.get('x-shopify-webhook-id') || '')

  if (!(await claimDelivery(webhookId))) {
    return new NextResponse(null, { status: 200 })
  }

  let order: any
  try {
    order = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Every app-created STRABL order also fires orders/create. Ignore them — the
  // STRABL webhook owns that path.
  if (isStrablOrder(order)) {
    return new NextResponse(null, { status: 200 })
  }

  try {
    if (topic === 'orders/create') {
      if (isCodOrder(order)) await handleCodCreated(order)
    } else if (topic === 'orders/paid') {
      if (isCodOrder(order)) await handleCodPaid(order)
    } else if (topic === 'orders/updated') {
      // orders/paid is the primary signal, but some manual-payment flows only
      // emit updated. Only act when Shopify now reports the order as paid.
      if (isCodOrder(order) && String(order?.financial_status || '').toLowerCase() === 'paid') {
        await handleCodPaid(order)
      }
    } else if (topic === 'orders/cancelled') {
      if (isCodOrder(order)) await handleCodCancelled(order)
    }
  } catch (err) {
    console.error(`[shopify-webhook] ${topic} failed:`, err)
    // Release the dedup claim so Shopify's retry of this same delivery is
    // actually processed instead of being swallowed as a duplicate.
    await releaseDelivery(webhookId)
    return NextResponse.json({ error: 'Order ingestion failed' }, { status: 500 })
  }

  return new NextResponse(null, { status: 200 })
}
