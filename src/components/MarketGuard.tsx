// src/components/MarketGuard.tsx
'use client'

import { useCountry } from '@/lib/countryContext'
import { isInMarket, UK_CATALOGUE_LIVE, MARKET_TAG } from '@/lib/pricing'

/**
 * Wraps the buy area on a product page. While UK_CATALOGUE_LIVE is false this
 * renders its children untouched — every product is sold in both markets, so
 * there is nothing to guard.
 *
 * Once per-market catalogues go live, a visitor who reaches a product from the
 * other catalogue (search result, shared link, old bookmark) sees a notice and
 * a route back instead of an "add to cart" that would create an order you
 * can't fulfil from that market's stock.
 *
 * Client-side on purpose. Doing this on the server would need a cookie read,
 * which makes every product page dynamic and — worse — would 404 the page for
 * Googlebot, which crawls with no market cookie.
 */
export default function MarketGuard({
  tags,
  children,
}: {
  tags: string[]
  children: React.ReactNode
}) {
  const { country, ready } = useCountry()

  // Before the country resolves, show the normal UI. A flash of "unavailable"
  // on a product the visitor CAN buy is worse than a brief moment of the
  // opposite, and `ready` settles on the first render when middleware has set
  // the cookie.
  if (!UK_CATALOGUE_LIVE || !ready || isInMarket(tags, country)) {
    return <>{children}</>
  }

  const otherMarket = tags.includes(MARKET_TAG.GB)
    ? 'United Kingdom'
    : 'United Arab Emirates'

  return (
    <div>
      <div
        style={{
          border: '1px solid #FDE68A',
          background: '#FFFBEB',
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 13,
          color: '#92400E',
          lineHeight: 1.6,
          marginBottom: 14,
        }}
      >
        <strong>Not stocked for your region.</strong> This compound is held in
        our {otherMarket} catalogue only.
      </div>

      <a
        href="/products"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '14px 20px',
          borderRadius: 12,
          background: '#f3f4f6',
          color: '#6b7280',
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          border: '1px solid #e5e7eb',
        }}
      >
        See what we ship to you
      </a>
    </div>
  )
}