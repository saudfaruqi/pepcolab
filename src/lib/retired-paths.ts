// src/lib/retired-paths.ts
//
// PERMANENTLY WITHDRAWN (Oct 2026 — "Site clean-up, CRM and WhatsApp
// opt-in" brief, sections A1–A4).
//
// Instagram and YouTube were taken down and TikTok blocked because the
// platforms judge an account by where it sends people, and pepcolab.com read
// to their crawlers as a shop selling injectables. The GLP line and every
// pen-only product were removed. Their URLs answer 410 Gone (middleware.ts),
// not a redirect: a 410 tells Google and the platform crawlers the item is
// withdrawn; a redirect to a similar product would look like hiding it.
//
// MASTER SWITCH — PRODUCT_WITHDRAWAL_ACTIVE (22 Oct 2026)
// Mohammed decided to keep every product on the public site and keep selling
// the pens, nasal sprays and the GLP line. With the switch off, nothing below
// hides a product, a variant or a product URL. Everything is kept wired so
// that flipping it to true withdraws exactly the brief's list in one deploy.
// Content retirements (research articles, the GLP legal note, the referral
// page) are NOT product removals and stay in force either way.
//
// This file is the single source of truth. The middleware, the sitemap, the
// catalogue filter in lib/shopify.ts, site search and the internal-link
// checks all read from it.

export const PRODUCT_WITHDRAWAL_ACTIVE = false

/** Shopify handles (without the -uae / -uk market suffix) withdrawn when the switch is on. */
export const RETIRED_HANDLES: ReadonlySet<string> = new Set([
  // GLP line
  'retatrutide',
  'reta-cagri',
  'cagrilintide',
  // Pen-only products
  'dsip',
  'slu-pp-223',
  'kisspeptin',
  'nad',
  'igf-1-lr3',
  'aod-9604',
  'ipamorelin',
  'cjc-no-dac',
])

/**
 * BPC-157 is pen-only until a 10mg vial SKU is in stock (brief A1). Until
 * then it is withdrawn with the others. When vial stock lands, set
 * BPC157_VIAL_LIVE=true in Vercel and redeploy — the product page, its
 * class tile and the BPC-157 + Thymosin Alpha-1 set come back together.
 */
export function bpc157VialLive(): boolean {
  return (process.env.BPC157_VIAL_LIVE || process.env.NEXT_PUBLIC_BPC157_VIAL_LIVE || '').toLowerCase() === 'true'
}

export function baseHandle(handle: string): string {
  return (handle || '').toLowerCase().trim().replace(/-(uae|uk|ae|gb)$/, '')
}

export function isRetiredHandle(handle: string): boolean {
  if (!PRODUCT_WITHDRAWAL_ACTIVE) return false
  const h = baseHandle(handle)
  if (RETIRED_HANDLES.has(h)) return true
  if (h === 'bpc-157' && !bpc157VialLive()) return true
  return false
}

/** Paths permanently withdrawn from pepcolab.com. Served as 410 Gone. */
export function gonePaths(): ReadonlySet<string> {
  // Content and files withdrawn regardless of the product switch.
  const paths = [
    '/research/glp1',
    '/research/glp1-receptor-agonists-compared',
    '/research/igf-1-lr3',
    '/legal/glp',
    '/referrals',
    '/pdf/pepcolab_mt2_10mg_coa.pdf',
  ]
  if (PRODUCT_WITHDRAWAL_ACTIVE) {
    paths.push(
      // GLP line
      '/products/retatrutide',
      '/products/reta-cagri',
      '/products/cagrilintide',
      '/products/category/incretin-analogues',
      // Pen-only products
      '/products/dsip',
      '/products/slu-pp-223',
      '/products/kisspeptin',
      '/products/nad',
      '/products/igf-1-lr3',
      '/products/aod-9604',
      '/products/ipamorelin',
      '/products/cjc-no-dac',
      // Certificates for withdrawn batches (public/pdf)
      '/pdf/pepcolab_tirzepatide_40mg_coa.pdf',
      '/pdf/pepcolab_retatrutide_30mg_coa.pdf',
      '/pdf/pepcolab_retatrutide_20mg_coa.pdf',
      '/pdf/pepcolab_igf1-lr3_1mg_coa.pdf',
    )
    if (!bpc157VialLive()) paths.push('/products/bpc-157')
  }
  return new Set(paths)
}

/** Old outcome-named categories and renamed products. Served as 301. */
export const RETIRED_REDIRECTS: Readonly<Record<string, string>> = {
  '/products/category/metabolic': '/products',
  '/products/category/recovery': '/products',
  '/products/category/cognitive': '/products',
  '/products/category/hormonal': '/products',
  '/products/category/anti-ageing': '/products',
  '/products/category/immune': '/products',
  '/products/category/accessories': '/products/category/lab-supplies',
}

/**
 * Normalises a request path the way the 410 check compares it: lower case,
 * no trailing slash, and legacy "-uae"/"-uk" product slugs folded onto the
 * neutral slug so /products/retatrutide-uae is gone too.
 */
export function normaliseRetiredPath(pathname: string): string {
  let p = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/'
  const m = p.match(/^\/products\/([^/]+)$/)
  if (m) p = `/products/${baseHandle(m[1])}`
  return p
}

export function isGonePath(pathname: string): boolean {
  return gonePaths().has(normaliseRetiredPath(pathname))
}

/** True for a site path that must never be linked to from anywhere. */
export function isRetiredHref(href: string): boolean {
  if (!href || !href.startsWith('/')) return false
  return isGonePath(href.split(/[?#]/)[0])
}

/** Variant titles that describe a device, not laboratory material (brief A2). */
export const DEVICE_VARIANT_RE = /\b(pens?|nasal|spray|sprays|cartridges?|auto-?injectors?)\b/i

/** True when a variant/line title is a device format AND withdrawal is switched on. */
export function isWithdrawnDeviceTitle(title: string): boolean {
  return PRODUCT_WITHDRAWAL_ACTIVE && DEVICE_VARIANT_RE.test(title || '')
}
