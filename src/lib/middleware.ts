// middleware.ts (at project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// PepcoLab only operates in these two markets — same whitelist
// countryContext.tsx enforces client-side. Without clamping here too, a
// visitor from anywhere else (any Vercel-detected country code) would flow
// a raw, unsupported country straight into Shopify's @inContext query.
const SUPPORTED_COUNTRIES = new Set(['AE', 'GB'])

// Matches the "AE, the primary market" comment already in countryContext.tsx.
// NOTE: this conflicts with layout.tsx's structured data, which only ever
// declares GBP/en_GB/GB — worth deciding deliberately which market is
// actually primary (or whether both need first-class treatment, given the
// stated goal of ranking in UAE *and* UK) rather than leaving the two files
// disagreeing silently. Change here + the two spots noted in
// countryContext.tsx together if you settle on GB instead.
const DEFAULT_COUNTRY = 'AE'

export function middleware(request: NextRequest) {
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