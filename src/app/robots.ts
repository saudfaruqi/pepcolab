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
          '/_next/',
          '/admin',
          '/admin/',
          // Personal, and a signed-out crawler would only ever see the login
          // screen — nothing here is worth a crawl budget.
          '/account',
          '/account/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}