// src/components/BestSellersSection.tsx
'use client'

import { useMemo, useRef } from 'react'
import Link from 'next/link'
import { formatPrice, productHref } from '@/lib/utils'

/**
 * "What researchers order most" rail (Oct 2026, clean-up brief A8).
 *
 * The five cards are the products with the most paid orders, ranked on the
 * server from our own order records (app/page.tsx → popularHandles) with
 * withdrawn products already excluded by getProducts(). When there is no
 * order history to rank by (build time, a new store), FALLBACK_HANDLES fills
 * the rail — a fixed list of products that are still listed.
 *
 * No rank badges ("Best seller", "Trending"…) and no editorial adjectives:
 * each card shows the name, the vial size, the price and "COA published".
 */
const FALLBACK_HANDLES = ['klow', 'glow', 'wolverine-stack', 'selank', 'ghk-cu', 'semax', 'mots-c']

function baseHandle(h: string): string {
  return (h || '').toLowerCase().replace(/-(uae|uk|ae|gb)$/, '')
}

/** "Vial 10mg" / "10mg" / "Default Title" → "10mg vial" or "Single vial". */
function vialSize(p: any): string {
  const t = String(p.mg || p.variants?.[0]?.title || '')
  const m = t.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ml|%)/i)
  if (m) return /ml|%/i.test(m[2]) ? `${m[1]}${m[2].toLowerCase()}` : `${m[1]}${m[2].toLowerCase()} vial`
  return 'Single vial'
}

export default function BestSellersSection({
  products,
  loading,
  popularHandles = [],
}: {
  products: any[]
  loading?: boolean
  /** Handles ranked by paid-order count, most first (server-computed). */
  popularHandles?: string[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const featured = useMemo(() => {
    const byBase = new Map<string, any>()
    for (const p of products) byBase.set(baseHandle(p.handle || p.slug), p)
    const picked: any[] = []
    const seen = new Set<string>()
    for (const h of [...popularHandles, ...FALLBACK_HANDLES]) {
      const key = baseHandle(h)
      const p = byBase.get(key)
      if (!p || seen.has(key)) continue
      seen.add(key)
      picked.push(p)
      if (picked.length === 5) break
    }
    return picked
  }, [products, popularHandles])

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
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(12px,3vw,42px)' }}>

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
                    height: 300,
                    minWidth: 200,
                    maxWidth: 260,
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
                  href={productHref(p.handle)}
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
                    flex: '0 0 auto',
                    alignSelf: 'stretch',
                  }}
                >
                  {/* Image container - fixed height so every vial sits at the same scale.
                      Height/padding scale up on desktop via .bs-image-container media queries below. */}
                  <div
                    className="bs-image-container"
                    style={{
                      position: 'relative',
                      height: 150,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px',
                      background: 'rgba(255,255,255,.02)',
                      flex: '0 0 auto',
                    }}
                  >
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.imageAlt || p.title}
                        loading={i < 2 ? 'eager' : 'lazy'}
                        className="bs-img"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                        }}
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
                        {/* Was 5.5px over 9px. Purity is the number the
                            whole brand rests on, and it was the least
                            legible thing on the card. */}
                        <div style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', fontWeight: 700 }}>
                          Purity
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                          {p.purity}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div
                    style={{
                      padding: '10px 12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 'clamp(13px, 1.1vw, 16px)',
                        fontWeight: 700,
                        letterSpacing: '-.02em',
                        color: '#fff',
                        lineHeight: 1.1,
                        margin: '0 0 4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.title}
                    </h3>

                    <p
                      style={{
                        fontSize: 'clamp(12.5px, 0.8vw, 13px)',
                        lineHeight: 1.4,
                        color: 'rgba(255,255,255,.4)',
                        margin: '0 0 10px',
                        minHeight: '1.4em',
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {vialSize(p)}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontSize: 'clamp(15px, 1.2vw, 18px)', fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>
                        {formatPrice(p.price, p.currencyCode ?? 'AED')}
                      </span>
                      <span
                        style={{
                          fontSize: 'clamp(11px, 0.7vw, 12px)',
                          fontWeight: 700,
                          color: p.inStock === false ? 'rgba(255,255,255,.3)' : '#4ADE80',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.inStock === false ? 'Out of stock' : 'COA published'}
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
          align-items: stretch;
          gap: clamp(10px, 1.5vw, 20px);
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
          width: clamp(200px, 30vw, 300px);
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

        /* Mobile: horizontal scroll, no hover/tap shadow */
        @media (max-width: 599px) {
          .bs-card {
            width: clamp(140px, 40vw, 180px);
          }

          .bs-card:hover,
          .bs-card:active,
          .bs-card:focus {
            box-shadow: none !important;
            transform: none !important;
          }

          .bs-image-container {
            height: 120px !important;
            padding: 8px !important;
          }
        }

        /* Tablet: 2-3 columns grid */
        @media (min-width: 600px) and (max-width: 899px) {
          .bs-rail {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
            overflow-x: visible;
            padding: 0;
            scroll-snap-type: none;
          }

          .bs-card {
            width: 100%;
            scroll-snap-align: unset;
          }

          .bs-scroll-hint {
            display: none;
          }
        }

        /* Desktop: 5 columns, bigger/wider product imagery */
        @media (min-width: 900px) {
          .bs-rail {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: clamp(16px, 2vw, 24px);
            overflow-x: visible;
            padding: 0;
            scroll-snap-type: none;
          }

          .bs-card {
            width: 100%;
            scroll-snap-align: unset;
          }

          .bs-image-container {
            height: 220px !important;
            padding: 18px !important;
          }

          .bs-scroll-hint {
            display: none;
          }
        }

        /* Extra-wide desktops: images get even more room */
        @media (min-width: 1300px) {
          .bs-image-container {
            height: 260px !important;
            padding: 22px !important;
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