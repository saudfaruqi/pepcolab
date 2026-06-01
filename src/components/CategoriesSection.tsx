'use client'
import { useRef, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    label: 'Metabolic & Weight',
    slug: 'metabolic',
    count: 8,
    emoji: '⚡',
    color: { bg: '#EBF2FF', accent: '#1A56DB', border: '#BFCFF8' },
    img: 'https://images.unsplash.com/photo-1576671414121-aa2d60f06f93?w=300&q=80&auto=format&fit=crop',
  },
  {
    label: 'Recovery & Healing',
    slug: 'recovery',
    count: 7,
    emoji: '💊',
    color: { bg: '#E6F5EE', accent: '#0A7B45', border: '#A7D9BC' },
    img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=300&q=80&auto=format&fit=crop',
  },
  {
    label: 'Cognitive & Neuro',
    slug: 'cognitive',
    count: 6,
    emoji: '🧠',
    color: { bg: '#F5F0FE', accent: '#7C3AED', border: '#D4C5F9' },
    img: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=300&q=80&auto=format&fit=crop',
  },
  {
    label: 'Hormonal & Peptide',
    slug: 'hormonal',
    count: 9,
    emoji: '🔬',
    color: { bg: '#FFF3E8', accent: '#C05621', border: '#F6C69B' },
    img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&q=80&auto=format&fit=crop',
  },
  {
    label: 'Anti-Ageing',
    slug: 'anti-ageing',
    count: 5,
    emoji: '✨',
    color: { bg: '#FFF0F5', accent: '#BE185D', border: '#F9A8D4' },
    img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&q=80&auto=format&fit=crop',
  },
  {
    label: 'Skin & Repair',
    slug: 'skin',
    count: 5,
    emoji: '🌿',
    color: { bg: '#F0FDF4', accent: '#15803D', border: '#86EFAC' },
    img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&q=80&auto=format&fit=crop',
  },
]

export default function CategoriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(18px)'
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        obs.disconnect()
      }
    }, { threshold: 0.1 })
    obs.observe(el)
  }, [])

  return (
    <section className="py-14 lg:py-18 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="section-label mb-1.5">Shop by category</p>
            <h2 className="text-[clamp(24px,3.2vw,36px)] font-bold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
              Popular Categories
            </h2>
          </div>
          <a href="/products" className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[var(--blue)] hover:text-[var(--blue-dark)] transition-colors">
            View all <ArrowRight size={14} />
          </a>
        </div>

        <div ref={sectionRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`/products?cat=${cat.slug}`}
              className="group relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(26,86,219,0.12)]"
              style={{
                background: cat.color.bg,
                borderColor: cat.color.border,
              }}
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                />
              </div>
              <div className="text-center">
                <div className="text-[12.5px] font-bold text-[var(--ink)] leading-tight mb-0.5">{cat.label}</div>
                <div className="text-[10.5px] font-medium" style={{ color: cat.color.accent }}>{cat.count} products</div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}