// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/shopify'

const BASE_URL = 'https://www.pepcolab.com'

type StaticRoute = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

/**
 * Excluded deliberately: /checkout/*, /api/*, /not-found.
 * Also excluded: /products?cat=… — query-string variants of an already-listed
 * page. They compete with /products for the same content. If you want category
 * pages indexed, make them real routes (/products/category/[cat]) with unique
 * copy, then add them here.
 */
const STATIC_ROUTES: StaticRoute[] = [
  { path: '/',             changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/products',     changeFrequency: 'daily',   priority: 0.9 },
  { path: '/certificates', changeFrequency: 'daily',   priority: 0.9 },
  { path: '/bundles',      changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/research',     changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/guides',       changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/tools',        changeFrequency: 'monthly', priority: 0.6 },
  { path: '/about',        changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq',          changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact',      changeFrequency: 'monthly', priority: 0.5 },
  { path: '/shipping',     changeFrequency: 'monthly', priority: 0.4 },
  { path: '/terms',        changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/privacy',      changeFrequency: 'yearly',  priority: 0.2 },
]

export const revalidate = 3600 // re-generate hourly so new products appear

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // NOTE: matches the cap used in generateStaticParams in products/[slug]/page.tsx.
  // Raise BOTH together if the catalogue ever exceeds 250 — Shopify's Storefront
  // API pages at 250 max, above which you need cursor pagination.
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const products = await getProducts(250)
    productEntries = products
      .filter((p) => p.handle)
      .map((p) => ({
        url: `${BASE_URL}/products/${p.handle}`,
        // Use Shopify's real updatedAt when we have it, so lastmod actually
        // means something to Google. `now` for every product on every hourly
        // regen was a false freshness signal that crawlers learn to ignore —
        // fall back to `now` only for the rare case updatedAt is missing.
        lastModified: (p as any).updatedAt ? new Date((p as any).updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch (err) {
    // Never let a Shopify outage 500 the sitemap — Google treats that as a hard
    // error and backs off re-crawling the whole file.
    console.error('[sitemap] Shopify product fetch failed:', err)
  }

  return [...staticEntries, ...productEntries]
}