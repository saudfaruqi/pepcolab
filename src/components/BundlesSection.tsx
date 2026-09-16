'use client'
// src/components/BundlesSection.tsx
//
// Bundle cards + detail panel. All pricing and matching lives in
// lib/bundles.ts — see the header there for what was fixed (Sep 2026):
// no placeholder prices while loading, exact variants added to the cart,
// and a saving that checkout actually applies.
import { ArrowRight, X, ShoppingCart, CheckCircle } from 'lucide-react'
import { useRef, useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getProducts } from '@/lib/shopify'
import { formatPrice, productHref } from '@/lib/utils'
import { useCart } from '@/lib/cartContext'
import { BUNDLE_DEFS, resolveBundle, type ResolvedBundle, type BundleDef } from '@/lib/bundles'
import Vial from '@/components/Vial'
import type { Product } from '@/app/data'
import { useCountry } from '@/lib/countryContext'

function BundleImageCollage({ bundle, height }: { bundle: ResolvedBundle<Product>; height: number }) {
  return (
    <div style={{ height, display: 'flex', background: bundle.def.bg }}>
      {bundle.lines.slice(0, 4).map((line, i, arr) => (
        <div
          key={line.variantId}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 14, minWidth: 0, position: 'relative',
            borderRight: i < arr.length - 1 ? '1px solid rgba(13,13,13,.06)' : 'none',
          }}
        >
          {line.product.image ? (
            <Image src={line.product.image} alt={line.product.name} fill sizes="25vw" style={{ objectFit: 'contain', padding: 14 }} />
          ) : (
            <Vial mg={line.variantTitle === 'Default Title' ? '' : line.variantTitle} size="lg" fromColor={bundle.def.accent} toColor={bundle.def.accent} />
          )}
        </div>
      ))}
    </div>
  )
}

function SkeletonCard({ def }: { def: BundleDef }) {
  return (
    <div className="card flex flex-col overflow-hidden bg-white" aria-busy="true">
      <div style={{ height: 160, background: def.bg }} className="animate-pulse" />
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="h-3 w-24 rounded bg-[#0D0D0D]/[.06]" />
        <div className="text-[14.5px] font-medium text-[var(--ink)]">{def.name}</div>
        <div className="h-3 w-40 rounded bg-[#0D0D0D]/[.06]" />
        <div className="mt-3 h-6 w-28 rounded bg-[#0D0D0D]/[.06]" />
        <div className="mt-2 h-10 w-full rounded-[8px] bg-[#0D0D0D]/[.06]" />
      </div>
    </div>
  )
}

