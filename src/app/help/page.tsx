// src/app/help/page.tsx
//
// The support hub.
//
// WHY: help was spread across /faq, /shipping, /refund-policy, /track-order,
// /contact and the chat widget, with no single door. A customer with a
// problem had to guess which of six pages held their answer, and guessing
// wrong is how someone gives up and emails "hi is anyone there".
//
// Ordered by what people actually arrive needing — order problems first,
// product questions second, everything else after. Not alphabetically, and
// not by how the site happens to be structured internally.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

export const metadata: Metadata = {
  title: 'Help & Support',
  description:
    'Track an order, find a batch certificate, check storage requirements, or reach a person. Everything you might need from PepcoLab support, in one place.',
  alternates: { canonical: '/help' },
}

const GROUPS = [
  {
    title: 'My order',
    items: [
      { href: '/track-order', label: 'Track an order', d: 'Status, tracking and delivery details with your order number.' },
      { href: '/account', label: 'Your orders & reorder', d: 'Every order you have placed, and one-tap reorder.' },
      { href: '/shipping', label: 'Shipping & dispatch times', d: 'When orders leave, how they are packed, where we deliver.' },
      { href: '/refund-policy', label: 'Damaged, wrong or missing', d: 'What is covered and the 48-hour window for claims.' },
    ],
  },
  {
    title: 'The products',
    items: [
      { href: '/certificates', label: 'Find a batch certificate', d: 'Search by the lot number printed on your vial.' },
      { href: '/testing', label: 'How we test', d: 'Independent third-party testing and batch-matched documentation.' },
      { href: '/storage', label: 'Storage & handling', d: 'Temperatures by format, reconstituted shelf life, freeze–thaw.' },
      { href: '/tools/reconstitution-calculator', label: 'Reconstitution calculator', d: 'Work out concentrations for laboratory preparation.' },
    ],
  },
  {
    title: 'Buying and legal',
    items: [
      { href: '/bulk-orders', label: 'Bulk & institutional orders', d: 'Quotations, purchase orders and invoicing.' },
      { href: '/uk', label: 'UK availability', d: 'Where UK dispatch has got to, and the launch list.' },
      { href: '/legal', label: 'Legal status by compound', d: 'What research use only means, compound by compound.' },
      { href: '/faq', label: 'Full FAQ', d: 'Everything else, at length.' },
    ],
  },
]

export default function HelpPage() {
  return (
    <>
      <Nav />
      <main style={{ background: PAPER, color: INK, padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(30px,5vw,50px)', fontWeight: 800, letterSpacing: '-.045em', lineHeight: 1.05, margin: '0 0 16px' }}>
            How can we help?
          </h1>
          <p style={{ fontSize: 'clamp(15px,1.6vw,17px)', lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 560, margin: '0 0 12px' }}>
            Most things are answered below. If yours isn&apos;t, a person is one message away —
            you never have to work through a bot first.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '0 0 44px' }}>
            <Link href="/contact" style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 24px',
              borderRadius: 999, background: INK, color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
            }}>Message a person</Link>
            <a href="mailto:hello@pepcolab.com" style={{
              display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px',
              borderRadius: 999, border: `1px solid rgba(13,13,13,.15)`, background: '#fff',
              color: INK, fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
            }}>hello@pepcolab.com</a>
          </div>

          {GROUPS.map(group => (
            <section key={group.title} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 16px' }}>
                {group.title}
              </h2>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
                {group.items.map(item => (
                  <Link key={item.href} href={item.href} style={{
                    display: 'block', background: '#fff', border: `1px solid ${BORDER}`,
                    borderRadius: 14, padding: '16px 18px', textDecoration: 'none',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(13,13,13,.55)' }}>{item.d}</div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <p style={{ fontSize: 12.5, lineHeight: 1.8, color: 'rgba(13,13,13,.45)', borderTop: `1px solid ${BORDER}`, paddingTop: 22 }}>
            One thing we can&apos;t help with: dosing, administration or protocol questions.
            Everything PepcoLab supplies is for in-vitro laboratory research only, and a supplier
            willing to answer those is telling you something about how they operate.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}