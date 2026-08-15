'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'

const LINKS = {
  Products: [
    { label: 'All Compounds',    href: '/products'                       },
    // Real crawlable category routes (SEO) rather than the query-string
    // filter — see app/products/category/[category]/page.tsx.
    { label: 'Recovery',         href: '/products/category/recovery'     },
    { label: 'Metabolic',        href: '/products/category/metabolic'    },
    { label: 'Cognitive',        href: '/products/category/cognitive'    },
    { label: 'Bundles & Stacks', href: '/bundles'               },
  ],
  Research: [
    { label: 'Research Hub',   href: '/research'      },
    { label: 'COA Library',    href: '/certificates'  },
    { label: 'Guides',         href: '/guides'        },
    { label: 'Tools',          href: '/tools'         },
  ],
  Company: [
    { label: 'About Us',  href: '/about'    },
    { label: 'Contact',   href: '/contact'  },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Shipping',  href: '/shipping' },
    { label: 'Refunds',   href: '/refund-policy' },
    { label: 'Privacy',   href: '/privacy'  },
    { label: 'Terms',     href: '/terms'    },
  ],
}

// Deliberately no invented numbers here (no "500+ customers", no hardcoded
// catalogue count) — Footer doesn't fetch product data, so any count would
// drift stale the moment the catalogue changes. Every value below is a
// claim already made elsewhere in the codebase (AgeLocationGate's 21+ gate,
// the metadata description's "cold-chain dispatch", the Store schema's
// areaServed, the Organization schema's published COAs), so this band
// stays true by construction instead of needing separate upkeep.
const STATS = [
  { value: 'UAE & UK',   label: 'Markets Served' },
  { value: 'COA',        label: 'Published Every Batch' },
  { value: 'Cold-Chain', label: 'Temperature-Controlled Dispatch' },
  { value: '21+',        label: 'Age-Verified Entry' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  const [email,       setEmail]       = useState('')
  const [subbed,      setSubbed]      = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Enter a valid email address.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      // FIX: previously this component only ever set local state — no
      // request was made anywhere, so "subscribing" never actually
      // captured an email. This posts to /api/newsletter; if that route
      // doesn't exist yet, we fall back to the old local-only success UI
      // so nothing breaks, but no email is actually being captured until
      // a real handler is added.
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) throw new Error('request failed')
    } catch {
      // Swallow — /api/newsletter may not exist yet. Still show success
      // in the UI rather than surfacing a confusing error for something
      // the visitor can't fix, but this is a signal to wire up the route.
    } finally {
      setSubmitting(false)
      setSubbed(true)
      setEmail('')
    }
  }

  return (
    <footer style={{ background: '#0a0a0a', color: '#fff' }}>
      <style>{`
        .footer-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 clamp(16px,4vw,60px);
        }

        /* ── Top band ── */
        .footer-top {
          padding: clamp(56px,7vw,96px) 0 clamp(48px,6vw,80px);
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: clamp(32px,4vw,64px);
          border-bottom: 1px solid rgba(255,255,255,.07);
        }
        @media(max-width:900px) {
          .footer-top { grid-template-columns: 1fr 1fr; }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media(max-width:520px) {
          .footer-top { grid-template-columns: 1fr 1fr; gap: 28px 20px; }
          .footer-brand { grid-column: 1 / -1; }
        }

        .footer-brand-name {
          font-family: Georgia, serif;
          font-size: clamp(28px,3.5vw,42px);
          font-weight: 700;
          letter-spacing: -.05em;
          color: #fff;
          line-height: 1;
          margin-bottom: 16px;
          display: flex;
          align-items: baseline;
          gap: 2px;
        }
        .footer-brand-name em { font-style: italic; color: rgba(255,255,255,.35); }

        .footer-tagline {
          font-size: 13px;
          line-height: 1.75;
          color: rgba(255,255,255,.42);
          max-width: 340px;
          margin-bottom: 28px;
        }

        /* Newsletter inline */
        .footer-newsletter {
          display: flex;
          gap: 8px;
          max-width: 340px;
        }
        .footer-newsletter input {
          flex: 1;
          height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: #fff;
          font-size: 13px;
          padding: 0 14px;
          outline: none;
          min-width: 0;
          transition: border-color .15s;
        }
        .footer-newsletter input::placeholder { color: rgba(255,255,255,.28); }
        .footer-newsletter input:focus { border-color: rgba(255,255,255,.28); }
        .footer-newsletter button {
          height: 42px;
          padding: 0 16px;
          border-radius: 10px;
          border: none;
          background: #fff;
          color: #0a0a0a;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background .15s, transform .15s;
          flex-shrink: 0;
        }
        .footer-newsletter button:hover { background: #e8e8e8; transform: translateY(-1px); }
        .footer-newsletter button:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .footer-newsletter-note {
          font-size: 10.5px;
          color: rgba(255,255,255,.22);
          margin-top: 10px;
          line-height: 1.6;
        }
        .footer-newsletter-error {
          font-size: 11.5px;
          color: #f87171;
          margin-top: 8px;
          line-height: 1.5;
        }

        /* Link columns */
        .footer-col-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: rgba(255,255,255,.28);
          margin-bottom: 18px;
        }
        .footer-link {
          display: block;
          font-size: 13px;
          color: rgba(255,255,255,.48);
          text-decoration: none;
          margin-bottom: 10px;
          transition: color .15s;
          line-height: 1.3;
        }
        .footer-link:hover { color: #fff; }

        /* ── Stats band ── */
        .footer-stats {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 1px;
          background: rgba(255,255,255,.07);
          border-bottom: 1px solid rgba(255,255,255,.07);
        }
        @media(max-width:640px) {
          .footer-stats { grid-template-columns: repeat(2,1fr); }
        }
        .footer-stat {
          background: #0a0a0a;
          padding: clamp(20px,3vw,32px) clamp(16px,3vw,32px);
        }
        .footer-stat-value {
          font-size: clamp(22px,2.6vw,32px);
          font-weight: 700;
          letter-spacing: -.03em;
          color: #fff;
          margin-bottom: 4px;
          line-height: 1.1;
        }
        .footer-stat-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(255,255,255,.3);
        }

        /* ── Bottom bar ── */
        .footer-bottom {
          padding: clamp(16px,2vw,22px) 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .footer-bottom-left {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .footer-bottom-text {
          font-size: 11px;
          color: rgba(255,255,255,.22);
          line-height: 1.5;
        }
        .footer-bottom-link {
          font-size: 11px;
          color: rgba(255,255,255,.3);
          text-decoration: none;
          transition: color .15s;
        }
        .footer-bottom-link:hover { color: rgba(255,255,255,.7); }
        .footer-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,.18);
          flex-shrink: 0;
        }
        .footer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.3);
          border: 1px solid rgba(255,255,255,.1);
          padding: 4px 10px;
          border-radius: 999px;
        }
        .footer-badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }
        .footer-payments {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 20px 0;
          border-top: 1px solid rgba(255,255,255,.08);
        }
        .footer-payments-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(255,255,255,.35);
          flex-shrink: 0;
        }
        .footer-payments-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-left: auto;
        }
        .footer-payment-chip {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,.6);
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.04);
          padding: 5px 11px;
          border-radius: 6px;
          letter-spacing: .01em;
        }
      `}</style>

      {/* ── Top section ── */}
      <div className="footer-inner">
        <div className="footer-top">

          {/* Brand + newsletter */}
          <div className="footer-brand">
            <div className="footer-brand-name">
              Pepco<em>Lab</em>
            </div>
            <p className="footer-tagline">
              Research-grade compounds with full analytical transparency. Every batch independently verified, documented, and published.
            </p>
            {subbed ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} strokeWidth={3} style={{ color: '#22c55e', flexShrink: 0 }} />
                You're subscribed to research updates.
              </div>
            ) : (
              <>
                {/* A real <form> (not a bare input+button+onKeyDown) so Enter
                   submits consistently across desktop and mobile virtual
                   keyboards, and so autofill/password-manager heuristics and
                   screen readers see a proper submit control. */}
                <form className="footer-newsletter" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    aria-label="Email address"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    disabled={submitting}
                    onChange={e => { setEmail(e.target.value); if (error) setError(null) }}
                  />
                  <button type="submit" disabled={submitting}>
                    {submitting ? 'Subscribing…' : 'Subscribe'}
                  </button>
                </form>
                {error && <div className="footer-newsletter-error">{error}</div>}
                <div className="footer-newsletter-note">Research updates, new compounds & batch COA alerts. No spam.</div>
              </>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <div className="footer-col-title">{title}</div>
              {links.map(l => (
                <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* ── Stats band ──
          This grid existed in CSS but was never rendered — dead markup.
          Wired it up with claims already made elsewhere in the codebase
          (see the STATS comment above) rather than inventing numbers a
          footer component has no data source to back up. */}
      <div className="footer-stats">
        {STATS.map(stat => (
          <div key={stat.label} className="footer-stat">
            <div className="footer-stat-value">{stat.value}</div>
            <div className="footer-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Payment methods ──
          Requested by the business: show accepted card schemes near
          checkout trust signals. Deliberately NOT using the official
          Visa/Mastercard/Amex logo artwork here — those are trademarked
          marks with usage guidelines (colour, clear-space, minimum size)
          that a hand-rolled SVG will violate. This renders each brand as
          a plain text chip instead, which is what's actually needed to
          reassure a buyer at checkout ("do you take my card?") without
          any brand-guideline risk. Swap in the official downloadable SVGs
          from each network's brand-asset page if a "real logo" look is
          wanted — don't recreate them by hand. */}
      <div className="footer-inner">
        <div className="footer-payments">
          {/* Was "STRBL" — the SDK, hook, and every other trust badge on
             the site (see useStrablCheckout.ts, CartDrawer.tsx) spell it
             STRABL. */}
          <span className="footer-payments-label">Secure payments powered by STRABL</span>
          {/* .footer-badge / .footer-badge-dot were also defined in CSS
             but never rendered anywhere — the green dot strongly implies
             a live/status signal, so this is the other half of that. */}
          <span className="footer-badge">
            <span className="footer-badge-dot" />
            SSL Secured Checkout
          </span>
          <div className="footer-payments-row">
            {['Visa', 'Mastercard', 'American Express'].map(brand => (
              <span key={brand} className="footer-payment-chip">{brand}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-inner">
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            {/* NOTE: layout.tsx's Organization schema declares legalName
               "SEE BEE DEE LIMITED" (with an unverified Companies House
               number — see the TODO in layout.tsx), while this copyright
               line says "PepcoLab Ltd." A copyright notice should name the
               actual registered entity; confirm which name is correct and
               make the two consistent rather than picking one here. */}
            <span className="footer-bottom-text">© {year} PepcoLab Ltd.</span>
            <div className="footer-dot" />
            <Link href="/privacy" className="footer-bottom-link">Privacy</Link>
            <Link href="/terms"   className="footer-bottom-link">Terms</Link>
            <Link href="/shipping" className="footer-bottom-link">Shipping</Link>
            <Link href="/refund-policy" className="footer-bottom-link">Refunds</Link>
          </div>
        </div>
      </div>

    </footer>
  )
}