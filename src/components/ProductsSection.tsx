'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, SlidersHorizontal, Search } from 'lucide-react'
import { PRODUCTS } from '@/app/data'
import ProductCard from '@/components/ProductCard'

interface Props {
  showAll?: boolean
}

const CATEGORIES = [
  'All',
  'Recovery',
  'Metabolic',
  'HGH',
  'Skin',
  'Cognitive',
  'Libido',
  'Immune',
  'Sleep',
]

export default function ProductsSection({ showAll = false }: Props) {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('default')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Scroll-in animation
  useEffect(() => {
    const animate = (el: HTMLElement | null, delay = 0) => {
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.style.transition =
                'opacity 0.65s cubic-bezier(.22,1,.36,1), transform 0.65s cubic-bezier(.22,1,.36,1)'
              el.style.opacity = '1'
              el.style.transform = 'translateY(0)'
            }, delay)
            obs.disconnect()
          }
        },
        { threshold: 0.06 }
      )
      obs.observe(el)
    }
    animate(headRef.current, 0)
    animate(gridRef.current, 80)
  }, [])

  let filtered = PRODUCTS
    .filter(p => category === 'All' || p.category === category)
    .filter(
      p =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .filter(p => showAll || p.inStock)

  if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  if (sort === 'purity') filtered = [...filtered].sort((a, b) => (b.purity ?? 99) - (a.purity ?? 99))

  if (!showAll) filtered = filtered.slice(0, 8)

  return (
    <section style={{ padding: showAll ? '0 0 80px' : '56px 0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(16px, 4vw, 64px)' }}>

        {/* ── Header ── */}
        <div ref={headRef} style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: showAll ? 20 : 8,
              flexWrap: 'wrap',
            }}
          >
            <div>
              {!showAll && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(13,13,13,.4)',
                    marginBottom: 8,
                  }}
                >
                  Catalogue
                </p>
              )}
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(22px, 4vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: '-.04em',
                  lineHeight: 1.05,
                  margin: 0,
                  color: '#0d0d0d',
                }}
              >
                {showAll ? 'All Peptides' : 'Research-Grade Peptides.'}
              </h2>
            </div>
            {!showAll && (
              <Link
                href="/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: '#0d0d0d',
                  textDecoration: 'none',
                  borderBottom: '1.5px solid #0d0d0d',
                  paddingBottom: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                View All <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {!showAll && (
            <p
              style={{
                fontSize: 13,
                color: 'rgba(13,13,13,.55)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Every compound HPLC-verified, Eurofins UK batch-tested. COA downloadable.
            </p>
          )}
        </div>

        {/* ── Filters (showAll mode) ── */}
        {showAll && (
          <div style={{ marginBottom: 24 }}>
            {/* Search + toggle row */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 12,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(13,13,13,.35)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  placeholder="Search compounds…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#fff',
                    border: '1.5px solid rgba(13,13,13,.12)',
                    padding: '9px 14px 9px 34px',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: '#0d0d0d',
                    boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(13,13,13,.45)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(13,13,13,.12)')}
                />
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  fontSize: 12,
                  color: 'rgba(13,13,13,.6)',
                  border: '1.5px solid rgba(13,13,13,.12)',
                  background: '#fff',
                  padding: '9px 12px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  flex: '0 0 auto',
                }}
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="purity">Purity: Highest</option>
              </select>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setFiltersOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '9px 14px',
                  border: '1.5px solid rgba(13,13,13,.12)',
                  background: filtersOpen ? '#0d0d0d' : '#fff',
                  color: filtersOpen ? '#fff' : 'rgba(13,13,13,.6)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  flex: '0 0 auto',
                  transition: 'all .15s',
                }}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal size={13} />
                {category !== 'All' ? category : 'Filter'}
              </button>
            </div>

            {/* Category pills – collapsible on mobile */}
            {filtersOpen && (
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  padding: '12px 0',
                  borderTop: '1px solid rgba(13,13,13,.08)',
                  borderBottom: '1px solid rgba(13,13,13,.08)',
                  marginBottom: 8,
                }}
              >
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat)
                      if (cat !== 'All') setFiltersOpen(false)
                    }}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      letterSpacing: '.03em',
                      padding: '6px 16px',
                      border: '1.5px solid',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                      borderRadius: 40,
                      background: category === cat ? '#0d0d0d' : 'transparent',
                      color: category === cat ? '#fff' : 'rgba(13,13,13,.55)',
                      borderColor: category === cat ? '#0d0d0d' : 'rgba(13,13,13,.18)',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Result count ── */}
        {showAll && (
          <p
            style={{
              fontSize: 12,
              color: 'rgba(13,13,13,.4)',
              marginBottom: 20,
              fontWeight: 500,
            }}
          >
            Showing {filtered.length} compound{filtered.length !== 1 ? 's' : ''}
            {category !== 'All' ? ` in ${category}` : ''}
            {search ? ` matching "${search}"` : ''}
          </p>
        )}

        {/* ── Grid ── */}
        <div ref={gridRef}>
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '64px 0',
                color: 'rgba(13,13,13,.4)',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔬</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>No compounds found</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                Try adjusting your search or filter
              </div>
              <button
                onClick={() => { setCategory('All'); setSearch('') }}
                style={{
                  marginTop: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 24px',
                  background: '#0d0d0d',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderRadius: 40,
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div
              style={{
                gap: 'clamp(10px, 2vw, 16px)',
              }}
              className="products-grid"
            >
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* ── View all CTA (homepage mode) ── */}
        {!showAll && filtered.length > 0 && (
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                padding: '13px 28px',
                border: '1.5px solid rgba(13,13,13,.2)',
                color: '#0d0d0d',
                textDecoration: 'none',
                borderRadius: 40,
                transition: 'border-color .15s',
              }}
            >
              View all peptides <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      <style>{`
      .products-grid {
      display: grid;
        grid-template-columns: repeat(2, 1fr);
      }
      @media (min-width: 600px) {
        .products-grid {
        display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
      }
      @media (min-width: 900px) {
        .products-grid {
        display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
      }
      `}
      </style>
    </section>
    
  )
}

    