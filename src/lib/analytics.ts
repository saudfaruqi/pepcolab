// src/lib/analytics.ts
//
// GA4 ECOMMERCE EVENTS — added September 2026
// -------------------------------------------
// WHY THIS EXISTS
// GA4 was installed and reporting pageviews, but "Key events: No data
// available" — meaning nothing past arrival was measured. Traffic numbers
// without funnel events answer the least useful half of the question: they
// tell you whether more people came, never whether anything worked. With a
// site change landing (middleware, hero video, age gate, titles), that is
// exactly the wrong time to be blind past the first pageview.
//
// WHAT IS TRACKED
//   view_item        product page viewed
//   add_to_cart      item added
//   remove_from_cart item removed
//   begin_checkout   STRABL checkout opened
//   purchase         checkout returned successfully
// plus three PepcoLab-specific events that matter more here than on a
// generic store: coa_lookup, chat_handoff, uk_waitlist_join.
//
// THE PURCHASE PROBLEM, AND HOW IT IS SOLVED
// STRABL redirects to /checkout/success with no order data in the URL, so
// the success page has nothing to report. Rather than guess, begin_checkout
// stashes the pending order (items, value, a generated transaction id) in
// sessionStorage; the success page reads it, fires `purchase`, and clears
// it. Clearing is what prevents a double-count on refresh, and sessionStorage
// (not localStorage) means it cannot survive into a later unrelated session.
//
// This is client-side attribution, so it will slightly undercount against
// Shopify — ad blockers, people closing the tab on the payment screen. Treat
// GA4 purchase counts as a trend line and Shopify as the books. They will
// not match exactly and they are not supposed to.
//
// GA4 SETUP STILL REQUIRED (one-time, in the GA4 UI — code alone is not
// enough): Admin → Events → mark `purchase` and `begin_checkout` as key
// events. Until you do, they record but do not appear as conversions.

type GtagArgs =
  | ['event', string, Record<string, unknown>]
  | ['config', string, Record<string, unknown>?]
  | ['js', Date]

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void
    dataLayer?: unknown[]
  }
}

const PENDING_KEY = 'pepcolab_pending_purchase'
const CURRENCY = 'AED'

export interface AnalyticsItem {
  item_id: string
  item_name: string
  item_variant?: string
  item_category?: string
  price: number
  quantity: number
}

/**
 * Every event goes through here. Never throws: an analytics failure must not
 * be able to break an add-to-cart or a checkout, which is the single most
 * common way tracking code causes real damage.
 */
function track(event: string, params: Record<string, unknown> = {}): void {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
    window.gtag('event', event, params)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[analytics]', event, err)
  }
}

const valueOf = (items: AnalyticsItem[]): number =>
  Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100

/* -------------------------------------------------------------------------- */
/* ECOMMERCE FUNNEL                                                            */
/* -------------------------------------------------------------------------- */

export function trackViewItem(item: AnalyticsItem): void {
  track('view_item', { currency: CURRENCY, value: item.price, items: [item] })
}

export function trackAddToCart(item: AnalyticsItem): void {
  track('add_to_cart', { currency: CURRENCY, value: item.price * item.quantity, items: [item] })
}

export function trackRemoveFromCart(item: AnalyticsItem): void {
  track('remove_from_cart', { currency: CURRENCY, value: item.price * item.quantity, items: [item] })
}

export function trackViewCart(items: AnalyticsItem[]): void {
  track('view_cart', { currency: CURRENCY, value: valueOf(items), items })
}

/**
 * Fires begin_checkout AND stashes the order so the success page can report
 * the purchase. Returns the transaction id in case a caller wants it.
 */
export function trackBeginCheckout(items: AnalyticsItem[], discountCode?: string): string {
  const value = valueOf(items)
  const transactionId = `PL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  track('begin_checkout', {
    currency: CURRENCY,
    value,
    items,
    ...(discountCode ? { coupon: discountCode } : {}),
  })

  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({
      transactionId, items, value, coupon: discountCode || undefined, ts: Date.now(),
    }))
  } catch {
    // Private mode or storage disabled — begin_checkout still recorded, only
    // the purchase attribution is lost. Degrade, don't break.
  }

  return transactionId
}

/**
 * Called once on /checkout/success. Reads and CLEARS the stash, so a refresh
 * or a back-navigation cannot double-count the order.
 *
 * Stale entries are discarded: anything older than 6 hours is far more likely
 * to be an abandoned checkout the visitor wandered back from than a real
 * completion, and counting it would inflate revenue.
 */
export function trackPurchaseFromPending(): boolean {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    if (!raw) return false
    sessionStorage.removeItem(PENDING_KEY)

    const pending = JSON.parse(raw) as {
      transactionId: string; items: AnalyticsItem[]; value: number; coupon?: string; ts: number
    }
    if (!pending?.items?.length) return false
    if (Date.now() - pending.ts > 6 * 60 * 60 * 1000) return false

    track('purchase', {
      transaction_id: pending.transactionId,
      currency: CURRENCY,
      value: pending.value,
      items: pending.items,
      ...(pending.coupon ? { coupon: pending.coupon } : {}),
    })
    return true
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/* PEPCOLAB-SPECIFIC                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Someone looked up a batch certificate. This is the most under-rated metric
 * on the site: it measures use of the thing that actually differentiates
 * PepcoLab from every competitor publishing a generic PDF. If COA lookups
 * correlate with purchases, the certificate library deserves far more
 * prominence than a nav link.
 */
export function trackCoaLookup(query: string, found: boolean): void {
  track('coa_lookup', { search_term: query.slice(0, 60), found })
}

/** Chat escalated to a human — the channel tells you which route people trust. */
export function trackChatHandoff(channel: 'whatsapp' | 'email' | 'callback', page: string): void {
  track('chat_handoff', { channel, page })
}

/** UK launch list signup. Measures demand before UK fulfilment exists. */
export function trackUkWaitlist(source: 'uk_page' | 'product_guard', productSlug?: string): void {
  track('uk_waitlist_join', { source, ...(productSlug ? { item_id: productSlug } : {}) })
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

/** Map a cart line onto a GA4 item. Keeps the shape in one place. */
export function lineToItem(line: {
  variantId: string; slug?: string; title: string; variantTitle?: string
  price: number; quantity: number; category?: string
}): AnalyticsItem {
  return {
    item_id: line.slug || line.variantId,
    item_name: line.title,
    item_variant: line.variantTitle || undefined,
    item_category: line.category || undefined,
    price: Number(line.price) || 0,
    quantity: Number(line.quantity) || 1,
  }
}