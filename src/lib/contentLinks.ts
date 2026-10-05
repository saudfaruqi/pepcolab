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

// NEW LONG-FORM RESEARCH (Sep 2026). These four are cluster hubs rather than
// single-compound pages, so they are linked by topic from every product page
// rather than matched to one compound. The briefs that came with them specify
// the inbound links; this is the product-page half of that.
//
// NOTE: /research/glp1-receptor-agonists-compared is deliberately NOT here.
// It is held for regulatory review (see research-data.ts), and even once
// published it must not be linked from product pages — a page reporting human
// weight-loss outcomes at named doses should not sit one click from a
// purchase path in either direction.

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
  // Oct 2026 additions. Same principle as the two pairs above: the guide
  // carries the practical answer, the research note carries the underlying
  // chemistry, and each should point at the other rather than competing for
  // the same query.
  'how-long-do-peptides-last': { href: '/research/peptide-storage', label: 'Research: The Chemistry of Peptide Degradation' },
  'how-to-spot-fake-peptides': { href: '/research/peptide-quality-failures', label: 'Research: How Peptide Vials Fail QC' },
  'hplc-vs-mass-spectrometry': { href: '/research/peptide-quality-failures', label: 'Research: How Peptide Vials Fail QC' },
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

  // Oct 2026: bacteriostatic water and the pharma-grade presentation are
  // diluents, not compounds, and the generic compound links below are close to
  // useless on them. They get the three pages that answer what someone buying
  // a diluent is actually asking — placed before the generic set so they
  // survive the slice(0, 4).
  if (/bacteriostatic|bac\s*water/i.test(title)) {
    links.push({ href: '/guides/bacteriostatic-water-shelf-life', label: 'Shelf life, storage & reuse' })
    links.push({ href: '/guides/bacteriostatic-water-vs-sterile-water', label: 'Bacteriostatic vs sterile water' })
    links.push({ href: '/guides/how-much-bacteriostatic-water-to-add', label: 'How much to add' })
  }

  // Quality verification leads, because it is the page that makes PepcoLab's
  // own batch documentation legible — and it is where the briefs specify an
  // inbound link from every product page's quality section.
  links.push({ href: '/research/peptide-quality-failures', label: 'How peptide vials fail QC' })
  links.push({ href: '/guides/coa-interpretation', label: 'How to read this COA' })
  // Oct 2026: replaces the second reconstitution link with the verification
  // checklist. Every product page already links the reconstitution guide via
  // the storage/handling block, and "how do I know this is real" is the
  // question a first-time buyer on a product page is actually holding — it is
  // the most searched question in this category and the only one where our
  // public lot verification is the answer.
  links.push({ href: '/guides/how-to-spot-fake-peptides', label: 'How to verify this is genuine' })
  links.push({ href: '/guides/how-long-do-peptides-last', label: 'How long it lasts' })
  links.push({ href: '/guides/peptide-reconstitution', label: 'Reconstitution guide' })
  links.push({ href: '/guides/storage-conditions', label: 'Storage guide' })

  return links.slice(0, 4)
}

/**
 * Given a guide's category, return the product category page(s) it should
 * link to.
 *
 * Documentation, Legality & Compliance and Buying Guide are deliberately
 * empty and should stay that way: a page about regulatory status or about how
 * to audit a supplier loses its credibility the moment it ends in a row of
 * buy buttons, and that credibility is the whole reason those pages can rank
 * on queries where every competing result is transparently commercial.
 * Guide-specific links on those pages are written into the body copy instead,
 * where they are contextual — see GUIDE_SPECIFIC_PRODUCTS below for the one
 * exception.
 */
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

/**
 * Per-guide product links, overriding the category mapping above where a
 * guide is about a specific thing we sell rather than about a category.
 *
 * Verified against the live sitemap — both handles resolve. The two
 * bacteriostatic-water guides are the only genuine cases: the reader of
 * "how long does an opened vial last" is holding the product the page is
 * about, which is a different situation from the reader of a storage guide.
 */
const GUIDE_SPECIFIC_PRODUCTS: Record<string, ContentLink[]> = {
  'bacteriostatic-water-shelf-life': [
    { href: '/products/bacteriostatic-water', label: 'Bacteriostatic Water' },
    { href: '/products/pharma-grade-bac-water', label: 'Pharma-Grade Bacteriostatic Water' },
  ],
  'bacteriostatic-water-vs-sterile-water': [
    { href: '/products/bacteriostatic-water', label: 'Bacteriostatic Water' },
    { href: '/products/pharma-grade-bac-water', label: 'Pharma-Grade Bacteriostatic Water' },
  ],
}

/**
 * The product links to show on a specific guide. Falls back to the category
 * mapping when the guide has no specific products of its own.
 */
export function productsForGuide(guideId: string, category: string): ContentLink[] {
  return GUIDE_SPECIFIC_PRODUCTS[guideId] ?? relatedProductsForGuideCategory(category)
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