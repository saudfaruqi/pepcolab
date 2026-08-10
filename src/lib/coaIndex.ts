// src/lib/coaIndex.ts
//
// Interim COA resolver — until every product has its own real
// "pepcolab.coa_url" metafield in Shopify (see shopify.ts normaliseProduct
// → coaUrl), this maps a product's compound + strength to the matching
// page inside the single combined lab PDF dropped in /public
// (TranmooCoa.pdf, 20 batch reports in one file). A real per-product
// coaUrl from Shopify always takes priority over this — see callers.
//
// If the PDF's filename/location changes, this is the only line to edit.
const COA_FILE = '/TranmooCoa.pdf'

interface CoaPageEntry {
  label: string
  page: number
  test: (name: string, mg: string) => boolean
}

function has(haystack: string, ...words: string[]): boolean {
  return words.every((w) => haystack.includes(w))
}

// Pulls the first number out of a strength string ("10mg", "1000 mg",
// "1g" isn't handled specially — NAD+ 1000mg entries in the PDF use
// "1000", so products should be titled the same way) and compares it.
function mgIs(mg: string, n: number): boolean {
  const m = (mg || '').match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) === n : false
}

// Order matches the PDF's page order exactly (1-indexed). The blend entry
// (page 1) is checked implicitly by requiring/excluding "thymosin"/"tb-500"
// alongside "bpc" in the two entries right after it, so a plain BPC-157
// product never matches the blend page and vice versa.
const COA_INDEX: CoaPageEntry[] = [
  { label: 'BPC-157 / Thymosin Alpha-1 Blend 10mg', page: 1,
    test: (n) => has(n, 'bpc') && (has(n, 'thymosin') || has(n, 'tb-500') || has(n, 'tb500')) },
  { label: 'BPC-157 10mg', page: 2,
    test: (n, mg) => has(n, 'bpc') && !has(n, 'thymosin') && !has(n, 'tb-500') && !has(n, 'tb500') && mgIs(mg, 10) },
  { label: 'Thymosin Alpha-1 10mg', page: 3,
    test: (n, mg) => (has(n, 'thymosin') || has(n, 'tb-500') || has(n, 'tb500')) && !has(n, 'bpc') && mgIs(mg, 10) },
  { label: 'GHK-Cu 100mg', page: 4,
    test: (n, mg) => has(n, 'ghk') && mgIs(mg, 100) },
  { label: 'NAD+ 1000mg', page: 5,
    test: (n, mg) => has(n, 'nad') && mgIs(mg, 1000) },
  { label: 'Semax 10mg', page: 6,
    test: (n, mg) => has(n, 'semax') && mgIs(mg, 10) },
  { label: 'MOTS-C 10mg', page: 7,
    test: (n, mg) => has(n, 'mots') && mgIs(mg, 10) },
  { label: 'MOTS-C 20mg', page: 8,
    test: (n, mg) => has(n, 'mots') && mgIs(mg, 20) },
  { label: 'MOTS-C 40mg', page: 9,
    test: (n, mg) => has(n, 'mots') && mgIs(mg, 40) },
  { label: 'Retatrutide 10mg', page: 10,
    test: (n, mg) => has(n, 'retatrutide') && mgIs(mg, 10) },
  { label: 'Retatrutide 20mg', page: 11,
    test: (n, mg) => has(n, 'retatrutide') && mgIs(mg, 20) },
  { label: 'Retatrutide 30mg', page: 12,
    test: (n, mg) => has(n, 'retatrutide') && mgIs(mg, 30) },
  { label: 'Retatrutide 40mg', page: 13,
    test: (n, mg) => has(n, 'retatrutide') && mgIs(mg, 40) },
  { label: 'Retatrutide 60mg', page: 14,
    test: (n, mg) => has(n, 'retatrutide') && mgIs(mg, 60) },
  { label: 'Tesamorelin 10mg', page: 15,
    test: (n, mg) => has(n, 'tesamorelin') && mgIs(mg, 10) },
  { label: 'Tesamorelin 20mg', page: 16,
    test: (n, mg) => has(n, 'tesamorelin') && mgIs(mg, 20) },
]

export interface ResolvedCoa {
  url: string
  label: string
}

// `name` should be the product's title (e.g. "Retatrutide") and `mg` its
// strength/variant title (e.g. "30mg") — pass selectedVariant.title where
// a strength picker exists so switching strength re-resolves the page.
export function resolveLocalCoa(name?: string, mg?: string): ResolvedCoa | undefined {
  const n = (name ?? '').toLowerCase()
  const m = mg ?? ''
  const entry = COA_INDEX.find((e) => e.test(n, m))
  return entry ? { url: `${COA_FILE}#page=${entry.page}`, label: entry.label } : undefined
}