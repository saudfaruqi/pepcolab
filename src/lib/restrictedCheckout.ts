// src/lib/restrictedCheckout.ts
//
// RETA (GLP) — hardcoded exception ─────────────────────────────────
// GLP can't go through the normal STRABL cart/checkout flow, so it
// is sold via a direct payment link instead. This is deliberately
// hardcoded to this one product rather than driven by a Shopify tag/
// metafield (that was a discussed alternative — hardcoding was chosen).
// If a second product ever needs the same treatment, add its slug to
// RETA_SLUGS and, if it needs its own link, extend PAYMENT_LINKS_BY_VARIANT.
//
// Fill in the real payment link(s) below (or via env vars) before this
// goes live — if any are still placeholders, the UI shows a
// "link coming soon" state rather than a dead/broken link.
// ---------------------------------------------------------------------------

const RETA_SLUGS = ['GLP-uae', 'Retatrutide-uae', 'retatrutide-uae']

export function isPaymentLinkOnlyProduct(slug?: string | null): boolean {
  if (!slug) return false
  return RETA_SLUGS.includes(slug)
}

// One payment link per strength/variant, since RETA's variants (10mg,
// 20mg, 30mg, 40mg, 50mg, 60mg, Vial) are priced differently and a single
// generic link can't encode that. Keys must match the variant `title`
// exactly as it comes from Shopify (see ProductActions.tsx's
// `selectedVariant.title`) — check the exact casing/spacing in Shopify if
// a link isn't matching.
//
// NEXT_PUBLIC_RETA_PAYMENT_LINK_* env vars win when set — set these in
// Vercel too so a link can be rotated without a redeploy. The STRABL URLs
// below (created 18-08-2026) are the live fallback in the meantime.
const PAYMENT_LINKS_BY_VARIANT: Record<string, string | undefined> = {
  '10mg': process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_10MG || 'https://checkout.strabl.io/PL-YL6IET',
  '20mg': process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_20MG || 'https://checkout.strabl.io/PL-BVQC55',
  '30mg': process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_30MG || 'https://checkout.strabl.io/PL-HN08LB',
  '40mg': process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_40MG || 'https://checkout.strabl.io/PL-0QQSVU',
  '50mg': process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_50MG || 'https://checkout.strabl.io/PL-BTMFTN',
  '60mg': process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_60MG || 'https://checkout.strabl.io/PL-ZOWHNN',
  'Vial': process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_VIAL || 'https://checkout.strabl.io/PL-RETZGA',
}

// Fallback used when a variant title doesn't match one of the keys above
// (new strength added in Shopify before this file's been updated, etc.).
// No dedicated "any strength" STRABL link exists yet — set
// NEXT_PUBLIC_RETA_PAYMENT_LINK once you have one, or add the missing
// strength to PAYMENT_LINKS_BY_VARIANT above instead.
const GENERIC_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK || 'https://PLACEHOLDER-payment-link.example.com/reta'

export function getPaymentLinkForVariant(variantTitle?: string | null): string {
  if (variantTitle) {
    // 1. Exact match first — handles the common case where Shopify's
    //    variant title is just "10mg", "Vial", etc.
    if (PAYMENT_LINKS_BY_VARIANT[variantTitle]) {
      return PAYMENT_LINKS_BY_VARIANT[variantTitle] as string
    }

    // 2. Fuzzy match — handles multi-option variant titles Shopify builds
    //    by joining option values with " / " (e.g. "10mg / Vial",
    //    "Strength: 10mg"), and differences in spacing/case ("10 mg" vs
    //    "10mg"). This is what actually fixed the "coming soon" bug: the
    //    exact-match-only version above broke as soon as RETA had more
    //    than one option (Strength + Format), which is the normal shape
    //    for a multi-option Shopify product.
    const normalised = variantTitle.toLowerCase().replace(/\s+/g, '')
    const strengthKeys = ['10mg', '20mg', '30mg', '40mg', '50mg', '60mg']
    for (const key of strengthKeys) {
      if (normalised.includes(key) && PAYMENT_LINKS_BY_VARIANT[key]) {
        return PAYMENT_LINKS_BY_VARIANT[key] as string
      }
    }
    // Only fall back to the plain "Vial" link if no strength number was
    // found at all — a title like "10mg / Vial" should hit the 10mg
    // branch above, not this one, since Vial there is just the format,
    // not the whole variant.
    if (normalised.includes('vial') && PAYMENT_LINKS_BY_VARIANT['Vial']) {
      return PAYMENT_LINKS_BY_VARIANT['Vial'] as string
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      `[restrictedCheckout] No RETA payment link matched variant title "${variantTitle}" — falling back to the generic link. If this is a real variant, add its exact/partial title to PAYMENT_LINKS_BY_VARIANT in lib/restrictedCheckout.ts.`
    )
  }
  return GENERIC_PAYMENT_LINK
}

export function isPlaceholderLink(url: string): boolean {
  return url.includes('PLACEHOLDER-payment-link.example.com')
}