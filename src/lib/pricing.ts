// src/lib/pricing.ts
//
// TWO LIVE MARKETS (Oct 2026)
// ---------------------------
// The UAE and the UK both sell. UK visitors see prices in pounds; the
// payment gateway (STRABL) charges in UAE dirhams for every order, so:
//
//   - Shopify holds one AED price list. Nothing in Shopify changes per market.
//   - convertFromAed() turns AED into the visitor's display currency at one
//     published rate (AED_PER_GBP). It is the ONLY conversion point.
//   - Checkout always sends the original AED prices to STRABL
//     (useStrablCheckout.ts reads CartLine.priceAed), never the GBP figure.
//   - chargeNotice() tells a UK buyer, beside every total, the exact AED
//     amount their card will be charged and the rate used.
//
// To change the rate, set NEXT_PUBLIC_AED_PER_GBP in Vercel and redeploy.
// To pause UK selling, set UK_CHECKOUT_LIVE to false.

export type Market = 'AE' | 'GB'

/** Master switch for UK selling. false shows UK visitors AED and no buy button. */
export const UK_CHECKOUT_LIVE = true

/**
 * Dirhams per pound used for UK display prices. Published beside every UK
 * total, so a buyer can check it. Mid-market on 24 Oct 2026 was 4.91.
 * Override with NEXT_PUBLIC_AED_PER_GBP (a plain number, e.g. "4.91").
 */
const DEFAULT_AED_PER_GBP = 4.91
export const AED_PER_GBP: number = (() => {
  const v = Number(process.env.NEXT_PUBLIC_AED_PER_GBP)
  return Number.isFinite(v) && v > 1 && v < 20 ? v : DEFAULT_AED_PER_GBP
})()

/** Display currency per market. GB shows GBP only while UK selling is live. */
export const MARKET_CURRENCY: Record<Market, string> = {
  AE: 'AED',
  GB: UK_CHECKOUT_LIVE ? 'GBP' : 'AED',
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

const round2 = (n: number) => Math.round(n * 100) / 100

/** Convert an AED amount into the market's display currency (2 dp). */
export function convertFromAed(amountAed: number, country?: string | null): number {
  if (currencyFor(country) === 'GBP') return round2(amountAed / AED_PER_GBP)
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
 * A SELLING check, not a visibility check: every visitor sees every product
 * page. Both markets sell the full catalogue.
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
 * Shown beside every UK total: the exact AED amount the card is charged and
 * the rate used. Returns null where display and charge currency are the same.
 */
export function chargeNotice(amountAed: number, country?: string | null): string | null {
  if (currencyFor(country) !== 'GBP') return null
  const aed = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'AED', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amountAed)
  return `Pound prices are converted at £1 = AED ${AED_PER_GBP.toFixed(2)}. Your card is charged ${aed} in UAE dirhams; your card provider converts it and its rate may differ slightly.`
}

/** Converts a displayed total back into the AED amount that will be charged. */
export function displayedTotalToAed(displayedTotal: number, country?: string | null): number {
  if (currencyFor(country) === 'GBP') return round2(displayedTotal * AED_PER_GBP)
  return displayedTotal
}
