// src/app/page.tsx
//
// RENDERING: statically generated and revalidated every 5 minutes.
//
// This page previously read the `pepcolab_country` cookie to fetch
// country-correct prices server-side. Correct in principle, ruinous in
// practice: cookies() opts the route out of static rendering, so the response
// came back `cache-control: private, no-cache, no-store` with
// `x-vercel-cache: MISS` on EVERY request. Every visitor paid for a cold
// render plus a live Shopify round-trip — ~1.5s TTFB — and nothing was ever
// served from the edge.
//
// The cookie read bought very little, because prices are corrected on the
// client anyway: CountryProvider resolves the market, and normaliseProduct()
// converts AED at that point. So the page is now built once in AED and cached;
// GB visitors see dirhams for a few hundred milliseconds before the client
// swaps them. That is a far better trade than 1.5s of blank screen for
// everyone, and it restores edge caching, which is also what stops slow
// hydration from delaying the cart's checkout button.
//
// IMPORTANT: this only works if layout.tsx ALSO stops calling cookies().
// A cookies() call anywhere in the layout chain forces every route under it
// to render dynamically, and this file's change alone will do nothing.
// FIX (Aug 2026): layout.tsx WAS still calling cookies() (added later for
// the country/pricing work) — silently cancelling this out ever since.
// Removed there; see that file's comment and countryContext.tsx's updated
// client-side fallback chain for how CountryProvider still resolves the
// country without it. This page should now actually be statically
// rendered and edge-cached as intended — worth confirming with a real
// TTFB check (response headers should show cache-control allowing caching
// and x-vercel-cache: HIT on repeat requests) rather than trusting the
// comment alone.
// CountryProvider already falls back to localStorage then /api/country when
// `initialCountry` is absent.
//
// PAYLOAD: getProducts() returns the full product record — description,
// descriptionHtml, longDesc, sequence, every variant, every image. The
// homepage renders cards, which need almost none of that. Serialising all of
// it into the RSC flight payload was pushing the homepage HTML past 250 KB
// (~129 KB of it flight data), which delays hydration — and until hydration
// completes, no onClick handler on the page works, including the cart's.
// pickCardFields() below strips it to what the cards actually read.

import HomePageContent from '@/components/HomePageContent'
import { getProducts } from '@/lib/shopify'
import { listAllOrders, isPaidOrder } from '@/lib/orderStore'

/**
 * Only the fields HomePageContent's cards, spotlight and bundles actually
 * read. Anything a card doesn't render is dead weight in the HTML — the
 * product page fetches the full record separately when someone opens it.
 *
 * If a card starts showing a field that isn't here it will render blank, so
 * add it to this list rather than reverting to spreading the whole product.
 */
function pickCardFields(p: any) {
  return {
    id: p.id,
    shopifyId: p.shopifyId,
    handle: p.handle,
    slug: p.slug,
    title: p.title,
    name: p.name,
    shortName: p.shortName,

    mg: p.mg,
    tags: p.tags,
    category: p.category,
    categorySlug: p.categorySlug,
    format: p.format,
    formatSlug: p.formatSlug,

    price: p.price,
    oldPrice: p.oldPrice,
    currencyCode: p.currencyCode ?? 'AED',
    variantId: p.variantId,
    variantCount: p.variantCount,
    // Compact variant list — needed by the homepage bundles
    // (lib/bundles.ts matches exact strengths/formats such as "10mg" or
    // "Vial"). Without it every multi-variant bundle was hidden.
    variants: (p.variants ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      availableForSale: v.availableForSale,
    })),
    inStock: p.inStock,

    purity: p.purity,
    lot: p.lot,
    testDate: p.testDate,

    image: p.image,
    imageAlt: p.imageAlt,
    // First two only — cards never show a gallery, and full image arrays on
    // 40 products are a meaningful slice of the payload.
    images: (p.images ?? []).slice(0, 2),

    color: p.color,

    // Deliberately omitted: description, descriptionHtml, longDesc, sequence,
    // coaUrl, updatedAt, and the full variants array. All of those are
    // product-page concerns and together they were the bulk of the payload.
  }
}

// Rebuild at most every 5 minutes. Prices and stock rarely move faster than
// that, and it keeps the page on the edge cache the rest of the time.
export const revalidate = 300

/**
 * Handles of the listed products ranked by how many paid orders included
 * them, most first — the "What researchers order most" rail (brief A8).
 * Order lines store product titles, so they are matched to listed products
 * by title. Withdrawn products never match because getProducts() has
 * already dropped them. Any failure (no Redis at build time) returns [] and
 * the rail falls back to its fixed list.
 */
async function popularHandlesFor(products: any[]): Promise<string[]> {
  try {
    const { orders } = await listAllOrders(2000, 0)
    const norm = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const byTitle = new Map<string, string>()
    for (const p of products) byTitle.set(norm(p.title), p.handle)
    const counts = new Map<string, number>()
    for (const o of orders) {
      if (!isPaidOrder(o)) continue
      const inOrder = new Set<string>()
      for (const line of o.products || []) {
        const handle = byTitle.get(norm(line.title))
        if (handle) inOrder.add(handle)
      }
      for (const h of inOrder) counts.set(h, (counts.get(h) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([h]) => h)
  } catch (err) {
    console.error('[home] Could not rank products by orders:', err)
    return []
  }
}

export default async function Home() {
  // Baseline market. Not the visitor's real country — that's resolved
  // client-side by CountryProvider, which is what allows this page to stay
  // static. AED is the currency Shopify actually charges in, so it's also the
  // safest thing to have in the cached HTML that crawlers see.
  const country = 'AE'

  let initialProducts: any[] = []
  let popularHandles: string[] = []
  try {
    const raw = await getProducts(40, country)
    initialProducts = raw.map(pickCardFields)
    popularHandles = await popularHandlesFor(raw)
  } catch (err) {
    // Same reasoning as sitemap.ts: never let a Shopify hiccup 500 the
    // homepage. HomePageContent's own client-side fetch (with its existing
    // loadError/retry state) picks up the slack if this comes back empty.
    console.error('[home] Server-side product fetch failed:', err)
  }

  return <HomePageContent initialProducts={initialProducts} initialCountry={country} popularHandles={popularHandles} />
}