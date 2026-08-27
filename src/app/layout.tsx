// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

import { CartProvider } from '@/lib/cartContext'
import CartDrawer from '@/components/CartDrawer'
import { CountryProvider } from '@/lib/countryContext'
import { WishlistProvider } from '@/lib/wishlistContext'
import { RecentlyViewedProvider } from '@/lib/recentlyViewedContext'
import AgeLocationGate from '@/components/AgeLocationGate'
import FloatingCalculator from '@/components/FloatingCalculator'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'

const siteUrl = 'https://www.pepcolab.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#050505',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      'PepcoLab | Research-Grade Peptides & Laboratory Compounds — UAE',
    template: '%s | PepcoLab',
  },

  description:
    'Research-grade peptides and laboratory compounds with published batch certificates of analysis and cold-chain dispatch across the UAE. Supplied for in-vitro research use only.',

  applicationName: 'PepcoLab',
  referrer: 'origin-when-cross-origin',

  authors: [{ name: 'PepcoLab', url: siteUrl }],
  creator: 'PepcoLab',
  publisher: 'PepcoLab',
  category: 'Scientific Research',

  // MARKET FIX (Aug 2026): PepcoLab is UAE-only for now — the UK was never
  // actually a live, fulfilled market despite the dual-market hreflang/
  // schema/currency scaffolding that had been built out across the site
  // (see countryContext.tsx, Nav.tsx's currency switcher, and the
  // structured-data block below, all trimmed to AE-only alongside this).
  // A single en-AE self-reference + x-default is the correct annotation
  // for a single-market site; per-page overrides (products, guides,
  // research) that previously mirrored this en-GB/en-AE pattern in their
  // own generateMetadata() should be updated the same way.
  alternates: {
    canonical: '/',
    languages: {
      'en-AE': '/',
      'x-default': '/',
    },
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
    google: 'iSuNTQTsMQf9PHYe4l-b3sXHGl8F3qQ59OGo9qnTn18',
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: ['/favicon.ico'],
  },

  manifest: '/site.webmanifest',

  openGraph: {
    title: 'PepcoLab | Research-Grade Peptides & Laboratory Compounds',
    description:
      'Published batch certificates of analysis and cold-chain dispatch across the UAE. Research use only.',
    url: siteUrl,
    siteName: 'PepcoLab',
    locale: 'en_AE',
    type: 'website',
    images: [
      {
        url: '/pepcoall.png',
        width: 1200,
        height: 630,
        alt: 'PepcoLab research-grade peptide vials',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PepcoLab | Research-Grade Peptides & Laboratory Compounds',
    description:
      'Research compounds with published batch documentation and cold-chain dispatch.',
    creator: '@pepcolab',
    images: ['/pepcoall.png'],
  },

  appleWebApp: {
    capable: true,
    title: 'PepcoLab',
    statusBarStyle: 'black-translucent',
  },

  formatDetection: { telephone: false, email: false, address: false },

  other: {
    'msapplication-TileColor': '#050505',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // FIX (Aug 2026): this used to do
  //   const initialCountry = (await cookies()).get('pepcolab_country')?.value
  // and pass it down to CountryProvider so it could start "ready" on the
  // very first render — see countryContext.tsx's own comment on why that
  // mattered (it's what let page.tsx server-render product data at all).
  //
  // The problem: `cookies()` is a Next.js "Dynamic API" — calling it
  // ANYWHERE in the layout chain opts the entire route tree under it into
  // dynamic (per-request) rendering, which is exactly the 1.5s-TTFB,
  // never-edge-cached problem page.tsx's own header comment describes
  // fixing. That fix was real for page.tsx in isolation, but this file
  // was silently cancelling it out — the homepage (and everything else
  // under this layout) was almost certainly still rendering dynamically
  // on every request despite `export const revalidate = 300`.
  //
  // Since RootLayout is itself a Server Component that can't safely read
  // a per-visitor cookie without forcing dynamic rendering, initialCountry
  // is no longer resolved here at all. CountryProvider falls back to its
  // existing client-side chain instead (see countryContext.tsx): checked,
  // in order, are localStorage (an explicit prior choice), the
  // `pepcolab_country` cookie via `document.cookie` (fast, synchronous,
  // no network — set by middleware.ts on every request, and still fully
  // intact, just no longer read server-side here), and only as a last
  // resort `/api/country`. For a returning or already-geo-tagged visitor
  // this resolves within the same tick after mount; for a genuinely new
  // visitor with no cookie yet, there's a brief flash before it resolves.
  // Low-stakes now that there's a single market/currency (AED) — this
  // flash used to matter more when it could show the wrong currency
  // briefly; now it's just the "ready" gate settling.
  //
  // If you want to eliminate that flash entirely while KEEPING static
  // rendering, the real fix is Next.js Partial Prerendering (PPR): a
  // static shell with just the country-dependent bits in a Suspense
  // boundary that reads cookies(). That needs `experimental.ppr` enabled
  // and a compatible Next.js version — worth checking your next.config
  // before taking it on, since it wasn't included in this file set.

  return (
    <html lang="en-AE" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
        <link rel="preload" href="/pepcologo.png" as="image" />

        {/* ORGANIZATION SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PepcoLab',
              url: siteUrl,
              logo: `${siteUrl}/pepcologo.png`,
              description:
                'Research-grade peptides and laboratory compounds for in-vitro research use.',
              email: 'hello@pepcolab.com',
              areaServed: [
                { '@type': 'Country', name: 'United Arab Emirates' },
              ],
            }),
          }}
        />

        {/* WEBSITE SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PepcoLab',
              url: siteUrl,
              inLanguage: ['en-AE'],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'PepcoLab',
              image: `${siteUrl}/pepcoall.png`,
              url: siteUrl,
              priceRange: 'AED 40 – AED 930',
              paymentAccepted: ['Credit Card', 'Apple Pay', 'Google Pay'],
              // MARKET FIX (Aug 2026): PepcoLab is UAE-only for now — see
              // the note on `alternates` above. Dropped GBP/UK from every
              // spot in this file that previously declared them (this
              // schema, the two above it, and the metadata/openGraph
              // blocks up top) so structured data stops telling Google
              // this ships to a market it doesn't currently serve.
              currenciesAccepted: 'AED',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'AE',
              },
              areaServed: ['United Arab Emirates'],
            }),
          }}
        />
      </head>

      <body suppressHydrationWarning>
        <Script
          src="https://unpkg.com/@strabl-engineering/checkout-sdk@1.0.2/dist/index.global.js"
          strategy="lazyOnload"
        />

        <CountryProvider>
          <AgeLocationGate />
          <WishlistProvider>
            <RecentlyViewedProvider>
              <CartProvider>
                {children}
                <CartDrawer />
                <FloatingCalculator />
                <FloatingWhatsApp />
              </CartProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </CountryProvider>
      </body>
    </html>
  )
}