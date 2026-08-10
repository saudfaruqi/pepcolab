// src/app/research/page.tsx
//
// FIX: previously 'use client' with all six articles held in one ARTICLES
// state array and no per-article URL — same structural issue as the old
// /guides page. Now a Server Component; full article list (and, via
// /research/[slug], full article bodies) are present in the initial HTML.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Clock, ChevronRight, Microscope } from 'lucide-react'
import { ARTICLES, CATEGORIES, tagColors } from '@/lib/research-data'

const SITE_URL = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'Research Hub — Peptide Mechanisms & Preclinical Findings',
  description:
    'In-depth research overviews of BPC-157, GLP-1 agonists, Epithalon, Semax and more — mechanisms, preclinical findings, and current evidence limitations.',
  alternates: { canonical: '/research' },
  openGraph: {
    title: 'Research Hub | PepcoLab',
    description:
      'In-depth research overviews of BPC-157, GLP-1 agonists, Epithalon, Semax and more — mechanisms, preclinical findings, and current evidence limitations.',
    url: `${SITE_URL}/research`,
    type: 'website',
  },
}

interface Props {
  searchParams: { tag?: string }
}

export default function ResearchPage({ searchParams }: Props) {
  const activeTag = searchParams.tag && CATEGORIES.some((c) => c.title === searchParams.tag)
    ? searchParams.tag
    : 'All'

  const filtered = activeTag === 'All' ? ARTICLES : ARTICLES.filter((a) => a.tag === activeTag)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Research Hub',
    url: `${SITE_URL}/research`,
    hasPart: ARTICLES.map((a) => ({
      '@type': 'Article',
      headline: a.title,
      url: `${SITE_URL}/research/${a.id}`,
      datePublished: a.dateISO,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Nav />

      <main style={{ background: '#f7f5f1', minHeight: '100vh' }}>
        <section style={{ padding: '72px 24px 40px', borderBottom: '1px solid rgba(13,13,13,.08)', background: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Microscope size={13} style={{ color: 'rgba(13,13,13,.35)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(13,13,13,.4)' }}>
                Research Hub
              </span>
            </div>

            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,44px)', letterSpacing: '-.04em', marginBottom: 10, color: '#0d0d0d' }}>
              Protocols &amp; References
            </h1>

            <p style={{ maxWidth: 640, fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)' }}>
              Mechanism-level overviews of the compounds researchers ask about most — sourced from
              published preclinical literature, with explicit limitations noted throughout. Nothing here
              is a health, dosing or treatment claim; it's a summary of what the current research does
              and doesn't show.
            </p>
          </div>
        </section>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link
            href="/research"
            style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(13,13,13,.15)',
              background: activeTag === 'All' ? '#0d0d0d' : '#fff', color: activeTag === 'All' ? '#fff' : 'rgba(13,13,13,.6)',
              textDecoration: 'none',
            }}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.title}
              href={`/research?tag=${encodeURIComponent(c.title)}`}
              style={{
                fontSize: 12, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(13,13,13,.15)',
                background: activeTag === c.title ? '#0d0d0d' : '#fff', color: activeTag === c.title ? '#fff' : 'rgba(13,13,13,.6)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {c.title} <span style={{ opacity: .5, fontSize: 11 }}>{c.count}</span>
            </Link>
          ))}
        </div>

        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
            {filtered.map((a) => {
              const tc = tagColors[a.tag] ?? { bg: '#f1f5f9', text: '#475569' }
              return (
                <Link
                  key={a.id}
                  href={`/research/${a.id}`}
                  style={{
                    background: '#fff', border: '1px solid rgba(13,13,13,.08)', borderRadius: 14,
                    padding: '20px 20px 16px', display: 'flex', flexDirection: 'column',
                    textDecoration: 'none', color: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
                      padding: '3px 9px', borderRadius: 999, background: tc.bg, color: tc.text,
                    }}>
                      {a.tag}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(13,13,13,.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {a.readTime}
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, lineHeight: 1.3, letterSpacing: '-.02em', marginBottom: 10, color: '#0d0d0d', flex: 1 }}>
                    {a.title}
                  </h2>

                  <p style={{ fontSize: 13, color: 'rgba(13,13,13,.58)', lineHeight: 1.65, marginBottom: 16 }}>
                    {a.excerpt}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(13,13,13,.06)', paddingTop: 12 }}>
                    <span style={{ fontSize: 11, color: 'rgba(13,13,13,.35)' }}>{a.date}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0d0d0d', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Read Article <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
