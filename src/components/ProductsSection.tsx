'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { getProducts } from '@/lib/shopify'
import ProductCard from '@/components/ProductCard'

// ── These are the only valid category tags we recognise ──────────────────
// Add to this list as you create new categories in Shopify
const KNOWN_CATEGORIES: { slug: string; label: string }[] = [
  { slug: 'recovery',    label: 'Recovery'    },
  { slug: 'metabolic',   label: 'Metabolic'   },
  { slug: 'cognitive',   label: 'Cognitive'   },
  { slug: 'hormonal',    label: 'Hormonal'    },
  { slug: 'anti-ageing', label: 'Anti-Ageing' },
  { slug: 'skin',        label: 'Skin & Repair'},
  { slug: 'neuro',       label: 'Neuro'       },
  { slug: 'accessories',  label: 'Accessories'  },
  { slug: 'immune',      label: 'Immune'      },
]

const KNOWN_SLUGS = new Set(KNOWN_CATEGORIES.map(c => c.slug))

interface Props { showAll?: boolean }

export default function ProductsSection({ showAll = false }: Props) {
  const [search,      setSearch]      = useState('')
  const [sort,        setSort]        = useState('default')
  const [category,    setCategory]    = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)

  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getProducts()
      .then(p => { setAllProducts(p); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Fade-in animation
  useEffect(() => {
    const animate = (el: HTMLElement | null, delay = 0) => {
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(16px)'
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity .65s cubic-bezier(.22,1,.36,1), transform .65s cubic-bezier(.22,1,.36,1)'
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }, delay)
          obs.disconnect()
        }
      }, { threshold: 0.06 })
      obs.observe(el)
    }
    animate(headRef.current)
    animate(gridRef.current, 80)
  }, [])

  // ── Find which category tags each product has ────────────────────────────
  function getProductCategory(p: any): string {
    const tags: string[] = (p.tags ?? []).map((t: string) => t.toLowerCase().replace(/\s+/g, '-'))
    return tags.find(t => KNOWN_SLUGS.has(t)) ?? ''
  }

  // ── Only show categories that have at least 1 product ───────────────────
  const activeCategories = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of allProducts) {
      const cat = getProductCategory(p)
      if (cat) counts[cat] = (counts[cat] ?? 0) + 1
    }
    return [
      { slug: 'all', label: 'All', count: allProducts.length },
      ...KNOWN_CATEGORIES
        .filter(c => counts[c.slug])
        .map(c => ({ ...c, count: counts[c.slug] })),
    ]
  }, [allProducts])

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let results = [...allProducts]

    if (!showAll) {
      return results
        .filter(p => p.inStock)
        .sort((a, b) => (a.badge === 'popular' ? -1 : b.badge === 'popular' ? 1 : 0))
        .slice(0, 8)
    }

    if (category !== 'all') {
      results = results.filter(p => getProductCategory(p) === category)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(p =>
        (p.name ?? p.title ?? '').toLowerCase().includes(q) ||
        (p.handle ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.tags ?? []).join(' ').toLowerCase().includes(q) ||
        (p.mg ?? '').toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case 'price-asc':  results.sort((a, b) => a.price - b.price); break
      case 'price-desc': results.sort((a, b) => b.price - a.price); break
      case 'purity':     results.sort((a, b) => (b.purity ?? 0) - (a.purity ?? 0)); break
      case 'name':       results.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')); break
    }

    return results
  }, [search, sort, category, showAll, allProducts])

  return (
    <section style={{ padding: showAll ? '0 0 100px' : '72px 0' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(16px,4vw,64px)' }}>

        {/* Header */}
        <div ref={headRef} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            <div>
              {!showAll && (
                <p style={{ fontSize: 11, letterSpacing: '.18em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 10 }}>
                  Catalogue
                </p>
              )}
              <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,5vw,52px)', lineHeight: 1, letterSpacing: '-.04em' }}>
                {showAll ? 'Research Peptides' : 'Research-Grade Peptides'}
              </h2>
            </div>
            {!showAll && (
              <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#111', fontWeight: 600, fontSize: 13 }}>
                View all peptides <ArrowRight size={14} />
              </Link>
            )}
          </div>
          <p style={{ maxWidth: 720, marginTop: 14, fontSize: 14, lineHeight: 1.8, color: 'rgba(13,13,13,.58)' }}>
            Every peptide is HPLC verified, independently batch tested and supplied with downloadable analytical documentation.
          </p>
        </div>

        {/* Filters */}
        {showAll && (
          <>
            {/* Search + sort row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,.35)', pointerEvents: 'none' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search compounds…"
                  style={{
                    width: '100%', height: 42,
                    border: '1px solid rgba(0,0,0,.1)', padding: '0 36px 0 36px',
                    fontSize: 13.5, outline: 'none', borderRadius: 10, background: '#fff',
                    color: '#0d0d0d',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,.35)', display: 'flex', padding: 4 }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{ height: 42, borderRadius: 10, border: '1px solid rgba(0,0,0,.1)', padding: '0 12px', fontSize: 13, background: '#fff', color: '#0d0d0d', cursor: 'pointer' }}
              >
                <option value="default">Featured</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="purity">Highest Purity</option>
                <option value="name">Name A–Z</option>
              </select>

              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                style={{
                  height: 42, padding: '0 14px', borderRadius: 10,
                  border: `1px solid ${filtersOpen ? '#111' : 'rgba(0,0,0,.1)'}`,
                  background: filtersOpen ? '#111' : '#fff',
                  color: filtersOpen ? '#fff' : '#111',
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  transition: 'all .15s',
                }}
              >
                {filtersOpen ? <X size={13} /> : <SlidersHorizontal size={13} />}
                Category
              </button>
            </div>

            {/* Category pills — only shown when filter open */}
            {filtersOpen && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18, padding: '14px 16px', background: '#f9f9f7', borderRadius: 12, border: '1px solid rgba(0,0,0,.07)' }}>
                {activeCategories.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => setCategory(cat.slug)}
                    style={{
                      borderRadius: 8, padding: '6px 14px',
                      border: category === cat.slug ? '1px solid #111' : '1px solid rgba(0,0,0,.1)',
                      background: category === cat.slug ? '#111' : '#fff',
                      color: category === cat.slug ? '#fff' : '#374151',
                      fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                      transition: 'all .15s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {cat.label}
                    <span style={{ opacity: .5, fontSize: 11 }}>{cat.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Result count + active filter indicator */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'rgba(13,13,13,.5)' }}>
                {loading ? 'Loading…' : <><strong style={{ color: '#0d0d0d' }}>{filteredProducts.length}</strong> compound{filteredProducts.length !== 1 ? 's' : ''}</>}
              </span>
              {category !== 'all' && (
                <button
                  onClick={() => setCategory('all')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#0d0d0d', background: '#f0f0ee', border: 'none', borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}
                >
                  {activeCategories.find(c => c.slug === category)?.label}
                  <X size={10} />
                </button>
              )}
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#0d0d0d', background: '#f0f0ee', border: 'none', borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}
                >
                  "{search}" <X size={10} />
                </button>
              )}
            </div>
          </>
        )}

        {/* Grid */}
        <div ref={gridRef}>
          {loading ? (
            <div className="products-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 16, background: '#eeece8', height: 300, opacity: 1 - i * 0.15, animation: 'shimmer 1.6s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🔬</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-.02em' }}>No compounds found</h3>
              <p style={{ color: 'rgba(13,13,13,.5)', fontSize: 14, marginBottom: 24 }}>Try adjusting your search or clearing filters.</p>
              <button
                onClick={() => { setSearch(''); setCategory('all'); setSort('default') }}
                style={{ border: 'none', borderRadius: 8, background: '#0d0d0d', color: '#fff', padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.shopifyId || product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* View all CTA */}
        {!showAll && filteredProducts.length > 0 && (
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', border: '1px solid rgba(0,0,0,.14)', borderRadius: 999, padding: '12px 24px', color: '#111', fontWeight: 600, fontSize: 13 }}>
              Browse Full Catalogue <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        @media (min-width: 768px) {
          .products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        }
        @media (min-width: 1200px) {
          .products-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: .45; }
        }
      `}</style>
    </section>
  )
}