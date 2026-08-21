// src/app/compare/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { COMPARISONS, getComparisonBySlug } from '@/lib/comparisons-data'
import { ArrowLeft, ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const c = getComparisonBySlug(params.slug)
  if (!c) return { title: 'Not found', robots: { index: false, follow: false } }

  const canonical = `/compare/${c.slug}`
  return {
    title: c.title,
    description: c.metaDescription,
    alternates: {
      canonical,
      languages: { 'en-GB': canonical, 'en-AE': canonical, 'x-default': canonical },
    },
    openGraph: { title: `${c.title} | PepcoLab`, description: c.metaDescription, url: `${SITE_URL}${canonical}`, type: 'article' },
  }
}

function buildJsonLd(c: NonNullable<ReturnType<typeof getComparisonBySlug>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.metaDescription,
    url: `${SITE_URL}/compare/${c.slug}`,
    author: { '@type': 'Organization', name: 'PepcoLab' },
  }
}

export default function ComparisonPage({ params }: Props) {
  const c = getComparisonBySlug(params.slug)
  if (!c) notFound()

  const jsonLd = buildJsonLd(c)
  const others = COMPARISONS.filter((o) => o.slug !== c.slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />

      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <div style={{ borderBottom: '1px solid rgba(13,13,13,.07)', padding: '16px 24px' }}>
          <Link href="/compare" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.55)', textDecoration: 'none', width: 'fit-content' }}>
            <ArrowLeft size={15} /> All Comparisons
          </Link>
        </div>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '56px 24px 8px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,3.5vw,36px)', lineHeight: 1.2, letterSpacing: '-.03em', marginBottom: 16, color: '#0d0d0d' }}>
            {c.title}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(13,13,13,.6)' }}>{c.intro}</p>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '24px 24px 8px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>{c.compoundA}</th>
                <th style={thStyle}>{c.compoundB}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.label}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#0d0d0d', background: '#f7f5f1' }}>{r.label}</td>
                  <td style={tdStyle}>{r.a}</td>
                  <td style={tdStyle}>{r.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '24px 24px 16px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 19, marginBottom: 10, color: '#0d0d0d' }}>Takeaway</h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'rgba(13,13,13,.7)' }}>{c.takeaway}</p>
          <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(13,13,13,.45)', marginTop: 18 }}>
            Research-profile comparison for laboratory reference only — not a usage, dosing, or stacking guide. See our{' '}
            <Link href="/legal" style={{ color: 'rgba(13,13,13,.6)', fontWeight: 600 }}>legal &amp; compliance hub</Link> for the regulatory position on either compound.
          </p>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '8px 24px 48px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(c.relatedProductSlugs ?? []).map((slug) => (
              <Link key={slug} href={`/products/${slug}`} style={pillStyle}>Shop {slug.replace(/-/g, ' ')} <ChevronRight size={13} /></Link>
            ))}
            {(c.relatedResearchIds ?? []).map((id) => (
              <Link key={id} href={`/research/${id}`} style={pillStyle}>Research: {id} <ChevronRight size={13} /></Link>
            ))}
          </div>
        </section>

        {others.length > 0 && (
          <section style={{ background: '#f7f5f1', padding: '40px 24px 64px' }}>
            <div style={{ maxWidth: 820, margin: '0 auto' }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 16 }}>
                Other comparisons
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {others.map((o) => (
                  <Link key={o.slug} href={`/compare/${o.slug}`} style={pillStyle}>{o.compoundA} vs {o.compoundB} <ChevronRight size={13} /></Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}

const thStyle = { textAlign: 'left' as const, padding: '10px 14px', borderBottom: '2px solid #e5e7eb', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '.06em', color: 'rgba(13,13,13,.5)' }
const tdStyle = { padding: '12px 14px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' as const, color: 'rgba(13,13,13,.75)', lineHeight: 1.5 }
const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none',
  border: '1px solid #e5e7eb', borderRadius: 999, padding: '9px 16px', background: '#fff',
} as const
