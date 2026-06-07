'use client'
import { ArrowRight } from 'lucide-react'
import { useRef, useEffect } from 'react'
import React from 'react'
import { BUNDLES } from '@/app/data'
import { getProducts } from '@/lib/shopify'
import type { Product } from '@/app/data'

import { useCountry } from '@/lib/countryContext'

const BUNDLE_IMGS: Record<string, string> = {
  'b1': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80&auto=format&fit=crop',
  'b2': 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&q=80&auto=format&fit=crop',
  'b3': 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&q=80&auto=format&fit=crop',
  'b4': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80&auto=format&fit=crop',
}

function AnimatedCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.55s ease, transform 0.55s ease'
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }, delay)
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return <>{children}</>
}

export default function BundlesSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const [products, setProducts] = React.useState<Product[]>([])
  const { country, ready } = useCountry()

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
            const prods = bundle.products
              .map((slug: string) => products.find((p: Product) => p.slug === slug))
              .filter((p): p is Product => p !== undefined)
            return (
              <a
                key={bundle.id}
                href={`/bundles#${bundle.id}`}
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
                {/* Image */}
                <div className="h-[160px] relative overflow-hidden">
                  <img
                    src={BUNDLE_IMGS[bundle.id]}
                    alt={bundle.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-3 right-3 text-[10px] font-semibold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    Save AED {bundle.save.toFixed(2)}
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {prods.map((_, i) => (
                      <div key={i} className="text-[10px] font-mono text-white/70 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/20">
                        {prods[i]?.mg}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-30)] mb-1.5">Bundle · {prods.length} compounds</div>
                  <h3 className="text-[14.5px] font-medium text-[var(--ink)] group-hover:text-[var(--cobalt)] transition-colors mb-1">{bundle.name}</h3>
                  <p className="text-[12px] text-[var(--ink-30)] mb-4 flex-1">{bundle.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-[19px] tracking-tight text-[var(--ink)]">AED {bundle.price.toFixed(2)}</span>
                    <ArrowRight size={14} className="text-[var(--ink-30)] group-hover:text-[var(--cobalt)] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}