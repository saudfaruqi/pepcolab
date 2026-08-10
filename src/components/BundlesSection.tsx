'use client'
import { ArrowRight, X, ShoppingCart, CheckCircle, Plus } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import React from 'react'
import { BUNDLES } from '@/app/data'
import { getProducts } from '@/lib/shopify'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/lib/cartContext'
import type { Product } from '@/app/data'

import { useCountry } from '@/lib/countryContext'

const BUNDLE_IMGS: Record<string, string> = {
  'b1': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80&auto=format&fit=crop',
  'b2': 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&q=80&auto=format&fit=crop',
  'b3': 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&q=80&auto=format&fit=crop',
  'b4': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80&auto=format&fit=crop',
}

export default function BundlesSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = React.useState<Product[]>([])
  const { country, ready } = useCountry()
  const { addItem } = useCart()

  // Which bundle's detail view is open. Cards used to link to
  // `/bundles#${bundle.id}` — but nothing on the page ever had a matching
  // element id, so the anchor never scrolled anywhere and clicking a bundle
  // looked like it did nothing. This drives an in-page detail panel instead,
  // which also works from the homepage preview, not just /bundles.
  const [openBundleId, setOpenBundleId] = useState<string | null>(null)

  // Per-bundle "adding the whole stack" state, keyed by bundle id, so one
  // bundle's spinner/checkmark doesn't affect another card.
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return  // ← wait for detection
    getProducts(40, country).then((raw) => {
      const normalized = raw.map((p) => ({
        ...p,
        badge: (p.badge && ["popular", "new", "sale", "bestseller"].includes(p.badge)
          ? p.badge
          : undefined) as "popular" | "new" | "sale" | "bestseller" | undefined,
      }))
      setProducts(normalized)
    })
  }, [country, ready])  // ← add deps

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
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
  }, [])

  // Lock body scroll while the detail panel is open, and let Escape close it.
  useEffect(() => {
    if (!openBundleId) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenBundleId(null) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [openBundleId])

  function bundleProducts(bundle: typeof BUNDLES[number]) {
    return bundle.products
      .map((slug: string) => products.find((p: Product) => p.slug === slug))
      .filter((p): p is Product => p !== undefined)
  }

  function priceBundle(bundle: typeof BUNDLES[number], prods: Product[]) {
    // Bundle price/save in data.ts are static, AED-denominated numbers
    // frozen at config time — every other price on the site (ProductActions,
    // RelatedProducts, ProductCard) is refetched live per buyer
    // country/currency, so a GB visitor was seeing an AED figure mislabelled
    // "AED" regardless of their actual market. Once all of a bundle's
    // products have loaded from the live, country-aware fetch above, derive
    // the bundle's price from their real (already-correct-currency) prices
    // instead, preserving the discount depth configured in data.ts rather
    // than the frozen absolute numbers.
    const staticTotal = bundle.price + bundle.save
    const discountRatio = staticTotal > 0 ? bundle.save / staticTotal : 0
    const liveTotal = prods.length === bundle.products.length
      ? prods.reduce((s, p: any) => s + p.price, 0)
      : null
    const currencyCode = (prods[0] as any)?.currencyCode ?? 'AED'
    const displayDiscounted = liveTotal != null
      ? Math.round(liveTotal * (1 - discountRatio) * 100) / 100
      : bundle.price
    const displayTotal = liveTotal ?? staticTotal
    const displaySave = Math.round((displayTotal - displayDiscounted) * 100) / 100
    return { currencyCode, displayDiscounted, displayTotal, displaySave }
  }

  // Adds every product in the bundle to the cart, one at a time. addItem
  // isn't batched — it's built for a single line at a time (see
  // cartContext.tsx) — so this awaits each call in sequence rather than
  // firing them all at once, which would race against each other's
  // optimistic-state updates.
  async function handleAddBundle(bundle: typeof BUNDLES[number], prods: Product[]) {
    if (prods.length === 0 || addingId) return
    setAddingId(bundle.id)
    try {
      for (const p of prods) {
        await addItem(
          p.variantId || `gid://shopify/ProductVariant/${p.id}`,
          p.name,
          p.mg,
          p.price,
          p.slug,
          p.image
        )
      }
      setAddedId(bundle.id)
      setTimeout(() => setAddedId(null), 2200)
    } finally {
      setAddingId(null)
    }
  }

  const openBundle = BUNDLES.find(b => b.id === openBundleId)
  const openProds = openBundle ? bundleProducts(openBundle) : []
  const openPricing = openBundle ? priceBundle(openBundle, openProds) : null

  return (
    <section className="py-16 lg:py-20 border-b border-[var(--border)] bg-[var(--paper)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="section-label mb-2">Curated stacks</p>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.03em] text-[var(--ink)]">Bundles & protocols</h2>
          </div>
          <a href="/bundles" className="text-[13px] text-[var(--ink-60)] hover:text-[var(--ink)] flex items-center gap-1.5 transition-colors group flex-shrink-0">
            View all bundles <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUNDLES.map((bundle, idx) => {
            const prods = bundleProducts(bundle)
            const { currencyCode, displayDiscounted, displaySave } = priceBundle(bundle, prods)
            const isAdding = addingId === bundle.id
            const isAdded = addedId === bundle.id

            return (
              <div
                key={bundle.id}
                className="card flex flex-col overflow-hidden group bg-white"
                style={{ opacity: 0, transform: 'translateY(24px)' }}
                ref={(el) => {
                  if (!el) return
                  const obs = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) {
                      setTimeout(() => {
                        el.style.transition = 'opacity 0.55s ease, transform 0.55s ease'
                        el.style.opacity = '1'
                        el.style.transform = 'translateY(0)'
                      }, idx * 80)
                      obs.disconnect()
                    }
                  }, { threshold: 0.1 })
                  obs.observe(el)
                }}
              >
                {/* Image — clicking it (or the title below) opens the detail panel */}
                <button
                  type="button"
                  onClick={() => setOpenBundleId(bundle.id)}
                  className="h-[160px] relative overflow-hidden text-left cursor-pointer"
                  style={{ border: 'none', padding: 0, background: 'none' }}
                >
                  <img
                    src={BUNDLE_IMGS[bundle.id]}
                    alt={bundle.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 right-3 text-[10px] font-semibold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    Save {formatPrice(displaySave, currencyCode)}
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {prods.map((_, i) => (
                      <div key={i} className="text-[10px] font-mono text-white/70 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/20">
                        {prods[i]?.mg}
                      </div>
                    ))}
                  </div>
                </button>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-30)] mb-1.5">Bundle · {prods.length} compounds</div>
                  <button
                    type="button"
                    onClick={() => setOpenBundleId(bundle.id)}
                    className="text-[14.5px] font-medium text-[var(--ink)] group-hover:text-[var(--cobalt)] transition-colors mb-1 text-left cursor-pointer"
                    style={{ border: 'none', padding: 0, background: 'none' }}
                  >
                    {bundle.name}
                  </button>
                  <p className="text-[12px] text-[var(--ink-30)] mb-4 flex-1">{bundle.desc}</p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-serif text-[19px] tracking-tight text-[var(--ink)]">{formatPrice(displayDiscounted, currencyCode)}</span>
                    <button
                      type="button"
                      onClick={() => setOpenBundleId(bundle.id)}
                      className="text-[12px] text-[var(--ink-30)] group-hover:text-[var(--cobalt)] flex items-center gap-1 transition-all cursor-pointer"
                      style={{ border: 'none', background: 'none', padding: 0 }}
                    >
                      Details <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Add-to-cart — the thing that was entirely missing.
                      Disabled until the country-aware product data has
                      actually loaded and every bundle slug resolved. */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAddBundle(bundle, prods) }}
                    disabled={prods.length === 0 || isAdding}
                    className="w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 rounded-[8px] transition-colors"
                    style={{
                      border: 'none',
                      cursor: prods.length === 0 || isAdding ? 'not-allowed' : 'pointer',
                      color: '#fff',
                      background: isAdded ? '#0A7B45' : prods.length === 0 ? 'rgba(13,13,13,.25)' : 'var(--ink, #111)',
                      opacity: isAdding ? 0.7 : 1,
                    }}
                  >
                    {isAdded
                      ? <><CheckCircle size={14} /> Added to cart</>
                      : <><ShoppingCart size={14} /> {isAdding ? 'Adding…' : 'Add bundle to cart'}</>
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      {openBundle && openPricing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${openBundle.name} details`}
          onClick={() => setOpenBundleId(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(13,13,13,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
              maxHeight: '88vh', overflowY: 'auto', position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setOpenBundleId(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 2,
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,.9)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ height: 180, position: 'relative', overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
              <img
                src={BUNDLE_IMGS[openBundle.id]}
                alt={openBundle.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.55), transparent)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 18, color: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .8 }}>
                  Bundle · {openProds.length} compounds
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, letterSpacing: '-.02em', marginTop: 2 }}>
                  {openBundle.name}
                </div>
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', marginBottom: 20 }}>
                {openBundle.desc}
              </p>

              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                {openProds.map((p: any) => (
                  <div key={p.slug} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', border: '1px solid rgba(13,13,13,.08)', borderRadius: 12,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: '#f7f5f1',
                      flexShrink: 0, overflow: 'hidden', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {p.image
                        ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.color?.vialFrom ?? '#3b82f6' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0d0d0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(13,13,13,.45)' }}>{p.mg}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0d0d', flexShrink: 0 }}>
                      {formatPrice(p.price, p.currencyCode ?? openPricing.currencyCode)}
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(p.variantId || `gid://shopify/ProductVariant/${p.id}`, p.name, p.mg, p.price, p.slug, p.image)}
                      aria-label={`Add ${p.name} to cart`}
                      style={{
                        width: 30, height: 30, borderRadius: '50%', border: 'none',
                        background: '#f0f0ee', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
                {openProds.length < openBundle.products.length && (
                  <p style={{ fontSize: 12, color: 'rgba(13,13,13,.4)' }}>
                    Loading remaining items for your region…
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: '#0d0d0d' }}>
                  {formatPrice(openPricing.displayDiscounted, openPricing.currencyCode)}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(13,13,13,.35)', textDecoration: 'line-through' }}>
                  {formatPrice(openPricing.displayTotal, openPricing.currencyCode)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0A7B45' }}>
                  Save {formatPrice(openPricing.displaySave, openPricing.currencyCode)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAddBundle(openBundle, openProds)}
                disabled={openProds.length === 0 || addingId === openBundle.id}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '15px 20px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14,
                  color: '#fff', cursor: openProds.length === 0 ? 'not-allowed' : 'pointer',
                  background: addedId === openBundle.id ? '#0A7B45' : '#0d0d0d',
                  opacity: addingId === openBundle.id ? 0.7 : 1,
                }}
              >
                {addedId === openBundle.id
                  ? <><CheckCircle size={16} /> Added to cart</>
                  : <><ShoppingCart size={16} /> {addingId === openBundle.id ? 'Adding…' : 'Add full bundle to cart'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}