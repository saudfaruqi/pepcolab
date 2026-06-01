'use client'
import { useRef, useEffect } from 'react'
import { Camera, Cpu, CheckCircle, Truck, ArrowRight, Upload } from 'lucide-react'

const STEPS = [
  { icon: Camera,      num: '01', label: 'Take Photo',    desc: 'Snap or upload your prescription clearly' },
  { icon: Cpu,         num: '02', label: 'We Read',      desc: 'We extracts & verifies all details'   },
  { icon: CheckCircle, num: '03', label: 'PharmCheck',    desc: 'Licensed pharmacist reviews & approves'   },
  { icon: Truck,       num: '04', label: 'Fast Delivery', desc: 'Dispatched same day, cold-chain tracked'  },
]

export default function ProcessSection() {
  const headRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

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
    animate(bodyRef.current, 100)
  }, [])

  return (
    <section className="py-16 lg:py-22 border-b border-[var(--border)] bg-[var(--blue-deep)] text-white overflow-hidden relative">
      {/* Subtle grid bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">

        {/* Header row */}
        <div ref={headRef} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--blue-soft)] mb-2">Prescription Upload Flow</p>
            <h2
              className="text-[clamp(26px,3.5vw,42px)] font-bold tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              From prescription to<br />
              delivery in 4 steps.
            </h2>
            <p className="mt-3 text-[13.5px] text-[rgba(255,255,255,0.6)] max-w-md leading-relaxed">
              Upload your prescription in a few taps, let our licensed pharmacists and verify it, and receive your medication at your door.
            </p>
          </div>
          <a
            href="/products"
            className="btn self-start lg:self-center py-3.5 px-7 text-[13.5px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)' }}
          >
            <Upload size={15} />
            Upload Prescription
          </a>
        </div>

        {/* Steps */}
        <div ref={bodyRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.12)] rounded-2xl overflow-hidden">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className="flex flex-col gap-4 p-7 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[var(--blue)] flex items-center justify-center">
                    <Icon size={18} className="text-white" strokeWidth={1.7} />
                  </div>
                  <span className="text-[12px] font-mono text-[rgba(255,255,255,0.3)]">{step.num}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[13.5px] font-bold text-white">{step.label}</span>
                    {idx < STEPS.length - 1 && (
                      <ArrowRight size={12} className="text-[rgba(255,255,255,0.3)] hidden lg:block" />
                    )}
                  </div>
                  <p className="text-[12px] text-[rgba(255,255,255,0.55)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}