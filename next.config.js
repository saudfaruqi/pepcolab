/** @type {import('next').NextConfig} */
const nextConfig = {
  // `images.domains` is deprecated in favour of `remotePatterns` (Next 13+) —
  // functionally identical here, but avoids the deprecation warning and lets
  // you scope to a path/protocol if you ever need to.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      // Hero/lifestyle imagery on /products (IMGS.hero, IMGS.lab) is served
      // from Unsplash, not Shopify — next/image throws at request time for
      // any remote host not explicitly allow-listed here, so this has to be
      // added before those two images can move off raw <img>.
      { protocol: 'https', hostname: 'images.unsplash.com' },
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
  //
  // SEO FIX: these destinations were pointing at the "-uae" slugs
  // (/products/semax-uae etc.), which middleware.ts now 301s onward to the
  // neutral canonical slug (toNeutralSlug() in lib/utils.ts). That made
  // every one of these a redirect CHAIN — 301 -> 301 -> final page — which
  // both wastes crawl budget and, per Google's own guidance, dilutes/delays
  // how much of the accumulated ranking signal actually reaches the final
  // URL. Pointing straight at the neutral slug collapses each of these back
  // to a single hop.
  // ---------------------------------------------------------------------
  async redirects() {
    return [
      // Confirmed indexed and ranking — highest priority
      { source: '/products/semax-2mg', destination: '/products/semax', permanent: true },
      { source: '/products/ghk-cu-5mg', destination: '/products/ghk-cu', permanent: true },

      // Old slugs from the previous catalogue that map to a live product
      { source: '/products/bpc-157-5mg', destination: '/products/bpc-157', permanent: true },
      { source: '/products/selank-5mg', destination: '/products/selank', permanent: true },
      { source: '/products/epithalon-5mg', destination: '/products/epithalon', permanent: true },
      { source: '/products/ipamorelin-2mg', destination: '/products/ipamorelin', permanent: true },

      // Discontinued lines with no direct equivalent.
      //
      // FIX (Sep 2026): these previously both landed on /products, the bare
      // collection page. Google treats a redirect to a generic hub as a soft
      // 404 and passes little or nothing through — the whole reason for
      // redirecting instead of 404ing is lost. Pointing each at the category
      // that actually matches the compound keeps the destination topically
      // relevant to the query the old URL used to rank for.
      //
      // FIX (Sep 2026): '/products/glp-1-tera-5mg' was ALSO listed in
      // middleware's DISCONTINUED_PRODUCT_REDIRECTS pointing at
      // /products/category/metabolic. next.config.js redirects resolve before
      // middleware runs, so the middleware entry could never execute and the
      // two silently disagreed. Resolved here, and removed from middleware.
      { source: '/products/tb-500-10mg', destination: '/products/category/recovery', permanent: true },
      { source: '/products/glp-1-tera-5mg', destination: '/products/category/metabolic', permanent: true },

      // Catch-all safety net for the old "-Nmg" slug pattern.
      //
      // Verified against the live catalogue before keeping this: no current
      // Shopify handle contains a "-Nmg" segment (handles are "{name}-uae",
      // e.g. bpc-157-uae), so this cannot capture a live product URL. Recheck
      // that assumption if the handle scheme ever changes — as written, a
      // handle like "bpc-157-10mg" would be 301'd off its own product page.
      //
      // Runs last; every specific rule above wins.
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