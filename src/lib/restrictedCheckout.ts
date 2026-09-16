// src/lib/restrictedCheckout.ts
//
// RETA (GLP) — hardcoded exception ─────────────────────────────────
// GLP can't go through the normal STRABL cart/checkout flow, so it is sold
// via direct STRABL payment links instead. This is deliberately hardcoded to
// this one product rather than driven by a Shopify tag/metafield.
//
// STRABL payment links are FIXED carts: the quantity is baked into the link
// and the customer cannot change it at checkout. So there is one link per
// variant AND per quantity (1–5). The site picks the quantity; this file
// returns the matching link.
//
// ⚠ Never edit an existing STRABL link's price or quantity — STRABL updates
// the item but keeps charging the old total. Create a new link instead and
// swap the ID here / in the env var.
//
// Any variant+quantity without a live, correctly-priced link resolves to the placeholder,
// so the UI shows "link coming soon" instead of a wrong-price checkout.
// ---------------------------------------------------------------------------

// Shopify handles are lowercase; comparison below is case-insensitive.
// NOTE: 'reta-cagri-uae' currently goes through the normal STRABL cart.
// Confirm whether it needs the same payment-link treatment.
const RETA_SLUGS = ['retatrutide-uae']

export function isPaymentLinkOnlyProduct(slug?: string | null): boolean {
  if (!slug) return false
  return RETA_SLUGS.includes(slug.trim().toLowerCase())
}

export type RetaVariantKey = '10MG' | '20MG' | '30MG' | '40MG' | '50MG' | '60MG' | 'VIAL'

export const RETA_MAX_QTY = 5

/** Unit prices in AED — must match Shopify and every STRABL link amount. */
export const RETA_UNIT_PRICE_AED: Record<RetaVariantKey, number> = {
  '10MG': 900,
  '20MG': 1000,
  '30MG': 1100,
  '40MG': 1200,
  '50MG': 1300,
  '60MG': 1400,
  VIAL: 1460,
}

const STRABL = 'https://checkout.strabl.io/'

// NEXT_PUBLIC_* vars are inlined at BUILD time, so every var is referenced
// literally and a changed value only takes effect after a redeploy.
// Env var wins when set; otherwise the fallback ID below is used.
// All 35 links (7 variants × qty 1–5) are listed. 26 were verified live on
// 16-09-2026. The 9 in PENDING_LINK_IDS below were edited in STRABL and
// still charged pre-update totals when last checked, so they stay switched
// off until STRABL shows the correct amount.
const PAYMENT_LINKS: Record<RetaVariantKey, Record<number, string | undefined>> = {
  '10MG': {
    1: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_10MG || `${STRABL}PL-YL6IET`,
    2: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_10MG_QTY2 || `${STRABL}PL-ZW8DPX`,
    3: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_10MG_QTY3 || `${STRABL}PL-NFHYBD`,
    4: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_10MG_QTY4 || `${STRABL}PL-WQSVGG`,
    5: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_10MG_QTY5 || `${STRABL}PL-5D28RD`,
  },
  '20MG': {
    1: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_20MG || `${STRABL}PL-BVQC55`,
    2: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_20MG_QTY2 || `${STRABL}PL-1SFUQC`,
    3: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_20MG_QTY3 || `${STRABL}PL-46YOOR`,
    4: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_20MG_QTY4 || `${STRABL}PL-O4YUFF`,
    5: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_20MG_QTY5 || `${STRABL}PL-K6ZURC`,
  },
  '30MG': {
    1: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_30MG || `${STRABL}PL-HN08LB`,
    2: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_30MG_QTY2 || `${STRABL}PL-76KNEM`,
    3: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_30MG_QTY3 || `${STRABL}PL-1WJY61`,
    4: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_30MG_QTY4 || `${STRABL}PL-KNEU15`,
    5: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_30MG_QTY5 || `${STRABL}PL-DVI2LI`,
  },
  '40MG': {
    1: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_40MG || `${STRABL}PL-0QQSVU`,
    2: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_40MG_QTY2 || `${STRABL}PL-KXKYFE`,
    3: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_40MG_QTY3 || `${STRABL}PL-KCEITA`,
    4: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_40MG_QTY4 || `${STRABL}PL-Y9ESPV`,
    5: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_40MG_QTY5 || `${STRABL}PL-G5WCP3`,
  },
  '50MG': {
    1: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_50MG || `${STRABL}PL-BTMFTN`,
    2: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_50MG_QTY2 || `${STRABL}PL-QNPQUQ`,
    3: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_50MG_QTY3 || `${STRABL}PL-03LL32`,
    4: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_50MG_QTY4 || `${STRABL}PL-5RR1G1`,
    5: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_50MG_QTY5 || `${STRABL}PL-KJBHNJ`,
  },
  '60MG': {
    1: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_60MG || `${STRABL}PL-ZOWHNN`,
    2: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_60MG_QTY2 || `${STRABL}PL-RGKVJV`,
    3: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_60MG_QTY3 || `${STRABL}PL-E1E84I`,
    4: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_60MG_QTY4 || `${STRABL}PL-D9YE7A`,
    5: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_60MG_QTY5 || `${STRABL}PL-OUMKES`,
  },
  VIAL: {
    1: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_VIAL || `${STRABL}PL-RETZGA`,
    2: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_VIAL_QTY2 || `${STRABL}PL-O1EUM8`,
    3: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_VIAL_QTY3 || `${STRABL}PL-CM5YSB`,
    4: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_VIAL_QTY4 || `${STRABL}PL-AVFI53`,
    5: process.env.NEXT_PUBLIC_RETA_PAYMENT_LINK_VIAL_QTY5 || `${STRABL}PL-UTBC2L`,
  },
}

