// src/lib/pricing.ts
//
// WHY THIS EXISTS
// ---------------
// Shopify Markets multi-currency is unavailable on this store: the payment
// gateway (Strabl) doesn't support presenting more than one currency, and
// marketUpdate rejects any attempt to set a GBP base currency on the UK
// market. Storefront `@inContext(country: GB)` therefore returns AED
// presentment prices regardless.
//
// Consequence: **AED is the only real price.** The cart, the checkout and
// the actual card charge are all AED. GBP is a display conversion so UK
// visitors can read a familiar number — it is not what gets charged, and
// the customer's own bank applies its FX spread on top (typically 2-3%).
// That has to be disclosed at checkout. See `chargeNotice()` below.

export type Market = 'AE' | 'GB'

/**
 * Fixed display rate — deliberately NOT a live FX feed.
 *
 * A live rate means your shelf prices move several times a day, a customer
 * who saw £41 yesterday sees £43 today, and any GBP figure you put in an ad
 * or an email is wrong within a week. Set this manually, review monthly,
 * and keep a margin buffer so a rate move doesn't eat into the AED price
 * you actually collect.
 *
 * Last reviewed: <SET DATE ON EACH UPDATE>
 */
export const GBP_PER_AED = 0.21

/** Round to a price that looks chosen rather than converted. */
function tidyGbp(value: number): number {
  if (value < 20) return Math.round(value * 2) / 2 // nearest 0.50
  if (value < 100) return Math.round(value)         // nearest £1
  return Math.round(value / 5) * 5                  // nearest £5
}

export interface DisplayPrice {
  /** The figure to show, already formatted. */
  label: string
  /** Currency actually charged at checkout — always AED on this store. */
  chargedCurrency: 'AED'
  /** The AED amount that will be charged, formatted. */
  chargedLabel: string
  /** True when the displayed figure is a conversion, not the charge. */
  isConverted: boolean
}

/**
 * Turn an AED amount from Shopify into what a given market should see.
 * `aed` is the raw `variant.price.amount` string or number.
 */
export function displayPrice(aed: string | number, market: Market): DisplayPrice {
  const amount = typeof aed === 'string' ? parseFloat(aed) : aed
  const chargedLabel = formatAed(amount)

  if (market === 'GB') {
    const gbp = tidyGbp(amount * GBP_PER_AED)
    return {
      label: formatGbp(gbp),
      chargedCurrency: 'AED',
      chargedLabel,
      isConverted: true,
    }
  }

  return {
    label: chargedLabel,
    chargedCurrency: 'AED',
    chargedLabel,
    isConverted: false,
  }
}

export function formatAed(amount: number): string {
  return `AED ${amount.toLocaleString('en-AE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function formatGbp(amount: number): string {
  return `£${amount.toLocaleString('en-GB', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Disclosure copy. Render this wherever a converted price appears — product
 * page, cart drawer and checkout at minimum. UK consumer law requires the
 * price actually payable to be clear before purchase; an approximate
 * conversion is fine, an undisclosed one is not.
 */
export function chargeNotice(price: DisplayPrice): string | null {
  if (!price.isConverted) return null
  return `Approximate. Charged in dirhams as ${price.chargedLabel}. Your bank sets the final exchange rate and may add a fee.`
}

/**
 * Which catalogue a market sees. Products are tagged `uae` and/or `uk`;
 * a product carrying both appears in both markets.
 */
export const MARKET_TAG: Record<Market, string> = {
  AE: 'uae',
  GB: 'uk',
}

/** Storefront API search syntax for the products connection. */
export function marketQuery(market: Market): string {
  return `tag:${MARKET_TAG[market]}`
}