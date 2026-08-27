'use client'

// SEO FIX (Aug 2026 audit): this used to fetch products entirely inside a
// useEffect, so the server-rendered HTML Googlebot (and any visitor with
// slow/blocked JS) first saw was just the search bar and stat-card shell —
// zero of the actual COA content this page exists for. That's the highest
// commercial-intent page on the site ("the COA archive the site's
// positioning rests on" — see the old file's comments) shipping with an
// empty first paint, which is a strong contributor to it sitting in GSC's
// "Discovered — currently not indexed" bucket instead of getting indexed.
//
// Fix follows the exact pattern already used in app/products/page.tsx and
// app/products/category/[category]/page.tsx: the parent page.tsx (Server
// Component) fetches the catalogue server-side and passes it in as
// `initialProducts`, so the full certificate grid is present in the very
// first HTML response. This component still re-fetches client-side on
// mount to stay fresh for long-lived tabs, but seeds state from the server
// data first so there's never an empty-then-populated flash for a crawler
// or a visitor.

import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getProducts } from '@/lib/shopify'
import { resolveLocalCoa } from '@/lib/coaIndex'
import {
  Search,
  Eye,
  CheckCircle2,
  ShieldCheck,
  FlaskConical,
  FileText,
  ArrowRight,
} from 'lucide-react'

interface CertificatesClientProps {
  initialProducts: any[]
}

// useSearchParams() requires a Suspense boundary in the App Router, so the
// actual page logic lives in CertificatesContent below and this export just
// wraps it. Same pattern used in app/products/page.tsx.
export default function CertificatesClient({ initialProducts }: CertificatesClientProps) {
  return (
    <Suspense fallback={null}>
      <CertificatesContent initialProducts={initialProducts} />
    </Suspense>
  )
}

