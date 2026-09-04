// src/app/testing/page.tsx
//
// How a batch gets from synthesis to a certificate with a lot number on it.
//
// This is the brand's entire argument, and until now it existed only as one
// paragraph on product pages and some social content. It is what a cautious
// first-time buyer reads before ordering, and what you link when someone asks
// why they should trust you rather than the cheaper listing.
//
// CLAIM DISCIPLINE — read before editing:
//   - The lab is named: Freedom Diagnostics.
//   - It is described as "an independent third-party laboratory". It is NOT
//     described as accredited, ISO/IEC 17025, UKAS, or certified by anyone.
//     If Freedom Diagnostics confirms an accreditation in writing, add it
//     here and in lib/chatContent.ts — nowhere else needs to change.
//   - No purity figure is quoted site-wide. Purity is per batch, on that
//     batch's certificate. A blanket "99%+" is the exact claim this page
//     exists to argue against.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'
const SECTION_PAD = 'clamp(48px, 7vw, 80px) clamp(20px, 5vw, 48px)'

export const metadata: Metadata = {
  title: 'How We Test',
  description:
    'Every PepcoLab batch is tested by Freedom Diagnostics, an independent third-party laboratory, and the certificate is matched to the lot number on your vial — not a generic reference document.',
  alternates: { canonical: '/testing' },
  openGraph: {
    title: 'How PepcoLab Tests Every Batch',
    description: 'Independent third-party testing, batch-matched certificates, lot traceability to the vial.',
    url: 'https://www.pepcolab.com/testing',
    images: [{ url: '/og-pepcolab.jpg', width: 1200, height: 630, alt: 'PepcoLab' }],
  },
}

const STEPS = [
  {
    t: 'Synthesis',
    d: 'Peptides are built one amino acid at a time on a solid resin support, then cleaved and purified. Nothing is grown or extracted. The sequence is determined at this stage; everything after it is about proving what actually came out.',
  },
  {
    t: 'Purification',
    d: 'The crude product is separated from truncated sequences, deletion products and residual reagents. This is where the number on a certificate is really decided — two vials of the same compound from different runs are not necessarily the same material.',
  },
  {
    t: 'Independent testing',
    d: 'Batches are tested by Freedom Diagnostics, an independent third-party laboratory. Not by us, and not on the strength of the manufacturer’s own paperwork alone. The lab has no commercial interest in the result.',
  },
  {
    t: 'Batch-matched certificate',
    d: 'The certificate reports identity and purity by HPLC, the method used and the test date — and it is tied to the specific lot number printed on the vial you receive.',
  },
  {
    t: 'Published, searchable by lot',
    d: 'Certificates go into a public library you can search by lot number before or after ordering. You do not have to ask us for one, and you do not have to take our word for what it says.',
  },
]

const FAQ = [
  {
    q: 'Why does "batch-matched" matter so much?',
    a: 'Because a certificate that cannot be tied to a physical lot proves nothing about the material in front of you. A generic PDF reused across production runs is the industry norm and it is close to meaningless — it describes a batch somebody once tested, not the one you are holding.',
  },
  {
    q: 'Why don’t you advertise a purity percentage?',
    a: 'Because purity varies between production runs, so a single site-wide number would be an average at best and a marketing claim at worst. We publish the measured figure for each batch instead, and you can read it before you order.',
  },
  {
    q: 'Is Freedom Diagnostics accredited?',
    a: 'They are an independent third-party laboratory with no commercial interest in the outcome of a test. We do not make an accreditation claim on their behalf — if a supplier tells you a lab is ISO 17025 or UKAS accredited, ask them to name the accreditation body and the scope, because those are verifiable and vague versions of the claim usually are not.',
  },
  {
    q: 'What is actually on the certificate?',
    a: 'Identity and purity determined by HPLC, the analytical method used, the test date, and the lot number it corresponds to. That last field is the one worth checking against your vial.',
  },
  {
    q: 'Can I see a certificate before I order?',
    a: 'Yes. The library is public and searchable without an account. That is deliberate — the documentation is the product as much as the powder is.',
  },
]

export default function TestingPage() {
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
          <h1 style={{ fontSize: 'clamp(32px,5.5vw,58px)', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1.02, margin: '0 0 20px' }}>
            How we test
          </h1>
          <p style={{ fontSize: 'clamp(15px,1.6vw,18px)', lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 640, margin: 0 }}>
            You cannot tell anything about a peptide by looking at it. Every meaningful
            difference between one supplier and another is in the documentation — which is
            exactly why so little of it is published.
          </p>
        </section>

        <section style={{ padding: `0 clamp(20px,5vw,48px) clamp(48px,6vw,72px)`, maxWidth: 820, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.t} style={{ display: 'flex', gap: 18, padding: '22px 0', borderTop: `1px solid ${BORDER}` }}>
              <div style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 999,
                background: '#fff', border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12.5, fontWeight: 700, color: 'rgba(13,13,13,.5)',
              }}>{i + 1}</div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.025em', margin: '3px 0 8px' }}>{s.t}</h2>
                <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'rgba(13,13,13,.65)', margin: 0, maxWidth: 620 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </section>

        <section style={{ padding: SECTION_PAD, background: INK, color: '#FAFAF8' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,42px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.08, margin: '0 0 18px', maxWidth: 600 }}>
              How to check any supplier, including us
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(250,250,248,.65)', maxWidth: 620, margin: '0 0 28px' }}>
              Four questions. They take a minute, they cost nothing, and a supplier who cannot
              answer them has told you something useful.
            </p>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 14 }}>
              {[
                'Does the certificate carry a lot number, and does it match the vial?',
                'Who ran the test, and are they independent of the seller?',
                'What method was used, and what was the test date?',
                'Can you see the certificate before ordering, without asking for it?',
              ].map(q => (
                <li key={q} style={{ fontSize: 15, lineHeight: 1.7, color: '#FAFAF8' }}>{q}</li>
              ))}
            </ol>
            <Link href="/certificates" style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 24px',
              marginTop: 30, borderRadius: 999, background: '#FAFAF8', color: INK,
              fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
            }}>
              Search our certificates by lot
            </Link>
          </div>
        </section>

        <section style={{ padding: SECTION_PAD, maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,3.4vw,40px)', fontWeight: 800, letterSpacing: '-.04em', margin: '0 0 28px' }}>
            Questions we get asked
          </h2>
          {FAQ.map(f => (
            <div key={f.q} style={{ padding: '20px 0', borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 9px' }}>{f.q}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'rgba(13,13,13,.65)', margin: 0 }}>{f.a}</p>
            </div>
          ))}
          <p style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(13,13,13,.42)', marginTop: 30 }}>
            All materials are supplied for in-vitro laboratory research use only. Not for human
            or veterinary consumption. PepcoLab is the trading name of SEE BEE DEE LIMITED,
            registered in England and Wales, company number 17072052.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}