export default function BundlesSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const { country, ready } = useCountry()
  const { addItem } = useCart()

  const [openBundleId, setOpenBundleId] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedId, setAddedId] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    setLoadFailed(false)
    getProducts(100, country)
      .then((raw) => { if (!cancelled) setProducts(raw as unknown as Product[]) })
      .catch((err) => {
        console.error('[bundles] Could not load products:', err)
        if (!cancelled) { setProducts([]); setLoadFailed(true) }
      })
    return () => { cancelled = true }
  }, [country, ready])

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

  const resolved = useMemo(
    () => (products ? BUNDLE_DEFS.map((def) => resolveBundle(def, products)) : null),
    [products]
  )

  // Log each incomplete bundle once, so a wrong handle/variant in
  // lib/bundles.ts is visible in the browser console and Vercel logs.
  const logged = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!resolved) return
    for (const b of resolved) {
      if (b.complete || logged.current.has(b.def.id)) continue
      logged.current.add(b.def.id)
      console.error(`[bundles] Hiding "${b.def.name}" — ${b.missing.join('; ')}. Check lib/bundles.ts.`)
    }
  }, [resolved])

  const visible = resolved?.filter((b) => b.complete) ?? []

  async function handleAddBundle(bundle: ResolvedBundle<Product>) {
    if (!bundle.complete || addingId) return
    setAddingId(bundle.def.id)
    try {
      for (const line of bundle.lines) {
        await addItem(line.variantId, line.product.name, line.variantTitle, line.price, line.product.slug, line.product.image)
      }
      setAddedId(bundle.def.id)
      setTimeout(() => setAddedId(null), 2200)
    } finally {
      setAddingId(null)
    }
  }

  const openBundle = visible.find((b) => b.def.id === openBundleId) || null

  return (
    <section className="py-16 lg:py-20 border-b border-[var(--border)] bg-[var(--paper)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="section-label mb-2">Curated stacks</p>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] tracking-[-0.03em] text-[var(--ink)]">Bundles &amp; protocols</h2>
          </div>
          <a href="/bundles" className="text-[13px] text-[var(--ink-60)] hover:text-[var(--ink)] flex items-center gap-1.5 transition-colors group flex-shrink-0">
            View all bundles <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!resolved && BUNDLE_DEFS.map((def) => <SkeletonCard key={def.id} def={def} />)}

          {resolved && visible.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-dashed border-[#0D0D0D]/15 py-12 text-center text-sm text-[var(--ink-60)]">
              {loadFailed
                ? 'Bundles couldn’t load right now. Please refresh, or browse the catalogue.'
                : 'Bundles are being restocked. Browse the catalogue in the meantime.'}{' '}
              <Link href="/products" className="underline">View products</Link>
            </div>
          )}

          {visible.map((bundle) => {
            const isAdding = addingId === bundle.def.id
            const isAdded = addedId === bundle.def.id
            return (
              <div key={bundle.def.id} className="card flex flex-col overflow-hidden group bg-white">
                <button
                  type="button"
                  onClick={() => setOpenBundleId(bundle.def.id)}
                  className="relative overflow-hidden text-left cursor-pointer"
                  style={{ border: 'none', padding: 0, background: 'none', width: '100%' }}
                  aria-label={`${bundle.def.name} details`}
                >
                  <div className="transition-transform duration-700 group-hover:scale-105">
                    <BundleImageCollage bundle={bundle} height={160} />
                  </div>
                  <div className="absolute top-3 right-3 text-[10px] font-semibold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    Save {bundle.def.discountPercent}% · {formatPrice(bundle.save, bundle.currency)}
                  </div>
                </button>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-30)] mb-1.5">
                    Bundle · {bundle.lines.length} compounds
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenBundleId(bundle.def.id)}
                    className="text-[14.5px] font-medium text-[var(--ink)] group-hover:text-[var(--cobalt)] transition-colors mb-1 text-left cursor-pointer"
                    style={{ border: 'none', padding: 0, background: 'none' }}
                  >
                    {bundle.def.name}
                  </button>
                  <ul className="text-[12px] text-[var(--ink-60)] mb-4 flex-1 space-y-0.5">
                    {bundle.lines.map((l) => (
                      <li key={l.variantId} className="flex justify-between gap-2">
                        <span>{l.item.label}</span>
                        <span className="text-[var(--ink-30)]">{formatPrice(l.price, bundle.currency)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-[19px] tracking-tight text-[var(--ink)]">{formatPrice(bundle.price, bundle.currency)}</span>
                      <span className="text-[12px] text-[var(--ink-30)] line-through">{formatPrice(bundle.total, bundle.currency)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenBundleId(bundle.def.id)}
                      className="text-[12px] text-[var(--ink-30)] group-hover:text-[var(--cobalt)] flex items-center gap-1 cursor-pointer"
                      style={{ border: 'none', background: 'none', padding: 0 }}
                    >
                      Details <ArrowRight size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAddBundle(bundle) }}
                    disabled={isAdding}
                    className="w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 rounded-[8px] transition-colors"
                    style={{
                      border: 'none',
                      cursor: isAdding ? 'not-allowed' : 'pointer',
                      color: '#fff',
                      background: isAdded ? '#0A7B45' : 'var(--ink, #111)',
                      opacity: isAdding ? 0.7 : 1,
                    }}
                  >
                    {isAdded
                      ? <><CheckCircle size={14} /> Added — saving applied in cart</>
                      : <><ShoppingCart size={14} /> {isAdding ? 'Adding…' : 'Add bundle to cart'}</>}
                  </button>
                  <p className="mt-2 text-[11px] text-[var(--ink-30)] text-center">
                    {bundle.def.discountPercent}% off is applied automatically in your cart.
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {openBundle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${openBundle.def.name} details`}
          onClick={() => setOpenBundleId(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(13,13,13,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto', position: 'relative' }}
          >
            <button
              type="button"
              onClick={() => setOpenBundleId(null)}
              aria-label="Close"
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 2, width: 32, height: 32, borderRadius: '50%',
                border: 'none', background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ height: 180, position: 'relative', overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
              <BundleImageCollage bundle={openBundle} height={180} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.55), transparent)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 18, color: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', opacity: .8 }}>
                  Bundle · {openBundle.lines.length} compounds
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, letterSpacing: '-.02em', marginTop: 2 }}>
                  {openBundle.def.name}
                </div>
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', marginBottom: 20 }}>
                {openBundle.def.desc} Each item ships as a current batch with its own certificate.
              </p>

              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                {openBundle.lines.map((l) => (
                  <Link
                    key={l.variantId}
                    href={productHref(l.product.slug)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      border: '1px solid rgba(13,13,13,.08)', borderRadius: 12, textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: '#f7f5f1', flexShrink: 0,
                      overflow: 'hidden', position: 'relative',
                    }}>
                      {l.product.image && (
                        <Image src={l.product.image} alt={l.product.name} fill sizes="44px" style={{ objectFit: 'contain' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0d0d0d' }}>{l.product.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(13,13,13,.45)' }}>
                        {l.variantTitle === 'Default Title' ? 'Standard' : l.variantTitle}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0d0d', flexShrink: 0 }}>
                      {formatPrice(l.price, openBundle.currency)}
                    </div>
                  </Link>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.03em', color: '#0d0d0d' }}>
                  {formatPrice(openBundle.price, openBundle.currency)}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(13,13,13,.35)', textDecoration: 'line-through' }}>
                  {formatPrice(openBundle.total, openBundle.currency)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0A7B45' }}>
                  Save {formatPrice(openBundle.save, openBundle.currency)} ({openBundle.def.discountPercent}%)
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(13,13,13,.45)', margin: '0 0 16px' }}>
                The saving is applied automatically in your cart when both items are in it.
              </p>

              <button
                type="button"
                onClick={() => handleAddBundle(openBundle)}
                disabled={addingId === openBundle.def.id}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '15px 20px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14,
                  color: '#fff', cursor: 'pointer',
                  background: addedId === openBundle.def.id ? '#0A7B45' : '#0d0d0d',
                  opacity: addingId === openBundle.def.id ? 0.7 : 1,
                }}
              >
                {addedId === openBundle.def.id
                  ? <><CheckCircle size={16} /> Added — saving applied in cart</>
                  : <><ShoppingCart size={16} /> {addingId === openBundle.def.id ? 'Adding…' : 'Add full bundle to cart'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}