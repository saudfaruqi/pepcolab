// src/app/uk/page.tsx
//
// UK MARKET — PAUSED (10 Nov 2026)
// --------------------------------
// UK ordering opened in Oct 2026 and is paused from 10 Nov 2026
// (UK_CHECKOUT_LIVE = false in lib/pricing.ts). The page stays up for search
// and collects a launch list (UkLaunchForm). When UK selling reopens, restore
// the "Now ordering" copy below and remove the form.
//
// WHAT THIS PAGE DELIBERATELY DOES NOT DO:
//   - claim any regulatory approval, MHRA registration or medicine status
//   - describe what any compound does in a body
// All claims sit on the supply axis — purity, documentation, traceability,
// handling. Keep it that way when editing.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import UkLaunchForm from '@/components/UkLaunchForm'
import { AED_PER_GBP } from '@/lib/pricing'

const SITE_URL = 'https://www.pepcolab.com'
const CANONICAL = '/uk'

export const metadata: Metadata = {
  title: 'Research Peptides in the UK | Order Online',
  description:
    'PepcoLab supplies research-grade peptides with independently tested, batch-matched certificates of analysis and cold-chain handling. UK delivery is paused for now — join the list to hear when it reopens. For in-vitro research use only.',
  alternates: {
    canonical: CANONICAL,
    languages: {
      'en-GB': CANONICAL,
      'en-AE': CANONICAL,
      'x-default': CANONICAL,
    },
  },
  openGraph: {
    title: 'PepcoLab UK | Research-Grade Peptides',
    description:
      'Independently tested, batch-matched COAs and lot-traced supply. UK delivery paused for now — join the list.',
    url: `${SITE_URL}${CANONICAL}`,
    type: 'website',
    images: [{ url: '/og-pepcolab.jpg', width: 1200, height: 630, alt: 'PepcoLab' }],
  },
  robots: { index: true, follow: true },
}

// Rebuilt daily. The content is static; the revalidate exists so copy edits
// propagate without a redeploy.
export const revalidate = 86400

const FAQ = [
  {
    q: 'Does PepcoLab ship to the United Kingdom?',
    a: 'Not at the moment. UK delivery is paused and orders can only be placed for delivery within the UAE. Leave your email on this page and we will tell you as soon as UK delivery reopens.',
  },
  {
    q: 'Is PepcoLab a UK company?',
    a: 'Yes. PepcoLab is the trading name of SEE BEE DEE LIMITED, registered in England and Wales, company number 17072052.',
  },
  {
    q: 'What does "research use only" mean?',
    a: 'Every compound PepcoLab supplies is intended solely for in-vitro laboratory research. None of it is a medicine, a supplement, or a product for human or veterinary consumption, and none of it is licensed by the MHRA or any other medicines regulator. Purchasers are responsible for ensuring their intended use is lawful in their jurisdiction.',
  },
  {
    q: 'How is purity established?',
    a: 'Batches are tested by an independent third-party laboratory and each certificate of analysis is matched to the specific lot number printed on the vial you receive — not to a generic reference document. That distinction matters: a COA that cannot be tied to a physical lot proves nothing about the material in front of you.',
  },
  {
    q: 'What happens to the cold chain in transit?',
    a: 'Lyophilised peptides are shipped in temperature-controlled packaging and are stable for the transit window under those conditions. Handling and storage requirements for each compound are printed on the documentation supplied with the order.',
  },
  {
    q: 'Are UK prices in pounds?',
    a: `When UK delivery reopens, UK visitors will see prices in pounds, converted from our UAE dirham price list (currently £1 = AED ${AED_PER_GBP.toFixed(2)}). Payments are processed in UAE dirhams, so the card is charged the AED amount shown beside the cart total and the card provider converts it.`,
  },
]

const SECTION_PAD = 'clamp(56px, 8vw, 96px) clamp(20px, 5vw, 64px)'

