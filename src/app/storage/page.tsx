// src/app/storage/page.tsx
//
// The storage and handling reference.
//
// WHY THIS PAGE EXISTS, AND HOW IT AVOIDS COMPETING WITH THE EXISTING GUIDE
//
// The site ALREADY has /guides/storage-conditions (general peptide storage
// science) and /research/peptide-storage (the chemistry of degradation). A
// third page repeating the same general advice would split the same signal
// three ways — the exact cannibalisation the /recovery and /metabolic hubs
// were retitled to fix in September 2026.
//
// So the split is by SPECIFICITY, not topic:
//   /guides/storage-conditions  -> general science. How peptides degrade,
//                                  what temperature and humidity do, why.
//   THIS page                   -> PepcoLab's own formats and policy. What
//                                  the vial, the pen, the spray, the bac
//                                  water and the acetic acid each require,
//                                  what the 28-day in-use window is, what
//                                  happens if a parcel arrives warm.
//
// A researcher asking "how should peptides be stored" wants the guide. A
// PepcoLab customer holding a pen and wondering whether to freeze it wants
// this. Keep the titles distinct and keep the cross-links below intact.
//
// COMPLIANCE: every figure below is a HANDLING specification for a laboratory
// material, identical to what is printed on the documentation in the box.
// Nothing states or implies a physiological effect, and nothing describes
// preparing material for use in a person. Keep it that way when editing.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

export const metadata: Metadata = {
  title: 'Storage & Handling by Format',
  description:
    'Storage requirements for every PepcoLab format: lyophilised vials at −20 °C, pens and sprays at 2–8 °C never frozen, reconstituted material within 28 days, plus what to do if a shipment arrives warm.',
  alternates: { canonical: '/storage' },
  openGraph: {
    title: 'Storage & Handling by Format | PepcoLab',
    description: 'What each PepcoLab format requires — vials, pens, sprays, solvents — and the 28-day in-use window.',
    url: 'https://www.pepcolab.com/storage',
    images: [{ url: '/og-pepcolab.jpg', width: 1200, height: 630, alt: 'PepcoLab' }],
  },
}

const FORMATS = [
  {
    format: 'Lyophilised vial',
    unopened: '−20 °C, desiccated, protected from light',
    afterOpening: '2–8 °C once reconstituted, use within 28 days',
    freeze: 'Frozen is correct while lyophilised. Avoid repeated freeze–thaw once in solution.',
  },
  {
    format: 'Pre-filled pen',
    unopened: '2–8 °C, do not freeze, protected from light',
    afterOpening: '2–8 °C, discard 28 days after first use',
    freeze: 'Never freeze. A pen is supplied in solution and freezing it is not recoverable.',
  },
  {
    format: 'Nasal spray',
    unopened: '2–8 °C, do not freeze, protected from light',
    afterOpening: '2–8 °C, discard 28 days after first use',
    freeze: 'Never freeze.',
  },
  {
    format: 'Bacteriostatic water',
    unopened: 'Room temperature, away from direct sunlight',
    afterOpening: 'Room temperature, sealed between uses',
    freeze: 'Do not freeze. The bacteriostatic preservative is what permits multiple entries.',
  },
  {
    format: 'Acetic acid solution',
    unopened: 'Room temperature, away from direct sunlight',
    afterOpening: 'Room temperature, keep sealed',
    freeze: 'Do not freeze.',
  },
]

const FAQ = [
  {
    q: 'Why −20 °C for vials but 2–8 °C for pens?',
    a: 'They are physically different materials. A lyophilised vial contains dry powder, which is most stable frozen and desiccated. A pen contains material already in solution — freezing a solution risks aggregation and cannot be reversed by thawing it.',
  },
  {
    q: 'Where does the 28-day figure come from?',
    a: 'It is the documented in-use window for reconstituted material held at 2–8 °C, and it is what is printed on the documentation supplied with every order. Treat it as a limit rather than a target.',
  },
  {
    q: 'My parcel arrived warm. Is it ruined?',
    a: 'Not necessarily. Lyophilised peptides are stable for the transit window under the temperature-controlled packing used for dispatch — the dry state is considerably more tolerant than material in solution. If a shipment arrives visibly compromised, photograph the packaging and the product and contact us within 48 hours; that is the window for a refund or replacement.',
  },
  {
    q: 'Does repeated freeze–thaw matter?',
    a: 'Yes, and it is one of the commonest handling errors. Each cycle is an opportunity for aggregation and degradation in solution. Aliquot at reconstitution if the preparation will be drawn from repeatedly, rather than returning the same vial to the freezer.',
  },
  {
    q: 'Does light exposure actually matter?',
    a: 'For some materials, considerably. Copper complexes such as GHK-Cu and AHK-Cu are light- and oxidation-sensitive, which is why they are supplied and stored protected from light. Where a compound has a specific requirement it is stated on its own documentation.',
  },
  {
    q: 'What about the postal or courier delay?',
    a: 'Handling requirements begin when the parcel is opened. Material in transit is packed for that transit; requirements on this page apply to storage in your own facility once it arrives.',
  },
]

