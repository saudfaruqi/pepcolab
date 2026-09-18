// src/app/robots.ts
import type { MetadataRoute } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pepcolab.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/checkout',
          '/checkout/',
          '/cart',
          // '/_next/' is deliberately NOT blocked (Sep 2026): it holds the
          // CSS, JavaScript and optimised images (/_next/image) Google needs
          // to render pages and index product photos. Blocking it made pages
          // look broken to Googlebot and kept images out of image search.
          '/admin',
          '/admin/',
          // Personal, and a signed-out crawler would only ever see the login
          // screen — nothing here is worth a crawl budget.
          '/account',
          '/account/',
          // CRAWL BUDGET (Sep 2026). Search Console shows 10 pages
          // "Discovered — currently not indexed" with no crawl attempted,
          // including /shipping and /terms, which ARE linked from the footer.
          // That is not a linking problem, it is rationing: a young domain
          // with 171 routes gets a small crawl allowance, and Google is
          // spending part of it on filtered variants that only ever resolve
          // to a canonical elsewhere. /products?cat= is already reported as
          // "Alternate page with proper canonical" — correctly handled, but
          // still crawled. Blocking the parameter frees that budget for the
          // pages that should rank.
          '/products?cat=',
          '/search',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}