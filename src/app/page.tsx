// src/app/page.tsx
//
// SSR: middleware.ts resolves the visitor's country from IP into a
// `pepcolab_country` cookie; layout.tsx feeds it to CountryProvider as
// `initialCountry` so `ready` is true on first render, and this page fetches
// products server-side for that country. The first HTML response therefore
// contains real products at the right price, and the client only refetches
// if the visitor switches markets.
//
// PAYLOAD: getProducts() returns the full product record — description,
// descriptionHtml, longDesc, sequence, every variant, every image. The
// homepage renders cards, which need almost none of that. Serialising all of
// it into the RSC flight payload was pushing the homepage HTML past 250 KB
// (~129 KB of it flight data), which delays hydration — and until hydration
// completes, no onClick handler on the page works, including the cart's.
// pickCardFields() below strips it to what the cards actually read.

import { cookies } from 'next/headers'
import HomePageContent from '@/components/HomePageContent'
import { getProducts } from '@/lib/shopify'

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
    badge:
      p.badge && ['popular', 'new', 'sale', 'bestseller'].includes(p.badge)
        ? p.badge
        : undefined,

    // Deliberately omitted: description, descriptionHtml, longDesc, sequence,
    // coaUrl, updatedAt, and the full variants array. All of those are
    // product-page concerns and together they were the bulk of the payload.
  }
}

export default async function Home() {
  // Next.js 15's cookies() is async — must be awaited.
  const country = (await cookies()).get('pepcolab_country')?.value ?? 'AE'

  let initialProducts: any[] = []
  try {
    const raw = await getProducts(40, country)
    initialProducts = raw.map(pickCardFields)
  } catch (err) {
    // Same reasoning as sitemap.ts: never let a Shopify hiccup 500 the
    // homepage. HomePageContent's own client-side fetch (with its existing
    // loadError/retry state) picks up the slack if this comes back empty.
    console.error('[home] Server-side product fetch failed:', err)
  }

  return <HomePageContent initialProducts={initialProducts} initialCountry={country} />
}