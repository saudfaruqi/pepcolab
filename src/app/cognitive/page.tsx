// src/app/cognitive/page.tsx
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
  title: 'Cognitive Peptides: Research Overview & Compound Guide',
  description:
    'Which peptides appear most in cognitive and neurological research literature, how they differ, and how to check a supplier’s certificate of analysis before you order.',
  alternates: {
    canonical: '/cognitive',
    languages: { 'en-GB': '/cognitive', 'en-AE': '/cognitive', 'x-default': '/cognitive' },
  },
  openGraph: {
    title: 'Cognitive Research Peptides | PepcoLab',
    description: 'The compounds most studied in cognitive and neurological research, and how to evaluate a supplier.',
    url: `${SITE_URL}/cognitive`,
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Cognitive Research Peptides',
  url: `${SITE_URL}/cognitive`,
}

export default function CognitiveHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <section style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 24px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 16, color: '#0d0d0d' }}>
            Cognitive Research Peptides
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.7, color: 'rgba(13,13,13,.65)', maxWidth: 680 }}>
            Neuropeptide research spans stress-response and neuroplasticity pathways among others. The compounds below are the ones most discussed in that literature — both originally developed in Russia and licensed there as prescription medicines, though unlicensed in the UAE — supplied strictly for laboratory research use.
          </p>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '8px 24px 40px' }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Semax</h2>
              <p style={cardTextStyle}>An ACTH(4-10) analogue studied in neuroprotection and cognitive-function research; licensed as a prescription medicine in Russia, unlicensed in the UAE.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/research/semax" style={pillStyle}>Research profile <ChevronRight size={13} /></Link>
                <Link href="/legal/semax" style={pillStyle}>Legal status <ChevronRight size={13} /></Link>
                <Link href="/products/semax" style={pillStyle}>Shop Semax <ChevronRight size={13} /></Link>
              </div>
            </div>
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Selank</h2>
              <p style={cardTextStyle}>A synthetic analogue of tuftsin studied in anxiolytic and stress-response research; shares Semax's regulatory position.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/legal/selank" style={pillStyle}>Legal status <ChevronRight size={13} /></Link>
                <Link href="/products/selank" style={pillStyle}>Shop Selank <ChevronRight size={13} /></Link>
              </div>
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 64px' }}>
          <Link href="/products/category/cognitive" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700,
            color: '#0d0d0d', textDecoration: 'none', borderBottom: '2px solid #0d0d0d', paddingBottom: 2,
          }}>
            Browse all Cognitive research peptides <ChevronRight size={15} />
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