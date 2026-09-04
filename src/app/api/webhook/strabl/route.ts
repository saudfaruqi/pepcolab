// src/app/api/webhook/strabl/route.ts
//
// MOVED HERE FROM src/app/api/strabl/route.ts.
// STRABL's dashboard has the webhook URL registered as
// https://www.pepcolab.com/api/webhook/strabl — but the old handler only
// existed at /api/strabl. Every webhook STRABL has ever sent (order_created,
// order_failed, everything) has been hitting a 404 on this server. Nothing
// here has ever run in production.
//
// Also fixed: the payload shape. The old handler destructured
// { webhookEventType, orderUuid, payload } — that doesn't match STRABL's
// documented schema at all. The real shape is:
//   { type, orderUpdate: { orderUuid, ..., failureReason?, meta? }, customerUpdate }
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createShopifyOrder, markShopifyOrderPaid, type AdminLineItemInput } from '@/lib/shopifyAdmin'
import { saveOrderRecord, getOrderRecord, type OrderRecord } from '@/lib/orderStore'
import { normaliseAddress } from '@/lib/addressNormalise'
import { sendMailSafe } from '@/lib/mailer'
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from '@/lib/orderEmails'
import { incrementRedemption } from '@/lib/discountStore'
import { recordReferralRedemption, REFERRER_REWARD_PERCENT } from '@/lib/referralStore'
import { sendReferralRewardEmail } from '@/lib/referralEmails'
import { redis } from '@/lib/redis'

const ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'

// Use a Set for deduplication - in production, use Redis or similar
const processedIds = new Set<string>()

// STRABL doesn't guarantee ISO 3166-1 alpha-2 in shipping.country — observed
// "UAE" instead of "AE" on SOR-QJJJCS, which Shopify's Admin API rejects
// outright (country_code must be alpha-2), throwing and taking down the
// whole order-create call for a problem that has nothing to do with the
// order itself. Normalize known non-standard variants here rather than
// letting one bad country string 500 an otherwise-valid paid order.
const COUNTRY_CODE_ALIASES: Record<string, string> = {
  UAE: 'AE',
  'U.A.E': 'AE',
  'U.A.E.': 'AE',
  'UNITED ARAB EMIRATES': 'AE',
  KSA: 'SA',
  'SAUDI ARABIA': 'SA',
}

function normalizeCountryCode(raw: string | undefined): string {
  const value = (raw || '').trim().toUpperCase()
  if (!value) return 'AE'
  if (value.length === 2) return value // already alpha-2
  return COUNTRY_CODE_ALIASES[value] || 'AE' // unknown format — fall back rather than let it reach Shopify and throw
}

// Resolves STRABL's externalVariantId/externalProductId into a Shopify
// Storefront API variant GID ("gid://shopify/ProductVariant/123..."), for
// anything that needs to add this exact variant back into a Storefront
// cart (i.e. abandoned-cart restore links). Separate from the numeric-ID
// truncation buildShopifyOrderInputs does for the Admin API below — that
// path wants a bare number, this one wants the full Storefront GID.
// Returns null when there's nothing usable — Payment Link orders often
// don't carry this field at all, and a bare Product GID isn't safe to
// guess a variant from.
function resolveVariantGid(item: any): string | null {
  const raw = item.externalVariantId || item.externalProductId || ''
  if (!raw) return null
  if (raw.startsWith('gid://shopify/ProductVariant/')) return raw
  if (/^\d+$/.test(raw)) return `gid://shopify/ProductVariant/${raw}`
  return null
}

// SOR-QJJJCS showed order_created can fail (bad country code, transient
// Shopify error, etc) while a later order_updated for the SAME order
// succeeds — but order_updated events aren't guaranteed to carry the full
// shipping block again. Without this cache, a later event with missing
// shipping fields would silently create the Shopify order with BLANK
// address1/city/postcode instead of the customer's real address, which is
// far worse than just failing outright (order looks fine, ships nowhere).
// OrderRecord (orderStore.ts) deliberately doesn't persist full shipping
// address — only what /track-order needs to show the customer — so this is
// a separate, short-lived cache purely for recovering a real address across
// retries/duplicate events for the same order.
const SHIPPING_CACHE_PREFIX = 'strabl-shipping-cache:'
const SHIPPING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days — plenty for retries, not a long-term PII store

interface CachedShipping {
  email: string
  phone: string
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  postalCode: string
  countryCode: string
}

function shippingCacheKey(orderShortCode: string): string {
  return `${SHIPPING_CACHE_PREFIX}${orderShortCode.trim().toUpperCase()}`
}

