// src/app/compare/page.tsx
//
// REVISION (Oct 2026): the hub listed seven comparisons as bare titles with
// no description and emitted no schema, so it gave Google nothing to read
// beyond a list of links and gave a visitor no reason to pick one. Each row
// now carries its own one-line summary, and the page emits ItemList +
// BreadcrumbList so the collection is legible as a collection.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { COMPARISONS } from '@/lib/comparisons-data'
import { ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'Peptide Comparisons — Research Profile Reference',
  description: 'Side-by-side research-profile comparisons between commonly co-discussed research peptides — structure, mechanism, and research literature focus.',
  alternates: {
    canonical: '/compare',
    languages: { 'en-GB': '/compare', 'en-AE': '/compare', 'x-default': '/compare' },
  },
  openGraph: {
    title: 'Peptide Comparisons | PepcoLab',
    description: 'Research-profile comparisons between commonly co-discussed research peptides.',
    url: `${SITE_URL}/compare`,
    type: 'website',
  },
}

function buildJsonLd() {
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Peptide Comparisons',
    description: 'Research-profile comparisons between commonly co-discussed research peptides.',
    numberOfItems: COMPARISONS.length,
    itemListElement: COMPARISONS.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.title,
      url: `${SITE_URL}/compare/${c.slug}`,
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Comparisons', item: `${SITE_URL}/compare` },
    ],
  }

  return [itemListLd, breadcrumbLd]
}

export default function CompareHubPage() {
  const jsonLd = buildJsonLd()

  return (
    <>
      {jsonLd.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}
      <Nav />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <section style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 28px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 14, color: '#0d0d0d' }}>
            Peptide Comparisons
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', maxWidth: 640 }}>
            Structure and mechanism, side by side, for compounds that are frequently discussed together — plus one comparison of
            the two kinds of analytical document you will be shown. Research-profile reference only.
          </p>
        </section>

        <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 72px', display: 'grid', gap: 12 }}>
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                background: '#f7f5f1', borderRadius: 12, padding: '18px 20px',
                textDecoration: 'none', color: '#0d0d0d',
                border: '1px solid rgba(13,13,13,.05)',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 17, display: 'block', marginBottom: 5, lineHeight: 1.3 }}>
                  {c.compoundA} vs {c.compoundB}
                </span>
                {/* The metaDescription doubles as the listing summary — one
                    sentence written to be read cold, which is exactly what a
                    hub row needs. Keeping them the same string means they
                    cannot drift apart. */}
                <span style={{ fontSize: 13.5, lineHeight: 1.55, color: 'rgba(13,13,13,.55)', display: 'block' }}>
                  {c.metaDescription}
                </span>
              </span>
              <ChevronRight size={16} style={{ color: 'rgba(13,13,13,.3)', flexShrink: 0 }} />
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </>
  )
}