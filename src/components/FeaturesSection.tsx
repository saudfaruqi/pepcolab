'use client'
import { useRef, useEffect } from 'react'
import { Truck, ShieldCheck, BadgeCheck, CreditCard } from 'lucide-react'

// FIX: this block previously claimed "FDA-Approved Medications Only" and
// "Licensed for US Pharmacists" / "prescription upload" review — none of
// which is true for a research-use-only peptide catalogue, and both
// directly contradict the "research use only, not for human consumption"
// positioning stated on /about, /terms and the product pages. Leaving
// this live is a real regulatory exposure (implying FDA approval and a
// pharmacist-reviewed prescription pathway for products that are neither)
// on top of being a brand-trust problem the moment a buyer compares the
// homepage to the small print. Replaced with claims that are actually true
// of this storefront.
const FEATURES = [
  {
    icon: Truck,
    title: 'Cold-Chain Dispatch — UK & UAE',
    desc: 'Temperature-controlled packaging on every order, tracked door-to-door across both markets.',
    color: '#EBF2FF',
    accent: '#1A56DB',
  },
  {
    icon: ShieldCheck,
    title: 'Independently Tested, Every Batch',
    desc: 'Third-party HPLC purity analysis by Freedom Diagnostics, with the certificate published per lot — not asserted.',
    color: '#E6F5EE',
    accent: '#0A7B45',
  },
  {
    icon: BadgeCheck,
    title: 'Sourced from Denver, Colorado, USA',
    desc: 'Manufactured and lab-tested for research use only — not for human or veterinary consumption.',
    color: '#F5F0FE',
    accent: '#7C3AED',
  },
  {
    icon: CreditCard,
    title: 'Secure Card Payments',
    desc: 'Visa, Mastercard and American Express accepted via STRABL, our PCI-compliant payment processor.',
    color: '#FFF3E8',
    accent: '#C05621',
  },
]

export default function FeaturesSection() {
  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animate = (el: HTMLElement | null, delay = 0) => {
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(18px)'
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
    animate(gridRef.current, 120)
  }, [])

  return (
    <section className="py-16 lg:py-22 border-b border-[var(--border)] bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div ref={headRef} className="text-center mb-12">
          <p className="section-label mb-2">Why choose us</p>
          <h2
            className="text-[clamp(28px,4vw,46px)] font-bold tracking-tight text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What Makes Us Different?
          </h2>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="flex flex-col gap-4 p-6 rounded-2xl border border-[var(--border)] bg-white hover:border-[var(--blue-mid)] hover:shadow-[0_6px_24px_rgba(26,86,219,0.08)] transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-200"
                  style={{ background: f.color }}
                >
                  <Icon size={22} style={{ color: f.accent }} strokeWidth={1.7} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-[var(--ink)] mb-2 leading-snug">{f.title}</h3>
                  <p className="text-[12.5px] text-[var(--ink-60)] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}