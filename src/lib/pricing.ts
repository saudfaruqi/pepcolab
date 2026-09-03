// src/lib/pricing.ts
//
// DUAL MARKET (Sep 2026)
// ----------------------
// History: this file originally carried a full second market (GB/GBP display
// pricing, a UK catalogue tag, FX conversion, a bank-charge disclosure). In
// August all of that was stripped to AE-only, correctly, because none of it
// was backed by real UK fulfilment.
//
// It is now back as TWO markets, but with the trade the August version got
// wrong reversed. The old code's failure was showing a converted GBP price
// that checkout could not honour. So:
//
//   - GB is a real, separately-identified market.  (was: silently relabelled AE)
//   - GB is shown AED, the currency actually charged. (was: fabricated GBP)
//   - GB cannot check out.                          (was: broken checkout path)
//
// ONE SWITCH controls UK selling: UK_CHECKOUT_LIVE. When UK fulfilment and a
// GBP price list exist in Shopify, flip it to true and update the three
// things flagged with "WHEN UK GOES LIVE" below. Nothing else needs touching.
//
// Every exported function keeps its original signature, so the existing call
// sites in cartContext.tsx, shopify.ts, CartDrawer.tsx, cart/page.tsx,
// MarketGuard.tsx and ProductVariantView.tsx compile unchanged.

export type Market = 'AE' | 'GB'

/**
 * Master switch for UK selling.
 *
 * WHEN UK GOES LIVE, in the same deploy:
 *   1. Set this to true.
 *   2. Set MARKET_CURRENCY.GB to 'GBP' and populate GBP prices in Shopify.
 *   3. Add United Kingdom to the Store schema's areaServed in app/layout.tsx.
 *
 * Doing (1) without (2) would show AED to UK buyers at checkout; doing (3)
 * without (1) claims availability the site cannot deliver.
 */
export const UK_CHECKOUT_LIVE = false

/**
 * Display currency per market. GB is AED on purpose while UK_CHECKOUT_LIVE is
 * false — STRABL charges in AED, and a GBP figure the checkout cannot honour
 * is worse than an honest foreign-currency price with a note beside it.
 */
export const MARKET_CURRENCY: Record<Market, string> = {
  AE: 'AED',
  GB: 'AED',
}

/** Shopify product tag that assigns a product to a market. */
export const MARKET_TAG: Record<Market, string> = {
  AE: 'uae',
  GB: 'uk',
}

/**
 * Legacy alias. Several files still import UK_CATALOGUE_LIVE; it has always
 * meant "is there a separate UK catalogue to gate against", which is exactly
 * UK_CHECKOUT_LIVE. Kept so no import breaks.
 */
export const UK_CATALOGUE_LIVE = UK_CHECKOUT_LIVE

export function normaliseMarket(country?: string | null): Market {
  return country === 'GB' ? 'GB' : 'AE'
}

/** Currency code a market should be shown prices in. */
export function currencyFor(country?: string | null): string {
  return MARKET_CURRENCY[normaliseMarket(country)]
}

/** True if the visitor's market can complete a purchase today. */
export function canCheckoutIn(country?: string | null): boolean {
  return normaliseMarket(country) === 'AE' || UK_CHECKOUT_LIVE
}

/**
 * Convert an AED amount into the market's display currency.
 *
 * A no-op while both markets display AED. It is kept as a real function
 * rather than deleted because every call site already routes through it —
 * when GBP display goes live this is the single place conversion lands,
 * instead of an FX rate being scattered across six components.
 */
export function convertFromAed(amountAed: number, _country?: string | null): number {
  return amountAed
}

/**
 * Storefront search filter for a market, or undefined for no filtering.
 *
 * Returns undefined while there is one catalogue. Do NOT start filtering by
 * MARKET_TAG here until UK-tagged products actually exist in Shopify — a
 * filter that matches nothing returns an empty catalogue, not a fallback.
 */
export function marketQuery(_country?: string | null): string | undefined {
  return undefined
}

/**
 * Whether a product is sold in a given market.
 *
 * IMPORTANT: this is a SELLING check, not a VISIBILITY check. UK visitors
 * still see every product page, with full content, schema and COA data —
 * they simply get the launch-list panel instead of a buy button (see
 * MarketGuard.tsx). Hiding the catalogue from UK visitors would gut the
 * entire point of ranking in the UK before launch.
 */
export function isInMarket(_tags: string[] = [], country?: string | null): boolean {
  return canCheckoutIn(country)
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
 * Disclosure copy shown beside a price when the visitor's market is charged
 * in a currency other than their local one.
 *
 * Returns a real notice for GB now: a UK researcher seeing "AED 480" is owed
 * an explanation of what their card will actually be billed. Returns null for
 * AE, and will return null for GB once GBP pricing is live.
 */
export function chargeNotice(
  _amountAed: number,
  country?: string | null
): string | null {
  if (normaliseMarket(country) === 'GB' && !UK_CHECKOUT_LIVE) {
    return 'Priced in UAE dirhams. UK dispatch is not yet available — join the launch list for GBP pricing at UK release.'
  }
  return null
}

/**
 * Converts a displayed total back into the AED amount that will be charged.
 * A no-op while displayed and charged amounts match.
 */
export function displayedTotalToAed(displayedTotal: number, _country?: string | null): number {
  return displayedTotal
}