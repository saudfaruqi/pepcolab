// src/lib/productClasses.ts
//
// PRODUCT CLASSES (Oct 2026) — the catalogue's only category taxonomy.
//
// WHY THIS REPLACED THE SHOPIFY TAGS
// The catalogue used to be grouped by the body outcome a buyer might want:
// Metabolic, Hormonal, Cognitive, Recovery, Anti-Ageing, Immune. Those are
// implied claims in the brand's own voice — the MHRA's presentational test,
// the Abu Dhabi DoH marketing circular and Meta's ad review all read a
// "Recovery" aisle the same way: as a promise about what the product does to
// a person. The Meta-ads plan (12 Oct 2026, section 3) makes compound-class
// labels a precondition for running any ads at all.
//
// So products are now grouped by WHAT THEY ARE (structural / pharmacological
// class), which is also how a laboratory catalogue is organised.
//
// HOW A PRODUCT GETS ITS CLASS
// 1. CLASS_BY_HANDLE below, keyed by the Shopify handle without the market
//    suffix ("bpc-157-uae" → "bpc-157"). Every live product is listed.
// 2. A product added later and not yet listed falls back on its old Shopify
//    tag via LEGACY_TAG_TO_CLASS, so it still lands somewhere sensible.
//    Add new products to CLASS_BY_HANDLE when you list them.
//
// The old /products/category/<goal> URLs 301 to the new class URLs
// (next.config.js) and the old goal-led hub pages (/metabolic, /recovery,
// /cognitive, /longevity, /aesthetic) redirect to their nearest class.

export type ProductClassSlug =
  | 'gh-axis-peptides'
  | 'incretin-analogues'
  | 'neuropeptide-analogues'
  | 'mitochondrial-cofactors'
  | 'copper-cosmetic-peptides'
  | 'bioregulator-peptides'
  | 'research-blends'
  | 'lab-supplies'

export interface ProductClass {
  slug: ProductClassSlug
  label: string
  /** One line for menus and cards. Structural description only. */
  short: string
  seo: { title: string; description: string; h1: string; intro: string; examples: string }
  /** Accent colour for cards and chips (matches the old palette slots). */
  color: string
}

