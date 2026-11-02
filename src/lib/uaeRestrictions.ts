// src/lib/uaeRestrictions.ts
//
// UAE CATALOGUE (Oct 2026)
// ------------------------
// pepcolab.com is blocked in the UAE. The likely trigger is the sale into the
// UAE of GLP-1 analogues and of pens and nasal sprays, which UAE regulators
// treat as medical products. The UAE catalogue therefore carries the
// research and cosmetic lines only. The UK catalogue is unchanged.
//
// What "restricted in the UAE" covers, all driven from this file:
//   - every GLP / incretin / amylin analogue product
//   - every pen-only product
//   - every pen, nasal-spray, cartridge or auto-injector variant of any product
//
// Where it is enforced:
//   1. middleware.ts       — a visitor on a UAE IP address who opens a
//                            restricted product URL, the incretin class page
//                            or a restricted certificate PDF is sent to
//                            /products.
//   2. lib/shopify.ts      — getProducts() drops restricted products and
//                            variants for the UAE market (server pages, and
//                            any browser on a UAE IP address).
//   3. Product page        — restricted variants are hidden; a restricted
//                            product shows "not available in your location".
//   4. Cart and checkout   — restricted lines are removed and never sent to
//                            payment from a UAE browser.
//   5. STRABL webhook      — the backstop: a PAID order shipping to the UAE
//                            that contains a restricted item is held (no
//                            Shopify order, no driver), the customer is told
//                            it will be refunded, and an alert goes out.
//
// The market used here is the visitor's real location (the pepcolab_country
// cookie, which middleware.ts rewrites from the IP address on every request)
// as well as the market they chose. Choosing "United Kingdom" in the site's
// location pop-up does not lift the restriction for someone in the UAE.
//
// To lift the restriction (for example once a UAE licence covers these
// products), set UAE_RESTRICTION_ACTIVE to false and redeploy.
import { DEVICE_VARIANT_RE, RETIRED_HANDLES, baseHandle, bpc157VialLive } from './retired-paths'

export const UAE_RESTRICTION_ACTIVE = true

/** GLP, incretin and amylin analogue handles (without -uae / -uk suffix). */
const GLP_HANDLES = ['retatrutide', 'reta-cagri', 'cagrilintide', 'tirzepatide', 'semaglutide']

/** GLP line + pen-only products. RETIRED_HANDLES is exactly that list. */
const UAE_RESTRICTED_HANDLES: ReadonlySet<string> = new Set([...GLP_HANDLES, ...Array.from(RETIRED_HANDLES)])

/** Matches a GLP compound name in free text (order line titles). */
const GLP_NAME_RE = /\b(reta(trutide)?|cagri(lintide)?|tirzepatide|semaglutide|glp(-?\d)?|incretin)\b/i

/** True when this market gets the UAE catalogue. */
export function restrictsMarket(country?: string | null): boolean {
  return UAE_RESTRICTION_ACTIVE && country === 'AE'
}

export function isUaeRestrictedHandle(handle: string): boolean {
  if (!UAE_RESTRICTION_ACTIVE) return false
  const h = baseHandle(handle)
  if (UAE_RESTRICTED_HANDLES.has(h)) return true
  // BPC-157 is pen-only until a vial SKU lands (see retired-paths.ts).
  if (h === 'bpc-157' && !bpc157VialLive()) return true
  return false
}

/** A pen, nasal-spray, cartridge or auto-injector variant/format. */
export function isUaeRestrictedVariant(title: string): boolean {
  return UAE_RESTRICTION_ACTIVE && DEVICE_VARIANT_RE.test(title || '')
}

/** For an order line, where only the title and options are known. */
export function isUaeRestrictedOrderLine(title: string, options: string[] = []): boolean {
  if (!UAE_RESTRICTION_ACTIVE) return false
  const text = [title, ...options].join(' ')
  return GLP_NAME_RE.test(text) || DEVICE_VARIANT_RE.test(text)
}

/** Lot codes of certificates for products outside the UAE catalogue. */
const RESTRICTED_LOT_RE = /^PAL-(TZP|RET|SEM|CAG|IGF1)/i

/** A published certificate (app/coaData.ts) for a product outside the UAE catalogue. */
export function isUaeRestrictedBatch(batch: { lot: string; product: string; identity?: string }): boolean {
  if (!UAE_RESTRICTION_ACTIVE) return false
  return RESTRICTED_LOT_RE.test(batch.lot) || GLP_NAME_RE.test(`${batch.product} ${batch.identity ?? ''}`) || /\bIGF-?1/i.test(batch.product)
}

/** Paths a visitor on a UAE IP address is sent away from. */
export function isUaeRestrictedPath(pathname: string): boolean {
  if (!UAE_RESTRICTION_ACTIVE) return false
  const p = (pathname || '/').toLowerCase().replace(/\/+$/, '')
  if (p === '/products/category/incretin-analogues') return true
  const product = p.match(/^\/products\/([^/]+)$/)
  if (product) return isUaeRestrictedHandle(product[1])
  const lot = p.match(/^\/verify\/([^/]+)$/)
  if (lot) return RESTRICTED_LOT_RE.test(decodeURIComponent(lot[1]))
  const pdf = p.match(/^\/pdf\/([^/]+\.pdf)$/)
  if (pdf) return GLP_NAME_RE.test(pdf[1].replace(/[_-]/g, ' ')) || /igf1|igf-1/.test(pdf[1])
  return false
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : null
}

/**
 * In the browser: true when the visitor is in the UAE by IP address, or has
 * chosen the UAE. Always false on the server (use restrictsMarket there).
 */
export function uaeRestrictedOnClient(): boolean {
  if (!UAE_RESTRICTION_ACTIVE || typeof document === 'undefined') return false
  const geo = readCookie('pepcolab_country')
  let chosen: string | null = null
  try {
    chosen = localStorage.getItem('pepcolab_country')
  } catch {
    // Storage blocked; the IP cookie alone decides.
  }
  if (geo === 'AE' || chosen === 'AE') return true
  // No IP cookie yet (first request not seen): default to the UAE catalogue
  // unless the visitor has chosen the UK.
  return !geo && chosen !== 'GB'
}