function CertificatesContent({ initialProducts }: CertificatesClientProps) {
  const searchParams = useSearchParams()

  // Was never read at all — ProductActions' "COA" button and COASection's
  // search box both link here with ?lot=XXXX, but the query state below
  // started blank every time regardless, so landing here from either of
  // those never actually pre-filtered to the batch the visitor was after.
  const lotParam = searchParams.get('lot') ?? ''

  const [query, setQuery] = useState(lotParam)
  // Seeded from the server-rendered data instead of [] — this is what
  // actually fixes the empty-first-paint problem described above.
  const [products, setProducts] = useState<any[]>(initialProducts)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getProducts()
      setProducts(data)
    }
    loadProducts()
  }, [])

  // Keep the search box in sync if ?lot= changes while already on this page
  // (e.g. clicking a different product's COA button via client-side nav).
  useEffect(() => {
    if (lotParam) setQuery(lotParam)
  }, [lotParam])

  // Arriving with a specific lot in mind — jump straight to the results
  // instead of leaving the visitor at the top of a page they need to
  // scroll down on to see the thing they actually clicked through for.
  useEffect(() => {
    if (lotParam) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredProducts = useMemo(() => {
    if (!query) return products

    const q = query.toLowerCase()

    return products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        p.lot?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }, [query, products])

  // Previously: avgPurity defaulted every product with no purity data to
  // 99%, which just papers over missing data with a flattering number
  // instead of reporting it — and the stat cards below showed
  // products.length (every product in the catalogue, tested or not) for
  // both "Published COAs" and "Verified Batches", while the list underneath
  // was visibly showing most of them as "COA pending upload". Compute the
  // same coaUrl/purity fallback used per-card (Shopify metafield, then the
  // matching local batch in coaData.ts) once here, and only count/average
  // products that actually resolve to a real result.
  const coaStats = useMemo(() => {
    let resolvedCount = 0
    const purityValues: number[] = []
    for (const p of products as any[]) {
      const localCoa = resolveLocalCoa(p.name, p.mg)
      const coaUrl = p.coaUrl || localCoa?.url
      const purity = p.purity ?? localCoa?.purity
      if (coaUrl) resolvedCount++
      if (typeof purity === 'number') purityValues.push(purity)
    }
    const avgPurity =
      purityValues.length > 0
        ? purityValues.reduce((a, b) => a + b, 0) / purityValues.length
        : 0
    return { resolvedCount, avgPurity }
  }, [products])

  // Filtering already happens live as the person types (see filteredProducts
  // above) — "Verify Batch" had no onClick at all, so clicking it did
  // nothing. Filtering itself doesn't need this button, but a button that
  // visibly does nothing reads as broken, so it now jumps down to the
  // results it's meant to be verifying.
  const handleVerify = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Nav />

      <main
        style={{
          background: '#f7f7f5',
          minHeight: '100vh',
        }}
      >
        {/* HERO */}

        <section
          style={{
            borderBottom: '1px solid rgba(13,13,13,.08)',
            background:
              'linear-gradient(to bottom, #ffffff 0%, #f7f7f5 100%)',
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '80px 24px 72px',
            }}
          >
            <div
              style={{
                maxWidth: 760,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: '#2563EB',
                  marginBottom: 18,
                }}
              >
                <ShieldCheck size={14} />
                Research Transparency
              </div>

              <h1
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(42px,7vw,72px)',
                  lineHeight: 0.95,
                  letterSpacing: '-.06em',
                  margin: '0 0 20px',
                  color: '#0d0d0d',
                }}
              >
                Certificate
                <br />
                Library
              </h1>

              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: 'rgba(13,13,13,.58)',
                  maxWidth: 620,
                  marginBottom: 40,
                }}
              >
                Every PepcoLab batch is independently tested and publicly
                published. Search any lot number to retrieve purity data,
                HPLC analysis, and laboratory verification records.
              </p>

              {/* Search */}

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    flex: '1 1 420px',
                  }}
                >
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(13,13,13,.35)',
                    }}
                  />

                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
                    placeholder="Search lot number, peptide or category..."
                    style={{
                      width: '100%',
                      height: 56,
                      borderRadius: 14,
                      border: '1px solid rgba(13,13,13,.12)',
                      background: '#fff',
                      padding: '0 18px 0 46px',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  onClick={handleVerify}
                  style={{
                    height: 56,
                    padding: '0 28px',
                    borderRadius: 14,
                    border: 'none',
                    background: '#0d0d0d',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <FlaskConical size={16} />
                  Verify Batch
                </button>
              </div>
            </div>

            {/* Stats strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
                gap: 20,
                marginTop: 56,
                maxWidth: 900,
              }}
            >
              {[
                { label: 'Published COAs', value: coaStats.resolvedCount, icon: FileText },
                { label: 'Verified Batches', value: coaStats.resolvedCount, icon: CheckCircle2 },
                {
                  label: 'Avg. Purity',
                  value: coaStats.avgPurity ? `${coaStats.avgPurity.toFixed(1)}%` : 'N/A',
                  icon: ShieldCheck,
                },
              ].map(stat => (
                <div key={stat.label}>
                  <stat.icon size={18} color="rgba(13,13,13,.35)" />
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 32,
                      letterSpacing: '-.03em',
                      margin: '10px 0 4px',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(13,13,13,.45)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section ref={resultsRef}>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 24px 80px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 34,
                  margin: 0,
                  letterSpacing: '-.05em',
                }}
              >
                Published Certificates
              </h2>

              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(13,13,13,.45)',
                }}
              >
                {filteredProducts.length} results
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 18,
                gridTemplateColumns:
                  'repeat(auto-fill,minmax(320px,1fr))',
              }}
            >
              {filteredProducts.map(product => {
                // Real Shopify metafields win if set; otherwise fall back to
                // the matching published batch in coaData.ts (via
                // coaIndex.ts). Previously this fallback only covered the
                // PDF link (coaUrl) — lot/purity/testDate were read straight
                // from Shopify metafields with no fallback at all, so a
                // product could correctly link to its real COA and still
                // show "N/A" for every field on the card. Compute the local
                // match once here and fall back per-field, the same pattern
                // coaUrl already used.
                const localCoa = resolveLocalCoa(product.name, product.mg)
                const coaUrl = product.coaUrl || localCoa?.url
                const lot = product.lot || localCoa?.lot
                const purity = product.purity ?? localCoa?.purity
                const testDate = product.testDate || localCoa?.testDate
                return (
                <div
                  key={product.id}
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid rgba(13,13,13,.08)',
                    transition: '.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '.12em',
                          color: 'rgba(13,13,13,.35)',
                          marginBottom: 6,
                        }}
                      >
                        {product.category}
                      </div>

                      <h3
                        style={{
                          fontSize: 20,
                          margin: 0,
                          fontWeight: 700,
                        }}
                      >
                        {product.name}
                      </h3>
                    </div>

                    <CheckCircle2
                      size={22}
                      color="#16A34A"
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      marginBottom: 22,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(13,13,13,.4)',
                        }}
                      >
                        Lot Number
                      </div>

                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        {lot || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(13,13,13,.4)',
                        }}
                      >
                        Purity
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: purity ? '#16A34A' : 'rgba(13,13,13,.4)',
                          marginTop: 4,
                        }}
                      >
                        {purity ? `${purity}%` : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(13,13,13,.4)',
                        }}
                      >
                        Test Date
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        {testDate || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(13,13,13,.4)',
                        }}
                      >
                        Laboratory
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        Freedom Diagnostics
                      </div>
                    </div>
                  </div>

                  {/* View-only — no download, COAs are viewable in-browser
                      only, per policy. Opens the batch's direct COA page
                      when one resolves (Shopify metafield or the local
                      combined PDF index), otherwise this card just
                      represents the published record shown above. */}
                  <a
                    href={coaUrl || '#'}
                    target={coaUrl ? '_blank' : undefined}
                    rel={coaUrl ? 'noopener noreferrer' : undefined}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 12,
                      border: '1px solid rgba(13,13,13,.08)',
                      background: coaUrl ? '#fafafa' : '#f2f2f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: coaUrl ? 'pointer' : 'default',
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: coaUrl ? '#0d0d0d' : 'rgba(13,13,13,.4)',
                      opacity: coaUrl ? 1 : 0.7,
                    }}
                    onClick={e => { if (!coaUrl) e.preventDefault() }}
                  >
                    <Eye size={15} />
                    {coaUrl ? 'View COA' : 'COA pending upload'}
                    {coaUrl && <ArrowRight size={14} />}
                  </a>
                </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