export const PRODUCT_CLASSES: ProductClass[] = [
  {
    slug: 'gh-axis-peptides',
    label: 'GH-Axis Peptides',
    short: 'GHRH analogues, secretagogues and GH fragments',
    color: '#8B5CF6',
    seo: {
      title: 'GHRH Analogues & Secretagogue Peptides — Research Grade | UAE',
      description:
        'GHRH analogues, growth-hormone secretagogues, IGF-1 LR3 and GH-fragment peptides for laboratory research. Identity and purity independently tested, certificate published per batch.',
      h1: 'GH-Axis Research Peptides',
      intro:
        'Synthetic GHRH analogues (Tesamorelin, CJC-1295 with Ipamorelin) and growth-hormone sequence fragments (FRAG 176-191), supplied lyophilised for in-vitro and analytical research. Every lot is tested by an independent laboratory for identity and HPLC purity before release.',
      examples: 'FRAG 176-191, Tesamorelin, CJC-1295, Ipamorelin, IGF-1 LR3, AOD-9604',
    },
  },
  {
    slug: 'incretin-analogues',
    label: 'Incretin & Amylin Analogues',
    short: 'Multi-receptor incretin and amylin analogues',
    color: '#3B82F6',
    seo: {
      title: 'Incretin & Amylin Analogue Peptides — Research Grade | UAE',
      description:
        'Incretin-receptor and amylin analogue peptides for laboratory research. Independently tested for identity and purity, with the certificate published for each batch.',
      h1: 'Incretin & Amylin Analogues',
      intro:
        'Long-acting peptide analogues of the incretin and amylin families, supplied for in-vitro and analytical research. Identity is confirmed by mass spectrometry and purity by HPLC on every lot.',
      examples: 'incretin-receptor analogues, Cagrilintide',
    },
  },
  {
    slug: 'neuropeptide-analogues',
    label: 'Neuropeptide Analogues',
    short: 'Synthetic analogues of endogenous neuropeptides',
    color: '#EC4899',
    seo: {
      title: 'Neuropeptide Analogues — Research Grade | UAE',
      description:
        'Synthetic neuropeptide and melanocortin analogues including Semax, Selank, VIP, PT-141 and Dihexa, for laboratory research. Third-party tested, certificate per batch.',
      h1: 'Neuropeptide Analogues',
      intro:
        'Synthetic analogues and fragments of endogenous neuropeptides — ACTH(4-10) and tuftsin analogues, VIP, melanocortin-receptor peptides and Dihexa — supplied lyophilised for in-vitro and analytical research with an independent certificate for every lot.',
      examples: 'Semax, Selank, DSIP, VIP, Kisspeptin-10, PT-141, Dihexa',
    },
  },
  {
    slug: 'mitochondrial-cofactors',
    label: 'Mitochondrial Peptides & Cofactors',
    short: 'Mitochondria-derived peptides, cofactors and small molecules',
    color: '#10B981',
    seo: {
      title: 'Mitochondrial Peptides & Cofactors — Research Grade | UAE',
      description:
        'Mitochondria-derived and mitochondria-targeted peptides, glutathione and small-molecule research compounds for laboratory use. Independently tested, certificate per batch.',
      h1: 'Mitochondrial Peptides & Cofactors',
      intro:
        'Mitochondria-derived peptides (MOTS-c), mitochondria-targeted tetrapeptides (SS-31), the cofactor glutathione and the small-molecule enzyme inhibitor 5-Amino-1MQ, supplied for in-vitro and analytical research.',
      examples: 'MOTS-c, SS-31, NAD+, Glutathione, 5-Amino-1MQ, SLU-PP-223',
    },
  },
  {
    slug: 'copper-cosmetic-peptides',
    label: 'Copper & Cosmetic Peptides',
    short: 'Copper-binding tripeptides and cosmetic peptide actives',
    color: '#F59E0B',
    seo: {
      title: 'GHK-Cu, AHK-Cu & Cosmetic Peptide Actives — Research Grade | UAE',
      description:
        'Copper-binding tripeptides (GHK-Cu, AHK-Cu) and cosmetic peptide actives (palmitoyl pentapeptide, acetyl octapeptide-3) for laboratory and formulation research. Certificate per batch.',
      h1: 'Copper & Cosmetic Peptides',
      intro:
        'Copper(II)-complexed tripeptides and the signal and neurotransmitter-modulating peptide actives used in cosmetic formulation research, each lot independently tested for identity and HPLC purity.',
      examples: 'GHK-Cu, AHK-Cu, Matrixyl (palmitoyl pentapeptide), SNAP-8',
    },
  },
  {
    slug: 'bioregulator-peptides',
    label: 'Bioregulator & Fragment Peptides',
    short: 'Short-chain bioregulators and protein-derived fragments',
    color: '#06B6D4',
    seo: {
      title: 'Bioregulator & Fragment Peptides — Research Grade | UAE',
      description:
        'Short-chain bioregulator peptides and protein-derived sequence fragments — Epithalon, Thymosin Alpha-1, KPV — for laboratory research. Third-party tested, certificate per batch.',
      h1: 'Bioregulator & Fragment Peptides',
      intro:
        'Short synthetic peptides derived from endogenous protein sequences — the tetrapeptide Epithalon, Thymosin Alpha-1 and the α-MSH fragment KPV — supplied lyophilised for in-vitro and analytical research.',
      examples: 'BPC-157, Epithalon, Thymosin Alpha-1, KPV',
    },
  },
  {
    slug: 'research-blends',
    label: 'Research Blends',
    short: 'Fixed-ratio multi-peptide preparations',
    color: '#EF4444',
    seo: {
      title: 'Multi-Peptide Research Blends — Research Grade | UAE',
      description:
        'Fixed-ratio multi-peptide research preparations (BPC-157 / TB-500 Blend, GLOW, KLOW), each component identified and quantified on the batch certificate.',
      h1: 'Multi-Peptide Research Blends',
      intro:
        'Pre-combined, fixed-ratio peptide preparations supplied lyophilised in a single vial for in-vitro studies of several sequences together. Each component is identified and its content reported on the certificate for that lot.',
      examples: 'BPC-157 / TB-500 Blend, GLOW, KLOW',
    },
  },
  {
    slug: 'lab-supplies',
    label: 'Lab Supplies',
    short: 'Bacteriostatic water and reconstitution solvents',
    color: '#6B7280',
    seo: {
      title: 'Bacteriostatic Water & Laboratory Solvents | UAE',
      description:
        'Bacteriostatic water, Bacteriostatic Water USP and 0.6% acetic acid for laboratory peptide reconstitution, batch-documented.',
      h1: 'Bacteriostatic Water & Solvents',
      intro:
        'Laboratory solvents used to reconstitute lyophilised peptides: bacteriostatic water (0.9% benzyl alcohol), Bacteriostatic Water USP, and dilute acetic acid for sequences with limited aqueous solubility.',
      examples: 'bacteriostatic water, acetic acid 0.6%',
    },
  },
]

