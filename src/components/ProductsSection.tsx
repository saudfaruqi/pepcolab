'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import {
  CATEGORIES,
} from '@/app/data'

import { getProducts } from '@/lib/shopify'



import ProductCard from '@/components/ProductCard'

interface Props {
  showAll?: boolean
}

export default function ProductsSection({
  showAll = false,
}: Props) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [category, setCategory] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])

  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // ─────────────────────────────────────
  // Scroll Animation
  // ─────────────────────────────────────

  useEffect(() => {
    const loadProducts = async () => {
      const products = await getProducts()
      console.log('Loaded products:', products)  // ← check browser console
      setAllProducts(products)
    }
    loadProducts()
  }, [])

  useEffect(() => {
    const animate = (
      el: HTMLElement | null,
      delay = 0
    ) => {
      if (!el) return

      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.style.transition =
                'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)'
              el.style.opacity = '1'
              el.style.transform = 'translateY(0)'
            }, delay)

            obs.disconnect()
          }
        },
        { threshold: 0.08 }
      )

      obs.observe(el)
    }

    animate(headRef.current)
    animate(gridRef.current, 80)
  }, [])

  // ─────────────────────────────────────
  // Filtering
  // ─────────────────────────────────────

  const filteredProducts = useMemo(() => {
    let results = [...allProducts]

    if (!showAll) {
      results = results
        .filter(p => p.inStock)
        .sort((a, b) => {
          if (a.badge === 'popular') return -1
          if (b.badge === 'popular') return 1
          return 0
        })
        .slice(0, 8)

      return results
    }

    if (category !== 'all') {
      results = results.filter(
        p => p.categorySlug === category
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()

      results = results.filter(
        p =>
          (p.name ?? p.title ?? '').toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          p.tags.join(' ').toLowerCase().includes(q) ||
          (p.mg ?? '').toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price)
        break

      case 'price-desc':
        results.sort((a, b) => b.price - a.price)
        break

      case 'purity':
        results.sort(
          (a, b) =>
            (b.purity ?? 0) -
            (a.purity ?? 0)
        )
        break

      case 'stock':
        results.sort(
          (a, b) =>
            b.stockCount - a.stockCount
        )
        break
    }

    return results
  }, [search, sort, category, showAll, allProducts])

  return (
    <section
      style={{
        padding: showAll
          ? '0 0 100px'
          : '72px 0',
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding:
            '0 clamp(16px,4vw,64px)',
        }}
      >
        {/* HEADER */}

        <div
          ref={headRef}
          style={{
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'flex-end',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              {!showAll && (
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing:
                      '.18em',
                    fontWeight: 700,
                    textTransform:
                      'uppercase',
                    color:
                      'rgba(13,13,13,.45)',
                    marginBottom: 10,
                  }}
                >
                  Catalogue
                </p>
              )}

              <h2
                style={{
                  margin: 0,
                  fontFamily:
                    'Georgia, serif',
                  fontSize:
                    'clamp(28px,5vw,52px)',
                  lineHeight: 1,
                  letterSpacing:
                    '-.04em',
                }}
              >
                {showAll
                  ? 'Research Peptides'
                  : 'Research-Grade Peptides'}
              </h2>
            </div>

            {!showAll && (
              <Link
                href="/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration:
                    'none',
                  color: '#111',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                View all peptides
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          <p
            style={{
              maxWidth: 720,
              marginTop: 14,
              fontSize: 14,
              lineHeight: 1.8,
              color:
                'rgba(13,13,13,.58)',
            }}
          >
            Every peptide is HPLC
            verified, independently
            batch tested and supplied
            with downloadable
            analytical documentation.
          </p>
        </div>

        {/* FILTERS */}

        {showAll && (
          <>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  position:
                    'relative',
                }}
              >
                <Search
                  size={15}
                  style={{
                    position:
                      'absolute',
                    left: 14,
                    top: '50%',
                    transform:
                      'translateY(-50%)',
                    color:
                      'rgba(0,0,0,.4)',
                  }}
                />

                <input
                  value={search}
                  onChange={e =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search compounds..."
                  style={{
                    width: '100%',
                    height: 46,
                    border:
                      '1px solid rgba(0,0,0,.12)',
                    padding:
                      '0 16px 0 40px',
                    fontSize: 14,
                    outline: 'none',
                    borderRadius: 14,
                  }}
                />
              </div>

              <select
                value={sort}
                onChange={e =>
                  setSort(
                    e.target.value
                  )
                }
                style={{
                  height: 46,
                  borderRadius: 14,
                  border:
                    '1px solid rgba(0,0,0,.12)',
                  padding:
                    '0 14px',
                  fontSize: 13,
                  background:
                    '#fff',
                }}
              >
                <option value="default">
                  Sort: Featured
                </option>
                <option value="price-asc">
                  Price ↑
                </option>
                <option value="price-desc">
                  Price ↓
                </option>
                <option value="purity">
                  Highest Purity
                </option>
                <option value="stock">
                  Most Stock
                </option>
              </select>

              <button
                onClick={() =>
                  setFiltersOpen(
                    !filtersOpen
                  )
                }
                style={{
                  height: 46,
                  padding:
                    '0 16px',
                  borderRadius: 14,
                  border:
                    '1px solid rgba(0,0,0,.12)',
                  background:
                    filtersOpen
                      ? '#111'
                      : '#fff',
                  color:
                    filtersOpen
                      ? '#fff'
                      : '#111',
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                {filtersOpen ? (
                  <X size={15} />
                ) : (
                  <SlidersHorizontal
                    size={15}
                  />
                )}
                Filters
              </button>
            </div>

            {filtersOpen && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() =>
                      setCategory(
                        cat.slug
                      )
                    }
                    style={{
                      borderRadius: 999,
                      padding:
                        '8px 16px',
                      border:
                        category ===
                        cat.slug
                          ? '1px solid #111'
                          : '1px solid rgba(0,0,0,.14)',
                      background:
                        category ===
                        cat.slug
                          ? '#111'
                          : '#fff',
                      color:
                        category ===
                        cat.slug
                          ? '#fff'
                          : '#111',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {cat.label} (
                    {cat.count})
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                marginBottom: 24,
                fontSize: 13,
                color:
                  'rgba(13,13,13,.5)',
              }}
            >
              Showing{' '}
              <strong>
                {
                  filteredProducts.length
                }
              </strong>{' '}
              peptide
              {filteredProducts.length !==
              1
                ? 's'
                : ''}
            </div>
          </>
        )}

        {/* GRID */}

        <div ref={gridRef}>
          {filteredProducts.length ===
          0 ? (
            <div
              style={{
                textAlign:
                  'center',
                padding:
                  '80px 0',
              }}
            >
              <h3>No compounds found</h3>

              <p
                style={{
                  color:
                    'rgba(13,13,13,.5)',
                }}
              >
                Try adjusting your
                search or filters.
              </p>

              <button
                onClick={() => {
                  setSearch('')
                  setCategory('all')
                  setSort('default')
                }}
                style={{
                  marginTop: 20,
                  border: 'none',
                  borderRadius: 999,
                  background:
                    '#111',
                  color: '#fff',
                  padding:
                    '12px 24px',
                  cursor: 'pointer',
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(
                product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>
          )}
        </div>

        {!showAll &&
          filteredProducts.length >
            0 && (
            <div
              style={{
                marginTop: 40,
                display: 'flex',
                justifyContent:
                  'center',
              }}
            >
              <Link
                href="/products"
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap: 8,
                  textDecoration:
                    'none',
                  border:
                    '1px solid rgba(0,0,0,.15)',
                  borderRadius: 999,
                  padding:
                    '14px 28px',
                  color: '#111',
                  fontWeight: 600,
                }}
              >
                Browse Full
                Catalogue
                <ArrowRight
                  size={15}
                />
              </Link>
            </div>
          )}
      </div>

      <style jsx>{`
        .products-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 16px;
        }

        @media (min-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            );
          }
        }

        @media (min-width: 1200px) {
          .products-grid {
            grid-template-columns: repeat(
              4,
              minmax(0, 1fr)
            );
            gap: 20px;
          }
        }
      `}</style>
    </section>
  )
}