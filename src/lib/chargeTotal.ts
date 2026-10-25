// src/lib/chargeTotal.ts
//
// The amount STRABL will actually charge, in AED, for a cart shown in any
// display currency. useStrablCheckout builds the payment from these same
// AED lines, and the cart page and drawer print the result in the UK charge
// notice, so the figure a UK buyer is told is the figure on their card.
import { computeBundleSavings } from './bundles'
import { displayedTotalToAed } from './pricing'

export interface PricedLine {
  variantId: string
  slug: string
  variantTitle: string
  quantity: number
  price: number
  /** Shopify's AED unit price, kept beside the converted display price. */
  priceAed?: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Lines repriced in AED, the gateway currency. */
export function toAedLines<T extends PricedLine>(lines: T[], country?: string | null): T[] {
  return lines.map((l) => ({
    ...l,
    price: typeof l.priceAed === 'number' && l.priceAed > 0 ? l.priceAed : displayedTotalToAed(l.price, country),
  }))
}

/** AED charged after bundle savings and an AED code discount. */
export function aedChargeTotal(lines: PricedLine[], country?: string | null, codeDiscountAed = 0): number {
  const aed = toAedLines(lines, country)
  const subtotal = aed.reduce((s, l) => s + l.price * l.quantity, 0)
  const bundles = computeBundleSavings(aed).amount
  return Math.max(0, round2(subtotal - bundles - codeDiscountAed))
}
