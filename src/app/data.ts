import { PRODUCT_CLASSES, CLASS_BY_HANDLE } from '@/lib/productClasses'
import { isRetiredHandle } from '@/lib/retired-paths'
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

// Compound classes (Oct 2026) — replaces the health-goal categories
// (Metabolic, Recovery, Cognitive…). Labels, counts and copy all come from
// lib/productClasses.ts; this keeps the old export shape for existing imports.
// Counts here are the static fallback (handle map minus withdrawn products,
// with the renamed blend counted once). Pages that have the live catalogue
// compute counts from it instead (lib/productClasses.ts classCounts).
const LIVE_HANDLES = Object.keys(CLASS_BY_HANDLE).filter((h) => h !== 'wolverine-stack' && !isRetiredHandle(h))
export const CATEGORIES: Category[] = [
  { slug: 'all', label: 'All', count: LIVE_HANDLES.length },
  ...PRODUCT_CLASSES.map((c) => ({
    slug: c.slug,
    label: c.label,
    count: LIVE_HANDLES.filter((h) => CLASS_BY_HANDLE[h] === c.slug).length,
  })),
]

// BUNDLES moved to lib/bundles.ts (Sep 2026): each bundle now names exact
// variants, prices come live from Shopify, and the saving is applied at
// checkout. Re-exported here so existing imports keep working.
export { BUNDLE_DEFS as BUNDLES } from '@/lib/bundles'

// Customer reviews come from the moderated review store (lib/reviewStore.ts).
// The placeholder REVIEWS array that used to live here was removed.
