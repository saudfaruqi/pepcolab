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
]

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
  }
  return (map[articleId] ?? []).map((p) => ({ href: `/products/${p.slug}`, label: p.label }))
}
