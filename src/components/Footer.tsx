'use client'

import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background: '#0d0d0d',
        borderTop: '1px solid rgba(255,255,255,.06)',
        padding: '64px 20px 32px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ── GRID ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 40,
            marginBottom: 56,
          }}
        >
          {/* BRAND */}
          <div style={{ gridColumn: 'span 2' }}>
            <img src="/pepcologo.png" alt="PepcoLab Logo" className="h-18 w-auto mb-6 invert" />

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,.45)',
                maxWidth: 420,
                marginBottom: 14,
              }}
            >
              Research-grade compounds with full analytical transparency. Every batch is
              independently verified and documented for research integrity.
            </p>

            <p
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,.25)',
                fontStyle: 'italic',
              }}
            >
              For research use only. Not intended for human consumption, diagnosis, or
              medical treatment.
            </p>
          </div>

          {/* PRODUCTS */}
          <div>
            <SectionTitle>Products</SectionTitle>
            <FooterLink href="/products">All Peptides</FooterLink>
            <FooterLink href="/products?cat=recovery">Recovery</FooterLink>
            <FooterLink href="/products?cat=metabolic">Metabolic</FooterLink>
            <FooterLink href="/products?cat=cognitive">Cognitive</FooterLink>
            <FooterLink href="/products?cat=skin">Skin</FooterLink>
          </div>

          {/* RESEARCH */}
          <div>
            <SectionTitle>Research</SectionTitle>
            <FooterLink href="/research">Research Hub</FooterLink>
            <FooterLink href="/certificates">COA Library</FooterLink>
            <FooterLink href="/tools">Tools</FooterLink>
            <FooterLink href="/guides">Guides</FooterLink>
          </div>

          {/* COMPANY */}
          <div>
            <SectionTitle>Company</SectionTitle>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/shipping">Shipping</FooterLink>
            <FooterLink href="/returns">Returns</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,.07)',
            paddingTop: 20,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={bottomText}>
            © {year} PepcoLab Ltd. All rights reserved.
          </span>

          <span style={bottomText}>
            Registered UK Supplier · Research Use Only
          </span>
        </div>
      </div>

      {/* ── RESPONSIVE ── */}
      <style>{`
        @media (max-width: 1024px) {
          footer div[style*="grid-template-columns"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          footer div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }

          footer {
            padding: 48px 16px 28px !important;
          }

          footer a {
            font-size: 14px !important;
            padding: 6px 0;
          }
        }
      `}</style>
    </footer>
  )
}

/* ── COMPONENTS ── */

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        fontSize: 13,
        color: 'rgba(255,255,255,.45)',
        textDecoration: 'none',
        marginBottom: 8,
        transition: 'color .15s ease',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.color = '#fff')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = 'rgba(255,255,255,.45)')
      }
    >
      {children}
    </Link>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,.3)',
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}

const bottomText: React.CSSProperties = {
  fontSize: 11.5,
  color: 'rgba(255,255,255,.25)',
}