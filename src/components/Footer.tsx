'use client'
import Link from 'next/link'
import { useState } from 'react'

/**
 * Brand marks are drawn inline rather than imported.
 *
 * lucide-react removed its brand icons (Instagram, Youtube and the rest) in
 * v1 — importing them builds fine against older versions and breaks on
 * upgrade, which is the worst kind of dependency. These are the same
 * stroke-style glyphs the rest of the footer uses, at 24×24, inheriting
 * `currentColor` so the hover and focus states below drive them.
 */
type IconProps = { size?: number }

function InstagramMark({ size = 17 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function YoutubeMark({ size = 17 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
}

/**
 * Social profiles (Sep 2026).
 *
 * Kept in one place because the same URLs also belong in the Organization
 * schema's `sameAs` (app/layout.tsx) — that is what lets Google tie these
 * profiles to the PepcoLab brand entity rather than treating them as three
 * unrelated things with similar names. Brand search is already the site's
 * strongest query cluster, so the linkage is worth having.
 *
 * Add a profile here and to SOCIAL_PROFILES in app/layout.tsx together.
 */
const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/pepcolab/', Icon: InstagramMark },
  { label: 'YouTube',   href: 'https://www.youtube.com/@pepcolab',   Icon: YoutubeMark   },
]

const LINKS = {
  Products: [
    { label: 'All Compounds',    href: '/products'                       },
    // Real crawlable category routes (SEO) rather than the query-string
    // filter — see app/products/category/[category]/page.tsx.
    { label: 'Recovery',         href: '/products/category/recovery'     },
    { label: 'Metabolic',        href: '/products/category/metabolic'    },
    { label: 'Cognitive',        href: '/products/category/cognitive'    },
    { label: 'Bundles & Stacks', href: '/bundles'               },
    { label: 'Wishlist',         href: '/wishlist'              },
  ],
  Research: [
    { label: 'Research Hub',   href: '/research'      },
    { label: 'COA Library',    href: '/certificates'  },
    // Reviews (Sep 2026). Open to anyone who has dealt with us, ordered or
    // not — the write page does not require an order code.
    { label: 'Reviews',        href: '/reviews'       },
    { label: 'How We Test',    href: '/testing'       },
    { label: 'Storage Guide',  href: '/storage'       },
    { label: 'Bulk Orders',    href: '/bulk-orders'   },
    // /uk had ZERO inbound links anywhere on the site, which is why Google
    // reported it as "Discovered — currently not indexed" with no crawl ever
    // attempted. A page in the sitemap and nowhere else tells Google it
    // exists and that nothing on the site considers it worth pointing at.
    { label: 'UK Launch',      href: '/uk'            },
    { label: 'Help',           href: '/help'          },
    { label: 'Guides',         href: '/guides'        },
    { label: 'Comparisons',    href: '/compare'       },
    { label: 'Legal & Compliance', href: '/legal'     },
    { label: 'Tools',          href: '/tools'         },
  ],
  Company: [
    { label: 'About Us',  href: '/about'    },
    { label: 'Refer & Earn', href: '/referrals' },
    { label: 'Contact',   href: '/contact'  },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Shipping',  href: '/shipping' },
    { label: 'Refunds',   href: '/refund-policy' },
    { label: 'Privacy',   href: '/privacy'  },
    { label: 'Terms',     href: '/terms'    },
  ],
}


export default function Footer() {
  const year = new Date().getFullYear()
  const [email,       setEmail]       = useState('')
  const [subbed,      setSubbed]      = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubscribe() {
    const trimmed = email.trim()
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Enter a valid email address.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      // FIX 2026-08-16: this used to swallow every failure and show a fake
      // "✓ Done" regardless, back when /api/newsletter didn't exist yet.
      // The route is real now (see lib/orderStore.ts / newsletter route),
      // so a swallowed failure here just hides a genuine problem (e.g. the
      // Redis connection being down) behind a false success. Show the real
      // error instead.
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setSubbed(true)
      setEmail('')
    } catch {
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
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
          font-size: clamp(26px,3vw,38px);
          font-weight: 700;
          letter-spacing: -.06em;
          color: #fff;
          margin-bottom: 4px;
          line-height: 1;
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
        .footer-socials {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        .footer-social {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.55);
          border: 1px solid rgba(255,255,255,.14);
          transition: color .2s ease, border-color .2s ease, background .2s ease;
        }
        .footer-social:hover {
          color: #fff;
          border-color: rgba(255,255,255,.4);
          background: rgba(255,255,255,.06);
        }
        /* Keyboard users get the same affordance as a hover, not a default
           browser outline that disappears against the dark footer. */
        .footer-social:focus-visible {
          outline: 2px solid rgba(255,255,255,.8);
          outline-offset: 2px;
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
            <div>
              <img src="/pepcologo.png" alt="PepcoLab" className="lg:h-16 h-10 w-auto invert" />
            </div>
            <p className="footer-tagline">
              Research-grade compounds with full analytical transparency. Every batch independently verified, documented, and published.
            </p>
            {subbed ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#22c55e' }}>✓</span> You're subscribed to research updates.
              </div>
            ) : (
              <>
                <div className="footer-newsletter">
                  <input
                    type="email"
                    aria-label="Email address"
                    placeholder="your@email.com"
                    value={email}
                    disabled={submitting}
                    onChange={e => { setEmail(e.target.value); if (error) setError(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubscribe() }}
                  />
                  <button onClick={handleSubscribe} disabled={submitting}>
                    {submitting ? 'Subscribing…' : 'Subscribe'}
                  </button>
                </div>
                {error && <div className="footer-newsletter-error">{error}</div>}
                <div className="footer-newsletter-note">Research updates, new compounds & batch COA alerts. No spam.</div>
              </>
            )}

            <div className="footer-socials">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  /* noopener/noreferrer on every outbound target="_blank" —
                     without it the opened tab can reach back via window.opener. */
                  rel="noopener noreferrer"
                  aria-label={`PepcoLab on ${label}`}
                  title={label}
                  className="footer-social"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
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
          <span className="footer-payments-label">Secure payments powered by STRABL</span>
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
            {/* LEGAL (Sep 2026): "PepcoLab Ltd" is not a registered company. PepcoLab
                is the trading name of SEE BEE DEE LIMITED (England &amp; Wales,
                17072052). Naming a company that does not exist in your own footer
                is exactly the detail a cautious buyer checks at Companies House. */}
            <span className="footer-bottom-text">© {year} PepcoLab — SEE BEE DEE LIMITED (England &amp; Wales, 17072052)</span>
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