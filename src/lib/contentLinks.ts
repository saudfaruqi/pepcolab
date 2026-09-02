// src/lib/contentLinks.ts
//
// SEO FIX (Aug 2026 audit): "15 quality articles published but orphaned —
// none in sitemap, zero internal links either way." app/sitemap.ts fixes the
// first half (getting them indexed at all). This file fixes the second half:
// a real, server-rendered link graph between product pages and the
// guides/research hub, in both directions — product -> content in
// app/products/[slug]/page.tsx, content -> product in
// app/guides/[slug]/page.tsx and app/research/[slug]/page.tsx.
//
// Intentionally simple keyword/category matching rather than a CMS-grade
// tagging system — good enough to stop pages being orphaned, cheap to
// extend as the catalogue and content hub both grow.

export type ContentLink = { href: string; label: string }

/** Research articles keyed by the product-name substring that identifies them. */
const RESEARCH_BY_PRODUCT_KEYWORD: { match: RegExp; id: string; title: string }[] = [
  { match: /bpc-?157/i, id: 'bpc-157', title: 'BPC-157' },
  { match: /\bglp\b|retatrutide|glp-?1/i, id: 'glp1', title: 'GLP-1' },
  { match: /epithalon/i, id: 'epithalon', title: 'Epithalon' },
  { match: /\bsemax\b/i, id: 'semax', title: 'Semax' },
  { match: /tesamorelin/i, id: 'tesamorelin', title: 'Tesamorelin' },
  { match: /igf-?1?-?lr3/i, id: 'igf-1-lr3', title: 'IGF-1 LR3' },
  { match: /ghk-?cu/i, id: 'ghk-cu', title: 'GHK-Cu' },
  { match: /tb-?500/i, id: 'tb-500', title: 'TB-500' },
  { match: /sermorelin/i, id: 'sermorelin', title: 'Sermorelin' },
  { match: /ss-?31|elamipretide/i, id: 'ss-31', title: 'SS-31' },
]

// Cross-hub links between the two duplicate-topic pairs — /research covers
// the underlying chemistry, /guides covers the step-by-step procedure. See
// research-data.ts 'peptide-storage'/'reconstitution-guide' comments for
// the differentiation rationale (Sep 2026 duplicate-content fix).
const RESEARCH_TO_GUIDE: Record<string, ContentLink> = {
  'peptide-storage': { href: '/guides/storage-conditions', label: 'Guide: Storage Conditions (step-by-step)' },
  'reconstitution-guide': { href: '/guides/peptide-reconstitution', label: 'Guide: Reconstitution (step-by-step)' },
}

const GUIDE_TO_RESEARCH: Record<string, ContentLink> = {
  'storage-conditions': { href: '/research/peptide-storage', label: 'Research: The Chemistry of Peptide Degradation' },
  'peptide-reconstitution': { href: '/research/reconstitution-guide', label: 'Research: Solvent Selection Chemistry' },
}

/** For the two duplicate-topic pairs, the matching page in the other content hub. */
export function crossHubLinkForResearchArticle(articleId: string): ContentLink | null {
  return RESEARCH_TO_GUIDE[articleId] ?? null
}

export function crossHubLinkForGuide(guideId: string): ContentLink | null {
  return GUIDE_TO_RESEARCH[guideId] ?? null
}

/** Product research-category tag -> the categories page it maps to (see app/data.ts CATEGORIES). */
const CATEGORY_LABEL: Record<string, string> = {
  metabolic: 'Metabolic',
  hormonal: 'Hormonal',
  cognitive: 'Cognitive',
  recovery: 'Recovery',
  'anti-ageing': 'Anti-Ageing',
  accessories: 'Accessories',
  immune: 'Immune',
}

/** Given a product's title + research-category tag, return content links for its page. */
export function relatedContentForProduct(title: string, categorySlug?: string): ContentLink[] {
  const links: ContentLink[] = []

  const researchMatch = RESEARCH_BY_PRODUCT_KEYWORD.find((r) => r.match.test(title))
  if (researchMatch) {
    links.push({ href: `/research/${researchMatch.id}`, label: `Research: ${researchMatch.title}` })
  }

  links.push({ href: '/guides/coa-interpretation', label: 'How to read this COA' })
  links.push({ href: '/guides/peptide-reconstitution', label: 'Reconstitution guide' })
  links.push({ href: '/guides/storage-conditions', label: 'Storage guide' })

  return links.slice(0, 4)
}

/** Given a guide's category, return the product category page(s) it should link to. */
export function relatedProductsForGuideCategory(category: string): ContentLink[] {
  const map: Record<string, string[]> = {
    'Lab Basics': ['metabolic', 'recovery'],
    Storage: ['metabolic', 'recovery', 'cognitive'],
    Calculations: ['metabolic', 'hormonal'],
    Pharmacology: ['recovery', 'anti-ageing'],
    Documentation: [],
    'Legality & Compliance': [],
    'Buying Guide': [],
  }
  const slugs = map[category] ?? []
  return slugs
    .filter((s) => CATEGORY_LABEL[s])
    .map((s) => ({ href: `/products/category/${s}`, label: `Shop ${CATEGORY_LABEL[s]} compounds` }))
}

/** Given a research article's id, return the specific product(s) it discusses. */
export function relatedProductsForResearchArticle(articleId: string): ContentLink[] {
  const map: Record<string, { slug: string; label: string }[]> = {
    'bpc-157': [{ slug: 'bpc-157', label: 'Shop BPC-157' }],
    glp1: [{ slug: 'retatrutide', label: 'Shop GLP' }],
    epithalon: [{ slug: 'epithalon', label: 'Shop Epithalon' }],
    semax: [{ slug: 'semax', label: 'Shop Semax' }],
    // Best-guess handles following the "{name}-uae" pattern noted in
    // app/data.ts — coaData.ts confirms these four compounds are in the
    // live catalogue, but exact handle spelling (hyphenation of "IGF-1
    // LR3" in particular) isn't verified from here. Confirm in Shopify
    // admin before relying on these.
    tesamorelin: [{ slug: 'tesamorelin', label: 'Shop Tesamorelin' }],
    'igf-1-lr3': [{ slug: 'igf1-lr3', label: 'Shop IGF-1 LR3' }],
    sermorelin: [{ slug: 'sermorelin', label: 'Shop Sermorelin' }],
    'ss-31': [{ slug: 'ss-31', label: 'Shop SS-31' }],
    // GHK-Cu and TB-500 intentionally have no shop link: app/data.ts's
    // BUNDLES comment confirms neither is a real catalogue handle as a
    // standalone product (the catalogue has "AHK-Cu" instead of GHK-Cu,
    // and TB-500 only appears inside the GLOW blend in coaData.ts) — a
    // guessed slug here would 404 rather than sell.
  }
  return (map[articleId] ?? []).map((p) => ({ href: `/products/${p.slug}`, label: p.label }))
}