// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { cookies } from 'next/headers'
import './globals.css'

import { CartProvider } from '@/lib/cartContext'
import CartDrawer from '@/components/CartDrawer'
import { CountryProvider } from '@/lib/countryContext'
import AgeLocationGate from '@/components/AgeLocationGate'
import FloatingCalculator from '@/components/FloatingCalculator'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'

const siteUrl = 'https://www.pepcolab.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // No "user-scalable=no" — blocking pinch-zoom is a WCAG 2.1 failure (1.4.4).
  // No maximumScale — blocking pinch-zoom is a WCAG 2.1 failure (1.4.4).
  themeColor: '#050505',
  // 'light', not 'dark': the actual UI (Nav, CartDrawer, page content) is a
  // white/light theme — only AgeLocationGate's entry overlay is dark, and
  // it's a fully opaque full-screen layer with its own explicit colors
  // (including accent-color on its checkbox), so it doesn't need the
  // document-level scheme. Declaring 'dark' here was telling the browser
  // to render native chrome — scrollbars, unstyled form controls, the
  // default focus ring color — in dark mode on top of a light page, which
  // is a real (if subtle) visual mismatch on any control this codebase
  // hasn't explicitly re-themed.
  colorScheme: 'light',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  // UAE leads the title: the live catalogue is 34 UAE SKUs priced in AED.
  // Declaring UK-only while trading in AED suppresses you for the queries
  // that actually match your storefront.
  title: {
    default:
      'PepcoLab | Research-Grade Peptides & Laboratory Compounds — UAE & UK',
    template: '%s | PepcoLab',
  },

  description:
    'Research-grade peptides and laboratory compounds with published batch certificates of analysis and cold-chain dispatch across the UAE and UK. Supplied for in-vitro research use only.',

  applicationName: 'PepcoLab',
  referrer: 'origin-when-cross-origin',

  // No `keywords` — ignored by Google since 2009, and the old array named
  // Retatrutide and Semaglutide alongside "Dubai".

  authors: [{ name: 'PepcoLab', url: siteUrl }],
  creator: 'PepcoLab',
  publisher: 'PepcoLab',
  category: 'Scientific Research',

  // Relative canonical — resolved per-route against metadataBase.
  alternates: {
    canonical: '/',
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
    // ® removed throughout — see the note in the Store schema below.
    title: 'PepcoLab | Research-Grade Peptides & Laboratory Compounds',
    description:
      'Published batch certificates of analysis and cold-chain dispatch across the UAE and UK. Research use only.',
    url: siteUrl,
    siteName: 'PepcoLab',
    // Matches the UAE-primary decision already made in the title/description
    // above and middleware.ts's DEFAULT_COUNTRY — previously this said
    // 'en_GB' with 'en_AE' as the alternate, disagreeing with both.
    locale: 'en_AE',
    alternateLocale: ['en_GB'],
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
    // Was /pepcologo.png — a square logo on a summary_large_image card
    // letterboxes or gets rejected. Needs the 1200x630 asset.
    images: ['/pepcoall.png'],
  },

  appleWebApp: {
    capable: true,
    title: 'PepcoLab',
    statusBarStyle: 'black-translucent',
  },

  formatDetection: { telephone: false, email: false, address: false },

  // theme-color and mobile-web-app-capable are emitted by the `viewport`
  // export and `appleWebApp` above — don't duplicate them here.
  other: {
    'msapplication-TileColor': '#050505',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read the country middleware.ts already resolved (from
  // x-vercel-ip-country/geo) and persisted into a cookie, so CountryProvider
  // can start in its final state instead of always beginning at 'AE' and
  // waiting on a client-side /api/country fetch. This is what makes it safe
  // for page.tsx to server-render product data instead of the previous
  // dynamic(..., { ssr: false }) — see countryContext.tsx for the other half.
  // Next.js 15's cookies() is async — must be awaited (this is also why
  // the request.geo fallback in middleware.ts is only defensive: newer
  // Next versions removed it, the header is the reliable source).
  const initialCountry = (await cookies()).get('pepcolab_country')?.value

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

        {/* The STRABL SDK below is fetched from unpkg at runtime — this
            lets that connection start warming immediately instead of only
            once the lazyOnload <Script> actually requests it. */}
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />

        {/* No hardcoded <link rel="canonical"> here — metadata.alternates
            handles it per-route. A static one would point every page at the
            homepage. */}

        <link rel="preload" href="/pepcologo.png" as="image" />

        {/* ORGANIZATION SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              // legalName intentionally omitted: this previously said
              // "SEE BEE DEE LIMITED", but the only UK company matching
              // that exact name (13044306) is dissolved and appears
              // unrelated (farm address, agriculture SIC codes, dissolved
              // 2023) — not safe to keep without confirming your actual
              // current legal entity name against Companies House
              // directly. Add it back once verified.
              name: 'PepcoLab',
              url: siteUrl,
              logo: `${siteUrl}/pepcologo.png`,
              description:
                'Research-grade peptides and laboratory compounds for in-vitro research use.',
              email: 'hello@pepcolab.com',
              // RESOLVED (this session): confirmed via live search that
              // "SEE BEE DEE LTD" is a real UK company, but its actual
              // Companies House number is 13044306 — not 17072052 — and
              // that company is DISSOLVED (7 March 2023), registered to a
              // farm address in Maidstone, Kent, with no evident
              // connection to this business. The number/name pair
              // previously here didn't match anything real, so both the
              // `identifier` block and the incomplete `address` below were
              // removed entirely rather than publish a wrong legal
              // identifier — add them back with the real, verified
              // Companies House number and registered address once
              // confirmed against the actual incorporation certificate.
              areaServed: [
                { '@type': 'Country', name: 'United Arab Emirates' },
                { '@type': 'Country', name: 'United Kingdom' },
              ],
              // RESOLVED (this session): re-searched both — no pepcolab
              // Instagram or X/Twitter account turns up. Removed rather
              // than link to accounts that don't appear to exist; add
              // real profile URLs back here once they exist.
            }),
          }}
        />

        {/* WEBSITE SCHEMA
            No potentialAction/SearchAction — it pointed at /search?q={...}
            and that route doesn't exist. Add it back against
            /products?q={...} once search is wired up. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PepcoLab',
              url: siteUrl,
              inLanguage: ['en-AE', 'en-GB'],
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
              currenciesAccepted: 'AED, GBP',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'GB',
              },
              areaServed: ['United Arab Emirates', 'United Kingdom'],
            }),
          }}
        />
      </head>

      <body suppressHydrationWarning>
        {/* STRABL SDK — pinned to 1.0.2, the version this integration has
            been decompiled, verified, and tested against. @latest was
            letting a third-party publish silently change the live checkout
            with no deploy on our side — bump this deliberately when STRABL
            confirms a new version, not automatically. */}
        <Script
          src="https://unpkg.com/@strabl-engineering/checkout-sdk@1.0.2/dist/index.global.js"
          strategy="lazyOnload"
        />

        <CountryProvider initialCountry={initialCountry}>
          {/* Gate sits inside CountryProvider so a UAE/UK selection can call
              useCountry().setCountry() directly — one source of truth for
              market. Renders as a fixed overlay, so children still mount
              underneath and there's no SSR content flash. */}
          <AgeLocationGate />
          <CartProvider>
            {children}
            <CartDrawer />
            <FloatingCalculator />
            <FloatingWhatsApp />
          </CartProvider>
        </CountryProvider>
      </body>
    </html>
  )
}