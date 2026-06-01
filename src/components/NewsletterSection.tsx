'use client'
import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!email.includes('@')) return
    setSubmitted(true)
    setEmail('')
  }

  return (
    <section className="py-16 lg:py-20 border-b border-[var(--border)] bg-[var(--gray-50)]">
      <div className="max-w-2xl mx-auto px-6 lg:px-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--blue-light)] flex items-center justify-center mx-auto mb-6">
          <Mail size={24} className="text-[var(--blue)]" strokeWidth={1.7} />
        </div>
        <p className="section-label mb-2">Newsletter</p>
        <h2
          className="text-[clamp(24px,3.5vw,38px)] font-bold tracking-tight text-[var(--ink)] mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Stay Connected &amp; Stay Healthy
        </h2>
        <p className="text-[14px] text-[var(--ink-60)] leading-relaxed mb-8 max-w-md mx-auto">
          Get the latest research updates, exclusive offers, and new product announcements straight to your inbox.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-[var(--green)] font-semibold text-[15px]">
            ✅ You're subscribed! Thanks for joining.
          </div>
        ) : (
          <div className="flex gap-2.5 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter your email address"
              className="input flex-1"
            />
            <button onClick={handleSubmit} className="btn btn-blue gap-1.5 py-3 px-5 flex-shrink-0">
              Subscribe <ArrowRight size={13} />
            </button>
          </div>
        )}
        <p className="mt-4 text-[11px] text-[var(--ink-40)]">No spam ever. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}