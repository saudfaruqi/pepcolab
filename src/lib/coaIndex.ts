// src/lib/coaIndex.ts
//
// Interim COA resolver — until every product has its own real
// "pepcolab.coa_url" metafield in Shopify (see shopify.ts normaliseProduct
// → coaUrl), this maps a product's compound + strength to its published
// Certificate of Analysis. A real per-product coaUrl from Shopify always
// takes priority over this — see callers (e.g. app/certificates/page.tsx).
//
// Previously this pointed into a single combined lab PDF (TranmooCoa.pdf)
// via page-number fragments, for a different, unrelated set of products
// (BPC-157, Thymosin, GHK-Cu, NAD+, Semax, MOTS-C...). That file/product
// list doesn't correspond to what's actually sold or tested now, so this
// resolves against the real batch data in app/coaData.ts instead — each
// batch has its own standalone PDF in /public/pdf, no page fragments
// needed. If a Shopify product's title/strength doesn't match any test
// below, it just falls through to "COA pending upload" in the UI (see
// page.tsx) rather than showing a copy-pasted certificate for the wrong
// product — do not add a catch-all fallback match here.

import { COA_BATCHES } from '@/app/coaData'

export interface ResolvedCoa {
  url: string
  label: string
  lot: string
  purity: number
  testDate: string
}

function has(haystack: string, ...words: string[]): boolean {
  return words.every((w) => haystack.includes(w))
}

// Pulls the first number out of a strength string ("10mg", "40 mg") and
// compares it. Adjust if your Shopify variant titles format strength
// differently (e.g. "1000mg" NAD+-style products should still parse fine).
function mgIs(mg: string, n: number): boolean {
  const m = (mg || '').match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) === n : false
}

interface CoaMatcher {
  accession: string
  test: (name: string, mg: string) => boolean
}

// One matcher per batch in app/coaData.ts. Keep this list in sync if you
// add/remove batches there.
//
// mg is only reliably available when resolveLocalCoa is called with a
// selected variant (e.g. a product detail page with a strength picker).
// The /certificates listing page calls this once per *product*, with no
// variant selected, so mg is often empty there. For a product that only
// has ONE published batch, requiring an mg match is pure false-negative
// risk — match on name alone. For a product with MULTIPLE published
// strengths (GLP: 20mg + 30mg), keep the mg gate: without a
// selected variant there's no way to know which batch is right, and
// showing the wrong one's certificate is worse than "pending upload".
// If you publish a second strength for any of the name-only matchers
// below, add the mg check back in and split it into two entries.
const MATCHERS: CoaMatcher[] = [
  { accession: '2606090460',
    test: (n) => has(n, 'tesamorelin') }, // only 5mg published
  { accession: '2606090459',
    test: (n) => has(n, 'igf') },
  { accession: '2606090458',
    test: (n) => has(n, 'mt2') || has(n, 'melanotan') }, // only 10mg published
  { accession: '2605180344',
    test: (n) => has(n, 'glow') },
  { accession: '2605180343',
    test: (n) => has(n, 'tirzepatide') }, // only 40mg published
  { accession: '2605180342',
    test: (n) => has(n, 'sermorelin') }, // only 10mg published
  { accession: '2605180341',
    test: (n) => has(n, 'ss-31') || has(n, 'ss31') }, // only 50mg published
  { accession: '2605110026',
    test: (n, mg) => has(n, 'glp') && mgIs(mg, 30) }, // ambiguous without mg — 30mg batch
  { accession: '2605110025',
    test: (n, mg) => has(n, 'glp') && mgIs(mg, 20) }, // ambiguous without mg — 20mg batch
]

// `name` should be the product's title (e.g. "GLP") and `mg` its
// strength/variant title (e.g. "30mg") — pass selectedVariant.title where
// a strength picker exists so switching strength re-resolves the batch.
//
// Returns the batch's lot/purity/test-date alongside the PDF link so
// callers (e.g. the /certificates card, which previously only ever read
// product.lot/purity/testDate straight from Shopify metafields and showed
// "N/A" whenever those weren't set) can fall back to the real published
// result instead of a blank field, exactly the way coaUrl already falls
// back to this resolver when the Shopify metafield is empty.
export function resolveLocalCoa(name?: string, mg?: string): ResolvedCoa | undefined {
  const n = (name ?? '').toLowerCase()
  const m = mg ?? ''
  const matcher = MATCHERS.find((e) => e.test(n, m))
  if (!matcher) return undefined
  const batch = COA_BATCHES.find((b) => b.accession === matcher.accession)
  if (!batch) return undefined
  return {
    url: batch.pdfUrl,
    label: `${batch.product} · ${batch.lot}`,
    lot: batch.lot,
    purity: batch.purity,
    testDate: batch.reported,
  }
}