// src/app/metabolic/page.tsx
//
// SEO FIX (growth-playbook §04 Phase 1, "Segment hubs"): "...then recovery,
// cognitive, metabolic" — metabolic is deliberately last per the playbook's
// own sequencing note ("metabolic cluster last, most conservative copy"),
// since GLP-1-class content draws the most regulatory scrutiny (see
// lib/legal-data.ts). Copy here stays especially conservative — no
// weight-management framing, straight research/mechanism language only.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

// SEO FIX (Sep 2026) — KEYWORD CANNIBALISATION
//
// This hub and /products/category/{slug} were both titled "<Topic> Research
// Peptides — UAE" and both described as the compounds studied in that field.
// Two pages on the same domain competing for the same query is a net loss:
// internal links and external signal split between them, Google picks one
// (often not the one you wanted), and both rank lower than a single
// consolidated page would.
//
// They are not merged, because the intent genuinely differs. The split is now
// explicit:
//   THIS page  -> informational. "which compounds, what the research says,
//                 how to evaluate a supplier." No "for sale", no price, no
//                 market qualifier in the title.
//   /products/category/{slug} -> commercial. "<Topic> Peptides for Sale —
//                 Research Grade | UAE & UK", product grid, prices.
//
// The existing link from this page down to the category page is what passes
// the informational traffic through to the commercial page. Keep it.
export const metadata: Metadata = {
  title: 'Metabolic Peptides: Research Overview & Compound Guide',
  description:
    'Which compounds appear most in metabolic-pathway and GLP-1-class research, what distinguishes them, and how to verify purity and batch documentation before you order.',
  alternates: {
    canonical: '/metabolic',
    languages: { 'en-GB': '/metabolic', 'en-AE': '/metabolic', 'x-default': '/metabolic' },
  },
  openGraph: {
    title: 'Metabolic Research Peptides | PepcoLab',
    description: 'GLP-1-class and related compounds studied in metabolic-pathway research, and how to evaluate a supplier.',
    url: `${SITE_URL}/metabolic`,
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Metabolic Research Peptides',
  url: `${SITE_URL}/metabolic`,
}

export default function MetabolicHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <section style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 24px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 16, color: '#0d0d0d' }}>
            Metabolic Research Peptides
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.7, color: 'rgba(13,13,13,.65)', maxWidth: 680 }}>
            Metabolic-pathway research is one of the most active areas in current peptide science, centred on GLP-1, GIP, and glucagon receptor mechanisms. This is a research-literature overview — licensed weight-management medicines (Wegovy, Mounjaro) are prescription-only and are not what this page or our catalogue supplies. See the compound legal-status page below for the regulatory distinction.
          </p>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '8px 24px 40px' }}>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>GLP-1 Class Compounds</h2>
            <p style={cardTextStyle}>Compounds acting on GLP-1, GIP, and/or glucagon receptor pathways — an active area of metabolic research literature, supplied strictly for laboratory research use.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/research/glp1" style={pillStyle}>Research profile <ChevronRight size={13} /></Link>
              <Link href="/legal/glp" style={pillStyle}>Legal status <ChevronRight size={13} /></Link>
              <Link href="/products/category/metabolic" style={pillStyle}>Shop metabolic compounds <ChevronRight size={13} /></Link>
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 64px' }}>
          <Link href="/products/category/metabolic" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700,
            color: '#0d0d0d', textDecoration: 'none', borderBottom: '2px solid #0d0d0d', paddingBottom: 2,
          }}>
            Browse all Metabolic research peptides <ChevronRight size={15} />
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