import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/lib/cartContext'
import CartDrawer from '@/components/CartDrawer'
import { CountryProvider } from '@/lib/countryContext'

export const metadata: Metadata = {
  title: { template: '%s · PepcoLab', default: 'PepcoLab — Research-Grade Peptides, UK' },
  description: 'Premium research peptides. Independently tested, Eurofins UK verified, cold-chain dispatched. Every batch certificate publicly available.',
  keywords: 'research peptides UK, BPC-157, GLP-1, TB-500, COA verified peptides, HPLC tested',
  openGraph: {
    siteName: 'PepcoLab',
    locale: 'en_GB',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        <meta name="google-site-verification" content="coc1Mhr_wcWR5l4AULYnq5mngxdMdXebz01HBvxmZmM" />
      </head>
      <body>
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