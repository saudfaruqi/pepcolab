import type { Metadata, Viewport } from 'next'
import './globals.css'

import { CartProvider } from '@/lib/cartContext'
import CartDrawer from '@/components/CartDrawer'
import { CountryProvider } from '@/lib/countryContext'

const siteUrl = 'https://www.pepcolab.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050505',
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      'PepcoLab® | Research-Grade Peptides & Laboratory Compounds UK & UAE',
    template: '%s | PepcoLab',
  },

  description:
    'PepcoLab supplies premium research-grade peptides and laboratory compounds for scientific and in-vitro research applications. Independently verified batches, COA transparency, cold-chain dispatch, and international laboratory sourcing for UK and UAE researchers.',

  applicationName: 'PepcoLab',

  referrer: 'origin-when-cross-origin',

  keywords: [
    'research peptides UK',
    'research peptides UAE',
    'research compounds UK',
    'research compounds Dubai',
    'research peptides London',
    'research peptides Abu Dhabi',
    'research compounds UAE',
    'research laboratory compounds',
    'laboratory peptides',
    'research use only peptides',
    'research chemicals UK',
    'research chemicals UAE',
    'HPLC tested peptides',
    'COA verified peptides',
    'cold-chain peptide delivery',
    'premium laboratory compounds',
    'peptide supplier UK',
    'peptide supplier UAE',
    'BPC-157 research peptide',
    'TB-500 peptide',
    'GHK-Cu copper peptide',
    'Semaglutide research compound',
    'Tirzepatide research peptide',
    'Retatrutide research peptide',
    'CJC-1295 peptide',
    'Ipamorelin peptide',
    'Sermorelin peptide',
    'Tesamorelin peptide',
    'Semax peptide',
    'Selank peptide',
    'Dihexa peptide',
    'Melanotan II research peptide',
    'PT-141 peptide',
    'MOTS-c peptide',
    'Humanin peptide',
    'Thymosin Alpha-1 peptide',
    'scientific research compounds',
    'laboratory-grade peptides',
    'peptide COA verification',
    'independent batch testing',
    'research-use-only compounds',
  ],

  authors: [
    {
      name: 'PepcoLab',
      url: siteUrl,
    },
  ],

  creator: 'PepcoLab',

  publisher: 'PepcoLab',

  category: 'Scientific Research',

  alternates: {
    canonical: siteUrl,
    languages: {
      'en-GB': siteUrl,
      'en-AE': siteUrl,
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
      {
        url: '/favicon.ico',
      },
      {
        url: '/icon-32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/icon-192.png',
        type: 'image/png',
        sizes: '192x192',
      },
    ],

    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
      },
    ],

    shortcut: ['/favicon.ico'],
  },

  manifest: '/site.webmanifest',

  openGraph: {
    title:
      'PepcoLab® | Research-Grade Peptides & Laboratory Compounds',

    description:
      'Premium laboratory compounds and research peptides with independent batch verification, COA transparency, and cold-chain UK & UAE distribution.',

    url: siteUrl,

    siteName: 'PepcoLab',

    locale: 'en_GB',

    type: 'website',

    countryName: 'United Kingdom',

    images: [
      {
        url: '/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'PepcoLab Research-Grade Peptides',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',

    title:
      'PepcoLab® | Research-Grade Peptides & Laboratory Compounds',

    description:
      'Research-grade peptides with transparent COA documentation, independent testing, and cold-chain dispatch.',

    creator: '@pepcolab',

    images: ['/og-cover.jpg'],
  },

  appleWebApp: {
    capable: true,
    title: 'PepcoLab',
    statusBarStyle: 'black-translucent',
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  other: {
    'theme-color': '#050505',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#050505',

    // SEO + GEO
    geo_region: 'GB',
    geo_placename: 'London',
    distribution: 'global',
    coverage: 'Worldwide',
    target: 'all',

    // Branding
    classification: 'Scientific Research',
    copyright: 'PepcoLab',
    designer: 'PepcoLab',
    owner: 'PepcoLab',

    // Compliance Positioning
    product_type: 'Research Compounds',
    audience: 'Scientific Research Community',
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
        {/* FONT OPTIMIZATION */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          href="https://://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* DNS PREFETCH */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* CANONICAL */}
        <link rel="canonical" href={siteUrl} />

        {/* PRELOAD IMPORTANT ASSETS */}
        <link rel="preload" href="/og-cover.jpg" as="image" />

        {/* GOOGLE VERIFICATION */}
        <meta
          name="google-site-verification"
          content="iSuNTQTsMQf9PHYe4l-b3sXHGl8F3qQ59OGo9qnTn18"
        />

        {/* ORGANIZATION SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',

              name: 'PepcoLab',

              url: siteUrl,

              logo: `${siteUrl}/logo.png`,

              description:
                'Research-grade peptides and laboratory compounds for scientific and in-vitro research applications.',

              email: 'support@pepcolab.com',

              address: {
                '@type': 'PostalAddress',
                addressCountry: 'GB',
              },

              areaServed: [
                {
                  '@type': 'Country',
                  name: 'United Kingdom',
                },
                {
                  '@type': 'Country',
                  name: 'United Arab Emirates',
                },
              ],

              sameAs: [
                'https://instagram.com/pepcolab',
                'https://x.com/pepcolab',
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

              potentialAction: {
                '@type': 'SearchAction',

                target: `${siteUrl}/search?q={search_term_string}`,

                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* ECOMMERCE / STORE SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',

              '@type': 'Store',

              name: 'PepcoLab',

              image: `${siteUrl}/og-cover.jpg`,

              url: siteUrl,

              telephone: '+44',

              priceRange: '£££',

              paymentAccepted: [
                'Bank Transfer',
                'Credit Card',
                'Apple Pay',
                'Google Pay',
              ],

              currenciesAccepted: 'GBP, AED, USD',

              address: {
                '@type': 'PostalAddress',
                addressCountry: 'GB',
              },

              areaServed: [
                'United Kingdom',
                'United Arab Emirates',
              ],
            }),
          }}
        />

        {/* SECURITY */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        />
      </head>

      <body suppressHydrationWarning>
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