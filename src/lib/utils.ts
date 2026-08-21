// src/lib/utils.ts

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

/**
 * SEO FIX (Aug 2026 audit): every Shopify product handle is hardcoded
 * "{name}-uae" (see app/data.ts), which was leaking straight into indexed
 * URLs and <link rel="canonical"> for BOTH the UK and UAE markets — the
 * "UK market architecturally unreachable" finding in the growth-playbook
 * audit. Renaming the Shopify handles themselves is a bigger, separate job
 * (handle also flows through cart/checkout/order-emails/STRABL webhook —
 * see lib/orderEmails.ts, lib/useStrablCheckout.ts, app/api/checkout/**),
 * so as an interim, low-risk fix: every NEW/indexed link on the site points
 * to the neutral slug via productHref(), and middleware.ts 301-redirects
 * any request that still lands on the old "-uae" URL to it. Cart/checkout/
 * order-confirmation code paths are untouched and keep using the real
 * Shopify handle directly — those aren't indexed and shouldn't change until
 * the handle rename itself happens.
 */
export function toNeutralSlug(handleOrSlug: string): string {
  return handleOrSlug.replace(/-uae$/i, '')
}

/** Neutral slug -> the real Shopify handle to query the Storefront API with. */
export function toShopifyHandle(neutralSlug: string): string {
  return neutralSlug.endsWith('-uae') ? neutralSlug : `${neutralSlug}-uae`
}

/** Use for every indexable/clickable product link. Do NOT use for cart,
 * checkout, order-confirmation or webhook code — those keep the real handle. */
export function productHref(handleOrSlug: string): string {
  return `/products/${toNeutralSlug(handleOrSlug)}`
}

/**
 * Strips a leading mention of the product name from a description/blurb.
 *
 * Shopify product descriptions are typically written as full sentences that
 * open with the product's own name (e.g. "BPC-157 5mg is a synthetically
 * produced peptide…"). That reads fine as body copy, but when the same text
 * is reused as a one-liner or card blurb sitting directly under an <h1>/<h3>
 * that already shows the name, it looks like the name is just being
 * repeated back. This trims that leading repeat (name, optionally followed
 * by a dash/colon/"is"/"are") so the blurb starts with new information.
 *
 * Only strips a match anchored at the very start of the text — never
 * touches the name if it shows up mid-sentence.
 */
export function stripLeadingName(
  text: string | undefined | null,
  name: string | undefined | null
): string {
  if (!text) return ''
  let trimmed = text.trim()
  if (!name) return trimmed

  const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escaped) return trimmed

  // Some Shopify descriptions have the name (+ strength) pasted twice in a
  // row at the very start with no separator — e.g. "Acetic Acid
  // 0.6%Acetic Acid 0.6% is a dilute…" — a content-entry issue upstream,
  // not a formatting one. Collapse an immediate back-to-back repeat down
  // to a single occurrence before doing anything else, so the connector
  // check below still finds "is"/"are"/a dash right after the name.
  const dupeRe = new RegExp(
    `^\\s*(${escaped}\\s*(?:[\\w.%]{1,12})?)\\s*\\1`,
    'i'
  )
  trimmed = trimmed.replace(dupeRe, '$1')

  // After the name, Shopify copy often inserts the variant/strength before
  // getting to a verb — "Acetic Acid 0.6% is a dilute…", "BPC-157 5mg is a
  // synthetically…" — so allow one short word-ish token (letters/digits/%/.)
  // in between. The connector itself ("is"/"are"/a dash/colon) is required:
  // without one, we can't tell where the name reference actually ends, so
  // we leave the text untouched rather than risk cutting into real content.
  const re = new RegExp(
    `^\\s*${escaped}\\s*(?:[\\w.%]{1,12}\\s*)?(?:[-–—:]\\s*|\\b(?:is|are)\\b\\s*)`,
    'i'
  )
  const stripped = trimmed.replace(re, '')

  if (stripped !== trimmed && stripped.length > 0) {
    // Re-capitalise whatever now leads the sentence.
    return stripped.charAt(0).toUpperCase() + stripped.slice(1)
  }
  return trimmed
}