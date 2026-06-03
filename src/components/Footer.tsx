'use client'
import Link from 'next/link'
import { useState } from 'react'

const LINKS = {
  Products: [
    { label: 'All Compounds',    href: '/products'              },
    { label: 'Recovery',         href: '/products?cat=recovery' },
    { label: 'Metabolic',        href: '/products?cat=metabolic'},
    { label: 'Cognitive',        href: '/products?cat=cognitive'},
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
    { label: 'Shipping',  href: '/shipping' },
    { label: 'Privacy',   href: '/privacy'  },
    { label: 'Terms',     href: '/terms'    },
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()
  const [email, setEmail]   = useState('')
  const [subbed, setSubbed] = useState(false)

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
        .footer-newsletter-note {
          font-size: 10.5px;
          color: rgba(255,255,255,.22);
          margin-top: 10px;
          line-height: 1.6;
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
                <span style={{ color: '#22c55e' }}>✓</span> You're subscribed to research updates.
              </div>
            ) : (
              <>
                <div className="footer-newsletter">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && email.includes('@')) { setSubbed(true); setEmail('') } }}
                  />
                  <button onClick={() => { if (email.includes('@')) { setSubbed(true); setEmail('') } }}>
                    Subscribe
                  </button>
                </div>
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

      {/* ── Bottom bar ── */}
      <div className="footer-inner">
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span className="footer-bottom-text">© {year} PepcoLab Ltd.</span>
            <div className="footer-dot" />
            <Link href="/privacy" className="footer-bottom-link">Privacy</Link>
            <Link href="/terms"   className="footer-bottom-link">Terms</Link>
            <Link href="/shipping" className="footer-bottom-link">Shipping</Link>
          </div>
        </div>
      </div>

    </footer>
  )
}