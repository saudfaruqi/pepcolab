/** @type {import('next').NextConfig} */
const nextConfig = {
  // `images.domains` is deprecated in favour of `remotePatterns` (Next 13+) —
  // functionally identical here, but avoids the deprecation warning and lets
  // you scope to a path/protocol if you ever need to.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },

  // Removes the `X-Powered-By: Next.js` response header. Not an SEO factor,
  // but free — no reason to hand out your framework fingerprint to every
  // request when it costs one config line to stop.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Baseline security headers. Doesn't move rankings directly, but
        // Chrome/Safari surface some of these in dev tools and security
        // scanners, and it's the kind of thing that's genuinely free to add
        // and awkward to explain not having on a health/research-adjacent
        // commerce site.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Long, immutable caching for product images fetched through Next's
        // image optimizer — these URLs are content-hashed by Shopify's CDN,
        // so it's safe to cache aggressively. Shaves repeat-visit load time,
        // which factors into Core Web Vitals.
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig