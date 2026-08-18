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
import { sendMailSafe } from '@/lib/mailer'
import { sendOrderConfirmationEmail, sendPaymentFailedEmail } from '@/lib/orderEmails'
import { incrementRedemption } from '@/lib/discountStore'
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

function verifyWebhook(webhookId: string, timestamp: string, signature: string, rawBody: string) {
  const secret = process.env.STRABL_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[webhook] STRABL_WEBHOOK_SECRET not set, skipping verification')
    return // Skip verification if secret is not set (dev mode)
  }

  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    throw new Error('Webhook timestamp too old or invalid')
  }

  const signingInput = `${webhookId}.${timestamp}.${rawBody}`
  const expectedHex = crypto.createHmac('sha256', secret).update(signingInput).digest('hex')
  const expected = `v1=${expectedHex}`

  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    throw new Error('Webhook signature mismatch')
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const webhookId = req.headers.get('x-webhook-id') || ''
  const timestamp = req.headers.get('x-webhook-timestamp') || ''
  const signature = req.headers.get('x-webhook-signature') || ''

  try {
    verifyWebhook(webhookId, timestamp, signature, rawBody)
  } catch (err: any) {
    // TEMP DEBUG: log every header STRABL actually sends, so we can see
    // whether x-webhook-id / x-webhook-timestamp / x-webhook-signature are
    // even the right names, and what format the timestamp is really in
    // (seconds vs ms), instead of guessing. Remove once verification is
    // confirmed working.
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

  // Builds the /track-order lookup record from whatever this event gave us.
  // Called for every event type below (including failures) so a customer
  // can look up an order regardless of how it ended — this is the piece
  // that was missing before: order_failed used to only log to the server
  // console, so a customer with a failed payment had literally nothing to
  // look up.
  const buildOrderRecord = (status: OrderRecord['status']): OrderRecord => {
    const products = resolvedProducts.map((item: any) => ({
      title: item.title || 'Product',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      variantOptions: item.extra || [],
    }))
    const total = products.reduce((sum: number, p: any) => sum + p.price * p.quantity, 0)
    const firstName = customerUpdate.firstName || ''
    const lastName = customerUpdate.lastName || ''

    return {
      orderShortCode,
      orderUuid: orderUuid || '',
      status,
      failureReason: orderUpdate.failureReason || undefined,
      email: (customerUpdate.email || '').toLowerCase().trim(),
      customerName: [firstName, lastName].filter(Boolean).join(' ') || undefined,
      products,
      currency: 'AED', // STRABL webhook payloads observed so far are AED-only per merchant config
      total,
      createdAt: new Date().toISOString(),
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
  const buildShopifyOrderInputs = async () => {
    const shippingAddress = customerUpdate.shipping || {}

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

    let email = customerUpdate.email || ''
    let phone = customerUpdate.phoneNumber || ''
    let address1 = shippingAddress.address_1 || ''
    let address2 = shippingAddress.address_2 || ''
    let city = shippingAddress.city || ''
    let postalCode = shippingAddress.postcode || ''
    let countryCode = normalizeCountryCode(shippingAddress.country)
    let firstName = customerUpdate.firstName || shippingAddress.first_name || ''
    let lastName = customerUpdate.lastName || shippingAddress.last_name || ''

    const currentShipping: CachedShipping = {
      email, phone, firstName, lastName, address1, address2, city, postalCode, countryCode,
    }

    if (isUsableAddress(currentShipping)) {
      // Good address on this event — cache it so a later event for the
      // same order (e.g. order_updated with a stripped-down payload) can
      // recover it instead of falling back to blanks.
      await cacheShippingIfUsable(orderShortCode, currentShipping)
    } else {
      // This event didn't carry a real address (common on order_updated —
      // see SOR-QJJJCS) — try to recover the real one from an earlier
      // event on this same order rather than sending Shopify an order
      // with a blank/default address.
      const cached = await getCachedShipping(orderShortCode)
      if (cached) {
        console.info(`[webhook] Recovered shipping address for ${orderShortCode} from cache (current event had none)`)
        email = email || cached.email
        phone = phone || cached.phone
        firstName = firstName || cached.firstName
        lastName = lastName || cached.lastName
        address1 = cached.address1
        address2 = cached.address2
        city = cached.city
        postalCode = cached.postalCode
        countryCode = cached.countryCode
      }
    }

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

        const { lineItems, hasCustomLineItem, countryCode, customerInfo } = await buildShopifyOrderInputs()

        if (lineItems.length === 0) {
          // Now genuinely rare — only when STRABL sent no usable price at
          // all (not just a missing variant mapping, which is handled
          // below via a custom line item instead). Payment was already
          // taken (paymentStatus: 'paid' on these events), so this still
          // gets the same urgent alert as a Shopify API failure — money
          // in, no Shopify order out, and nothing here can fix itself.
          console.error(`[webhook] ⚠️ No usable line items (missing price) for paid order ${orderShortCode}`)
          const record = buildOrderRecord(type === 'order_created' ? 'created' : 'updated')
          await saveOrderRecord(record) // still let the customer look it up / get their confirmation email below
          if (record.email) {
            await sendOrderConfirmationEmail({
              to: record.email,
              orderShortCode: record.orderShortCode,
              products: record.products,
              total: record.total,
              currency: record.currency,
            })
          }
          await sendMailSafe({
            to: ALERT_EMAIL,
            subject: `⚠️ Order needs MANUAL Shopify creation — no usable price (${orderShortCode})`,
            text: `Payment succeeded but STRABL didn't send a usable price for any product on this order, so no line item could be created — not even as a custom item.

STRABL order: ${orderShortCode}
Customer email: ${customerUpdate.email || '(none)'}
Customer name: ${[customerUpdate.firstName, customerUpdate.lastName].filter(Boolean).join(' ') || '(none)'}
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
        if (!customerInfo.email) console.warn('[webhook] No customer email found in STRABL order')

        const shopifyOrder = await createShopifyOrder(
          lineItems,
          countryCode,
          customerInfo,
          orderShortCode,
          hasCustomLineItem ? { extraTags: ['strabl-custom-item'] } : undefined
        )

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
        const record = buildOrderRecord(type === 'order_created' ? 'created' : 'updated')
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
        // looked up before the retry succeeded). A 'processing' record
        // lets the page say something true and reassuring instead.
        const processingRecord = buildOrderRecord('processing')
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
Customer email: ${customerUpdate.email || '(none)'}
Customer name: ${[customerUpdate.firstName, customerUpdate.lastName].filter(Boolean).join(' ') || '(none)'}
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
      const failedRecord = buildOrderRecord('failed')
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
      await saveOrderRecord(buildOrderRecord('refunded'))
      break

    case 'order_chargeback':
      console.info(`[webhook] 🔄 Chargeback — strabl:${orderUuid}`)
      await saveOrderRecord(buildOrderRecord('chargeback'))
      break

    case 'order_abandoned': {
      console.info(`[webhook] 🛒 Order abandoned — strabl order: ${orderShortCode}`)
      await saveOrderRecord(buildOrderRecord('abandoned'))

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