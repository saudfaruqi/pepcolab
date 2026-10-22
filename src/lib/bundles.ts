// src/lib/bundles.ts
//
// BUNDLES — one source of truth (Sep 2026)
//
// What was wrong before:
//  - Bundle prices were frozen numbers in app/data.ts (AED 89.99 etc.) and
//    were shown while products loaded, next to "0 compounds".
//  - The "discounted" bundle price shown after loading was never applied:
//    "Add bundle" added each item at full price and checkout charged full
//    price. An advertised saving that isn't honoured is a misleading price.
//  - The bundle text named strengths ("BPC-157 10mg") but the cart received
//    whatever the product's default variant happened to be.
//
// Now:
//  - Each bundle lists the exact Shopify handle + variant title it contains.
//  - The bundle price is always the live price of those exact variants,
//    minus the bundle's discountPercent. Nothing is shown until live prices
//    load, and a bundle is hidden if any item is missing or out of stock.
//  - The saving is REAL: computeBundleSavings() looks at the cart and gives
//    discountPercent off every complete set, however the items were added.
//    useStrablCheckout applies it to the price sent to STRABL, and the cart
//    page and drawer show it.

import { baseHandle, isRetiredHandle } from './retired-paths'

export interface BundleItem {
  /** Shopify product handle */
  handle: string
  /** Shopify variant title exactly as in Shopify ("10mg", "Vial", "Default Title") */
  variant: string
  /** Short label shown to customers */
  label: string
}

export interface BundleDef {
  id: string
  name: string
  desc: string
  items: BundleItem[]
  discountPercent: number
  accent: string
  bg: string
}

// Oct 2026 clean-up brief A7: outcome-named bundles renamed to what they
// contain. The BPC-157 set is only offered while a BPC-157 vial is listed
// (lib/retired-paths.ts); otherwise it is not offered at all.
const ALL_BUNDLE_DEFS: BundleDef[] = [
  {
    id: 'b1',
    name: 'BPC-157 + Thymosin Alpha-1 Set',
    desc: 'BPC-157 10mg vial and Thymosin Alpha-1, supplied together for paired in-vitro studies.',
    items: [
      { handle: 'bpc-157', variant: '10mg', label: 'BPC-157 · 10mg vial' },
      { handle: 'thymosin-alpha', variant: 'Default Title', label: 'Thymosin Alpha-1' },
    ],
    discountPercent: 10,
    accent: '#0D7A45',
    bg: '#EDFAF3',
  },
  {
    id: 'b2',
    name: 'Epithalon + AHK-Cu Set',
    desc: 'Epithalon and AHK-Cu, supplied together for paired in-vitro studies.',
    items: [
      { handle: 'epithalon', variant: 'Default Title', label: 'Epithalon' },
      { handle: 'ahk-cu', variant: 'Default Title', label: 'AHK-Cu' },
    ],
    discountPercent: 10,
    accent: '#7C3AED',
    bg: '#F4F1FE',
  },
  {
    id: 'b3',
    name: 'Semax + Selank Set',
    desc: 'Semax and Selank vials, supplied together for paired in-vitro studies.',
    items: [
      { handle: 'semax', variant: 'Vial', label: 'Semax · Vial' },
      { handle: 'selank', variant: 'Vial', label: 'Selank · Vial' },
    ],
    discountPercent: 10,
    accent: '#BE185D',
    bg: '#FDF0F8',
  },
]

export const BUNDLE_DEFS: BundleDef[] = ALL_BUNDLE_DEFS.filter(
  (def) => !def.items.some((item) => isRetiredHandle(item.handle))
)

/** The largest discount offered on any bundle — for headings like "Save 10%". */
export const MAX_BUNDLE_DISCOUNT = Math.max(...BUNDLE_DEFS.map((b) => b.discountPercent))

function norm(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase()
}

/** Handle without the market suffix, so "semax-uae" and "semax" match. */
function sameHandle(a: string | undefined | null, b: string | undefined | null): boolean {
  return baseHandle(a || '') === baseHandle(b || '')
}

function variantMatches(itemVariant: string, variantTitle: string): boolean {
  const want = norm(itemVariant)
  const have = norm(variantTitle)
  if (want === have) return true
  // "Vial" matches a vial variant with a strength ("Vial 10mg", "10mg Vial").
  if (want === 'vial' && /\bvial\b/.test(have)) return true
  // "10mg" matches "10mg Vial" / "Vial 10mg" once device variants are gone.
  if (/^\d+(\.\d+)?mg$/.test(want) && have.split(/[\s/·-]+/).includes(want)) return true
  // Single-variant products may come through as "Default Title" or empty.
  return want === 'default title' && (have === '' || have === 'default title')
}

