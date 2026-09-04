// src/app/bulk-orders/page.tsx
//
// Institutional and volume supply.
//
// WHY THIS PAGE EXISTS
// The product catalogue already says PepcoLab supplies universities,
// contract research organisations and qualified laboratory purchasers — but
// the site only let them buy the way a consumer buys: card at checkout, no
// quote, no PO, no invoice. Institutions cannot transact that way, so the
// copy was making a promise the site could not keep.
//
// This is a small build for a disproportionate class of customer: they order
// on a schedule, they do not haggle, and they do not churn.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import BulkQuoteForm from '@/components/BulkQuoteForm'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'
const SECTION_PAD = 'clamp(48px, 7vw, 76px) clamp(20px, 5vw, 48px)'

export const metadata: Metadata = {
  title: 'Bulk & Institutional Orders',
  description:
    'Volume and institutional supply of research-grade peptides for universities, CROs and laboratories. Quotations, purchase orders and invoicing. Batch-matched certificates supplied with every order.',
  alternates: { canonical: '/bulk-orders' },
  openGraph: {
    title: 'Bulk & Institutional Orders | PepcoLab',
    description: 'Quotations, purchase orders and invoicing for laboratory and institutional buyers.',
    url: 'https://www.pepcolab.com/bulk-orders',
    images: [{ url: '/og-pepcolab.jpg', width: 1200, height: 630, alt: 'PepcoLab' }],
  },
}

export default function BulkOrdersPage() {
  return (
    <>
      <Nav />
      <main style={{ background: PAPER, color: INK }}>
        <section style={{ padding: SECTION_PAD, maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(32px,5.5vw,56px)', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1.03, margin: '0 0 20px' }}>
            Bulk &amp; institutional orders
          </h1>
          <p style={{ fontSize: 'clamp(15px,1.6vw,18px)', lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 620, margin: 0 }}>
            Universities, contract research organisations and laboratories don&apos;t buy with a
            card at a checkout. Tell us what you need and how your procurement works, and
            you&apos;ll get a real quote back from a person.
          </p>
        </section>

        <section style={{ padding: `0 clamp(20px,5vw,48px) clamp(40px,6vw,60px)`, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))' }}>
            {[
              { t: 'Quotations and POs', d: 'A formal quotation document for procurement, and purchase orders accepted with invoicing rather than card payment up front.' },
              { t: 'Volume pricing', d: 'Priced case by case against the actual order rather than from a fixed table — quantities, compounds and frequency all move it.' },
              { t: 'Certificates in advance', d: 'Batch certificates supplied before you commit, so documentation can clear internal review before a PO is raised.' },
              { t: 'Scheduled supply', d: 'Recurring delivery against a standing requirement, so a project isn’t waiting on a reorder that nobody remembered to place.' },
            ].map(c => (
              <div key={c.t} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
                <h2 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 9px' }}>{c.t}</h2>
                <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'rgba(13,13,13,.6)', margin: 0 }}>{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: `0 clamp(20px,5vw,48px) clamp(48px,7vw,80px)`, maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.2vw,34px)', fontWeight: 800, letterSpacing: '-.04em', margin: '0 0 8px' }}>
            Request a quote
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 24px' }}>
            The more specific you are about quantities and procurement requirements, the fewer
            emails it takes to get you a number.
          </p>
          <BulkQuoteForm />

          <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(13,13,13,.5)', marginTop: 24 }}>
            Currently dispatching from the UAE; <Link href="/uk" style={{ color: INK, fontWeight: 600 }}>UK supply is in preparation</Link>.
            More on <Link href="/testing" style={{ color: INK, fontWeight: 600 }}>how batches are tested</Link> and{' '}
            <Link href="/storage" style={{ color: INK, fontWeight: 600 }}>storage requirements</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  )
}