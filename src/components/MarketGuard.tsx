// src/components/MarketGuard.tsx
'use client'

/**
 * Wraps the buy area of a product page. It shows a short notice instead of
 * the buy controls when the product is not sold where the visitor is:
 *   - `unavailable` — set by ProductVariantView for products outside the
 *     UAE catalogue (lib/uaeRestrictions.ts) when the visitor is in the UAE
 *   - UK_CHECKOUT_LIVE false in lib/pricing.ts — UK visitors
 */

import Link from 'next/link'
import { useCountry } from '@/lib/countryContext'
import { isInMarket } from '@/lib/pricing'

interface Props {
  tags: string[]
  /** Not sold in the visitor's market. */
  unavailable?: boolean
  children: React.ReactNode
  /** Kept for call-site compatibility. */
  productSlug?: string
  productName?: string
}

export default function MarketGuard({ tags, children, unavailable = false }: Props) {
  const { country, ready } = useCountry()
  if (!unavailable && (!ready || isInMarket(tags, country))) return <>{children}</>
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', fontSize: 13.5, lineHeight: 1.6, color: '#374151' }}>
      {unavailable ? 'This product is not available in your location.' : 'Ordering is not available for your location right now.'}{' '}
      {unavailable && (
        <>
          <Link href="/products" style={{ fontWeight: 600, textDecoration: 'underline' }}>Browse the catalogue</Link>
          {' '}or{' '}
        </>
      )}
      <Link href="/contact" style={{ fontWeight: 600, textDecoration: 'underline' }}>Contact us</Link>
      {' '}with any questions.
    </div>
  )
}
