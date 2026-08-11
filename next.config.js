/** @type {import('next').NextConfig} */
const nextConfig = {
  // `images.domains` is deprecated in favour of `remotePatterns` (Next 13+) —
  // functionally identical here, but avoids the deprecation warning and lets
  // you scope to a path/protocol if you ever need to.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
    // Serve AVIF/WebP where the browser supports it. Product photos are the
    // heaviest thing on your collection page, and this is a direct LCP win —
    // AVIF typically lands 30-50% smaller than the equivalent WebP.
    formats: ['image/avif', 'image/webp'],
    // Idiomatic way to hold optimised images in the cache. Preferred over a
    // manual Cache-Control header on /_next/image, which overrides Next's own
    // cache logic and can serve stale renders. 31536000 = one year.
    minimumCacheTTL: 31536000,
  },

  // Removes the `X-Powered-By: Next.js` response header. Not an SEO factor,
  // but free — no reason to hand out your framework fingerprint to every
  // request when it costs one config line to stop.
  poweredByHeader: false,

  // ---------------------------------------------------------------------
  // LEGACY SLUG REDIRECTS
  //
  // These are pre-UAE-catalogue product URLs that Google still has indexed
  // and is still serving. Search Console shows /products/semax-2mg at
  // position 3.8 and /products/ghk-cu-5mg at position 4.5 — the two highest
  // positions on the entire site, better than the homepage — both returning
  // 404 and converting 26 impressions into zero clicks.
  //
  // 301s pass the accumulated ranking signal to the live URLs instead of
  // discarding it. Check Search Console → Indexing → Pages for any other
  // legacy slugs still indexed and add them here.
  // ---------------------------------------------------------------------
  async redirects() {
    return [
      // Confirmed indexed and ranking — highest priority
      { source: '/products/semax-2mg', destination: '/products/semax-uae', permanent: true },
      { source: '/products/ghk-cu-5mg', destination: '/products/ghk-cu-uae', permanent: true },

      // Old slugs from the previous catalogue that map to a live product
      { source: '/products/bpc-157-5mg', destination: '/products/bpc-157-uae', permanent: true },
      { source: '/products/selank-5mg', destination: '/products/selank-uae', permanent: true },
      { source: '/products/epithalon-5mg', destination: '/products/epithalon-uae', permanent: true },
      { source: '/products/ipamorelin-2mg', destination: '/products/ipamorelin-uae', permanent: true },

      // Discontinued lines with no direct equivalent — send to the catalogue
      // rather than 404. TB-500 is no longer stocked; glp-1-tera has no
      // successor product.
      { source: '/products/tb-500-10mg', destination: '/products', permanent: true },
      { source: '/products/glp-1-tera-5mg', destination: '/products', permanent: true },

      // Catch-all safety net: any remaining /products/*-Nmg style slug from
      // the old catalogue lands on the collection page instead of a 404.
      // Runs last, so the specific rules above always win.
      {
        source: '/products/:slug(.*-\\d+mg)',
        destination: '/products',
        permanent: true,
      },
    ]
  },

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
      // NOTE: the manual Cache-Control block on /_next/image has been removed
      // in favour of `images.minimumCacheTTL` above. Setting the header by
      // hand overrides Next's own cache invalidation on the optimiser route,
      // which can pin a stale render of a product image even after you swap
      // the source file in Shopify — exactly the situation you'd hit next
      // time you replace a product photo.
    ]
  },
}

module.exports = nextConfig