function isUsableAddress(s: CachedShipping): boolean {
  return Boolean(s.address1 && s.city)
}

async function cacheShippingIfUsable(orderShortCode: string, shipping: CachedShipping): Promise<void> {
  if (!orderShortCode || !isUsableAddress(shipping)) return
  try {
    await redis.set(shippingCacheKey(orderShortCode), shipping, { ex: SHIPPING_CACHE_TTL_SECONDS })
  } catch (err) {
    // Best-effort only — losing this cache just means a future event with
    // missing shipping data can't be backfilled, it doesn't break anything
    // that's happening right now.
    console.error('[webhook] Failed to cache shipping address:', err)
  }
}

async function getCachedShipping(orderShortCode: string): Promise<CachedShipping | null> {
  if (!orderShortCode) return null
  try {
    const cached = await redis.get<CachedShipping>(shippingCacheKey(orderShortCode))
    return cached ?? null
  } catch (err) {
    console.error('[webhook] Failed to read cached shipping address:', err)
    return null
  }
}

// Same problem as shipping, same fix: SOR-QJJJCS's order_updated event
// almost certainly carried no usable `products` (empty price/list), which
// hits the "no usable line items" branch below — that branch deliberately
// returns success and emails an alert for MANUAL creation, but never
// actually creates the Shopify order. STRABL considered the webhook
// successfully delivered, so it never retried, and the order was never
// created automatically. Caching a known-good products array from
// whichever event has one lets a later sparse event still create the real
// order instead of silently falling through to "email a human."
const PRODUCTS_CACHE_PREFIX = 'strabl-products-cache:'
const PRODUCTS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7

function productsCacheKey(orderShortCode: string): string {
  return `${PRODUCTS_CACHE_PREFIX}${orderShortCode.trim().toUpperCase()}`
}

function hasUsableProducts(products: any[]): boolean {
  return Array.isArray(products) && products.some((p) => Number(p?.price) > 0 && Number(p?.quantity ?? 1) > 0)
}

async function cacheProductsIfUsable(orderShortCode: string, products: any[]): Promise<void> {
  if (!orderShortCode || !hasUsableProducts(products)) return
  try {
    await redis.set(productsCacheKey(orderShortCode), products, { ex: PRODUCTS_CACHE_TTL_SECONDS })
  } catch (err) {
    console.error('[webhook] Failed to cache products:', err)
  }
}

async function getCachedProducts(orderShortCode: string): Promise<any[] | null> {
  if (!orderShortCode) return null
  try {
    const cached = await redis.get<any[]>(productsCacheKey(orderShortCode))
    return cached ?? null
  } catch (err) {
    console.error('[webhook] Failed to read cached products:', err)
    return null
  }
}

// FIX (Aug 2026): this was hardcoded to exactly one header-naming
// convention (x-webhook-id/-timestamp/-signature) and exactly one
// timestamp unit (seconds), neither of which had ever been confirmed
// against real STRABL traffic — see the removed TEMP DEBUG block below,
// whose whole purpose was to find out those two things by trial and
// error against production requests.
//
// Rather than keep guessing at one shape, this now checks the header-name
// variants used by the two conventions webhook providers overwhelmingly
// use in practice: the plain "x-webhook-*" this code originally assumed,
// and the Standard Webhooks / Svix-style "webhook-*" / "svix-*" triplet
// (STRABL's docs weren't available to confirm which). It also accepts a
// timestamp in either seconds or milliseconds. This does NOT remove the
// need to confirm against real traffic — check Vercel logs for
// "[webhook] Verification rejected" on genuine STRABL deliveries; if it's
// still firing, the real header names/format differ from all of these
// guesses and need to come from STRABL support/docs directly.
const WEBHOOK_ID_HEADERS = ['x-webhook-id', 'webhook-id', 'svix-id']
const WEBHOOK_TIMESTAMP_HEADERS = ['x-webhook-timestamp', 'webhook-timestamp', 'svix-timestamp']
const WEBHOOK_SIGNATURE_HEADERS = ['x-webhook-signature', 'webhook-signature', 'svix-signature']

function firstHeader(req: NextRequest, names: string[]): string {
  for (const name of names) {
    const value = req.headers.get(name)
    if (value) return value
  }
  return ''
}

// Normalizes a timestamp to whole seconds regardless of whether the
// provider sent seconds or milliseconds. A value with 13 digits is
// unambiguously milliseconds (10-digit epoch seconds only reaches 13
// digits again in the year 2286); anything shorter is treated as seconds.
function normalizeTimestampSeconds(raw: string): number {
  const ts = parseInt(raw, 10)
  if (isNaN(ts)) return NaN
  return raw.trim().length >= 13 ? Math.round(ts / 1000) : ts
}

function verifyWebhook(webhookId: string, timestamp: string, signature: string, rawBody: string) {
  const secret = process.env.STRABL_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook] STRABL_WEBHOOK_SECRET not set, skipping verification')
    return // Skip verification if secret is not set (dev mode)
  }

  const ts = normalizeTimestampSeconds(timestamp)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    throw new Error('Webhook timestamp too old or invalid')
  }

  // Svix/Standard Webhooks sign the raw (un-normalized) timestamp string,
  // not the normalized seconds value, so the signing input still uses the
  // original `timestamp` argument as received.
  const signingInput = `${webhookId}.${timestamp}.${rawBody}`
  const expectedHex = crypto.createHmac('sha256', secret).update(signingInput).digest('hex')

  // Accept either a plain hex digest or the "v1=<hex>" prefixed form some
  // providers (including the original x-webhook-signature assumption
  // here) use. Try both rather than assuming which one STRABL sends.
  const candidates = [expectedHex, `v1=${expectedHex}`]
  const matches = candidates.some((candidate) => {
    if (candidate.length !== signature.length) return false
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(signature))
  })

  if (!matches) {
    throw new Error('Webhook signature mismatch')
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const webhookId = firstHeader(req, WEBHOOK_ID_HEADERS)
  const timestamp = firstHeader(req, WEBHOOK_TIMESTAMP_HEADERS)
  const signature = firstHeader(req, WEBHOOK_SIGNATURE_HEADERS)

  try {
    verifyWebhook(webhookId, timestamp, signature, rawBody)
  } catch (err: any) {
    // Kept deliberately (not "temp") until verification against real
    // STRABL traffic is confirmed clean: logs every header actually
    // received so a still-failing case can be diagnosed without guessing
    // further. If this keeps firing on genuine deliveries even after the
    // multi-convention header/timestamp handling above, the mismatch is
    // in the signing scheme itself (e.g. a different signing-input format)
    // and needs STRABL's own docs/support to resolve.
    const allHeaders: Record<string, string> = {}
    req.headers.forEach((value, key) => { allHeaders[key] = value })
    console.warn('[webhook] Verification rejected:', err.message)
    console.warn('[webhook] DEBUG raw headers:', JSON.stringify(allHeaders, null, 2))
    console.warn('[webhook] DEBUG raw body:', rawBody.slice(0, 2000))
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Dedup check happens up front (cheap, avoids reprocessing true
  // duplicates), but marking a webhookId as processed is deferred until
  // after we know order creation actually succeeded — see syncFailed
  // below. Previously this was marked processed immediately on receipt,
  // which meant a failed order-creation attempt could never actually be
  // retried: STRABL's retry of the same webhookId would just hit this
  // dedup check and get silently swallowed as a "duplicate" — the 500
  // response was retried, but the retry never did any real work.
  if (webhookId && processedIds.has(webhookId)) {
    return new NextResponse(null, { status: 204 })
  }

  if (processedIds.size > 1000) {
    const toDelete = Math.floor(processedIds.size / 2)
    let count = 0
    for (const id of processedIds) {
      if (count >= toDelete) break
      processedIds.delete(id)
      count++
    }
  }

  let syncFailed = false

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Real documented shape: { type, orderUpdate: {...}, customerUpdate: {...} }
  const { type, orderUpdate = {}, customerUpdate = {} } = event
  const orderUuid = orderUpdate.orderUuid
  const orderShortCode = orderUpdate.orderShortCode || ''

  // Resolve products ONCE per request, same recovery pattern as shipping:
  // if this event's own products/price are missing, fall back to a cached
  // good copy from an earlier event on the same order rather than silently
  // treating a real paid order as "no usable line items."
  let resolvedProducts: any[] = orderUpdate.products || []
  if (hasUsableProducts(resolvedProducts)) {
    await cacheProductsIfUsable(orderShortCode, resolvedProducts)
  } else {
    const cachedProducts = await getCachedProducts(orderShortCode)
    if (cachedProducts) {
      console.info(`[webhook] Recovered products for ${orderShortCode} from cache (current event had none)`)
      resolvedProducts = cachedProducts
    }
  }

  // BUG FIX (Aug 2026): resolve customer info (email/phone/name/address)
  // ONCE per request, same recovery pattern as resolvedProducts above.
  // Previously this recovery only happened inside buildShopifyOrderInputs()
  // — which built and cached a full recovered customer record for the
  // Shopify order itself — but buildOrderRecord() (which writes the
  // /track-order lookup record) read customerUpdate.email/.firstName/etc
  // directly, completely bypassing that recovery. Any event with a sparse
  // payload (e.g. an order_updated retry with no customerUpdate at all —
  // exactly what SOR-CHFSPS's stored record shows: email: "" even though
  // the shipping cache for the same order has the real email) got saved
  // to the lookup record with a blank email. A customer could never find
  // that order on /track-order even after the underlying payment/shipping
  // data had already been correctly recovered elsewhere for the actual
  // Shopify order.
  //
  // Resolving this once, up front, and having both buildOrderRecord and
  // buildShopifyOrderInputs read from the same resolved value closes that
  // gap and removes the duplicated recovery logic that used to live only
  // inside buildShopifyOrderInputs.
  const currentShipping: CachedShipping = {
    email: customerUpdate.email || '',
    phone: customerUpdate.phoneNumber || '',
    firstName: customerUpdate.firstName || (customerUpdate.shipping || {}).first_name || '',
    lastName: customerUpdate.lastName || (customerUpdate.shipping || {}).last_name || '',
    address1: (customerUpdate.shipping || {}).address_1 || '',
    address2: (customerUpdate.shipping || {}).address_2 || '',
    city: (customerUpdate.shipping || {}).city || '',
    postalCode: (customerUpdate.shipping || {}).postcode || '',
    countryCode: normalizeCountryCode((customerUpdate.shipping || {}).country),
  }

  let resolvedCustomer: CachedShipping = currentShipping
  if (isUsableAddress(currentShipping)) {
    // Good address+contact info on this event — cache it so a later,
    // sparser event for the same order can recover it.
    await cacheShippingIfUsable(orderShortCode, currentShipping)
  } else {
    const cached = await getCachedShipping(orderShortCode)
    if (cached) {
      console.info(`[webhook] Recovered customer/shipping info for ${orderShortCode} from cache (current event had none)`)
      resolvedCustomer = {
        email: currentShipping.email || cached.email,
        phone: currentShipping.phone || cached.phone,
        firstName: currentShipping.firstName || cached.firstName,
        lastName: currentShipping.lastName || cached.lastName,
        address1: cached.address1,
        address2: cached.address2,
        city: cached.city,
        postalCode: cached.postalCode,
        countryCode: cached.countryCode,
      }
    }
  }

  // Builds the /track-order lookup record from whatever this event gave us.
  // Called for every event type below (including failures) so a customer
  // can look up an order regardless of how it ended — this is the piece
  // that was missing before: order_failed used to only log to the server
  // console, so a customer with a failed payment had literally nothing to
  // look up.
  // BUG FIX: previously stamped createdAt with `new Date().toISOString()`
  // on every call — meaning order_updated, order_refunded, and
  // order_chargeback (all real, separate events per the comments above,
  // not just retries) each reset the record's createdAt to "now". Since
  // getCompletedOrdersInWindow/getAbandonedOrdersInWindow both key off
  // createdAt to decide "how long ago was this order placed," an order
  // that received even one order_updated event would never age past
  // "just now" in that index — silently preventing its review-request
  // email from ever becoming eligible, and (had this path re-fired for an
  // abandoned order) resetting its recovery-email countdown too. Now
  // preserves the original createdAt from the first record written for
  // this order short code, only defaulting to "now" when no prior record
  // exists at all.
  const buildOrderRecord = async (status: OrderRecord['status'], shopifyOrderId?: string): Promise<OrderRecord> => {
    const existingRecord = await getOrderRecord(orderShortCode)
    const products = resolvedProducts.map((item: any) => ({
      title: item.title || 'Product',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      variantOptions: item.extra || [],
      variantId: resolveVariantGid(item) || undefined,
    }))
    const total = products.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0)

    return {
      orderShortCode,
      orderUuid: orderUuid || '',
      status,
      shopifyOrderId,
      failureReason: orderUpdate.failureReason || undefined,
      // BUG FIX (Aug 2026): now sourced from resolvedCustomer (recovered
      // from cache when this event's own payload was sparse) instead of
      // raw customerUpdate — see the comment above resolvedCustomer.
      email: resolvedCustomer.email.toLowerCase().trim(),
      phone: resolvedCustomer.phone.trim() || undefined,
      customerName:
        [resolvedCustomer.firstName, resolvedCustomer.lastName].filter(Boolean).join(' ') || undefined,
      // Persist the delivery address on our own record, normalised. Falls
      // back to whatever is already stored when this event's payload is
      // sparse — the same recovery pattern resolvedCustomer uses above, so a
      // thin order_updated cannot wipe an address that a fuller
      // order_created already captured.
      shippingAddress:
        (resolvedCustomer.address1 || resolvedCustomer.city)
          ? normaliseAddress({
              address1: resolvedCustomer.address1,
              address2: resolvedCustomer.address2,
              city: resolvedCustomer.city,
              postalCode: resolvedCustomer.postalCode,
              countryCode: resolvedCustomer.countryCode,
            })
          : existingRecord?.shippingAddress,
      products,
      currency: 'AED', // STRABL webhook payloads observed so far are AED-only per merchant config
      total,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // Shared by order_created/updated, order_failed, and order_abandoned —
  // all three now create a real Shopify order (see below), just with
  // different financial_status/tags, so this extraction avoids writing
  // the same address/line-item mapping three times.
  //
  // 2026-08-19 fix (part 2): orders from a STRABL Payment Link don't
  // include externalVariantId/externalProductId, and — separately —
  // Shopify's line_items always need an explicit `price` now (see
  // shopifyAdmin.ts for why). So: always send price + title from STRABL's
  // own data, and only include variant_id when we actually have one.
  // Without a variant_id, Shopify creates a "custom" line item — not
  // linked to catalogue/inventory, but the order itself still gets
  // created automatically instead of needing manual entry every time a
  // Payment Link order comes in.
  //
  // BUG FIX (Aug 2026): this used to redo the exact same cache/recovery
  // logic that now lives in the resolvedCustomer block above (near-
  // identical code, computed twice, and the two copies were exactly what
  // let buildOrderRecord and the actual Shopify order end up with
  // different customer data for the same event). Now just reads
  // resolvedCustomer directly — single source of truth.
  const buildShopifyOrderInputs = async () => {
    const { email, phone, firstName, lastName, address1, address2, city, postalCode, countryCode } =
      resolvedCustomer

    const lineItems: AdminLineItemInput[] = resolvedProducts
      .map((item: any) => {
        let variantId = item.externalVariantId || item.externalProductId || ''
        if (variantId.includes('gid://')) {
          const match = variantId.match(/(\d+)$/)
          if (match) variantId = match[1]
        }
        const price = Number(item.price)
        const li: AdminLineItemInput = {
          quantity: item.quantity || 1,
          price: Number.isFinite(price) ? price.toFixed(2) : '0.00',
          title: item.title || 'Product',
        }
        if (variantId) li.variant_id = variantId
        return li
      })
      // price must be a real positive number — that's the one thing
      // Shopify genuinely can't create a line item without, catalogue
      // link or not.
      .filter((li: AdminLineItemInput) => Number(li.price) > 0 && li.quantity > 0)

    const hasCustomLineItem = lineItems.some((li) => !li.variant_id)

    return {
      lineItems,
      hasCustomLineItem,
      countryCode,
      customerInfo: {
        email,
        firstName,
        lastName,
        shippingAddress: { address1, address2, city, postalCode, countryCode },
        phone,
      },
    }
  }


  switch (type) {
    case 'order_created':
    case 'order_updated': {
      // Declared outside the try block (rather than as a `const` inside
      // it, as before) so the catch block below can see whether a Shopify
      // order was actually created before markShopifyOrderPaid failed —
      // see the catch block for why that matters.
      let shopifyOrder: { id: string; name?: string } | null = null
      try {
        // Idempotency: order_created and order_updated are genuinely
        // separate webhook events (different event IDs, not just retries
        // of one another — confirmed on SOR-QJJJCS, where order_created
        // failed twice and a distinct order_updated event succeeded
        // shortly after). Both hit this same code path, so without this
        // check a successful order_updated following a retried
        // order_created could create two Shopify orders for one purchase.
        const existing = await getOrderRecord(orderShortCode)
        if (existing && (existing.status === 'created' || existing.status === 'updated')) {
          console.info(`[webhook] Order ${orderShortCode} already synced to Shopify, skipping duplicate creation`)
          break
        }

        // BUG FIX (Aug 2026): this is the other half of the
        // 'awaiting_payment_mark' fix (see orderStore.ts) — if a PRIOR
        // attempt on this same order got as far as creating the Shopify
        // order but then failed to mark it paid, that Shopify order
        // already exists. Skip straight to retrying markShopifyOrderPaid
        // on it instead of falling through to createShopifyOrder again,
        // which is what was producing a fresh duplicate order on every
        // single STRABL retry.
        shopifyOrder =
          existing?.status === 'awaiting_payment_mark' && existing.shopifyOrderId
            ? { id: existing.shopifyOrderId }
            : null

        if (shopifyOrder) {
          console.info(`[webhook] Order ${orderShortCode} already has Shopify order ${shopifyOrder.id}, retrying mark-paid only`)
        }

        const { lineItems, hasCustomLineItem, countryCode, customerInfo } = shopifyOrder
          ? { lineItems: [], hasCustomLineItem: false, countryCode: '', customerInfo: {} as any }
          : await buildShopifyOrderInputs()

        if (!shopifyOrder && lineItems.length === 0) {
          // Now genuinely rare — only when STRABL sent no usable price at
          // all (not just a missing variant mapping, which is handled
          // below via a custom line item instead). Payment was already
          // taken (paymentStatus: 'paid' on these events), so this still
          // gets the same urgent alert as a Shopify API failure — money
          // in, no Shopify order out, and nothing here can fix itself.
          console.error(`[webhook] ⚠️ No usable line items (missing price) for paid order ${orderShortCode}`)
          const record = await buildOrderRecord(type === 'order_created' ? 'created' : 'updated')
          await saveOrderRecord(record) // still let the customer look it up / get their confirmation email below
          if (record.email) {
            await sendOrderConfirmationEmail({
              to: record.email,
              orderShortCode: record.orderShortCode,
              products: record.products,
              total: record.total,
              currency: record.currency,
              customerName: record.customerName,
            })
          }
          await sendMailSafe({
            to: ALERT_EMAIL,
            subject: `⚠️ Order needs MANUAL Shopify creation — no usable price (${orderShortCode})`,
            text: `Payment succeeded but STRABL didn't send a usable price for any product on this order, so no line item could be created — not even as a custom item.

STRABL order: ${orderShortCode}
Customer email: ${resolvedCustomer.email || '(none)'}
Customer name: ${[resolvedCustomer.firstName, resolvedCustomer.lastName].filter(Boolean).join(' ') || '(none)'}
Products: ${JSON.stringify(orderUpdate.products || [], null, 2)}

Please create this order manually in Shopify and mark it paid. The customer has already been sent their order confirmation email, so they're expecting this order — this alert is about the Shopify-side record, not the customer experience.`,
          })
          // Deliberately not marking syncFailed here — this returns a
          // normal 204 below. A STRABL retry can't invent a price that
          // was never sent; only a human creating the order in Shopify
          // can. Returning 500 here would just trigger repeat retries
          // (and, if this weren't already idempotency-guarded above,
          // repeat alert emails) for something automatic retrying will
          // never resolve.
          break
        }
        if (!shopifyOrder && !customerInfo.email) console.warn('[webhook] No customer email found in STRABL order')

        if (!shopifyOrder) {
          shopifyOrder = await createShopifyOrder(
            lineItems,
            countryCode,
            customerInfo,
            orderShortCode,
            hasCustomLineItem ? { extraTags: ['strabl-custom-item'] } : undefined
          )

          // BUG FIX (Aug 2026): save this the moment the Shopify order
          // exists — BEFORE attempting markShopifyOrderPaid below, which is
          // the step that was failing on essentially every order (see
          // shopifyAdmin.ts). If that call throws, the catch block at the
          // bottom of this case no longer loses track of the order that
          // was already created; a retry will find it via
          // 'awaiting_payment_mark' above and skip straight to retrying
          // mark-paid instead of calling createShopifyOrder again.
          await saveOrderRecord(await buildOrderRecord('awaiting_payment_mark', shopifyOrder.id))
        }

        if (hasCustomLineItem) {
          // Not urgent (the order WAS created successfully), but flagged
          // separately from the critical "money in, no order" alerts above
          // — a custom line item isn't linked to Shopify inventory/catalog,
          // so this order won't decrement stock automatically and is worth
          // a manual glance to match it against the real product.
          await sendMailSafe({
            to: ALERT_EMAIL,
            subject: `ℹ️ Order created with an unmapped product — check inventory (${orderShortCode})`,
            text: `Order ${orderShortCode} was created successfully in Shopify, but at least one line item had no matching variant (likely a STRABL Payment Link order), so it was added as a custom item instead — not linked to catalogue/inventory.

            Shopify order: ${shopifyOrder.name || shopifyOrder.id}
            Products: ${JSON.stringify(orderUpdate.products || [], null, 2)}

            Worth a quick check that stock/fulfillment for the real product is handled manually for this one, since Shopify won't have decremented it automatically.`,
                      })
        }

        await markShopifyOrderPaid(shopifyOrder.id, orderUuid)
        const record = await buildOrderRecord(type === 'order_created' ? 'created' : 'updated', shopifyOrder.id)
        await saveOrderRecord(record)

        // This is the actual fix for "how does the customer find their
        // order code again" — it previously only ever appeared transiently
        // on STRABL's own post-checkout page. checkout/success has always
        // claimed "you'll receive a confirmation email shortly"; now it's
        // true. Best-effort — a failed email should never fail the webhook
        // itself (the order is already real either way).
        if (record.email) {
          await sendOrderConfirmationEmail({
            to: record.email,
            orderShortCode: record.orderShortCode,
            products: record.products,
            total: record.total,
            currency: record.currency,
            customerName: record.customerName,
          })
        }

        // Best-effort, and deliberately only on 'order_created' (not
        // 'order_updated') to avoid double-counting the same order if it
        // fires both events. ASSUMPTION worth confirming with STRABL: that
        // the `extra` object sent in the checkout cart payload round-trips
        // back as `orderUpdate.meta` — inferred from the field naming and
        // the empty `"meta": {}` already observed in real webhook payloads,
        // not confirmed against a live discount-code order yet.
        const discountCode = orderUpdate.meta?.discountCode
        if (type === 'order_created' && discountCode) {
          try {
            await incrementRedemption(discountCode)
          } catch (err) {
            console.error('[webhook] Failed to increment discount redemption:', err)
          }

          // Referral reward — no-ops silently if discountCode isn't a
          // referral code (a normal promo code just returns null here).
          // Best-effort, same as everything else in this block: a failed
          // reward email should never fail the webhook or the real order,
          // which is already booked either way.
          try {
            const result = await recordReferralRedemption(discountCode)
            if (result) {
              await sendReferralRewardEmail({
                to: result.profile.ownerEmail,
                name: result.profile.ownerName,
                rewardCode: result.rewardCode,
                rewardPercent: REFERRER_REWARD_PERCENT,
              })
              await sendMailSafe({
                to: ALERT_EMAIL,
                subject: `🔁 Referral redeemed — ${result.profile.code}`,
                text: `${result.profile.ownerName} (${result.profile.ownerEmail})'s referral code ${result.profile.code} was just used on order ${shopifyOrder.name || shopifyOrder.id}.\n\nTotal referrals for this code: ${result.profile.referralCount}\nReward code issued to them: ${result.rewardCode}`,
              })
            }
          } catch (err) {
            console.error('[webhook] Failed to process referral redemption:', err)
          }
        }
      } catch (err: any) {
        console.error('[webhook] ❌ Failed to create Shopify order:', err.message, err.stack)
        syncFailed = true

        // 2026-08-19 fix: previously nothing was saved to the lookup store
        // on this path, so /track-order showed the exact same "couldn't
        // find an order matching that order number and email" message as
        // a genuine wrong-code/wrong-email mistake — indistinguishable to
        // the customer from them having gotten something wrong, when
        // really their order was just still being sorted out on our end
        // (confirmed on SOR-QJJJCS: real money taken, real confusion when
        // looked up before the retry succeeded). A 'processing'/
        // 'awaiting_payment_mark' record lets the page say something true
        // and reassuring instead.
        //
        // BUG FIX (Aug 2026): this used to unconditionally save 'processing'
        // here, with no shopifyOrderId — even when createShopifyOrder had
        // already succeeded and only the later markShopifyOrderPaid call
        // was what threw. That silently discarded the "a Shopify order for
        // this already exists" fact, so the next STRABL retry saw no
        // 'awaiting_payment_mark' record and called createShopifyOrder
        // again — the duplicate-order bug. If shopifyOrder is set here, a
        // Shopify order genuinely exists, so preserve that as
        // 'awaiting_payment_mark' (with its id) instead of downgrading to
        // plain 'processing'.
        const processingRecord = shopifyOrder
          ? await buildOrderRecord('awaiting_payment_mark', shopifyOrder.id)
          : await buildOrderRecord('processing')
        await saveOrderRecord(processingRecord)

        // This is the important one: STRABL has already taken the
        // customer's money at this point, but the Shopify order — the
        // thing that actually gets it packed and shipped — doesn't exist.
        // This has to reach a human, not just a log line, or the order
        // silently vanishes until the customer complains.
        await sendMailSafe({
          to: ALERT_EMAIL,
          subject: `⚠️ Order sync FAILED — payment taken, no Shopify order (${orderShortCode || orderUuid})`,
          text: `A STRABL payment succeeded but creating the Shopify order failed. The customer HAS been charged — this order needs to be created manually.

STRABL order: ${orderShortCode || '(no short code)'}
STRABL order UUID: ${orderUuid || '(none)'}
Customer email: ${resolvedCustomer.email || '(none)'}
Customer name: ${[resolvedCustomer.firstName, resolvedCustomer.lastName].filter(Boolean).join(' ') || '(none)'}
Products: ${JSON.stringify(orderUpdate.products || [], null, 2)}

Error: ${err.message}

STRABL will retry this webhook automatically (it received a 500). If retries keep failing, check the Shopify admin token, variant IDs, and API status, then create this order manually in Shopify and mark it paid (gateway: STRABL, message referencing the order UUID above).`,
        })
      }
      break
    }

    case 'order_failed': {
      // This is the field we've been missing entirely — STRABL's own stated
      // reason for the failure, straight from their backend, no guessing.
      console.error(
        `[webhook] ⚠️ Payment failed — strabl:${orderUuid} — reason: ${orderUpdate.failureReason} — meta:`,
        JSON.stringify(orderUpdate.meta)
      )
      const failedRecord = await buildOrderRecord('failed')
      await saveOrderRecord(failedRecord)

      // Reassures the customer no money was taken and gives them the order
      // code + a track-order link, rather than leaving them wondering what
      // happened after being bounced off STRABL's checkout page.
      if (failedRecord.email) {
        await sendPaymentFailedEmail({
          to: failedRecord.email,
          orderShortCode: failedRecord.orderShortCode,
          failureReason: failedRecord.failureReason,
        })
      }

      // Also create a real Shopify order so failed attempts are visible in
      // the Orders list for follow-up, not just in /track-order. financial_
      // status 'voided' means no money was taken — Shopify's own sales
      // reports exclude voided orders from revenue by default, so this
      // doesn't skew real numbers. Tagged 'strabl-failed' so it's easy to
      // filter out (or specifically find) in the admin.
      //
      // This is visibility, not a money-critical path — if it fails, log
      // and move on rather than alerting or blocking the webhook response
      // (unlike order_created/updated above, where a failure means a paid
      // order silently doesn't exist).
      try {
        const { lineItems, countryCode, customerInfo } = await buildShopifyOrderInputs()
        if (lineItems.length > 0) {
          await createShopifyOrder(lineItems, countryCode, customerInfo, orderShortCode, {
            financialStatus: 'voided',
            extraTags: ['strabl-failed'],
          })
        }
      } catch (err: any) {
        console.error('[webhook] Failed to create voided order for failed payment:', err.message)
      }
      break
    }

    case 'order_refunded':
      console.info(`[webhook] 🔄 Order refunded — strabl:${orderUuid}`)
      await saveOrderRecord(await buildOrderRecord('refunded'))
      break

    case 'order_chargeback':
      console.info(`[webhook] 🔄 Chargeback — strabl:${orderUuid}`)
      await saveOrderRecord(await buildOrderRecord('chargeback'))
      break

    case 'order_abandoned': {
      console.info(`[webhook] 🛒 Order abandoned — strabl order: ${orderShortCode}`)
      await saveOrderRecord(await buildOrderRecord('abandoned'))

      // Same reasoning as order_failed above: real but voided Shopify
      // order, tagged for filtering, so abandoned carts are visible for
      // manual recovery follow-up (call/email the customer) instead of
      // only existing in server logs.
      try {
        const { lineItems, countryCode, customerInfo } = await buildShopifyOrderInputs()
        if (lineItems.length > 0) {
          await createShopifyOrder(lineItems, countryCode, customerInfo, orderShortCode, {
            financialStatus: 'voided',
            extraTags: ['strabl-abandoned'],
          })
        }
      } catch (err: any) {
        console.error('[webhook] Failed to create voided order for abandoned checkout:', err.message)
      }
      break
    }

    default:
      console.log(`[webhook] ⚠️ Unhandled event type: ${type}`)
  }

  if (syncFailed) {
    // Deliberately NOT added to processedIds — see comment above the dedup
    // check. Returning 500 tells STRABL this delivery didn't succeed, and
    // because we didn't mark it processed, the retry will actually attempt
    // order creation again instead of being swallowed as a duplicate.
    return NextResponse.json({ error: 'Order sync failed, will retry' }, { status: 500 })
  }

  if (webhookId) processedIds.add(webhookId)
  return new NextResponse(null, { status: 204 })
}