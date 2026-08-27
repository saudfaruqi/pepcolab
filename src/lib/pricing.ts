// src/lib/pricing.ts
//
// MARKET FIX (Aug 2026): PepcoLab is UAE-only for now. This file used to
// carry a full second market (GB/GBP display pricing, a UK catalogue-tag
// switch, FX conversion, a bank-charge disclosure notice) alongside AE.
// None of that was actually live — countryContext.tsx and middleware.ts
// now only ever resolve visitors to 'AE', so every GB-specific branch here
// was dead code kept "just in case." Stripped down to AE-only.
//
// Every exported function below KEEPS its original signature (still takes
// an optional `country`/`market` param) purely so the ~10 call sites across
// cartContext.tsx, shopify.ts, CartDrawer.tsx, cart/page.tsx and
// MarketGuard.tsx don't all need touching — they simply always resolve to
// the AE behaviour now. If a second market is ever added back, this file
// (plus countryContext.tsx and middleware.ts's SUPPORTED_COUNTRIES) is
// where that comes back in.

export type Market = 'AE'

export const MARKET_CURRENCY: Record<Market, string> = {
  AE: 'AED',
}

/** Product tag that assigns a product to a market. Single-market now — kept
 *  for MarketGuard.tsx's tag-check signature, effectively unused. */
export const MARKET_TAG: Record<Market, string> = {
  AE: 'uae',
}

// Always false now that there's only one market — kept (rather than
// deleted outright) because MarketGuard.tsx, shopify.ts and
// ProductVariantView.tsx all still branch on it. A single-market site has
// nothing to guard, so this permanently short-circuits that gating logic.
export const UK_CATALOGUE_LIVE = false

export function normaliseMarket(_country?: string | null): Market {
  return 'AE'
}

/** Currency code a market should be shown prices in. Always AED now. */
export function currencyFor(_country?: string | null): string {
  return MARKET_CURRENCY.AE
}

/**
 * Convert an AED amount into the market's display currency.
 * Always a no-op now — AED is the only currency this store shows or charges.
 */
export function convertFromAed(amountAed: number, _country?: string | null): number {
  return amountAed
}

/**
 * Storefront search filter for a market, or undefined for no filtering.
 * Always undefined now (single catalogue, single market).
 */
export function marketQuery(_country?: string | null): string | undefined {
  return undefined
}

/**
 * Whether a product is sold in a given market. Always true now — there's
 * only one market, so nothing is ever "not stocked for your region."
 */
export function isInMarket(_tags: string[] = [], _country?: string | null): boolean {
  return true
}

/** Convenience for optional values (compareAtPrice, oldPrice). */
export function convertOptional(
  amountAed: number | undefined | null,
  _country?: string | null
): number | undefined {
  if (amountAed == null) return undefined
  return amountAed
}

/**
 * Disclosure copy for a converted/approximate price. Always null now —
 * there's no conversion happening, so there's nothing to disclose.
 */
export function chargeNotice(
  _amountAed: number,
  _country?: string | null
): string | null {
  return null
}

/**
 * Converts a displayed total back into the AED amount that will actually be
 * charged. Always a no-op now (displayed and charged amounts are the same).
 */
export function displayedTotalToAed(displayedTotal: number, _country?: string | null): number {
  return displayedTotal
}