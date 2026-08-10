// src/app/guides/page.tsx
//
// FIX: previously 'use client' with all guide content held in a single
// React state object and no per-guide URL — Google could see this index's
// card excerpts but never the guide bodies themselves, and there was
// nothing to link to or rank for "peptide reconstitution guide" etc.
// Now a Server Component: full HTML is present on first response, category
// filtering is done via real, crawlable ?category= links (no client JS
// required for the index to work or be indexed), and every guide has its
// own route at /guides/[slug].

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Clock, ChevronRight, BookOpen } from 'lucide-react'
import { GUIDES, CATEGORIES, CATEGORY_COLORS } from '@/lib/guides-data'

const SITE_URL = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'Research Guides — Peptide Handling, Storage & Compliance',
  description:
    'In-depth guides on peptide reconstitution, storage, sterile handling, dosage calculation, COA interpretation, and UK/UAE regulatory compliance for research use.',
  alternates: { canonical: '/guides' },
  openGraph: {
    title: 'Research Guides | PepcoLab',
    description:
      'In-depth guides on peptide reconstitution, storage, sterile handling, dosage calculation, COA interpretation, and UK/UAE regulatory compliance for research use.',
    url: `${SITE_URL}/guides`,
    type: 'website',
  },
}

interface Props {
  searchParams: { category?: string }
}

export default function GuidesPage({ searchParams }: Props) {
  const activeCategory = searchParams.category && CATEGORIES.includes(searchParams.category)
    ? searchParams.category
    : 'All'

  const filtered = activeCategory === 'All'
    ? GUIDES
    : GUIDES.filter((g) => g.category === activeCategory)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Research Guides',
    url: `${SITE_URL}/guides`,
    hasPart: GUIDES.map((g) => ({
      '@type': 'Article',
      headline: g.title,
      url: `${SITE_URL}/guides/${g.id}`,
      datePublished: g.publishedISO,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />

      <main style={{ background: '#f7f5f1', minHeight: '100vh' }}>
        {/* ── HERO ── */}
        <section style={{ padding: '72px 24px 40px', borderBottom: '1px solid rgba(13,13,13,.08)', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BookOpen size={13} style={{ color: 'rgba(13,13,13,.35)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(13,13,13,.4)' }}>
                Knowledge Base
              </span>
            </div>

            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-.04em', marginBottom: 10, color: '#0d0d0d' }}>
              Research Guides
            </h1>

            <p style={{ maxWidth: 640, fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)' }}>
              Structured protocols, lab techniques, and regulatory context for peptide research in the UK
              and UAE — reconstitution, storage, sterile handling, dosage calculation, COA interpretation,
              and buying compliantly. Built for consistency and reproducibility.
            </p>
          </div>
        </section>

        {/* ── CATEGORY FILTER (real links, crawlable, no JS required) ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={c === 'All' ? '/guides' : `/guides?category=${encodeURIComponent(c)}`}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid rgba(13,13,13,.15)',
                background: activeCategory === c ? '#0d0d0d' : '#fff',
                color: activeCategory === c ? '#fff' : 'rgba(13,13,13,.6)',
                textDecoration: 'none',
              }}
            >
              {c}
            </Link>
          ))}
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 12px', fontSize: 12, color: 'rgba(13,13,13,.4)' }}>
          {filtered.length} guide{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* ── GRID ── */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
            {filtered.map((g) => {
              const cat = CATEGORY_COLORS[g.category] || { bg: '#f5f5f5', color: '#444' }
              return (
                <Link
                  key={g.id}
                  href={`/guides/${g.id}`}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(13,13,13,.08)',
                    borderRadius: 14,
                    padding: '20px 20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
                      padding: '3px 9px', borderRadius: 999, background: cat.bg, color: cat.color,
                    }}>
                      {g.category}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(13,13,13,.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {g.readTime}
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, lineHeight: 1.3, letterSpacing: '-.02em', marginBottom: 10, color: '#0d0d0d', flex: 1 }}>
                    {g.title}
                  </h2>

                  <p style={{ fontSize: 13, color: 'rgba(13,13,13,.58)', lineHeight: 1.65, marginBottom: 16 }}>
                    {g.excerpt}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(13,13,13,.06)', paddingTop: 12 }}>
                    <span style={{ fontSize: 11, color: 'rgba(13,13,13,.35)' }}>{g.publishedAt}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0d0d0d', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Read Guide <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(13,13,13,.4)', fontSize: 14 }}>
              No guides found in this category.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
