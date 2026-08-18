// src/components/RelatedProducts.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/shopify'
import { useCountry } from '@/lib/countryContext'
import ProductCard from '@/components/ProductCard'

interface Props {
  initialProducts: any[]
  currentHandle: string
  currentTag?: string
}

// Same matching logic that used to live in page.tsx's getRelatedProducts —
// moved here so it can run again against freshly-fetched (GB) data, not
// just once against the AE data baked in at build time. Falls back to
// filling remaining slots with other in-stock products so the section
// never renders half-empty on a lightly-tagged catalogue.
function pickRelated(all: any[], currentHandle: string, currentTag?: string, limit = 4) {
  const pool = all.filter((p) => p.handle !== currentHandle)

  const sameCategory = currentTag
    ? pool.filter((p) => p.tags?.some((t: string) => t.toLowerCase() === currentTag.toLowerCase()))
    : []

  const related = [...sameCategory]
  if (related.length < limit) {
    // NOTE: this used to be `.sort(() => Math.random() - 0.5)`. Math.random()
    // runs once during the server render and again during React's client
    // hydration pass, producing a *different* shuffle each time — so the
    // "You may also like" order (and sometimes which products appeared)
    // mismatched between server HTML and the client's first render. That's
    // what was throwing the React hydration errors (#418/#423/#425) sitewide.
    // A stable, deterministic order (seeded off the current product's handle
    // rather than wall-clock randomness) still varies the fallback picks
    // page-to-page without ever disagreeing with itself between server and
    // client.
    const seed = Array.from(currentHandle).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const fillers = pool
      .filter((p) => p.inStock !== false && !related.some((r) => r.handle === p.handle))
      .map((p, i) => ({ p, key: (i * 2654435761 + seed) % 2147483647 }))
      .sort((a, b) => a.key - b.key)
      .map(({ p }) => p)
    for (const p of fillers) {
      if (related.length >= limit) break
      related.push(p)
    }
  }

  return related.slice(0, limit)
}

export default function RelatedProducts({ initialProducts, currentHandle, currentTag }: Props) {
  const { country, ready } = useCountry()

  // Start from the server-rendered (AE-built) list so there's no layout
  // shift / loading flash on first paint — same fallback approach
  // ProductActions uses for the main product price.
  const [products, setProducts] = useState(initialProducts)

  // FIX: this used to bail out with `country === 'AE'`, on the assumption
  // the server-rendered data was already correct for AE. That's only true
  // right after a build/ISR regeneration — after a price change in Shopify
  // it goes stale like everything else on this statically-built page (see
  // the matching comment in ProductActions.tsx). Always refetch once ready,
  // for every market, so this grid doesn't need a hard refresh either.
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    getProducts(100, country)
      .then((fresh) => {
        if (!cancelled) setProducts(fresh)
      })
      .catch(() => {
        // Keep showing whatever we currently have — never leave the section blank.
      })
    return () => {
      cancelled = true
    }
  }, [ready, country])

  const related = pickRelated(products, currentHandle, currentTag)

  // Own the whole section, not just the grid — this way if a country
  // refetch ever produces zero matches, the heading and "Browse all" link
  // disappear along with the grid instead of being left floating over an
  // empty section (the bug with the old static relatedProducts.length > 0
  // check in page.tsx, which only ever reflected the AE-built data).
  if (related.length === 0) return null

  return (
    <section className="pp-related">
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(24px,4vw,36px)', letterSpacing: '-.03em', margin: 0 }}>
            You may also like
          </h2>
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#111', fontWeight: 600, fontSize: 13 }}>
            Browse all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="pp-related-grid">
          {related.map((rp) => (
            <ProductCard key={rp.shopifyId || rp.handle} product={rp} />
          ))}
        </div>
      </div>
    </section>
  )
}