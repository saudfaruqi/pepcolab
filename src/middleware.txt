// src/middleware.ts
//
// ── CRITICAL PATH FIX (Sep 2026) ────────────────────────────────────────────
// This file previously lived at src/lib/middleware.ts. Next.js only loads
// middleware from the project root (`middleware.ts`) or, in a `src/` layout,
// from `src/middleware.ts`. Anywhere else it is an ordinary unused module —
// so none of the logic below has ever executed in production.
//
// Three things were silently dead as a result:
//   1. The 301 from the legacy "/products/{name}-uae" URLs to the neutral
//      canonical slug. The August SEO migration moved every canonical and
//      every statically-generated param onto the neutral slug while the
//      redirect that was supposed to carry the accumulated ranking signal
//      across never fired. Both URLs stayed reachable and Google was left
//      choosing between them.
//   2. The `x-buyer-country` request header, so nothing server-side ever saw
//      a resolved country.
//   3. The `pepcolab_country` cookie, so countryContext.tsx always fell
//      through to a `/api/country` network round-trip on first visit.
//
// DELETE src/lib/middleware.ts after adding this file. Leaving both in place
// is harmless at runtime but guarantees someone edits the dead one again.
// ────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// AE sells and ships. GB is a recognised market for content, currency
// context and messaging, but has no catalogue and no checkout yet — see
// lib/pricing.ts (UK_CHECKOUT_LIVE) for the single switch that turns UK
// selling on. Keeping GB here rather than collapsing it to AE is what lets
// a UK visitor be told the truth ("not dispatching to the UK yet") instead
// of being silently relabelled as a UAE customer.
const SUPPORTED_COUNTRIES = new Set(['AE', 'GB'])

const DEFAULT_COUNTRY = 'AE'

// Legacy product URLs from before the neutral-slug migration.
const LEGACY_PRODUCT_UAE_RE = /^\/products\/([^/]+)-uae\/?$/i

// DISCONTINUED-SKU REDIRECTS LIVE IN next.config.js, NOT HERE.
//
// The previous version of this file kept its own DISCONTINUED_PRODUCT_REDIRECTS
// map, and 'glp-1-tera-5mg' appeared in BOTH that map and next.config.js —
// pointing at two different destinations. next.config.js `redirects()` are
// evaluated before middleware runs, so the middleware entry could never
// execute and the disagreement was invisible.
//
// One source of truth avoids that permanently: add any discontinued or
// renamed product slug to the `redirects()` array in next.config.js. It is
// also the cheaper place for them — those are handled at the edge without
// invoking this function at all.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Legacy "-uae" slug -> neutral canonical slug. Single hop, 301.
  const legacyMatch = pathname.match(LEGACY_PRODUCT_UAE_RE)
  if (legacyMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/products/${legacyMatch[1]}`
    return NextResponse.redirect(url, 301)
  }

  // 2. Resolve the buyer country.
  //
  // `request.geo` was Vercel-Edge-specific and is gone in Next 15; the header
  // is the stable source. `geo` is kept only as a defensive fallback.
  const detected =
    request.headers.get('x-vercel-ip-country') ??
    (request as { geo?: { country?: string } }).geo?.country ??
    DEFAULT_COUNTRY

  const country = SUPPORTED_COUNTRIES.has(detected) ? detected : DEFAULT_COUNTRY

  // The header has to go on the OUTGOING REQUEST, not the response, for
  // Server Components to read it via headers() during the same render.
  // Setting it on the response only reaches the browser's network tab.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-buyer-country', country)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Not httpOnly on purpose: countryContext.tsx reads it synchronously via
  // document.cookie on first paint, which is what avoids both the price
  // flash and the /api/country round-trip.
  response.cookies.set('pepcolab_country', country, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  return response
}

export const config = {
  // Excludes _next assets, the API surface, and static files with an
  // extension (images, PDFs, the video, robots.txt, sitemap.xml) so the
  // middleware doesn't run — and set a cookie — on every asset request.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}