const SECTION_PAD = 'clamp(48px, 7vw, 80px) clamp(20px, 5vw, 48px)'

export default function StoragePage() {
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
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <main style={{ background: PAPER, color: INK }}>
        <section style={{ padding: SECTION_PAD, maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(32px,5.5vw,58px)', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1.02, margin: '0 0 20px' }}>
            Storage &amp; handling
          </h1>
          <p style={{ fontSize: 'clamp(15px,1.6vw,18px)', lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 620, margin: '0 0 16px' }}>
            A correctly synthesised, independently tested peptide can still be ruined in a
            freezer. Every format PepcoLab supplies has its own requirement, and the vial and
            the pen of the same compound are opposites.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.5)', maxWidth: 620, margin: 0 }}>
            Looking for the science rather than our specifications?{' '}
            <Link href="/guides/storage-conditions" style={{ color: INK, fontWeight: 600 }}>
              Storage conditions for research peptides
            </Link>{' '}
            covers how and why peptides degrade.
          </p>
        </section>

        <section style={{ padding: `0 clamp(20px,5vw,48px) clamp(40px,6vw,64px)`, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16 }}>
              <thead>
                <tr style={{ background: '#fff' }}>
                  {['Format', 'Unopened', 'After opening / reconstitution', 'Freezing'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '14px 16px', fontSize: 12,
                      fontWeight: 700, color: 'rgba(13,13,13,.5)',
                      borderBottom: `1px solid ${BORDER}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORMATS.map(f => (
                  <tr key={f.format}>
                    <td style={{ padding: '15px 16px', fontSize: 14, fontWeight: 700, borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>{f.format}</td>
                    <td style={{ padding: '15px 16px', fontSize: 13.5, lineHeight: 1.6, color: 'rgba(13,13,13,.7)', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>{f.unopened}</td>
                    <td style={{ padding: '15px 16px', fontSize: 13.5, lineHeight: 1.6, color: 'rgba(13,13,13,.7)', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>{f.afterOpening}</td>
                    <td style={{ padding: '15px 16px', fontSize: 13.5, lineHeight: 1.6, color: 'rgba(13,13,13,.7)', borderBottom: `1px solid ${BORDER}`, verticalAlign: 'top' }}>{f.freeze}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.7, color: 'rgba(13,13,13,.45)', marginTop: 14 }}>
            Where a specific compound carries a requirement of its own, it is stated on that
            product&apos;s page and on the documentation supplied with the order. That always
            takes precedence over this table.
          </p>
        </section>

        <section style={{ padding: SECTION_PAD, background: INK, color: '#FAFAF8' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(26px,3.6vw,42px)', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1.08, margin: '0 0 18px', maxWidth: 640 }}>
              The three mistakes that ruin material
            </h2>
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', marginTop: 32 }}>
              {[
                { t: 'Freezing a solution', d: 'Pens and sprays arrive in solution. Freezing risks aggregation, and thawing does not undo it. The vial and the pen of the same compound have opposite requirements.' },
                { t: 'Repeated freeze–thaw', d: 'Every cycle degrades material in solution a little further. Aliquot at reconstitution rather than returning one vial to the freezer repeatedly.' },
                { t: 'Ignoring the 28 days', d: 'The in-use window for reconstituted material at 2–8 °C is a limit, not a target. Plan the work around it rather than discovering it afterwards.' },
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
            Common questions
          </h2>
          {FAQ.map(f => (
            <div key={f.q} style={{ padding: '20px 0', borderBottom: `1px solid ${BORDER}` }}>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 9px' }}>{f.q}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.8, color: 'rgba(13,13,13,.65)', margin: 0 }}>{f.a}</p>
            </div>
          ))}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
            {[
              { href: '/tools/reconstitution-calculator', label: 'Reconstitution calculator' },
              { href: '/products/category/accessories', label: 'Solvents & accessories' },
              { href: '/testing', label: 'How we test' },
              { href: '/guides/storage-conditions', label: 'Guide: storage science' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 20px',
                borderRadius: 999, border: `1px solid rgba(13,13,13,.15)`,
                fontSize: 13.5, fontWeight: 600, color: INK, textDecoration: 'none',
              }}>{l.label}</Link>
            ))}
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(13,13,13,.42)', marginTop: 30 }}>
            All materials are supplied for in-vitro laboratory research use only. Nothing on this
            page describes preparation for human or veterinary use, and PepcoLab does not provide
            dosing, administration or protocol guidance.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}