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

export const BUNDLE_DEFS: BundleDef[] = [
  {
    id: 'b1',
    name: 'Recovery Stack',
    desc: 'BPC-157 10mg and Thymosin Alpha, supplied together.',
    items: [
      { handle: 'bpc-157-uae', variant: '10mg', label: 'BPC-157 · 10mg' },
      { handle: 'thymosin-alpha-uae', variant: 'Default Title', label: 'Thymosin Alpha' },
    ],
    discountPercent: 10,
    accent: '#0D7A45',
    bg: '#EDFAF3',
  },
  {
    id: 'b2',
    name: 'Longevity Protocol',
    desc: 'Epithalon and AHK-Cu, supplied together.',
    items: [
      { handle: 'epithalon-uae', variant: 'Default Title', label: 'Epithalon' },
      { handle: 'ahk-cu-uae', variant: 'Default Title', label: 'AHK-Cu' },
    ],
    discountPercent: 10,
    accent: '#7C3AED',
    bg: '#F4F1FE',
  },
  {
    id: 'b3',
    name: 'Cognitive Edge',
    desc: 'Semax and Selank vials, supplied together.',
    items: [
      { handle: 'semax-uae', variant: 'Vial', label: 'Semax · Vial' },
      { handle: 'selank-uae', variant: 'Vial', label: 'Selank · Vial' },
    ],
    discountPercent: 10,
    accent: '#BE185D',
    bg: '#FDF0F8',
  },
]

/** The largest discount offered on any bundle — for headings like "Save 10%". */
export const MAX_BUNDLE_DISCOUNT = Math.max(...BUNDLE_DEFS.map((b) => b.discountPercent))

function norm(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase()
}

function variantMatches(itemVariant: string, variantTitle: string): boolean {
  const want = norm(itemVariant)
  const have = norm(variantTitle)
  if (want === have) return true
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
    const product = products.find((p) => norm(p.slug) === norm(item.handle))
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
        (l) => norm(l.slug) === norm(item.handle) && variantMatches(item.variant, l.variantTitle)
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