const round2 = (n: number) => Math.round(n * 100) / 100

/* -------------------------------------------------------------------------- */
/* Catalogue side — what a bundle card shows and adds to the cart              */
/* -------------------------------------------------------------------------- */

export interface BundleProductLike {
  id: string
  slug: string
  name: string
  price: number
  image?: string
  currencyCode?: string
  variantId?: string
  mg?: string
  inStock?: boolean
  variants?: { id: string; title: string; price: number; availableForSale: boolean }[]
}

export interface ResolvedBundleLine<P extends BundleProductLike = BundleProductLike> {
  item: BundleItem
  product: P
  variantId: string
  variantTitle: string
  price: number
}

export interface ResolvedBundle<P extends BundleProductLike = BundleProductLike> {
  def: BundleDef
  lines: ResolvedBundleLine<P>[]
  complete: boolean
  missing: string[]
  currency: string
  total: number
  price: number
  save: number
}

/**
 * Matches a bundle to live products. `complete` is false if any item's
 * product or exact variant is missing or unavailable — such a bundle must
 * not be shown or sold.
 */
export function resolveBundle<P extends BundleProductLike>(def: BundleDef, products: P[]): ResolvedBundle<P> {
  const lines: ResolvedBundleLine<P>[] = []
  const missing: string[] = []

  for (const item of def.items) {
    const product = products.find((p) => sameHandle(p.slug, item.handle))
    if (!product) { missing.push(`${item.handle} (product not found)`); continue }

    const variants = product.variants ?? []
    let variant = variants.find((v) => variantMatches(item.variant, v.title))
    if (!variant && variants.length === 0 && norm(item.variant) === 'default title' && product.variantId) {
      variant = { id: product.variantId, title: 'Default Title', price: product.price, availableForSale: product.inStock !== false }
    }
    if (!variant) { missing.push(`${item.handle} / ${item.variant} (variant not found)`); continue }
    if (!variant.availableForSale) { missing.push(`${item.handle} / ${item.variant} (out of stock)`); continue }

    lines.push({
      item,
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: Number(variant.price) || 0,
    })
  }

  const complete = missing.length === 0 && lines.length === def.items.length && lines.every((l) => l.price > 0)
  const total = round2(lines.reduce((s, l) => s + l.price, 0))
  const save = round2(total * (def.discountPercent / 100))
  return {
    def,
    lines,
    complete,
    missing,
    currency: lines[0]?.product.currencyCode || 'AED',
    total,
    price: round2(total - save),
    save,
  }
}

/* -------------------------------------------------------------------------- */
/* Cart side — the saving actually applied at checkout                         */
/* -------------------------------------------------------------------------- */

export interface CartLineLike {
  variantId: string
  variantTitle: string
  slug: string
  price: number
  quantity: number
}

export interface AppliedBundle {
  id: string
  name: string
  sets: number
  amount: number
}

export interface BundleSavings {
  amount: number
  bundles: AppliedBundle[]
}

/**
 * Discount earned by complete bundle sets in the cart. Each unit counts
 * towards at most one bundle, so the same item can't be discounted twice.
 */
export function computeBundleSavings(lines: CartLineLike[]): BundleSavings {
  const remaining = new Map<CartLineLike, number>()
  for (const l of lines) {
    if (l.quantity > 0 && l.price > 0) remaining.set(l, l.quantity)
  }

  const applied: AppliedBundle[] = []

  for (const def of BUNDLE_DEFS) {
    const matched = def.items.map((item) =>
      Array.from(remaining.keys()).find(
        (l) => sameHandle(l.slug, item.handle) && variantMatches(item.variant, l.variantTitle)
      )
    )
    if (matched.some((m) => !m)) continue
    const lineSet = matched as CartLineLike[]
    // A bundle listing the same variant twice would need twice the quantity.
    const perSet = new Map<CartLineLike, number>()
    for (const l of lineSet) perSet.set(l, (perSet.get(l) || 0) + 1)
    const sets = Math.min(...Array.from(perSet.entries()).map(([l, need]) => Math.floor((remaining.get(l) || 0) / need)))
    if (!sets || sets < 1) continue

    const setTotal = lineSet.reduce((s, l) => s + l.price, 0)
    const amount = round2(setTotal * sets * (def.discountPercent / 100))
    for (const [l, need] of perSet) remaining.set(l, (remaining.get(l) || 0) - need * sets)
    applied.push({ id: def.id, name: def.name, sets, amount })
  }

  return { amount: round2(applied.reduce((s, b) => s + b.amount, 0)), bundles: applied }
}