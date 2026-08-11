// src/app/page.tsx
//
// FIX: previously the entire body was `dynamic(() => import(...), { ssr:
// false })` — the homepage, your single highest-value URL for "peptides
// UK"/"peptides UAE" searches, shipped an empty shell to every crawler and
// on every first paint. That existed because HomePageContent's product data
// depended on client-only state (CountryProvider's `ready` flag, which
// always started false and waited on a browser round-trip) — there was no
// way to SSR it correctly without country resolved up front.
//
// That's now fixed upstream: middleware.ts already resolves the visitor's
// country from IP and sets a `pepcolab_country` cookie; layout.tsx reads it
// and hands it to CountryProvider as `initialCountry`, so `ready` can be
// true immediately. This page reads the same cookie, fetches product data
// server-side for that exact country (now that shopify.ts's getProducts
// passes buyerCountry through on the server branch too), and hands the
// result to HomePageContent as `initialProducts` — so the very first HTML
// response already contains real products at the right price, and the
// client effect only refetches if the visitor switches markets.

import { cookies } from 'next/headers'
import HomePageContent from '@/components/HomePageContent'
import { getProducts } from '@/lib/shopify'

export default async function Home() {
  // Next.js 15's cookies() is async — must be awaited.
  const country = (await cookies()).get('pepcolab_country')?.value ?? 'AE'

  let initialProducts: any[] = []
  try {
    const raw = await getProducts(40, country)
    // Same normalisation HomePageContent's client-side fetch applies —
    // kept identical here so server- and client-fetched product objects
    // are indistinguishable to the rest of the component. Left loosely
    // typed at this boundary (HomePageContent's own NormalisedProduct type
    // is the source of truth and isn't exported for reuse here) rather than
    // duplicating that union type and having the two silently drift.
    initialProducts = raw.map((p: any) => ({
      ...p,
      currencyCode: p.currencyCode ?? 'AED',
      badge: p.badge && ['popular', 'new', 'sale', 'bestseller'].includes(p.badge) ? p.badge : undefined,
    }))
  } catch (err) {
    // Same reasoning as sitemap.ts: never let a Shopify hiccup 500 the
    // homepage. HomePageContent's own client-side fetch (with its existing
    // loadError/retry state) picks up the slack if this comes back empty.
    console.error('[home] Server-side product fetch failed:', err)
  }

  return <HomePageContent initialProducts={initialProducts} initialCountry={country} />
}
