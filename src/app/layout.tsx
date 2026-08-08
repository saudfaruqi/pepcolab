// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

import { CartProvider } from '@/lib/cartContext'
import CartDrawer from '@/components/CartDrawer'
import { CountryProvider } from '@/lib/countryContext'

const siteUrl = 'https://www.pepcolab.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // REMOVED maximumScale: 1 — it blocks pinch-zoom, which is a WCAG 2.1
  // failure (1.4.4 Resize Text) and hurts mobile usability on a spec-heavy site.
  themeColor: '#050505',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: 'PepcoLab® | Research-Grade Peptides & Laboratory Compounds UK',
    template: '%s | PepcoLab',
  },

  description:
    'Research-grade peptides and laboratory compounds with independent HPLC batch verification, published certificates of analysis, and cold-chain dispatch. Supplied for in-vitro research use only.',

  applicationName: 'PepcoLab',
  referrer: 'origin-when-cross-origin',

  // REMOVED the `keywords` array entirely.
  // Google has ignored meta keywords since 2009 — it is pure downside. The old
  // array also indexed your intent for a regulator: it named Retatrutide,
  // Tirzepatide and Semaglutide alongside "Dubai" and "Abu Dhabi".

  authors: [{ name: 'PepcoLab', url: siteUrl }],
  creator: 'PepcoLab',
  publisher: 'PepcoLab',
  category: 'Scientific Research',

  // CRITICAL FIX: canonical is now a RELATIVE path. Combined with
  // metadataBase, Next resolves it per-route. The previous absolute
  // `canonical: siteUrl` told Google that EVERY page was a duplicate of the
  // homepage. `alternates.languages` was also removed — both hreflang entries
  // pointed at the same URL, which is a no-op at best and a conflict signal at
  // worst. Add it back only when you have genuinely separate /uae/ pages.
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
      { url: '/pepcologo.png' },
      { url: '/pepcologo.png', type: 'image/png', sizes: '32x32' },
      { url: '/pepcologo.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/pepcologo.png', sizes: '180x180' }],
    shortcut: ['/pepcologo.png'],
  },

  manifest: '/site.webmanifest',

  openGraph: {
    title: 'PepcoLab® | Research-Grade Peptides & Laboratory Compounds',
    description:
      'Independent batch verification, published COAs, and cold-chain dispatch. Research use only.',
    url: siteUrl,
    siteName: 'PepcoLab',
    locale: 'en_GB',
    type: 'website',
    countryName: 'United Kingdom',
    images: [
      {
        url: '/pepcoall.png',
        width: 1200,
        height: 630,
        alt: 'PepcoLab Research-Grade Peptides',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PepcoLab® | Research-Grade Peptides & Laboratory Compounds',
    description:
      'Research-grade compounds with transparent COA documentation and independent testing.',
    creator: '@pepcolab',
    images: ['/pepcologo.png'],
  },

  appleWebApp: {
    capable: true,
    title: 'PepcoLab',
    statusBarStyle: 'black-translucent',
  },

  formatDetection: { telephone: false, email: false, address: false },

  // TRIMMED: theme-color and mobile-web-app-capable are already emitted by the
  // `viewport` export and `appleWebApp` above — duplicating them here produced
  // two of each tag. geo_region / coverage / distribution / target / audience /
  // classification / designer / owner are all non-standard tags that no search
  // engine reads. Removed as dead weight.
  other: {
    'msapplication-TileColor': '#050505',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        {/* FONTS — the previous href was "https://://fonts.googleapis.com/..."
            which is a malformed URL. It has been failing silently in
            production, so the entire site has been rendering in fallback
            system fonts. Fixed below. */}
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

        {/* REMOVED: <link rel="canonical" href={siteUrl} />
            This was hardcoded to the homepage on every single route, and it
            also duplicated the canonical emitted by metadata.alternates.
            The metadata export above now handles it correctly per-page. */}

        {/* REMOVED: duplicate <meta name="google-site-verification"> —
            metadata.verification already emits it. */}

        <link rel="preload" href="/pepcologo.png" as="image" />

        {/* ORGANIZATION SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PepcoLab',
              legalName: 'SEE BEE DEE LIMITED',
              url: siteUrl,
              logo: `${siteUrl}/pepcologo.png`,
              description:
                'Research-grade peptides and laboratory compounds for in-vitro research use.',
              email: 'hello@pepcolab.com',
              // TODO: add the real registered address. An addressCountry with
              // no street/locality is an incomplete PostalAddress and Google
              // may ignore the whole block.
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'GB',
              },
              identifier: {
                '@type': 'PropertyValue',
                name: 'Companies House',
                value: '17072052',
              },
              areaServed: [{ '@type': 'Country', name: 'United Kingdom' }],
              // TODO: remove any sameAs entry whose profile does not actually
              // exist — a 404 here is a negative trust signal.
              sameAs: [
                'https://instagram.com/pepcolab',
                'https://x.com/pepcolab',
              ],
            }),
          }}
        />

        {/* WEBSITE SCHEMA
            REMOVED the SearchAction potentialAction — it pointed at
            /search?q={...}, and there is no /search route in the app. Declaring
            a search endpoint that 404s is invalid structured data. Add it back
            when the route exists (your Nav already links to /products?q=…, so
            that is the URL to use). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'PepcoLab',
              url: siteUrl,
            }),
          }}
        />

        {/* STORE SCHEMA
            REMOVED telephone: '+44' — that is a country dialling code, not a
            phone number, and it invalidates the block. Either put the real
            E.164 number in or leave the field out entirely (done here). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'PepcoLab',
              image: `${siteUrl}/pepcoall.png`,
              url: siteUrl,
              priceRange: '££',
              paymentAccepted: ['Credit Card', 'Apple Pay', 'Google Pay'],
              currenciesAccepted: 'GBP',
              address: { '@type': 'PostalAddress', addressCountry: 'GB' },
              areaServed: 'United Kingdom',
            }),
          }}
        />
      </head>

      <body suppressHydrationWarning>
        {/* STRABL SDK — moved off `beforeInteractive`.
            beforeInteractive blocks first render on EVERY page for a script
            only the checkout needs, and it loads @latest from a third-party
            CDN, so an upstream publish can change your checkout without a
            deploy. Two changes:
              1. lazyOnload here, or better: move this <Script> into
                 src/app/checkout/page.tsx so it only loads where it is used.
              2. Pin the version — replace @latest with the exact version you
                 have tested. */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@strabl-engineering/checkout-sdk@latest/dist/index.global.js"
          strategy="lazyOnload"
        />

        <CountryProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </CountryProvider>
      </body>
    </html>
  )
}