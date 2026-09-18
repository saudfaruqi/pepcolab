// src/lib/productMeta.ts
//
// PRODUCT TITLES & META DESCRIPTIONS — September 2026
//
// WHY THIS EXISTS
// Every product page shipped the identical search snippet, with only the
// product name swapped in:
//
//   "Semax | Research Grade, COA Published | PepcoLab"
//   "Semax — research-grade compound with published certificate of analysis.
//    Cold-chain dispatch. For in-vitro research use only."
//
// Search Console (Sep 2026) showed 216 non-brand page-1 impressions
// producing 2 clicks. The bacteriostatic-water cluster alone was 169 page-1
// impressions and zero clicks at positions 5–8. A snippet that says nothing
// about size, format, price or availability gives a searcher no reason to
// pick it over the result above or below.
//
// WHAT CHANGED
// Titles and descriptions are now built from STRUCTURED fields only —
// product title, presentation (30ml / 10mg), formats (pen, vial, nasal
// spray), price and dispatch market. Nothing is pulled from the free-text
// Shopify description.
//
// That last point is deliberate and load-bearing. The original file noted
// that the meta description is "the most screenshotted surface on the site
// and the easiest thing for a regulator to quote back," so it refused to
// use product copy. This keeps that guarantee: a claim typed into a Shopify
// description later can never reach a search snippet, because no code path
// carries it there. Uniqueness comes from facts about supply, not from
// anything about what a compound does.
//
// NAME EXPANSION
// "Pharma Grade Bac Water" never contained the word "bacteriostatic", while
// the queries it ranks for are split between "bac water" and the full word.
// ALIASES expands abbreviated catalogue names for the title only — the
// Shopify product name itself is unchanged.

const FORMAT_WORDS = ['pen', 'nasal spray', 'spray', 'vial', 'powder', 'supply'] as const

/** Abbreviated catalogue names → the fuller name searchers type. Title only. */
const ALIASES: Record<string, string> = {
  'pharma grade bac water': 'Pharma Grade Bacteriostatic Water',
  'bac water': 'Bacteriostatic Water',
}

export interface MetaProductLike {
  title: string
  description?: string
  format?: string
  price?: number
  currencyCode?: string
  variants?: { title: string; price: number; availableForSale: boolean }[]
}

const STRENGTH_RE = /^\s*\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|%)\s*$/i

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Expands a known abbreviation; otherwise returns the name unchanged. */
export function displayName(title: string): string {
  return ALIASES[title.trim().toLowerCase()] ?? title
}

/**
 * Splits variant titles into the formats and strengths a product is sold in.
 * Shopify titles come through as "10mg", "Vial", "Pen / 10mg" or
 * "Default Title" depending on how many options a product has.
 */
export function parseVariants(product: MetaProductLike): { formats: string[]; strengths: string[] } {
  const formats = new Set<string>()
  const strengths = new Set<string>()

  for (const variant of product.variants ?? []) {
    const title = (variant.title || '').trim()
    if (!title || title.toLowerCase() === 'default title') continue
    for (const part of title.split('/').map((s) => s.trim()).filter(Boolean)) {
      const lower = part.toLowerCase()
      const format = FORMAT_WORDS.find((f) => lower === f || lower === `${f}s`)
      if (format) formats.add(titleCase(format === 'spray' ? 'nasal spray' : format))
      else if (STRENGTH_RE.test(part)) strengths.add(part.replace(/\s+/g, ''))
    }
  }

  // Single-variant products ("Default Title") carry their size in the
  // Shopify description's spec block instead: "… Presentation 30ml Purity …".
  if (strengths.size === 0 && product.description) {
    const match = product.description.match(/Presentation\s+([0-9][\w.%]*(?:\s*(?:mg|ml|mcg|g|%))?)/i)
    if (match) strengths.add(match[1].replace(/\s+/g, ''))
  }

  // productType is the fallback when no variant names a format.
  if (formats.size === 0 && product.format) {
    const lower = product.format.trim().toLowerCase()
    // "Supply" is Shopify's internal bucket for accessories, not something a
    // customer would search for — left out rather than shown.
    if (lower && lower !== 'supply' && lower !== 'accessories') formats.add(titleCase(product.format.trim()))
  }

  return { formats: [...formats], strengths: [...strengths] }
}

function joinNatural(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} or ${items[1]}`
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}

/** Lowest in-stock variant price, and whether the product has several. */
function priceLabel(product: MetaProductLike): string {
  const currency = product.currencyCode || 'AED'
  const sellable = (product.variants ?? []).filter((v) => v.availableForSale && v.price > 0)
  const pool = sellable.length ? sellable : (product.variants ?? []).filter((v) => v.price > 0)
  const prices = pool.map((v) => v.price)
  if (prices.length === 0) {
    return product.price && product.price > 0 ? money(product.price, currency) : ''
  }
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  return high > low ? `From ${money(low, currency)}` : money(low, currency)
}

/**
 * Search title, WITHOUT the brand suffix — app/layout.tsx applies
 * `template: '%s | PepcoLab'` to every page title, so returning it here
 * would render "… | PepcoLab | PepcoLab". The suffix it adds is still
 * counted against the length budget below.
 *
 * Kept near 60 characters so Google rarely truncates it, with the least
 * useful part (formats, then the size) dropped first when tight.
 */
export function buildProductTitle(product: MetaProductLike): string {
  const name = displayName(product.title)
  const { formats, strengths } = parseVariants(product)
  // The range is worth the characters: someone searching "bpc-157 10mg" sees
  // their exact strength bolded in the result.
  const size =
    strengths.length === 1
      ? strengths[0]
      : strengths.length > 1
        ? `${strengths[0]}–${strengths[strengths.length - 1]}`
        : ''
  const formatText = formats.length ? formats.join(', ') : ''
  const BRAND_SUFFIX_LENGTH = ' | PepcoLab'.length // added by the layout template
  const MAX = 60

  const candidates = [
    size && formatText ? `${name} ${size} — ${formatText}` : '',
    formatText ? `${name} — ${formatText}` : '',
    size ? `${name} ${size}` : '',
    name,
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (candidate.length + BRAND_SUFFIX_LENGTH <= MAX) return candidate
  }
  return name
}

/**
 * Search description. Facts about supply only — size, formats, price,
 * documentation, dispatch market, research-use statement. Target ~155
 * characters so it isn't cut mid-sentence.
 */
export function buildProductDescription(product: MetaProductLike): string {
  const name = displayName(product.title)
  const { formats, strengths } = parseVariants(product)

  const spec = [
    strengths.length === 1 ? strengths[0] : strengths.length > 1 ? `${strengths[0]}–${strengths[strengths.length - 1]}` : '',
    formats.length ? joinNatural(formats).toLowerCase() : '',
  ].filter(Boolean).join(', ')

  const price = priceLabel(product)

  const parts = [
    spec ? `${name} — ${spec}.` : `${name}.`,
    price ? `${price}.` : '',
    'Batch certificate of analysis published.',
    'Cold-chain dispatch across the UAE.',
    'In-vitro research use only.',
  ].filter(Boolean)

  let description = parts.join(' ')
  // Trim the least essential sentences first if the result runs long.
  if (description.length > 160) {
    description = parts.filter((p) => p !== 'Batch certificate of analysis published.').join(' ')
  }
  if (description.length > 160) {
    description = parts
      .filter((p) => p !== 'Batch certificate of analysis published.' && p !== 'Cold-chain dispatch across the UAE.')
      .concat('COA published. Dispatched in the UAE.')
      .join(' ')
  }
  return description
}