export default function UkPage() {
  return (
    <>
      <Nav />

      {/* FAQPage schema. Every answer here is factual and supply-axis, which
          is what makes it safe to expose as a rich result — these are the
          exact strings that can end up quoted in a SERP. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map(item => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />

      <main style={{ background: '#FAFAF8', color: '#101010' }}>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{ padding: SECTION_PAD, maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'rgba(0,0,0,.45)',
              marginBottom: 18,
            }}
          >
            United Kingdom · Delivery paused
          </div>

          <h1
            style={{
              fontSize: 'clamp(38px, 6vw, 76px)',
              lineHeight: 0.98,
              letterSpacing: '-.05em',
              fontWeight: 800,
              margin: '0 0 26px',
              maxWidth: 900,
            }}
          >
            Research peptides,
            <br />
            documented properly.
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 1.6vw, 19px)',
              lineHeight: 1.75,
              color: 'rgba(0,0,0,.65)',
              maxWidth: 640,
              margin: '0 0 36px',
            }}
          >
            PepcoLab supplies research-grade peptides with independently
            tested, batch-matched certificates of analysis, lot traceability
            to the vial, and cold-chain handling. UK delivery is paused for
            now — leave your email and we&apos;ll tell you the day it reopens.
          </p>

          <div style={{ maxWidth: 520, marginBottom: 28 }}>
            <UkLaunchForm />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 50,
                padding: '0 26px',
                borderRadius: 999,
                background: '#101010',
                color: '#FAFAF8',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Shop the catalogue
            </Link>
            <Link
              href="/certificates"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 50,
                padding: '0 26px',
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,.15)',
                color: '#101010',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              See the certificates
            </Link>
          </div>
        </section>

        {/* ── Why it matters ───────────────────────────────────────────── */}
        <section
          style={{
            padding: SECTION_PAD,
            background: '#101010',
            color: '#FAFAF8',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                lineHeight: 1.05,
                letterSpacing: '-.04em',
                fontWeight: 800,
                margin: '0 0 20px',
                maxWidth: 720,
              }}
            >
              The UK research market has a documentation problem.
            </h2>

            <p
              style={{
                fontSize: 'clamp(14px, 1.4vw, 17px)',
                lineHeight: 1.8,
                color: 'rgba(250,250,248,.65)',
                maxWidth: 680,
                margin: '0 0 44px',
              }}
            >
              Most of what is sold into UK laboratories arrives with a
              certificate that cannot be tied to the vial it came with.
              Generic PDFs get reused across batches. Purity figures are
              quoted without a method. Suppliers appear, sell, and close.
              None of that is detectable by looking at the powder, which is
              precisely why documentation is the only thing worth judging a
              supplier on.
            </p>

            <div
              style={{
                display: 'grid',
                gap: 24,
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              }}
            >
              {[
                {
                  t: 'Independently tested',
                  d: 'Batches are tested by a third-party laboratory rather than self-certified or relying solely on the manufacturer\u2019s own paperwork.',
                },
                {
                  t: 'Batch-matched COAs',
                  d: 'The certificate you receive corresponds to the lot number on your vial. Not a representative sample. Not last quarter\u2019s batch.',
                },
                {
                  t: 'Lot-traced to the vial',
                  d: 'Every unit carries a lot number that resolves back to its own test record, so a claim can actually be checked rather than taken on trust.',
                },
                {
                  t: 'Cold-chain handling',
                  d: 'Temperature-controlled packing and documented storage requirements, because a correctly synthesised peptide can still be ruined in transit.',
                },
              ].map(card => (
                <div
                  key={card.t}
                  style={{
                    border: '1px solid rgba(250,250,248,.12)',
                    borderRadius: 16,
                    padding: 24,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      letterSpacing: '-.02em',
                      margin: '0 0 10px',
                    }}
                  >
                    {card.t}
                  </h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.75,
                      color: 'rgba(250,250,248,.6)',
                      margin: 0,
                    }}
                  >
                    {card.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Start here ───────────────────────────────────────────────── */}
        <section style={{ padding: SECTION_PAD, maxWidth: 1200, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(26px, 3.4vw, 40px)',
              lineHeight: 1.1,
              letterSpacing: '-.04em',
              fontWeight: 800,
              margin: '0 0 18px',
            }}
          >
            Before you order
          </h2>

          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.8,
              color: 'rgba(0,0,0,.65)',
              maxWidth: 640,
              margin: '0 0 30px',
            }}
          >
            Every published certificate and the full research library are
            open to read, so you can see exactly what the documentation looks
            like before you place an order.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { href: '/certificates', label: 'Published certificates' },
              { href: '/products', label: 'Browse the catalogue' },
              { href: '/research', label: 'Research library' },
              { href: '/legal', label: 'Legal status by compound' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 46,
                  padding: '0 20px',
                  borderRadius: 999,
                  border: '1px solid rgba(0,0,0,.15)',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#101010',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section
          style={{
            padding: SECTION_PAD,
            maxWidth: 900,
            margin: '0 auto',
            borderTop: '1px solid rgba(0,0,0,.08)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(26px, 3.4vw, 40px)',
              lineHeight: 1.1,
              letterSpacing: '-.04em',
              fontWeight: 800,
              margin: '0 0 32px',
            }}
          >
            UK questions
          </h2>

          <div style={{ display: 'grid', gap: 0 }}>
            {FAQ.map(item => (
              <div
                key={item.q}
                style={{
                  padding: '22px 0',
                  borderBottom: '1px solid rgba(0,0,0,.08)',
                }}
              >
                <h3
                  style={{
                    fontSize: 16.5,
                    fontWeight: 700,
                    letterSpacing: '-.02em',
                    margin: '0 0 10px',
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.8,
                    color: 'rgba(0,0,0,.65)',
                    margin: 0,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.8,
              color: 'rgba(0,0,0,.45)',
              marginTop: 32,
            }}
          >
            PepcoLab is the trading name of SEE BEE DEE LIMITED, registered in
            England and Wales, company number 17072052. All compounds are
            supplied strictly for in-vitro laboratory research. They are not
            medicines, are not licensed by the MHRA, and are not for human or
            veterinary consumption.
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}