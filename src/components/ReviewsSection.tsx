'use client'
import { useRef, useEffect } from 'react'
import { Star, Quote } from 'lucide-react'

const REVIEWS = [
  {
    name: 'Daniel Rodriguez',
    role: 'Manila, Spain',
    stars: 5,
    title: 'My go-to for cold season',
    text: 'Always impresses me with their quality. The purity certificates are public and real, and I love that every purchase comes with tracking. Truly a trustworthy pharmacy partner.',
    avatar: 'DR',
    color: '#EBF2FF',
  },
  {
    name: 'Megan Thompson',
    role: 'Seattle, Colorado',
    stars: 5,
    title: 'Excellent service for flu while',
    text: 'Cured my prescription in just 2 days. Their process is impressive — everything was confirmed and delivered cold-packed with perfect instructions. Highly recommend.',
    avatar: 'MT',
    color: '#E6F5EE',
  },
  {
    name: 'Robert Greene',
    role: 'Seattle, Wyoming',
    stars: 5,
    title: 'Better than my local pharmacy',
    text: 'PepcoLab has transformed the way I manage my research. The COA library is publicly searchable, delivery is fast, and the customer service team is always available.',
    avatar: 'RG',
    color: '#F5F0FE',
  },
]

export default function ReviewsSection() {
  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animate = (el: HTMLElement | null, delay = 0) => {
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }, delay)
          obs.disconnect()
        }
      }, { threshold: 0.1 })
      obs.observe(el)
    }
    animate(headRef.current, 0)
    animate(gridRef.current, 100)
  }, [])

  return (
    <section className="py-16 lg:py-22 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div ref={headRef} className="text-center mb-12">
          <p className="section-label mb-2">What customers say</p>
          <h2
            className="text-[clamp(26px,3.8vw,44px)] font-bold tracking-tight text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Trusted by{' '}
            <span className="text-[var(--blue)]">10k+ Happy</span>
            <br />
            Customers, With{' '}
            <span className="text-[var(--blue)]">4.9</span> Review
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-[14px] font-semibold text-[var(--ink-60)] ml-2">4.9 / 5.0 from 10,400 reviews</span>
          </div>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="relative flex flex-col gap-4 p-6 rounded-2xl border border-[var(--border)] bg-white hover:border-[var(--blue-mid)] hover:shadow-[0_8px_30px_rgba(26,86,219,0.09)] transition-all"
            >
              <Quote size={20} className="text-[var(--blue-mid)] absolute top-5 right-5" />

              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(r.stars)].map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              <div>
                <div className="text-[13.5px] font-bold text-[var(--ink)] mb-1.5">{r.title}</div>
                <p className="text-[12.5px] text-[var(--ink-60)] leading-relaxed">{r.text}</p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: r.color, color: 'var(--blue)' }}
                >
                  {r.avatar}
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-[var(--blue)]">{r.name}</div>
                  <div className="text-[11px] text-[var(--ink-40)]">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}