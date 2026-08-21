// src/app/legal/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { LEGAL_NOTES } from '@/lib/legal-data'
import { ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'Legal & Compliance Hub — UK & UAE Research Peptide Regulation',
  description:
    'Compound-by-compound and country-by-country overview of how research peptides are regulated in the UK and UAE, and what "research use only" actually means.',
  alternates: {
    canonical: '/legal',
    languages: { 'en-GB': '/legal', 'en-AE': '/legal', 'x-default': '/legal' },
  },
}

export default function LegalHubPage() {
  return (
    <>
      <Nav />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <section style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px 32px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 14, color: '#0d0d0d' }}>
            Legal & Compliance Hub
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(13,13,13,.6)', maxWidth: 640 }}>
            General overviews, not legal advice, covering how UK and UAE law treats research-use peptides — country frameworks and compound-specific pages.
          </p>
        </section>

        <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 14 }}>
            Country frameworks
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <Link href="/guides/research-peptides-legal-status-uk" style={rowStyle}>
              <span>Are Research Peptides Legal in the UK? A Compliance Overview</span>
              <ChevronRight size={16} style={{ color: 'rgba(13,13,13,.3)', flexShrink: 0 }} />
            </Link>
            <Link href="/guides/research-peptides-legal-status-uae" style={rowStyle}>
              <span>Buying Research Peptides in the UAE: What to Know Before You Order</span>
              <ChevronRight size={16} style={{ color: 'rgba(13,13,13,.3)', flexShrink: 0 }} />
            </Link>
          </div>
        </section>

        <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 72px' }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 14 }}>
            By compound
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {LEGAL_NOTES.map((n) => (
              <Link key={n.slug} href={`/legal/${n.slug}`} style={rowStyle}>
                <span>Is {n.compound} legal in the UK and UAE?</span>
                <ChevronRight size={16} style={{ color: 'rgba(13,13,13,.3)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

const rowStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  background: '#f7f5f1', borderRadius: 12, padding: '16px 18px',
  textDecoration: 'none', color: '#0d0d0d', fontSize: 15, fontFamily: 'Georgia, serif',
} as const
