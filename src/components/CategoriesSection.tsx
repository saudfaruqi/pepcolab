'use client'
import { useRef, useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/shopify'
import { useCountry } from '@/lib/countryContext'

// WHY THIS CHANGED
// ----------------
// This component used to hold a hardcoded CATEGORIES array with static counts
// and its own comment conceding they were "not live-fetched, so update them if
// the catalogue changes materially". Two problems with that:
//
//   1. The counts drifted from the real catalogue the moment anything was
//      added, removed or retagged in Shopify — and a card advertising "9
//      products" that opens onto 7 is a small, avoidable credibility leak.
//   2. It couldn't switch catalogues. Once UK products exist and
//      UK_CATALOGUE_LIVE is flipped, a static list would keep showing UAE
//      categories to UK visitors. That is exactly the bug that surfaced on
//      the homepage.
//
// Categories are now derived from the tags on the products actually returned
// for the visitor's market, so labels, counts and card order all follow the
// live catalogue with no maintenance.

/** Visual treatment per category slug. Purely presentational — the list of
 *  categories that renders comes from the products, not from this map. */
const CATEGORY_STYLE: Record<
  string,
  { label: string; emoji: string; color: { bg: string; accent: string; border: string }; img: string }
> = {
  metabolic: {
    label: 'Metabolic & Weight',
    emoji: '⚡',
    color: { bg: '#EBF2FF', accent: '#1A56DB', border: '#BFCFF8' },
    img: 'https://images.unsplash.com/photo-1576671414121-aa2d60f06f93?w=300&q=80&auto=format&fit=crop',
  },
  hormonal: {
    label: 'Hormonal & Peptide',
    emoji: '🔬',
    color: { bg: '#FFF3E8', accent: '#C05621', border: '#F6C69B' },
    img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&q=80&auto=format&fit=crop',
  },
  cognitive: {
    label: 'Cognitive',
    emoji: '🧠',
    color: { bg: '#F5F0FE', accent: '#7C3AED', border: '#D4C5F9' },
    img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=300&q=80&auto=format&fit=crop',
  },
  recovery: {
    label: 'Recovery & Healing',
    emoji: '💊',
    color: { bg: '#E6F5EE', accent: '#0A7B45', border: '#A7D9BC' },
    img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300&q=80&auto=format&fit=crop',
  },
  'anti-ageing': {
    label: 'Anti-Ageing',
    emoji: '✨',
    color: { bg: '#FFF0F5', accent: '#BE185D', border: '#F9A8D4' },
    img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&q=80&auto=format&fit=crop',
  },
  accessories: {
    label: 'Accessories',
    emoji: '🧪',
    color: { bg: '#F0FDF4', accent: '#15803D', border: '#86EFAC' },
    img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&q=80&auto=format&fit=crop',
  },
  immune: {
    label: 'Immune',
    emoji: '🛡️',
    color: { bg: '#FFFBEB', accent: '#B45309', border: '#FDE68A' },
    img: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=300&q=80&auto=format&fit=crop',
  },
}

/** Used for a tag that has no entry above — a new Shopify category renders
 *  with a sensible neutral card instead of a blank one. */
const FALLBACK_STYLE = {
  emoji: '🔹',
  color: { bg: '#F5F5F4', accent: '#57534E', border: '#E7E5E4' },
  img: '',
}

// Market tags are catalogue plumbing, not research categories — never render.
const MARKET_TAGS = new Set(['uae', 'uk'])

function titleCase(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

type DerivedCategory = {
  slug: string
  label: string
  count: number
  emoji: string
  color: { bg: string; accent: string; border: string }
  img: string
}

export default function CategoriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { country, ready } = useCountry()

  const [products, setProducts] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  // Refetches whenever the market changes, which is what makes the cards
  // follow the visitor's catalogue. 250 rather than 40: this is a count, and
  // a partial fetch would under-report every category.
  useEffect(() => {
    if (!ready) return
    let cancelled = false

    getProducts(250, country)
      .then((raw) => {
        if (!cancelled) {
          setProducts(raw)
          setLoaded(true)
        }
      })
      .catch(() => {
        // Silent: this is a navigation aid, not primary content. An empty
        // result hides the section rather than showing a broken one.
        if (!cancelled) setLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [country, ready])

  const categories: DerivedCategory[] = useMemo(() => {
    const counts = new Map<string, number>()

    for (const p of products) {
      for (const tag of p.tags ?? []) {
        const slug = String(tag).toLowerCase()
        if (MARKET_TAGS.has(slug)) continue
        counts.set(slug, (counts.get(slug) ?? 0) + 1)
      }
    }

    return [...counts.entries()]
      .map(([slug, count]) => {
        const style = CATEGORY_STYLE[slug]
        return {
          slug,
          count,
          label: style?.label ?? titleCase(slug),
          emoji: style?.emoji ?? FALLBACK_STYLE.emoji,
          color: style?.color ?? FALLBACK_STYLE.color,
          img: style?.img ?? FALLBACK_STYLE.img,
        }
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [products])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(18px)'
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
    // Re-run once the cards actually exist, otherwise the observer attaches to
    // an empty container and the section stays stuck at opacity 0.
  }, [categories.length])

  // Nothing to navigate to — don't render an empty shell.
  if (loaded && categories.length === 0) return null

  return (
    <section className="py-14 lg:py-18 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="section-label mb-1.5">Shop by category</p>
            <h2
              className="text-[clamp(24px,3.2vw,36px)] font-bold tracking-tight text-[var(--ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Popular Categories
            </h2>
          </div>
          <a
            href="/products"
            className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[var(--blue)] hover:text-[var(--blue-dark)] transition-colors"
          >
            View all <ArrowRight size={14} />
          </a>
        </div>

        {/* auto-fit rather than a fixed lg:grid-cols-7 — the old grid assumed
            exactly seven categories, so adding or removing one in Shopify left
            a gap or a stranded card on the next row. */}
        <div
          ref={sectionRef}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          style={{ gridTemplateColumns: undefined }}
        >
          {!loaded &&
            [0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#eee] bg-[#f6f6f5] p-4"
                style={{ height: 148, animation: 'pulse 1.6s ease infinite', animationDelay: `${i * 0.08}s` }}
              />
            ))}

          {loaded &&
            categories.map((cat) => (
              <a
                key={cat.slug}
                // Real, crawlable category route (see products/category/[category]/page.tsx)
                // instead of the query-string filter — query params on
                // /products still work for on-page filtering, but this is
                // what gets indexed and ranked per category.
                href={`/products/category/${cat.slug}`}
                className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(26,86,219,0.12)]"
                style={{ background: cat.color.bg, borderColor: cat.color.border }}
              >
                <div
                  className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,.55)' }}
                >
                  {cat.img ? (
                    <img
                      src={cat.img}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                  ) : (
                    <span style={{ fontSize: 26 }} aria-hidden>
                      {cat.emoji}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[12.5px] font-bold text-[var(--ink)] leading-tight mb-0.5">
                    {cat.label}
                  </div>
                  <div className="text-[10.5px] font-medium" style={{ color: cat.color.accent }}>
                    {cat.count} product{cat.count !== 1 ? 's' : ''}
                  </div>
                </div>
              </a>
            ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          section .grid.grid-cols-2 {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
        }
      `}</style>
    </section>
  )
}