// PENDING — links that still charged the old total at the last live check
// (16-09-2026). They are blocked even if an env var points at them, so a
// wrong price can never reach checkout. When the STRABL dashboard "Amount"
// column shows the correct figure for a link, delete its line and redeploy.
//   ID            link                  charged   must charge
const PENDING_LINK_IDS = new Set<string>([
  'PL-YL6IET', // 10mg Pen × 1        580       900
  'PL-BVQC55', // 20mg Pen × 1        630       1000
  'PL-HN08LB', // 30mg Pen × 1        680       1100
  'PL-0QQSVU', // 40mg Pen × 1        730       1200
  'PL-BTMFTN', // 50mg Pen × 1        780       1300
  'PL-ZOWHNN', // 60mg Pen × 1        830       1400
  'PL-RGKVJV', // 60mg Pen × 2        1660      2800
  'PL-E1E84I', // 60mg Pen × 3        2800      4200
  'PL-RETZGA', // 60mg Vial × 1       730       1460
])

const PLACEHOLDER_LINK = 'https://PLACEHOLDER-payment-link.example.com/reta'

const STRABL_LINK_RE = /^https:\/\/checkout\.strabl\.io\/(?:payment-link\/)?(PL-[A-Z0-9]+)\/?$/

function validLink(url?: string | null): string | null {
  const value = url?.trim()
  if (!value) return null
  const match = STRABL_LINK_RE.exec(value)
  if (!match || PENDING_LINK_IDS.has(match[1])) return null
  return value
}

/**
 * Maps a Shopify variant title to a RETA variant key.
 * Shopify titles look like "Pen / 10mg" or "Vial / 60mg". Format is checked
 * FIRST: "Vial / 60mg" contains "60mg" and would otherwise route a vial
 * buyer to the 60mg PEN link (wrong product, wrong price).
 */
export function resolveRetaVariant(variantTitle?: string | null): RetaVariantKey | null {
  if (!variantTitle) return null
  const normalised = variantTitle.toLowerCase().replace(/\s+/g, '')
  if (normalised.includes('vial')) return 'VIAL'
  const match = normalised.match(/(^|[^0-9])(10|20|30|40|50|60)mg/)
  return match ? (`${match[2]}MG` as RetaVariantKey) : null
}

/** Verified link for a variant + quantity, or null if none exists yet. */
export function getRetaPaymentLink(variantTitle: string | null | undefined, quantity: number): string | null {
  const key = resolveRetaVariant(variantTitle)
  if (!key || !Number.isInteger(quantity) || quantity < 1 || quantity > RETA_MAX_QTY) return null
  return validLink(PAYMENT_LINKS[key][quantity])
}

/** Quantities that currently have a verified link — drive the qty selector from this. */
export function getAvailableRetaQuantities(variantTitle?: string | null): number[] {
  const quantities: number[] = []
  for (let q = 1; q <= RETA_MAX_QTY; q++) {
    if (getRetaPaymentLink(variantTitle, q)) quantities.push(q)
  }
  return quantities
}

/** Total (AED) that the matching STRABL link charges, or null for an unknown variant. */
export function getRetaTotalAED(variantTitle: string | null | undefined, quantity: number): number | null {
  const key = resolveRetaVariant(variantTitle)
  return key ? RETA_UNIT_PRICE_AED[key] * quantity : null
}

/**
 * Backwards-compatible entry point used by ProductActions.tsx.
 * Returns the placeholder when no verified link exists, so the existing
 * "link coming soon" state keeps working.
 */
export function getPaymentLinkForVariant(variantTitle?: string | null, quantity = 1): string {
  const link = getRetaPaymentLink(variantTitle, quantity)
  if (link) return link
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      `[restrictedCheckout] No verified RETA payment link for variant "${variantTitle}" × ${quantity} — showing "coming soon".`
    )
  }
  return PLACEHOLDER_LINK
}

export function isPlaceholderLink(url: string): boolean {
  return url.includes('PLACEHOLDER-payment-link.example.com')
}