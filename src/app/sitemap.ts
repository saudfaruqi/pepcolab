// src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/shopify'
import { CATEGORIES } from '@/app/data'
import { GUIDES } from '@/lib/guides-data'
import { ARTICLES } from '@/lib/research-data'
import { LEGAL_NOTES } from '@/lib/legal-data'
import { COMPARISONS } from '@/lib/comparisons-data'
import { toNeutralSlug } from '@/lib/utils'

const BASE_URL = 'https://www.pepcolab.com'

type StaticRoute = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

/**
 * Excluded deliberately: /checkout/*, /api/*, /not-found.
 * /products?cat=… (the query-string filter) stays excluded — it
 * self-canonicals to /products. The 7 real category routes below
 * (/products/category/[cat], added for exactly this reason — see that
 * page's file header) are what get indexed per-category now.
 */
const STATIC_ROUTES: StaticRoute[] = [
  { path: '/',             changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/products',     changeFrequency: 'daily',   priority: 0.9 },
  { path: '/certificates', changeFrequency: 'daily',   priority: 0.9 },
  { path: '/bundles',      changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/research',     changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/guides',       changeFrequency: 'weekly',  priority: 0.8 },
  // New Phase 1 content — see growth-playbook §04. High-intent,
  // zero-competition clusters, so given priority just under the hub pages.
  // UK market entry page (Sep 2026). Priority sits with the other
  // high-intent cluster hubs: it is the only URL on the site currently
  // targeting UK-qualified queries, and it is what gives Google a reason to
  // associate the domain with the UK before any UK catalogue exists.
  { path: '/uk',           changeFrequency: 'weekly',  priority: 0.8  },
  // Reviews (Sep 2026). Social proof is the one thing every competitor above
  // us in the SERPs shows and we don't — worth its own indexable URL rather
  // than only existing scattered across product pages.
  { path: '/reviews',      changeFrequency: 'weekly',  priority: 0.7  },
  // New reference and market pages (Sep 2026). /storage and /testing target
  // high-intent informational queries the catalogue cannot rank for; /dubai
  // defends the geography no competitor is contesting; /bulk-orders opens a
  // buying route the product copy already promised.
  { path: '/storage',      changeFrequency: 'monthly', priority: 0.75 },
  { path: '/testing',      changeFrequency: 'monthly', priority: 0.8  },
  { path: '/dubai',        changeFrequency: 'weekly',  priority: 0.8  },
  { path: '/bulk-orders',  changeFrequency: 'monthly', priority: 0.7  },
  { path: '/help',         changeFrequency: 'monthly', priority: 0.6  },
  { path: '/reviews/write', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/legal',        changeFrequency: 'weekly',  priority: 0.75 },
  { path: '/compare',      changeFrequency: 'weekly',  priority: 0.75 },
  { path: '/longevity',    changeFrequency: 'weekly',  priority: 0.75 },
  { path: '/aesthetic',    changeFrequency: 'weekly',  priority: 0.75 },
  { path: '/recovery',     changeFrequency: 'weekly',  priority: 0.75 },
  { path: '/cognitive',    changeFrequency: 'weekly',  priority: 0.75 },
  { path: '/metabolic',    changeFrequency: 'weekly',  priority: 0.75 },
  { path: '/tools',        changeFrequency: 'monthly', priority: 0.6 },
  { path: '/about',        changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faq',          changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact',      changeFrequency: 'monthly', priority: 0.5 },
  { path: '/shipping',     changeFrequency: 'monthly', priority: 0.4 },
  { path: '/terms',        changeFrequency: 'yearly',  priority: 0.2 },
  { path: '/privacy',      changeFrequency: 'yearly',  priority: 0.2 },
]

// One entry per real category slug (excludes the synthetic 'all' entry in
// CATEGORIES). Priority sits just under /products itself.
const CATEGORY_ROUTES: StaticRoute[] = CATEGORIES.filter((c) => c.slug !== 'all').map(
  (c) => ({ path: `/products/category/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.85 })
)

export const revalidate = 3600 // regenerate hourly so new products appear

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [...STATIC_ROUTES, ...CATEGORY_ROUTES].map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // NOTE: getProducts is called WITHOUT a country argument on purpose.
  //
  // That returns the unfiltered catalogue — both the `uae` and `uk` tagged
  // products. There is one URL per product and one canonical per URL, so
  // every product must be in the sitemap regardless of which market sells
  // it. Passing a country here would silently drop the other market's
  // products from the sitemap and, over time, from the index.
  //
  // Keep the 250 cap in sync with generateStaticParams in
  // products/[slug]/page.tsx. Shopify's Storefront API pages at 250 max;
  // above that you need cursor pagination.
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const products = await getProducts(250)
    productEntries = products
      .filter((p) => p.handle)
      .map((p) => ({
        // SEO FIX: canonical is now the neutral (no "-uae") slug — see
        // toNeutralSlug() in lib/utils.ts. The sitemap must only ever list
        // the canonical URL, never the legacy one middleware.ts redirects.
        url: `${BASE_URL}/products/${toNeutralSlug(p.handle)}`,
        // Real per-product timestamp from Shopify rather than `now`.
        // Stamping every product with the current time on each hourly
        // regeneration tells Google "everything changed, every hour", which
        // gets discounted as a freshness signal instead of trusted.
        lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch (err) {
    // Never let a Shopify outage 500 the sitemap — Google treats that as a
    // hard error and backs off re-crawling the whole file.
    console.error('[sitemap] Shopify product fetch failed:', err)
  }

  // SEO FIX (Aug 2026 audit): "15 quality articles published but
  // orphaned — none in sitemap." Both routes have real per-article
  // metadata/schema already (see app/guides/[slug]/page.tsx and
  // app/research/[slug]/page.tsx) — they just never appeared here, so
  // Google had no path to discover them beyond an unlinked crawl.
  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${BASE_URL}/guides/${g.id}`,
    lastModified: g.publishedISO ? new Date(g.publishedISO) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  const researchEntries: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${BASE_URL}/research/${a.id}`,
    lastModified: a.dateISO ? new Date(a.dateISO) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  const legalEntries: MetadataRoute.Sitemap = LEGAL_NOTES.map((n) => ({
    url: `${BASE_URL}/legal/${n.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const comparisonEntries: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${BASE_URL}/compare/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.65,
  }))

  return [...staticEntries, ...productEntries, ...guideEntries, ...researchEntries, ...legalEntries, ...comparisonEntries]
}