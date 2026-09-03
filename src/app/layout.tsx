// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cartContext'
import CartDrawer from '@/components/CartDrawer'
import { CountryProvider } from '@/lib/countryContext'
import { WishlistProvider } from '@/lib/wishlistContext'
import { RecentlyViewedProvider } from '@/lib/recentlyViewedContext'
import AgeLocationGate from '@/components/AgeLocationGate'
import FloatingCalculator from '@/components/FloatingCalculator'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import ChatWidget from '@/components/ChatWidget'

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

  // DUAL MARKET (Sep 2026): the site previously declared itself UAE-only at
  // every global level — title, description, html lang, hreflang, and both
  // schema blocks — while individual product pages already emitted an en-GB
  // hreflang. Google was getting two contradictory answers about who this
  // site is for. Everything below now says the same thing: one organisation,
  // two markets, shipping live in the UAE and announced for the UK.
  //
  // Nothing here claims UK fulfilment. UK is described as launching, which
  // is both true and the claim the /uk page is built to support.
  title: {
    default:
      'PepcoLab | Research-Grade Peptides & Laboratory Compounds — UAE & UK',
    template: '%s | PepcoLab',
  },

  description:
    'Research-grade peptides and laboratory compounds with independently tested, batch-matched certificates of analysis and cold-chain dispatch. Shipping across the UAE; United Kingdom launching soon. Supplied for in-vitro research use only.',

  applicationName: 'PepcoLab',
  referrer: 'origin-when-cross-origin',

  authors: [{ name: 'PepcoLab', url: siteUrl }],
  creator: 'PepcoLab',
  publisher: 'PepcoLab',
  category: 'Scientific Research',

  alternates: {
    canonical: '/',
    // One URL serving both regions in the same language, so the correct
    // pattern is self-referencing annotations per locale rather than
    // separate /ae and /uk URL trees. This now matches what
    // products/[slug]/page.tsx has been emitting since August.
    languages: {
      'en-AE': '/',
      'en-GB': '/',
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
      'Independently tested, batch-matched certificates of analysis and cold-chain dispatch. UAE now, UK launching soon. Research use only.',
    url: siteUrl,
    siteName: 'PepcoLab',
    locale: 'en_AE',
    alternateLocale: ['en_GB'],
    type: 'website',
    images: [
      {
        // WAS: /pepcoall.png — a 2.7 MB PNG, and the single most-shared
        // brand surface on the site. Replaced with a 31 KB typographic card
        // built from the real logo. See the audit note: the old image was an
        // AI render whose labels read "Pepco Lau.", "Selenk", "CIC-1295" and
        // "Semaolutide", and it showed compounds no longer stocked.
        url: '/og-pepcolab.jpg',
        width: 1200,
        height: 630,
        alt: 'PepcoLab — research-grade peptides, independently tested and lot-traced',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PepcoLab | Research-Grade Peptides & Laboratory Compounds',
    description:
      'Research compounds with independently tested, batch-matched documentation and cold-chain dispatch.',
    creator: '@pepcolab',
    images: ['/og-pepcolab.jpg'],
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
  return (
    // WAS lang="en-AE". A region-locked root language tag on a site that also
    // targets the UK undercuts the en-GB hreflang. Plain "en" is the correct
    // root value; region targeting is carried by hreflang, not by lang.
    <html lang="en" suppressHydrationWarning>
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
        {/* Shopify CDN serves every product image — resolving DNS and TLS
            up front removes a round-trip from the first product card paint. */}
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="preload" href="/pepcologo.png" as="image" />

        {/* ORGANIZATION SCHEMA
            areaServed now covers both markets. This is the entity-level
            statement of who PepcoLab serves, and it is the block Google reads
            when deciding which regions the brand is relevant to. */}
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
                'Supplier of research-grade peptides and laboratory compounds for in-vitro research use, with independently tested, batch-matched certificates of analysis.',
              email: 'hello@pepcolab.com',
              areaServed: [
                { '@type': 'Country', name: 'United Arab Emirates' },
                { '@type': 'Country', name: 'United Kingdom' },
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
              inLanguage: ['en-AE', 'en-GB'],
            }),
          }}
        />

        {/* STORE SCHEMA
            Deliberately NOT extended to the UK. The organisation serves both
            markets; the store currently transacts in one. Claiming UK
            availability in commerce schema while no UK catalogue exists is
            the kind of mismatch that earns a manual action, and it would be
            contradicted by the site's own checkout. Add GB here on the same
            day UK_CHECKOUT_LIVE flips in lib/pricing.ts — not before. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'PepcoLab',
              image: `${siteUrl}/og-pepcolab.jpg`,
              url: siteUrl,
              priceRange: 'AED 40 – AED 930',
              paymentAccepted: ['Credit Card', 'Apple Pay', 'Google Pay'],
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
          src="https://www.googletagmanager.com/gtag/js?id=G-8SE9C30NMW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8SE9C30NMW');
          `}
        </Script>

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
                <ChatWidget />
              </CartProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </CountryProvider>
        <Analytics />
      </body>
    </html>
  )
}