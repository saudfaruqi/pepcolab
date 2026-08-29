// src/app/longevity/page.tsx
//
// SEO FIX (growth-playbook §04 Phase 1, "Segment hubs"): "/longevity and
// /aesthetic first — lowest competition, lowest risk." A narrative,
// intent-led landing page distinct from /products/category/anti-ageing
// (which is the storefront browse page) — this is the content/GEO layer
// that links into it, same "hub links to shop" pattern used across
// guides/research pages via lib/contentLinks.ts.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'Longevity Research Peptides — UK & UAE',
  description:
    'An overview of the peptide compounds most studied in longevity and cellular-ageing research — mechanism, research literature, and where to find batch-tested stock.',
  alternates: {
    canonical: '/longevity',
    languages: { 'en-GB': '/longevity', 'en-AE': '/longevity', 'x-default': '/longevity' },
  },
  openGraph: {
    title: 'Longevity Research Peptides | PepcoLab',
    description: 'The compounds most studied in longevity and cellular-ageing research, and how to evaluate a supplier.',
    url: `${SITE_URL}/longevity`,
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Longevity Research Peptides',
  url: `${SITE_URL}/longevity`,
}

export default function LongevityHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <section style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 24px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 16, color: '#0d0d0d' }}>
            Longevity Research Peptides
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.7, color: 'rgba(13,13,13,.65)', maxWidth: 680 }}>
            Cellular-ageing and longevity research spans several distinct mechanisms — telomere-related signalling, extracellular-matrix repair, and mitochondrial function among them. The compounds below are the ones most discussed in that literature, supplied strictly for laboratory research use.
          </p>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '8px 24px 40px' }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Epithalon</h2>
              <p style={cardTextStyle}>Studied in connection with telomerase activity and circadian regulation. See the full research profile and current UK/UAE legal status.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/research/epithalon" style={pillStyle}>Research profile <ChevronRight size={13} /></Link>
                <Link href="/legal/epithalon" style={pillStyle}>Legal status <ChevronRight size={13} /></Link>
                <Link href="/products/epithalon" style={pillStyle}>Shop Epithalon <ChevronRight size={13} /></Link>
              </div>
            </div>
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>GHK-Cu</h2>
              <p style={cardTextStyle}>A copper-dependent tripeptide studied for its role in extracellular matrix remodelling — relevant to both longevity and skin-focused (aesthetic) research literature.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/legal/ghk-cu" style={pillStyle}>Legal status <ChevronRight size={13} /></Link>
                <Link href="/compare/ghk-cu-vs-matrixyl" style={pillStyle}>Compare vs Matrixyl <ChevronRight size={13} /></Link>
                <Link href="/products/ghk-cu" style={pillStyle}>Shop GHK-Cu <ChevronRight size={13} /></Link>
              </div>
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 64px' }}>
          <Link href="/products/category/anti-ageing" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700,
            color: '#0d0d0d', textDecoration: 'none', borderBottom: '2px solid #0d0d0d', paddingBottom: 2,
          }}>
            Browse all Anti-Ageing research peptides <ChevronRight size={15} />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

const cardStyle = { background: '#f7f5f1', borderRadius: 14, padding: '22px 24px' }
const cardTitleStyle = { fontFamily: 'Georgia, serif', fontSize: 19, marginBottom: 8, color: '#0d0d0d' }
const cardTextStyle = { fontSize: 14.5, lineHeight: 1.6, color: 'rgba(13,13,13,.65)', marginBottom: 14 }
const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none',
  border: '1px solid #e5e7eb', borderRadius: 999, padding: '8px 14px', background: '#fff',
} as const
