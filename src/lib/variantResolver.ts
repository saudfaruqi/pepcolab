// src/lib/variantResolver.ts
//
// Recovering a Shopify variant from a STRABL Payment Link line item.
//
// THE PROBLEM THIS SOLVES
//
// Order SOR-GNRKNV (28 Sep 2026) arrived as a custom Shopify line item with
// no catalogue link and no inventory decrement. The payload was:
//
//   { productUuid: "9a84c5f3-…", title: "GLP 40mg Pen", price: 1200,
//     quantity: 1, orderProductType: "Buy Now", extra: [] }
//
// app/api/webhook/strabl/route.ts resolves variants from
// `externalVariantId || externalProductId`. A Payment Link order carries
// NEITHER — only STRABL's own productUuid, which means nothing to Shopify,
// and a human-readable title.
//
// That is not an edge case. Every GLP sale goes through a Payment Link
// (see lib/restrictedCheckout.ts), so the highest-value product in the
// catalogue has never decremented stock automatically, and none of those
// orders are linked to the catalogue for reporting.
//
// THE SAFETY RULE — READ BEFORE CHANGING ANYTHING HERE
//
// A wrong match is worse than no match. Linking "GLP 40mg Pen" to the wrong
// variant silently decrements stock of something that was never sold, and
// the error surfaces weeks later as an inventory discrepancy nobody can
// trace. A missed match just leaves the line item custom — exactly what
// happens today, with an alert already firing.
//
// So the title only ever PROPOSES a variant. The price has to confirm it.
// If a title parses cleanly but the price disagrees with the variant's own
// price, this returns null and the line item stays custom. That is
// deliberate: STRABL Payment Links are fixed-price carts, so a mismatch
// means either the link was rebuilt at a different price or the title
// parsed to the wrong thing — and in both cases we want a human to look,
// not an automatic guess.

export interface ResolverVariant {
  id: string
  title: string
  price: number
}

export interface ResolverProduct {
  title: string
  handle: string
  variants?: ResolverVariant[]
}

export interface VariantMatch {
  variantId: string
  productTitle: string
  variantTitle: string
  price: number
}

/** Lowercase, strip everything that isn't a letter or digit. */
function norm(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Pulls the strength out of a title. "GLP 40mg Pen" → 40.
 * Handles "40mg", "40 mg", "1000mcg". Returns null when absent — several
 * products are single-strength and their titles carry no number at all.
 *
 * The unit is `mc?g`, NOT `m[cg]g`. The character class needs three
 * characters, so it matches "mcg" and "mgg" but never plain "mg" — which
 * silently returned null for every strength in the catalogue and made this
 * resolver match on format alone.
 */
function parseStrength(title: string): number | null {
  const m = (title || '').match(/(\d+(?:\.\d+)?)\s*mc?g\b/i)
  return m ? parseFloat(m[1]) : null
}

/**
 * Pulls the presentation out of a title. "GLP 40mg Pen" → "pen".
 * Checked longest-first so "nasal spray" wins over "spray".
 */
function parseFormat(title: string): string | null {
  const t = (title || '').toLowerCase()
  for (const f of ['nasal spray', 'spray', 'cartridge', 'vial', 'pen']) {
    if (new RegExp(`\\b${f.replace(' ', '\\s+')}\\b`).test(t)) {
      return f === 'spray' ? 'nasal spray' : f
    }
  }
  return null
}

/**
 * The product name, with the strength and format stripped off.
 * "GLP 40mg Pen" → "glp".
 */
function parseProductName(title: string): string {
  return norm(
    (title || '')
      .replace(/\d+(?:\.\d+)?\s*m[cg]g\b/gi, ' ')
      .replace(/\b(nasal\s+spray|spray|cartridge|vial|pen)\b/gi, ' ')
  )
}

/**
 * Finds the catalogue product a line-item title refers to.
 *
 * Exact match first, then a containment match, and only when exactly one
 * product contains the name — "glp" must not quietly resolve when both
 * "GLP" and some future "GLP-2" exist.
 */
function findProduct(title: string, catalogue: ResolverProduct[]): ResolverProduct | null {
  const key = parseProductName(title)
  if (key.length < 2) return null

  const exact = catalogue.filter(p => norm(p.title) === key)
  if (exact.length === 1) return exact[0]

  const partial = catalogue.filter(p => norm(p.title) === key || key.startsWith(norm(p.title)))
  if (partial.length === 1) return partial[0]

  // More than one candidate: prefer the longest product name that the title
  // starts with, which is the most specific reading. Still returns null if
  // that is ambiguous.
  const sorted = [...partial].sort((a, b) => norm(b.title).length - norm(a.title).length)
  if (sorted.length > 1 && norm(sorted[0].title).length === norm(sorted[1].title).length) return null
  return sorted[0] ?? null
}

/**
 * Resolves a STRABL line item to a Shopify variant, or returns null.
 *
 * `price` is the per-unit price STRABL charged. It is the confirmation
 * step, not a hint — see the safety rule in the file header.
 */
export function resolveVariantFromTitle(
  title: string,
  price: number,
  catalogue: ResolverProduct[]
): VariantMatch | null {
  if (!title || !Number.isFinite(price) || price <= 0) return null

  const product = findProduct(title, catalogue)
  if (!product) return null

  const variants = product.variants ?? []
  if (variants.length === 0) return null

  const wantMg = parseStrength(title)
  const wantFormat = parseFormat(title)

  const candidates = variants.filter(v => {
    const vMg = parseStrength(v.title)
    const vFormat = parseFormat(v.title)

    // Format is checked before strength, deliberately. "Vial / 60mg" and
    // "Pen / 60mg" share a strength, and matching on the number alone once
    // sent a vial order to a pen.
    if (wantFormat && vFormat && wantFormat !== vFormat) return false
    if (wantFormat && !vFormat && variants.some(x => parseFormat(x.title))) return false
    if (wantMg !== null && vMg !== null && wantMg !== vMg) return false
    if (wantMg !== null && vMg === null && variants.some(x => parseStrength(x.title) !== null)) return false
    return true
  })

  if (candidates.length !== 1) {
    // A single-variant product whose only variant is "Default Title" has
    // nothing to disambiguate, so an unambiguous product is enough.
    if (variants.length === 1 && candidates.length === 0) {
      const only = variants[0]
      return priceConfirms(only, price)
        ? built(product, only)
        : null
    }
    return null
  }

  const variant = candidates[0]
  return priceConfirms(variant, price) ? built(product, variant) : null
}

/**
 * The confirmation. Exact to the fils, with a tolerance only for
 * floating-point noise in the JSON — not for genuine price differences.
 */
function priceConfirms(variant: ResolverVariant, price: number): boolean {
  const v = Number(variant.price)
  if (!Number.isFinite(v)) return false
  return Math.abs(v - price) < 0.01
}

function built(product: ResolverProduct, variant: ResolverVariant): VariantMatch {
  return {
    variantId: variant.id,
    productTitle: product.title,
    variantTitle: variant.title,
    price: Number(variant.price),
  }
}

/** Shopify's REST line item wants the bare numeric id, not the GID. */
export function toNumericVariantId(gidOrId: string): string {
  const m = String(gidOrId || '').match(/(\d+)$/)
  return m ? m[1] : ''
}