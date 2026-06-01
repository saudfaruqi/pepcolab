'use client'
import { useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Download, ShoppingCart, CheckCircle } from 'lucide-react'
import { PRODUCTS } from '@/app/data'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Vial from '@/components/Vial'
import ProductCard from '@/components/ProductCard'
import { useCart } from '@/lib/cartContext'

/* ── Static params ── */
export function generateStaticParams() {
  return PRODUCTS.map(p => ({ slug: p.slug }))
}

const IMGS = {
  lab1: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800&q=80&auto=format&fit=crop',
  lab2: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=800&q=80&auto=format&fit=crop',
  lab3: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80&auto=format&fit=crop',
}

type Tab = 'overview' | 'technical' | 'coa' | 'storage' | 'disclaimer'

function ProductDetailClient({ p }: { p: (typeof PRODUCTS)[0] }) {
  const [added, setAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [addError, setAddError] = useState<string | null>(null)
  const { addItem, loading } = useCart()

  const handleAdd = async () => {
    if (!p.inStock || added || loading) return
    setAddError(null)
    setAdded(true)
    try {
      await addItem(
        p.variantId ?? `gid://shopify/ProductVariant/${p.id}`,
        p.name,
        p.mg,
        p.price,
        p.slug
      )
    } catch (err) {
      console.error('Add to cart error:', err)
      setAddError('Could not add to cart. Please try again.')
      setAdded(false)
    }
    setTimeout(() => setAdded(false), 2200)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'technical', label: 'Technical' },
    { key: 'coa', label: 'COA' },
    { key: 'storage', label: 'Storage' },
    { key: 'disclaimer', label: 'Disclaimer' },
  ]

  const related = PRODUCTS.filter(x => x.id !== p.id && x.inStock).slice(0, 4)

  return (
    <div style={{ background: '#f5f5f3', minHeight: '100vh' }}>
      <Nav />

      {/* ── Breadcrumb ── */}
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '14px clamp(16px, 4vw, 64px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'rgba(13,13,13,.4)',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={11} />
        <Link href="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Products</Link>
        <ChevronRight size={11} />
        <span style={{ color: '#0d0d0d', fontWeight: 500, wordBreak: 'break-word' }}>
          {p.name} {p.mg}
        </span>
      </div>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(16px, 4vw, 64px) 80px' }}>

        {/* ── Product grid: stacks on mobile ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 'clamp(32px, 5vw, 64px)',
            alignItems: 'start',
          }}
        >
          {/* ══ LEFT: Visual panel ══ */}
          <div>
            {/* Main vial card */}
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: 'clamp(320px, 50vw, 480px)',
                background: `linear-gradient(135deg, ${p.color.bg}, ${p.color.vialTo}33)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              {/* Lab photo backdrop */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${IMGS.lab3})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.08,
                }}
              />

              {/* Three vials */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 'clamp(12px, 3vw, 28px)',
                }}
              >
                <div style={{ opacity: 0.65, transform: 'translateY(-16px)' }}>
                  <Vial fromColor={p.color.vialFrom} toColor={p.color.vialTo} mg={p.mg} size="lg" />
                </div>
                <Vial fromColor={p.color.vialFrom} toColor={p.color.vialTo} mg={p.mg} size="xl" />
                <div style={{ opacity: 0.65, transform: 'translateY(8px)' }}>
                  <Vial fromColor={p.color.vialFrom} toColor={p.color.vialTo} mg={p.mg} size="lg" />
                </div>
              </div>

              {/* Floating purity card */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,.95)',
                  backdropFilter: 'blur(8px)',
                  padding: 'clamp(12px, 2vw, 16px) clamp(14px, 2vw, 20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,.12)',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(13,13,13,.35)',
                    marginBottom: 4,
                  }}
                >
                  Purity Analysis
                </div>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 'clamp(26px, 4vw, 34px)',
                    fontWeight: 700,
                    letterSpacing: '-.04em',
                    color: '#0d0d0d',
                    lineHeight: 1,
                  }}
                >
                  {p.purity ?? 99}%
                </div>
                <div style={{ fontSize: 10, color: 'rgba(13,13,13,.5)', marginTop: 4 }}>
                  HPLC verified · {p.testDate ?? 'Dec 2024'}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    height: 3,
                    background: 'rgba(13,13,13,.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${p.purity ?? 99}%`,
                      background: `linear-gradient(90deg, ${p.color.vialFrom}, ${p.color.vialTo})`,
                    }}
                  />
                </div>
              </div>

              {/* Lot badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  background: 'rgba(13,13,13,.8)',
                  color: 'rgba(255,255,255,.8)',
                  padding: '7px 12px',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.08em',
                }}
              >
                Lot {p.lot ?? 'N/A'}
              </div>
            </div>

            {/* Lot info grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                marginBottom: 12,
              }}
            >
              {[
                ['Lot Number', p.lot ?? 'N/A'],
                ['Test Date', p.testDate ?? 'N/A'],
                ['Testing Lab', 'Eurofins UK'],
              ].map(([label, val]) => (
                <div
                  key={label}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(13,13,13,.08)',
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(13,13,13,.38)',
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0d0d0d', wordBreak: 'break-word' }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {/* Lab photo strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[IMGS.lab1, IMGS.lab2].map((src, i) => (
                <div
                  key={i}
                  style={{ position: 'relative', height: 'clamp(100px, 18vw, 140px)', overflow: 'hidden' }}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.75)',
                      background: 'rgba(0,0,0,.4)',
                      padding: '2px 7px',
                    }}
                  >
                    {i === 0 ? 'Synthesis' : 'HPLC Analysis'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT: Product info ══ */}
          <div>
            {/* Badge */}
            {p.badge && (
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    padding: '5px 14px',
                    background:
                      p.badge === 'new' ? '#7C3AED' : p.badge === 'sale' ? '#DC2626' : '#0d0d0d',
                    color: '#fff',
                  }}
                >
                  {p.badge === 'popular'
                    ? '🔥 Popular'
                    : p.badge === 'new'
                    ? '✦ New'
                    : p.badge === 'bestseller'
                    ? '★ Bestseller'
                    : '🏷 Sale'}
                </span>
              </div>
            )}

            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'rgba(13,13,13,.4)',
                marginBottom: 6,
              }}
            >
              {p.category}
            </p>

            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(28px, 6vw, 54px)',
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: '-.05em',
                margin: '0 0 4px',
                color: '#0d0d0d',
              }}
            >
              {p.name}
            </h1>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(16px, 3vw, 22px)',
                color: 'rgba(13,13,13,.35)',
                letterSpacing: '-.02em',
                marginBottom: 18,
              }}
            >
              {p.mg}
            </div>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: 'rgba(13,13,13,.6)',
                marginBottom: 24,
              }}
            >
              {p.longDesc ?? p.description}
            </p>

            {/* Purity bar */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 6,
                  flexWrap: 'wrap',
                  gap: 4,
                }}
              >
                <span style={{ fontWeight: 700, color: '#0d0d0d' }}>
                  {p.purity ?? 99}% purity
                </span>
                <span style={{ color: 'rgba(13,13,13,.45)' }}>
                  HPLC verified · {p.testDate ?? 'Dec 2024'}
                </span>
              </div>
              <div style={{ height: 4, background: 'rgba(13,13,13,.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${p.purity ?? 99}%`,
                    background: `linear-gradient(90deg, ${p.color.vialFrom}, ${p.color.vialTo})`,
                  }}
                />
              </div>
            </div>

            {/* Price + stock */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 22,
                flexWrap: 'wrap',
              }}
            >
              <div>
                {p.oldPrice && (
                  <div
                    style={{
                      fontSize: 14,
                      textDecoration: 'line-through',
                      color: 'rgba(13,13,13,.4)',
                      marginBottom: 2,
                    }}
                  >
                    £{p.oldPrice.toFixed(2)}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 'clamp(36px, 7vw, 44px)',
                    fontWeight: 700,
                    letterSpacing: '-.04em',
                    color: '#0d0d0d',
                    lineHeight: 1,
                  }}
                >
                  £{p.price.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(13,13,13,.4)', marginTop: 4 }}>
                  + free cold-chain dispatch over £75
                </div>
              </div>

              {p.inStock ? (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0A7B45',
                    background: '#EDFAF3',
                    border: '1px solid rgba(10,123,69,.15)',
                    padding: '6px 14px',
                    borderRadius: 40,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✓ In stock · {p.stockCount ?? '—'} units
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#DC2626',
                    background: '#FEF2F2',
                    border: '1px solid rgba(220,38,38,.15)',
                    padding: '6px 14px',
                    borderRadius: 40,
                  }}
                >
                  Out of stock
                </span>
              )}
            </div>

            {/* Error message */}
            {addError && (
              <div
                style={{
                  fontSize: 13,
                  color: '#DC2626',
                  background: '#FEF2F2',
                  border: '1px solid rgba(220,38,38,.2)',
                  padding: '10px 14px',
                  marginBottom: 14,
                }}
              >
                {addError}
              </div>
            )}

            {/* CTA row */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 24,
                flexWrap: 'wrap',
              }}
            >
              <button
                disabled={!p.inStock || loading}
                onClick={handleAdd}
                style={{
                  flex: '1 1 200px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: added ? '#0A7B45' : !p.inStock ? 'rgba(13,13,13,.1)' : '#0d0d0d',
                  color: !p.inStock ? 'rgba(13,13,13,.4)' : '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '.04em',
                  padding: '16px 24px',
                  border: 'none',
                  cursor: !p.inStock || loading ? 'not-allowed' : 'pointer',
                  transition: 'background .2s',
                  fontFamily: 'inherit',
                  minHeight: 52,
                  opacity: loading ? 0.7 : 1,
                }}
                aria-label={added ? 'Added to cart' : `Add ${p.name} ${p.mg} to cart`}
              >
                {added ? (
                  <><CheckCircle size={16} /> Added to Cart</>
                ) : !p.inStock ? (
                  'Out of Stock'
                ) : loading ? (
                  'Adding…'
                ) : (
                  <><ShoppingCart size={16} /> Add to Cart</>
                )}
              </button>
              <a
                href={`/certificates?lot=${p.lot}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  color: '#0d0d0d',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '16px 20px',
                  border: '1.5px solid rgba(13,13,13,.2)',
                  textDecoration: 'none',
                  flexShrink: 0,
                  transition: 'border-color .15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <Download size={16} /> COA
              </a>
            </div>

            {/* Trust strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                background: 'rgba(13,13,13,.08)',
                marginBottom: 28,
              }}
            >
              {[
                { icon: '🛡', label: '3rd-party tested', sub: 'Eurofins UK' },
                { icon: '❄️', label: 'Cold-chain dispatch', sub: 'Same day by 2pm' },
                { icon: '📄', label: 'Batch COA', sub: 'Publicly searchable' },
              ].map(t => (
                <div
                  key={t.label}
                  style={{ background: '#fff', padding: '14px 10px', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{t.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0d0d0d', marginBottom: 2 }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(13,13,13,.4)' }}>{t.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Tabs ── */}
            <div style={{ borderTop: '1px solid rgba(13,13,13,.1)' }}>
              {/* Scrollable tab bar */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid rgba(13,13,13,.1)',
                  marginBottom: 20,
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '12px 14px 13px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      letterSpacing: '.02em',
                      color: activeTab === tab.key ? '#0d0d0d' : 'rgba(13,13,13,.38)',
                      borderBottom: activeTab === tab.key ? '2px solid #0d0d0d' : '2px solid transparent',
                      marginBottom: -1,
                      fontFamily: 'inherit',
                      transition: 'color .15s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'overview' && (
                <div style={{ fontSize: 13.5, lineHeight: 1.8, color: 'rgba(13,13,13,.6)' }}>
                  <p style={{ marginBottom: 14 }}>{p.longDesc ?? p.description}</p>
                  {p.sequence && (
                    <div
                      style={{
                        background: 'rgba(13,13,13,.04)',
                        border: '1px solid rgba(13,13,13,.08)',
                        padding: '12px 16px',
                        marginTop: 14,
                        overflowX: 'auto',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '.12em',
                          textTransform: 'uppercase',
                          color: 'rgba(13,13,13,.35)',
                          marginBottom: 8,
                        }}
                      >
                        Peptide Sequence
                      </div>
                      <code
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: 12,
                          color: '#0d0d0d',
                          letterSpacing: '.04em',
                          wordBreak: 'break-all',
                        }}
                      >
                        {p.sequence}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'technical' && (
                <div>
                  {[
                    ['Molecular Formula', 'Available on COA'],
                    ['Molecular Weight', 'Available on COA'],
                    ['Purity', `${p.purity ?? 99}% (HPLC)`],
                    ['Lot Number', p.lot ?? 'N/A'],
                    ['Test Date', p.testDate ?? 'N/A'],
                    ['Testing Lab', 'Eurofins UK'],
                    ['Storage', '-20°C long term, 4°C short term'],
                    ['Solubility', 'Sterile water or 0.1% acetic acid'],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(13,13,13,.06)',
                        fontSize: 13,
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          minWidth: 140,
                          fontWeight: 600,
                          color: 'rgba(13,13,13,.52)',
                          flexShrink: 0,
                        }}
                      >
                        {k}
                      </span>
                      <span style={{ color: '#0d0d0d' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'coa' && (
                <div
                  style={{
                    padding: 24,
                    background: 'rgba(13,13,13,.03)',
                    border: '1px solid rgba(13,13,13,.08)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    Certificate of Analysis
                  </div>
                  <div style={{ fontSize: 12.5, color: 'rgba(13,13,13,.55)', marginBottom: 20 }}>
                    Lot {p.lot ?? 'N/A'} · {p.testDate ?? 'N/A'} · Eurofins UK
                  </div>
                  <a
                    href={`/certificates?lot=${p.lot}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#0d0d0d',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '12px 24px',
                      border: 'none',
                      textDecoration: 'none',
                      borderRadius: 40,
                    }}
                  >
                    <Download size={14} /> Download COA (PDF)
                  </a>
                </div>
              )}

              {activeTab === 'storage' && (
                <div style={{ fontSize: 13.5, lineHeight: 1.85, color: 'rgba(13,13,13,.6)' }}>
                  {[
                    ['Short-term (up to 4 weeks)', 'Store at 4°C in a sealed container, protected from light and moisture.'],
                    ['Long-term', 'Store at -20°C or below. Avoid repeated freeze-thaw cycles.'],
                    ['Reconstitution', 'Use bacteriostatic water or sterile water. Swirl gently, do not vortex.'],
                    ['Shipping', 'Dispatched in cold-chain packaging with ice packs. Refrigerate immediately on receipt.'],
                  ].map(([title, body]) => (
                    <p key={title} style={{ marginBottom: 12 }}>
                      <strong style={{ color: '#0d0d0d' }}>{title}:</strong> {body}
                    </p>
                  ))}
                </div>
              )}

              {activeTab === 'disclaimer' && (
                <div
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.8,
                    color: 'rgba(13,13,13,.5)',
                    background: 'rgba(13,13,13,.03)',
                    padding: '16px 20px',
                    border: '1px solid rgba(13,13,13,.08)',
                  }}
                >
                  <p style={{ marginBottom: 10 }}>
                    <strong style={{ color: 'rgba(13,13,13,.7)' }}>For Research Use Only.</strong>{' '}
                    This product is not intended for human or veterinary use. It is not a drug, food,
                    or cosmetic and should not be misused as such.
                  </p>
                  <p style={{ marginBottom: 10 }}>
                    PepcoLab supplies research chemicals for legitimate scientific research only.
                    Purchasers must ensure compliance with all applicable laws and regulations in
                    their jurisdiction.
                  </p>
                  <p>
                    PepcoLab Ltd makes no representations regarding the suitability of this product
                    for any particular research purpose and is not liable for any misuse.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div
            style={{
              marginTop: 64,
              paddingTop: 48,
              borderTop: '1px solid rgba(13,13,13,.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: 28,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(20px, 3.5vw, 34px)',
                  fontWeight: 700,
                  letterSpacing: '-.04em',
                  margin: 0,
                }}
              >
                You May Also Need
              </h2>
              <Link
                href="/products"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: '#0d0d0d',
                  textDecoration: 'none',
                  borderBottom: '1.5px solid #0d0d0d',
                  paddingBottom: 2,
                }}
              >
                View All
              </Link>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
                gap: 'clamp(10px, 2vw, 16px)',
              }}
            >
              {related.map(rel => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

/* ── Page entry point ── */
export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = PRODUCTS.find(p => p.slug === params.slug)
  if (!product) notFound()
  return <ProductDetailClient p={product} />
}