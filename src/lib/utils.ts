import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Format a price amount with a dynamic ISO 4217 currency code.
 *
 * Uses `Intl.NumberFormat` so the symbol, grouping separator, and decimal
 * format all follow the locale conventions for the given currency.
 *
 * @param price        - Numeric price value
 * @param currencyCode - ISO 4217 code (e.g. "AED", "USD", "GBP"). Defaults
 *                       to "AED" to preserve backwards-compatibility with
 *                       existing call sites that omit the argument.
 * @param locale       - BCP 47 locale tag. Defaults to "en-US" for consistent
 *                       digit/separator format across markets.
 *
 * @example
 * formatPrice(149.99)           // "AED 149.99"  (default)
 * formatPrice(149.99, "USD")    // "$149.99"
 * formatPrice(149.99, "GBP")    // "£149.99"
 * formatPrice(149.99, "EUR")    // "€149.99"
 */
export function formatPrice(
  price: number,
  currencyCode = 'AED',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export function formatPurity(purity: number): string {
  return `${purity}%`
}