// src/components/MarketGuard.tsx
'use client'

/**
 * Wraps the buy area of a product page. Both live markets (UAE and UK) sell
 * the full catalogue, so it renders the buy controls. It stays as the single
 * place to put a per-market selling rule: if UK_CHECKOUT_LIVE in
 * lib/pricing.ts is set to false, UK visitors see a short notice instead.
 */

import Link from 'next/link'
import { useCountry } from '@/lib/countryContext'
import { isInMarket } from '@/lib/pricing'

interface Props {
  tags: string[]
  children: React.ReactNode
  /** Kept for call-site compatibility. */
  productSlug?: string
  productName?: string
}

export default function MarketGuard({ tags, children }: Props) {
  const { country, ready } = useCountry()
  if (!ready || isInMarket(tags, country)) return <>{children}</>
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', fontSize: 13.5, lineHeight: 1.6, color: '#374151' }}>
      Ordering is not available for your location right now.{' '}
      <Link href="/contact" style={{ fontWeight: 600, textDecoration: 'underline' }}>Contact us</Link>
      {' '}with any questions.
    </div>
  )
}
