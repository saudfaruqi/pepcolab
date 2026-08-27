// middleware.ts (at project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// MARKET FIX (Aug 2026): PepcoLab is UAE-only for now — same whitelist
// countryContext.tsx enforces client-side, trimmed the same way there.
// Without clamping here too, a visitor from anywhere else (any
// Vercel-detected country code) would flow a raw, unsupported country
// straight into Shopify's @inContext query.
const SUPPORTED_COUNTRIES = new Set(['AE'])

const DEFAULT_COUNTRY = 'AE'

// SEO FIX (Aug 2026 audit): product URLs were all indexed as
// "/products/{name}-uae" regardless of market — see toNeutralSlug() in
// lib/utils.ts for the full rationale. Any crawler/bookmark/backlink still
// hitting the old "-uae" URL gets a real 301 to the clean canonical one,
// so link equity consolidates onto a single indexed URL per product instead
// of splitting across two.
const LEGACY_PRODUCT_UAE_RE = /^\/products\/([^/]+)-uae\/?$/i

// SEO FIX (Aug 2026 audit): GSC flagged /products/glp-1-tera-5mg as a hard
// 404 — a discontinued/renamed SKU with no current product at that slug
// (confirmed against the live CATEGORIES/product export: nothing named
// "glp-1-tera" exists any more). A bare 404 throws away whatever link
// equity and search visibility that URL had built up; a 301 to the nearest
// still-live, topically-relevant page consolidates it instead. GLP-1-class
// compounds map to the "metabolic" category, so that's the target here.
//
// Add future discontinued/renamed product slugs to this map rather than
// letting them 404 — key is the neutral (no "-uae") slug, value is the
// path to redirect to.
const DISCONTINUED_PRODUCT_REDIRECTS: Record<string, string> = {
  'glp-1-tera-5mg': '/products/category/metabolic',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const legacyMatch = pathname.match(LEGACY_PRODUCT_UAE_RE)
  if (legacyMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/products/${legacyMatch[1]}`
    return NextResponse.redirect(url, 301)
  }

  const discontinuedMatch = pathname.match(/^\/products\/([^/]+)\/?$/i)
  if (discontinuedMatch) {
    const target = DISCONTINUED_PRODUCT_REDIRECTS[discontinuedMatch[1].toLowerCase()]
    if (target) {
      const url = request.nextUrl.clone()
      url.pathname = target
      return NextResponse.redirect(url, 301)
    }
  }

  // `request.geo` was Vercel Edge-specific and has been removed in newer
  // Next.js versions (deprecated in 13.4, gone in 15) — the header is the
  // stable source on Vercel. Keeping `geo` as a defensive fallback in case
  // you're still on an older Next version, but don't rely on it.
  const detected =
    request.headers.get('x-vercel-ip-country') ??
    (request as any).geo?.country ??
    DEFAULT_COUNTRY

  const country = SUPPORTED_COUNTRIES.has(detected) ? detected : DEFAULT_COUNTRY

  // BUG in the original: it called `response.headers.set(...)`, which only
  // reaches the browser's network tab — it is NOT visible to Server
  // Components via `headers()` from `next/headers` during the same render,
  // because that needs to be on the outgoing *request*, not the response.
  // As written, this middleware ran, set a header nobody server-side ever
  // read, and had zero effect on what actually got rendered. Fixed by
  // cloning the request headers and passing them through NextResponse.next().
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-buyer-country', country)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Also missing entirely: nothing persisted the decision anywhere the
  // *client* could read it. Without this, countryContext.tsx still has no
  // way to initialize at the right country on first paint — it would still
  // default to AE and wait on the async /api/country fetch, meaning the
  // price-flash and crawl-mismatch problem wasn't actually fixed by this
  // middleware even after the header bug above is corrected. A cookie
  // closes that loop: layout.tsx can read it server-side to set
  // CountryProvider's initial state correctly on the very first render.
  response.cookies.set('pepcolab_country', country, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  return response
}

export const config = {
  matcher: ['/((?!_next|favicon|api).*)'],
}