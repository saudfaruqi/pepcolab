// src/lib/pricing.ts
//
// WHY THIS EXISTS
// ---------------
// Shopify Markets multi-currency is unavailable on this store: the payment
// gateway (Strabl) only supports a single currency, so `marketUpdate` rejects
// a GBP base currency on the UK market and Storefront `@inContext(country: GB)`
// returns AED presentment prices regardless.
//
// Consequence: **AED is the only real price.** The cart, the checkout and the
// card charge are all AED. GBP is a display conversion so UK visitors read a
// familiar number — it is NOT what gets charged, and the customer's own bank
// applies its FX spread on top (typically 2-3%). That has to be disclosed
// wherever a converted price appears. See `chargeNotice()`.
//
// Conversion happens at exactly two places, both data boundaries:
//   1. normaliseProduct()  in src/lib/shopify.ts    — product prices
//   2. applyCart()         in src/lib/cartContext.tsx — cart lines + subtotal
// Everything downstream keeps calling formatPrice(amount, currencyCode) and
// works unchanged. Do NOT convert again inside components or you'll double-apply.

export type Market = 'AE' | 'GB'

export const MARKET_CURRENCY: Record<Market, string> = {
  AE: 'AED',
  GB: 'GBP',
}

/** Product tag that assigns a product to a market. */
export const MARKET_TAG: Record<Market, string> = {
  AE: 'uae',
  GB: 'uk',
}

// ─── UK CATALOGUE SWITCH ────────────────────────────────────────────────────
//
// FALSE  = one catalogue. Every product is shown in both markets; only the
//          displayed currency differs. This is correct while every product in
//          Shopify is tagged `uae` and nothing is tagged `uk` — filtering by
//          `tag:uk` today returns an empty storefront for UK visitors.
//
// TRUE   = per-market catalogues. AE visitors see `tag:uae`, GB visitors see
//          `tag:uk`. A product carrying BOTH tags appears in both.
//
// Flip this to true only once every product you intend to sell in the UK is
// tagged `uk` in Shopify. The moment it's true, any product without the `uk`
// tag disappears for UK visitors — that's the point, but it's abrupt, so
// tag first and flip second.
//
// Deliberately a constant rather than "filter, and fall back to everything if
// the result is empty". That kind of auto-detection means tagging a single
// product `uk` silently strips the UK storefront down to one item with no
// deploy and no warning. An explicit switch fails predictably.
export const UK_CATALOGUE_LIVE = false

/**
 * Fixed display rate — deliberately NOT a live FX feed.
 *
 * A live rate means shelf prices move several times a day, a customer who saw
 * £41 yesterday sees £43 today, and any GBP figure in an ad or an email is
 * wrong within a week. Set this manually, review monthly, and keep a margin
 * buffer so a rate move doesn't eat the AED you actually collect.
 *
 * Last reviewed: <SET DATE ON EACH UPDATE>
 */
export const GBP_PER_AED = 0.21

export function normaliseMarket(country?: string | null): Market {
  return country === 'GB' ? 'GB' : 'AE'
}

/** Currency code a market should be shown prices in. */
export function currencyFor(country?: string | null): string {
  return MARKET_CURRENCY[normaliseMarket(country)]
}

/** Round to a price that looks chosen rather than converted. */
function tidyGbp(value: number): number {
  if (value < 20) return Math.round(value * 2) / 2 // nearest 0.50
  if (value < 100) return Math.round(value)         // nearest £1
  return Math.round(value / 5) * 5                  // nearest £5
}

/**
 * Convert an AED amount into the market's display currency.
 * AE is a no-op — AED is the native currency of every Shopify price.
 */
export function convertFromAed(amountAed: number, country?: string | null): number {
  if (normaliseMarket(country) === 'AE') return amountAed
  return tidyGbp(amountAed * GBP_PER_AED)
}

/**
 * Storefront search filter for a market, or undefined for no filtering.
 *
 * Returns undefined when UK_CATALOGUE_LIVE is false, or when country is
 * unknown. Unknown-country callers are sitemap.ts and generateStaticParams,
 * which must always see BOTH catalogues so every product stays pre-rendered
 * and indexable — Googlebot crawls from US IPs with no market cookie.
 */
export function marketQuery(country?: string | null): string | undefined {
  if (!UK_CATALOGUE_LIVE) return undefined
  if (country !== 'AE' && country !== 'GB') return undefined
  return `tag:${MARKET_TAG[country]}`
}

/**
 * Whether a product is sold in a given market. Used to guard direct URL hits
 * on a product that belongs to the other catalogue.
 *
 * Returns TRUE when filtering is off or the country is unknown — same
 * crawler reasoning as marketQuery().
 */
export function isInMarket(tags: string[] = [], country?: string | null): boolean {
  if (!UK_CATALOGUE_LIVE) return true
  if (country !== 'AE' && country !== 'GB') return true
  return tags.map((t) => t.toLowerCase()).includes(MARKET_TAG[country])
}

/** Convenience for optional values (compareAtPrice, oldPrice). */
export function convertOptional(
  amountAed: number | undefined | null,
  country?: string | null
): number | undefined {
  if (amountAed == null) return undefined
  return convertFromAed(amountAed, country)
}

/**
 * Disclosure copy. Render wherever a converted price appears — product page,
 * cart drawer and checkout at minimum. UK consumer law requires the price
 * actually payable to be clear before purchase; an approximate conversion is
 * fine, an undisclosed one is not.
 *
 * `amountAed` is the ORIGINAL dirham figure, so the customer can see exactly
 * what their statement will show.
 */
export function chargeNotice(
  amountAed: number,
  country?: string | null
): string | null {
  if (normaliseMarket(country) === 'AE') return null
  const aed = `AED ${Math.round(amountAed).toLocaleString('en-AE')}`
  return `Approximate. Charged in dirhams as ${aed}. Your bank sets the final exchange rate and may add a fee.`
}