// data.ts
export interface Product {
  id: string
  slug: string
  name: string
  shortName: string
  category: string
  categorySlug: string
  mg: string
  description: string
  descriptionHtml?: string
  longDesc?: string
  updatedAt?: string
  purity?: number
  lot?: string
  // Link to the published Certificate of Analysis PDF for this product's
  // batch, sourced from Shopify's "pepcolab.coa_url" metafield. Optional —
  // falls back to the searchable /certificates library when not set.
  coaUrl?: string
  price: number
  oldPrice?: number
  testDate: string
  sequence?: string
  badge?: 'popular' | 'new' | 'sale' | 'bestseller'
  image?: string
  imageAlt?: string
  images?: { url: string; alt: string }[]
  color: {
    bg: string
    accent: string
    pill: string
    pillText: string
    purityBar: string
    btn: string
    vialFrom: string
    vialTo: string
  }
  inStock: boolean
  stockCount?: number   // ← was required, now optional
  variantId?: string
  variants?: {
    id: string
    title: string
    price: number
    compareAtPrice?: number
    currencyCode?: string
    availableForSale: boolean
    // Per-variant photo (Pen / Nasal Spray / Vial etc.) — see shopify.ts.
    // Optional because not every variant has its own image in Shopify;
    // consumers should fall back to the product's main `image` when absent.
    image?: { url: string; alt: string }
  }[]
}

export interface Category {
  slug: string
  label: string
  count: number
}

// Kept in sync with CategoriesSection.tsx and ProductsSection.tsx's
// KNOWN_CATEGORIES — all three previously disagreed with each other and
// with the real Shopify tags. This list, and the counts, now match the
// live product export (Aug 2026): metabolic(9), hormonal(7), cognitive(6),
// recovery(6), anti-ageing(5), accessories(3), immune(2) = 38 products.
// "skin" was removed — it was never a real product tag.
export const CATEGORIES: Category[] = [
  { slug: 'all',         label: 'All',          count: 38 },
  { slug: 'metabolic',   label: 'Metabolic',    count: 9  },
  { slug: 'hormonal',    label: 'Hormonal',     count: 7  },
  { slug: 'cognitive',   label: 'Cognitive',    count: 6  },
  { slug: 'recovery',    label: 'Recovery',     count: 6  },
  { slug: 'anti-ageing', label: 'Anti-Ageing',  count: 5  },
  { slug: 'accessories', label: 'Accessories',  count: 3  },
  { slug: 'immune',      label: 'Immune',       count: 2  },
]

// NOTE on slugs: Shopify product handles follow the pattern "{name}-uae"
// at the PRODUCT level (mg/strength is a variant option, not part of the
// handle) — e.g. "bpc-157-uae", "epithalon-uae". Slugs below were updated
// to match your actual 78-SKU catalogue.
//
// TWO PRODUCTS IN THE ORIGINAL BUNDLES DON'T EXIST IN YOUR CATALOGUE:
//   - "TB-500" (used in Recovery Stack)
//   - "GLP-1 Tera" (used in Metabolic Focus)
// These aren't in your price list, so I can't map them to a real handle —
// I've left them as TODOs below with a real in-catalogue product as a
// placeholder suggestion. Swap in whatever you actually want to bundle.
export const BUNDLES = [
  {
    id: 'b1', name: 'Recovery Stack',
    // FIX: was "TB-500" — TB-500 is the common market name for Thymosin
    // Beta-4 fragment, and the Freedom Diagnostics COA confirms you have a
    // real tested Thymosin Beta-4 batch (BT10, 99.26% purity, Red Cap lot).
    // Swap in the real Shopify handle once confirmed — using a placeholder
    // slug below.
    desc: 'BPC-157 10mg + Thymosin Beta-4 10mg',
    products: ['bpc-157-uae', 'thymosin-beta-4-uae'], // TODO: confirm real handle
    price: 89.99, save: 7.99,
    accent: '#0D7A45',
    bg: '#EDFAF3',
  },
  {
    id: 'b2', name: 'Longevity Protocol',
    desc: 'Epithalon 20mg + GHK-Cu 100mg',
    products: ['epithalon-uae', 'ghk-cu-uae'],
    price: 99.99, save: 4.99,
    accent: '#7C3AED',
    bg: '#F4F1FE',
  },
  {
    id: 'b3', name: 'Cognitive Edge',
    desc: 'Semax 10mg + Selank 10mg',
    products: ['semax-uae', 'selank-uae'],
    price: 104.99, save: 8.99,
    accent: '#BE185D',
    bg: '#FDF0F8',
  },
]

// PLACEHOLDER CONTENT — not real customer reviews. "Verified ·" badges on
// invented quotes are exactly what the UK's DMCC Act 2024 fake-reviews
// provisions target, and a fabricated "Dr." credential plus an invented
// quantitative lab-match claim raise that further into fabricated-expert-
// endorsement territory. "GLP-1 Tera" also isn't in your catalogue (see
// BUNDLES note above), so that line cited a product that doesn't exist.
// Replace this whole array with real, consented reviews as soon as you
// have them — until then, keep the "Verified" framing and invented
// credentials off.
export const REVIEWS = [
  {
    id: 'r1',
    text: 'The COA transparency is genuinely unlike any other supplier I\'ve used. Independent verification, downloadable HPLC traces — exactly what serious research requires.',
    author: 'D. Roswell', role: 'Independent Researcher',
    sub: 'BPC-157 5mg', initials: 'DR',
    rating: 5,
  },
  {
    id: 'r2',
    text: 'Ordered Friday afternoon, arrived Saturday morning, cold-chain packaging intact.',
    author: 'M. Kapur', role: 'Biochemistry Dept.',
    sub: 'Epithalon 10mg', initials: 'MK',
    rating: 5,
  },
  {
    id: 'r3',
    text: 'Finally a supplier that publishes their actual lab work. The batch verifier is a game-changer for research documentation.',
    author: 'S. Lowe', role: 'Pharmacology Research',
    sub: 'Epithalon 5mg', initials: 'SL',
    rating: 5,
  },
  {
    id: 'r4',
    text: 'The reconstitution calculator alone saves me time per session. Product quality has been consistently good across several orders.',
    author: 'T. Griffiths', role: 'Laboratory Technician',
    sub: 'GHK-Cu 100mg', initials: 'TG',
    rating: 5,
  },
]