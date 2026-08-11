// src/components/BestSellersSection.tsx
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

/**
 * Curated best-sellers rail. Replaces the old "Verified compounds / Published
 * data" block, which just showed products.slice(0, 4) — i.e. whatever order
 * Shopify happened to return, presented as if it were a considered selection.
 *
 * Order here IS the ranking shown on the cards, so it's an editorial decision
 * rather than an accident of the API. Edit the array to re-rank.
 *
 * Handles must match Shopify exactly. Anything not found in `products` is
 * skipped silently rather than rendering an empty card — so a product going
 * out of stock or being renamed degrades gracefully.
 */
const FEATURED_HANDLES = [
  'retatrutide-uae',
  'klow-uae',
  'wolverine-stack-uae',
  'glow-uae',
  'selank-uae',
]

/** Short editorial line per product. Kept factual — format and composition,
 *  not effects. These sit on the most-viewed section of the site. */
const FEATURED_COPY: Record<string, string> = {
  'retatrutide-uae': 'The flagship blend. Five peptides, one vial, published COA.',
  'klow-uae': 'The flagship blend. Five peptides, one vial, published COA.',
  'wolverine-stack-uae': 'Repair blend in pen or vial. Two formats, one batch record.',
  'glow-uae': 'Three-peptide preparation, cold-chain dispatched.',
  'selank-uae': 'Heptapeptide, available as vial, pen or nasal spray.',
}

const RANK_LABELS = ['Best seller', 'Most reordered', 'Staff pick', 'Trending', 'Popular']

export default function BestSellersSection({
  products,
  loading,
}: {
  products: any[]
  loading?: boolean
}) {
  const featured = useMemo(() => {
    return FEATURED_HANDLES
      .map((handle) => products.find((p) => p.handle === handle || p.slug === handle))
      .filter(Boolean)
  }, [products])

  // Nothing matched — don't render a headline over an empty rail.
  if (!loading && featured.length === 0) return null

  return (
    <section
      id="catalogue"
      style={{
        padding: 'clamp(56px,7vw,96px) 0',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(16px,3vw,32px)' }}>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 'clamp(28px,4vw,44px)',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'clamp(32px,5vw,64px)',
                fontWeight: 800,
                letterSpacing: '-.055em',
                lineHeight: .95,
                color: '#000',
                margin: 0,
              }}
            >
              What researchers<br />order most.
            </h2>
          </div>

          <Link
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,.7)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,.2)',
              paddingBottom: 3,
            }}
          >
            View full catalogue →
          </Link>
        </div>

        {/* Rail */}
        <div className="bs-grid">
          {loading &&
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  borderRadius: 22,
                  background: '#141414',
                  height: 380,
                  animation: 'pulse 1.6s ease infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}

          {!loading &&
            featured.map((p: any, i: number) => (
              <Link
                key={p.shopifyId || p.id}
                href={`/products/${p.handle}`}
                className="bs-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  background: 'linear-gradient(160deg,#161616,#0F0F0F)',
                  border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 22,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Rank chip */}
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    zIndex: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: i === 0 ? '#C8992A' : 'rgba(255,255,255,.08)',
                    border: i === 0 ? 'none' : '1px solid rgba(255,255,255,.12)',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: i === 0 ? '#0A0A0A' : 'rgba(255,255,255,.65)',
                    }}
                  >
                    {RANK_LABELS[i] ?? 'Popular'}
                  </span>
                </div>

                {/* Image */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '1/1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 22,
                  }}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.imageAlt || p.title}
                      loading={i < 2 ? 'eager' : 'lazy'}
                      className="bs-img"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 12 }}>{p.title}</div>
                  )}

                  {p.purity && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        padding: '5px 9px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,.07)',
                        border: '1px solid rgba(255,255,255,.1)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <div style={{ fontSize: 7.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', fontWeight: 700 }}>
                        Purity
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                        {p.purity}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 'clamp(17px,2vw,21px)',
                      fontWeight: 700,
                      letterSpacing: '-.03em',
                      color: '#fff',
                      lineHeight: 1.15,
                      margin: '0 0 8px',
                    }}
                  >
                    {p.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.65,
                      color: 'rgba(255,255,255,.45)',
                      margin: '0 0 18px',
                      flex: 1,
                    }}
                  >
                    {FEATURED_COPY[p.handle] ?? 'Published certificate of analysis for every batch.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-.03em' }}>
                        {formatPrice(p.price, p.currencyCode ?? 'AED')}
                      </span>
                      {p.oldPrice && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.28)', textDecoration: 'line-through' }}>
                          {formatPrice(p.oldPrice, p.currencyCode ?? 'AED')}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: p.inStock === false ? 'rgba(255,255,255,.3)' : '#4ADE80',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.inStock === false ? 'Out of stock' : 'In stock'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>

      <style>{`
        .bs-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        @media (min-width: 900px) {
          .bs-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
        }
        .bs-card {
          transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease;
        }
        .bs-card:hover {
          transform: translateY(-6px);
          border-color: rgba(200,153,42,.35) !important;
          box-shadow: 0 24px 50px rgba(0,0,0,.5);
        }
        .bs-img { transition: transform .45s ease; }
        .bs-card:hover .bs-img { transform: scale(1.05); }
        @media (prefers-reduced-motion: reduce) {
          .bs-card, .bs-img { transition: none !important; }
          .bs-card:hover { transform: none; }
        }
      `}</style>
    </section>
  )
}