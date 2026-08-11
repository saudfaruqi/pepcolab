// src/components/BestSellersSection.tsx
'use client'

import { useMemo, useRef } from 'react'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  
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
        padding: 'clamp(40px,7vw,96px) 0',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 clamp(12px,3vw,32px)' }}>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 'clamp(16px,4vw,44px)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'clamp(26px,5vw,64px)',
                fontWeight: 800,
                letterSpacing: '-.045em',
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
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(0,0,0,.7)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,.2)',
              paddingBottom: 3,
              whiteSpace: 'nowrap',
            }}
          >
            View full catalogue →
          </Link>
        </div>

        {/* Rail */}
        <div className="bs-wrapper">
          <div ref={scrollRef} className="bs-rail">
            {loading &&
              [0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bs-card-skeleton"
                  style={{
                    borderRadius: 14,
                    background: '#141414',
                    height: 240,
                    minWidth: 180,
                    maxWidth: 200,
                    flex: '0 0 auto',
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
                    borderRadius: 14,
                    overflow: 'hidden',
                    position: 'relative',
                    minWidth: 180,
                    maxWidth: 200,
                    flex: '0 0 auto',
                  }}
                >
                  {/* Rank chip - smaller */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: i === 0 ? '#C8992A' : 'rgba(255,255,255,.08)',
                      border: i === 0 ? 'none' : '1px solid rgba(255,255,255,.12)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 7.5,
                        fontWeight: 800,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: i === 0 ? '#0A0A0A' : 'rgba(255,255,255,.65)',
                      }}
                    >
                      {RANK_LABELS[i] ?? 'Popular'}
                    </span>
                  </div>

                  {/* Image - smaller */}
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '1/1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 12,
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
                      <div style={{ color: 'rgba(255,255,255,.2)', fontSize: 10 }}>{p.title}</div>
                    )}

                    {p.purity && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          right: 6,
                          padding: '2px 6px',
                          borderRadius: 5,
                          background: 'rgba(255,255,255,.07)',
                          border: '1px solid rgba(255,255,255,.1)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <div style={{ fontSize: 5.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', fontWeight: 700 }}>
                          Purity
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                          {p.purity}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body - compact */}
                  <div style={{ padding: '8px 10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '-.02em',
                        color: '#fff',
                        lineHeight: 1.1,
                        margin: '0 0 2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.title}
                    </h3>

                    <p
                      style={{
                        fontSize: 10,
                        lineHeight: 1.4,
                        color: 'rgba(255,255,255,.4)',
                        margin: '0 0 8px',
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {FEATURED_COPY[p.handle] ?? 'Published COA for every batch.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>
                        {formatPrice(p.price, p.currencyCode ?? 'AED')}
                      </span>
                      <span
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          color: p.inStock === false ? 'rgba(255,255,255,.3)' : '#4ADE80',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.inStock === false ? 'Out' : 'In stock'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>

          {/* Scroll hint */}
          <div className="bs-scroll-hint">
            <span>← Swipe →</span>
          </div>
        </div>
      </div>

      <style>{`
        .bs-wrapper {
          position: relative;
        }
        
        .bs-rail {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: visible;
          padding: 4px 2px 10px 2px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        
        .bs-rail::-webkit-scrollbar {
          display: none;
        }
        
        .bs-card {
          scroll-snap-align: start;
          transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease;
          min-width: 180px;
          max-width: 200px;
          flex: 0 0 auto;
          height: auto;
        }
        
        .bs-card:hover {
          transform: translateY(-3px);
          border-color: rgba(200,153,42,.35) !important;
          box-shadow: 0 16px 32px rgba(0,0,0,.5);
        }
        
        .bs-img { 
          transition: transform .45s ease; 
        }
        
        .bs-card:hover .bs-img { 
          transform: scale(1.04); 
        }
        
        .bs-scroll-hint {
          display: block;
          text-align: center;
          font-size: 10px;
          color: rgba(255,255,255,.2);
          letter-spacing: .08em;
          margin-top: 2px;
          animation: fadeInOut 2.5s ease infinite;
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        
        /* Tablet: 2-3 columns */
        @media (min-width: 600px) and (max-width: 899px) {
          .bs-rail {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
            overflow-x: visible;
            padding: 0;
            scroll-snap-type: none;
          }
          
          .bs-card {
            min-width: unset;
            max-width: unset;
            flex: unset;
            scroll-snap-align: unset;
          }
          
          .bs-scroll-hint {
            display: none;
          }
        }
        
        /* Desktop: 5 columns */
        @media (min-width: 900px) {
          .bs-rail {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 18px;
            overflow-x: visible;
            padding: 0;
            scroll-snap-type: none;
          }
          
          .bs-card {
            min-width: unset;
            max-width: unset;
            flex: unset;
            scroll-snap-align: unset;
          }
          
          .bs-scroll-hint {
            display: none;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .bs-card, .bs-img { 
            transition: none !important; 
          }
          .bs-card:hover { 
            transform: none; 
          }
          .bs-scroll-hint {
            animation: none;
            opacity: 0.25;
          }
        }
      `}</style>
    </section>
  )
}