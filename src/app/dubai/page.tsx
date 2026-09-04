// src/app/dubai/page.tsx
//
// Local landing page for the market PepcoLab actually dispatches in.
//
// WHY DUBAI SPECIFICALLY
// Geography is the least defended thing in this business. "Research peptides
// Dubai" and "buy peptides UAE" have almost no serious competition — the
// suppliers ranking for peptide terms are overwhelmingly US-focused and none
// of them can ship into the UAE quickly or with local support. A category
// page cannot win a local query; a local page can.
//
// HONESTY CONSTRAINTS — this page must not drift:
//   - No shopfront is claimed. There is no walk-in address, so none is given.
//   - No delivery time is promised beyond what /shipping already states.
//   - Nothing implies legal advice about importing or possessing compounds.
//     /legal covers status per compound and this page links to it.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'
const SECTION_PAD = 'clamp(48px, 7vw, 76px) clamp(20px, 5vw, 48px)'

export const metadata: Metadata = {
  title: 'Research Peptides in Dubai & the UAE',
  description:
    'Research-grade peptides dispatched within the UAE with cold-chain packaging and batch-matched certificates of analysis. Local dispatch to Dubai, Abu Dhabi and Sharjah. For laboratory research use only.',
  alternates: { canonical: '/dubai' },
  openGraph: {
    title: 'Research Peptides in Dubai & the UAE | PepcoLab',
    description: 'Local cold-chain dispatch, independently tested batches, certificates searchable by lot.',
    url: 'https://www.pepcolab.com/dubai',
    images: [{ url: '/og-pepcolab.jpg', width: 1200, height: 630, alt: 'PepcoLab' }],
  },
}

const FAQ = [
  {
    q: 'Do you deliver within Dubai?',
    a: 'Yes. Orders are dispatched from PepcoLab inventory held in the UAE, in temperature-controlled packaging, to Dubai and across the Emirates including Abu Dhabi and Sharjah. Most orders are dispatched within one business day of payment being confirmed; delivery estimates run from dispatch rather than from when you ordered.',
  },
  {
    q: 'Is stock held locally, or shipped in from abroad?',
    a: 'Locally. That is the practical difference between ordering here and ordering from an overseas supplier: no international transit window for a cold-chain product, and no customs step between you and the parcel.',
  },
  {
    q: 'Can I visit a shop?',
    a: 'No. PepcoLab is a supply operation, not a retail shopfront — orders are placed online and dispatched to you. If you would rather arrange an order through a person, message us on WhatsApp.',
  },
  {
    q: 'Do you supply laboratories and clinics in the UAE?',
    a: 'Yes, and institutional buyers are handled separately from individual orders — quotations, purchase orders and invoicing rather than card checkout. See the bulk and institutional ordering page.',
  },
  {
    q: 'What is the legal position in the UAE?',
    a: 'Everything supplied is for in-vitro laboratory research use only. None of it is a medicine, none of it is licensed by any medicines regulator, and none of it is for human or veterinary consumption. Purchasers are responsible for ensuring their intended use is lawful in their jurisdiction — our legal status page covers what is known per compound, and it is not a substitute for your own advice.',
  },
  {
    q: 'Which currency will I be charged in?',
    a: 'UAE dirhams (AED). That is the currency displayed and the currency your card is charged, so there is no conversion surprise at the payment screen.',
  },
]

export default function DubaiPage() {
  return (
    <>
      <Nav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map(f => ({
              '@type': 'Question', name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <main style={{ background: PAPER, color: INK }}>
        <section style={{ padding: SECTION_PAD, maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(32px,5.5vw,56px)', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1.03, margin: '0 0 20px' }}>
            Research peptides in Dubai
          </h1>
          <p style={{ fontSize: 'clamp(15px,1.6vw,18px)', lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 620, margin: '0 0 28px' }}>
            Stock is held in the UAE and dispatched locally in temperature-controlled packaging,
            with a batch-matched certificate for every lot. No international transit window, no
            customs step, and a person on WhatsApp when something needs sorting.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 24px',
              borderRadius: 999, background: INK, color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
            }}>Browse the catalogue</Link>
            <Link href="/certificates" style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px',
              borderRadius: 999, border: `1px solid rgba(13,13,13,.15)`, background: '#fff',
              color: INK, fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
            }}>See published certificates</Link>
          </div>
        </section>

        <section style={{ padding: SECTION_PAD, background: INK, color: '#FAFAF8' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,42px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.08, margin: '0 0 18px', maxWidth: 620 }}>
              Why local supply changes the maths
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(250,250,248,.65)', maxWidth: 640, margin: '0 0 34px' }}>
              Most research compounds reaching the Gulf come from overseas sellers, which means a
              long transit window for a temperature-sensitive product, a customs step nobody can
              give you a date for, and no one to speak to when a parcel goes quiet.
            </p>
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
              {[
                { t: 'Stock held in the UAE', d: 'Dispatched from local inventory rather than forwarded from another country, so the cold chain has one short leg instead of several long ones.' },
                { t: 'Charged in dirhams', d: 'Displayed and charged in AED. No conversion surprise between the product page and the payment screen.' },
                { t: 'Support in your timezone', d: 'Questions answered on WhatsApp during Gulf hours, by someone who can actually look up your order.' },
                { t: 'Certificates before you buy', d: 'The batch library is public and searchable by lot number — you do not have to order first to see the documentation.' },
              ].map(c => (
                <div key={c.t} style={{ border: '1px solid rgba(250,250,248,.14)', borderRadius: 16, padding: 22 }}>
                  <h3 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 9px' }}>{c.t}</h3>
                  <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'rgba(250,250,248,.6)', margin: 0 }}>{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: SECTION_PAD, maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,3.4vw,40px)', fontWeight: 800, letterSpacing: '-.04em', margin: '0 0 28px' }}>
            Ordering in the UAE
          </h2>
          {FAQ.map(f => (
            <div key={f.q} style={{ padding: '20px 0', borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 9px' }}>{f.q}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'rgba(13,13,13,.65)', margin: 0 }}>{f.a}</p>
            </div>
          ))}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
            {[
              { href: '/shipping', label: 'Shipping details' },
              { href: '/bulk-orders', label: 'Institutional orders' },
              { href: '/legal', label: 'Legal status by compound' },
              { href: '/storage', label: 'Storage & handling' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 20px',
                borderRadius: 999, border: `1px solid rgba(13,13,13,.15)`, background: '#fff',
                fontSize: 13.5, fontWeight: 600, color: INK, textDecoration: 'none',
              }}>{l.label}</Link>
            ))}
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(13,13,13,.42)', marginTop: 30 }}>
            Supplied for in-vitro laboratory research use only. Not medicines, not licensed by any
            medicines regulator, and not for human or veterinary consumption.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}