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
  userScalable: true,
  themeColor: '#050505',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      'PepcoLab | Research-Grade Peptides & Laboratory Compounds — UAE & UK',
    template: '%s | PepcoLab',
  },

  description:
    'Research-grade peptides and laboratory compounds with published batch certificates of analysis and cold-chain dispatch across the UAE and UK. Supplied for in-vitro research use only.',

  applicationName: 'PepcoLab',
  referrer: 'origin-when-cross-origin',

  authors: [{ name: 'PepcoLab', url: siteUrl }],
  creator: 'PepcoLab',
  publisher: 'PepcoLab',
  category: 'Scientific Research',

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
    title: 'PepcoLab | Research-Grade Peptides & Laboratory Compounds',
    description:
      'Published batch certificates of analysis and cold-chain dispatch across the UAE and UK. Research use only.',
    url: siteUrl,
    siteName: 'PepcoLab',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <Script
          src="https://unpkg.com/@strabl-engineering/checkout-sdk@1.0.2/dist/index.global.js"
          strategy="lazyOnload"
        />

        <CountryProvider initialCountry={initialCountry}>
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