/** Shopify handle (without the -uae / -uk market suffix) → class. */
export const CLASS_BY_HANDLE: Record<string, ProductClassSlug> = {
  'frag-176-191': 'gh-axis-peptides',
  tesamorelin: 'gh-axis-peptides',
  'cjc-ipa': 'gh-axis-peptides',
  'cjc-no-dac': 'gh-axis-peptides',
  ipamorelin: 'gh-axis-peptides',
  'igf-1-lr3': 'gh-axis-peptides',
  'aod-9604': 'gh-axis-peptides',

  retatrutide: 'incretin-analogues',
  'reta-cagri': 'incretin-analogues',
  cagrilintide: 'incretin-analogues',

  vip: 'neuropeptide-analogues',
  dihexa: 'neuropeptide-analogues',
  semax: 'neuropeptide-analogues',
  selank: 'neuropeptide-analogues',
  'pt-141': 'neuropeptide-analogues',
  dsip: 'neuropeptide-analogues',
  kisspeptin: 'neuropeptide-analogues',

  glutathione: 'mitochondrial-cofactors',
  '5-amino-1mq': 'mitochondrial-cofactors',
  'ss-31': 'mitochondrial-cofactors',
  'mots-c': 'mitochondrial-cofactors',
  nad: 'mitochondrial-cofactors',
  'slu-pp-223': 'mitochondrial-cofactors',

  'ghk-cu': 'copper-cosmetic-peptides',
  'ahk-cu': 'copper-cosmetic-peptides',
  matrixyl: 'copper-cosmetic-peptides',
  'snap-8': 'copper-cosmetic-peptides',

  kpv: 'bioregulator-peptides',
  epithalon: 'bioregulator-peptides',
  'thymosin-alpha': 'bioregulator-peptides',
  'bpc-157': 'bioregulator-peptides',

  'bpc-157-tb-500-blend': 'research-blends',
  'wolverine-stack': 'research-blends',
  glow: 'research-blends',
  klow: 'research-blends',

  'acetic-acid': 'lab-supplies',
  'bacteriostatic-water': 'lab-supplies',
  'pharma-grade-bac-water': 'lab-supplies',
}

/** Fallback for products not yet in CLASS_BY_HANDLE. */
export const LEGACY_TAG_TO_CLASS: Record<string, ProductClassSlug> = {
  metabolic: 'mitochondrial-cofactors',
  hormonal: 'gh-axis-peptides',
  cognitive: 'neuropeptide-analogues',
  recovery: 'bioregulator-peptides',
  'anti-ageing': 'copper-cosmetic-peptides',
  immune: 'bioregulator-peptides',
  accessories: 'lab-supplies',
}

/** Old category URL slug → new class slug (301s in next.config.js use the same map). */
export const LEGACY_CATEGORY_REDIRECTS: Record<string, ProductClassSlug> = {
  metabolic: 'mitochondrial-cofactors',
  hormonal: 'gh-axis-peptides',
  cognitive: 'neuropeptide-analogues',
  recovery: 'bioregulator-peptides',
  'anti-ageing': 'copper-cosmetic-peptides',
  immune: 'bioregulator-peptides',
  accessories: 'lab-supplies',
}

const CLASS_MAP = new Map(PRODUCT_CLASSES.map((c) => [c.slug, c]))

export function getProductClass(slug: string | undefined | null): ProductClass | undefined {
  return slug ? CLASS_MAP.get(slug as ProductClassSlug) : undefined
}

export function isProductClassSlug(slug: string | undefined | null): slug is ProductClassSlug {
  return Boolean(slug && CLASS_MAP.has(slug as ProductClassSlug))
}

function baseHandle(handle: string): string {
  return (handle || '').toLowerCase().replace(/-(uae|uk|ae|gb)$/, '')
}

/** The class for a product. Always returns a class. */
export function classOf(handle: string, tags: string[] = []): ProductClassSlug {
  const byHandle = CLASS_BY_HANDLE[baseHandle(handle)]
  if (byHandle) return byHandle
  for (const t of tags) {
    const mapped = LEGACY_TAG_TO_CLASS[t.toLowerCase()]
    if (mapped) return mapped
  }
  return 'research-blends'
}

/**
 * Products per class, computed from the LIVE catalogue (brief A5) — pass the
 * result of getProducts(). Never hard-coded: counts and example names must
 * only ever reflect products that still exist.
 */
export function classCounts(products: { categorySlug?: string }[]): Record<ProductClassSlug, number> {
  const counts = Object.fromEntries(PRODUCT_CLASSES.map((c) => [c.slug, 0])) as Record<ProductClassSlug, number>
  for (const p of products) {
    if (p.categorySlug && isProductClassSlug(p.categorySlug)) counts[p.categorySlug as ProductClassSlug]++
  }
  return counts
}
