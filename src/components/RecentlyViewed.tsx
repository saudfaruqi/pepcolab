// src/components/RecentlyViewed.tsx
'use client'
import Link from 'next/link'
import { useRecentlyViewed } from '@/lib/recentlyViewedContext'
import { formatPrice, productHref } from '@/lib/utils'

interface Props {
  // Exclude the product currently being viewed — seeing the page you're
  // already on in its own "recently viewed" rail is a very small but real
  // "why is this here" moment.
  excludeSlug?: string
}

export default function RecentlyViewed({ excludeSlug }: Props) {
  const { items, hydrated } = useRecentlyViewed()

  const visible = items.filter((i) => i.slug !== excludeSlug)

  // Nothing recorded yet (or this is literally the only page they've
  // viewed) — render nothing rather than an empty shell. Also skip before
  // hydration so this never flashes then disappears.
  if (!hydrated || visible.length === 0) return null

  return (
    <section style={{ padding: '48px 0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
        <h2 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3vw,28px)',
          letterSpacing: '-.03em', margin: '0 0 18px',
        }}>
          Recently Viewed
        </h2>

        <div style={{
          display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6,
          scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch',
        }}>
          {visible.map((item) => (
            <Link
              key={item.slug}
              href={productHref(item.slug)}
              style={{
                flex: '0 0 auto', width: 168, textDecoration: 'none', color: 'inherit',
                scrollSnapAlign: 'start',
              }}
            >
              <div style={{
                width: '100%', aspectRatio: '1 / 1', borderRadius: 14,
                background: '#f7f5f1', border: '1px solid #EFEFEF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: 8,
              }}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }}
                  />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2fd' }} />
                )}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#AAB3C8', marginBottom: 2 }}>
                {item.category || 'Research Compound'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D0F14', lineHeight: 1.25, marginBottom: 2 }}>
                {item.name}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#626A85' }}>
                {formatPrice(item.price, item.currencyCode ?? 'AED')}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}