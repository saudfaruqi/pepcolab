// src/app/guides/[slug]/page.tsx
//
// NEW FILE. This is the route that didn't exist before — each guide now has
// its own indexable URL, its own <title>/<meta description>, its own
// Article + BreadcrumbList JSON-LD, and its full body content present in
// the server-rendered HTML. This is what lets an individual guide rank for
// its own query ("peptide reconstitution guide", "COA interpretation
// guide") instead of being invisible behind a client-side state toggle.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ContentBlocks from '@/components/ContentBlocks'
import { GUIDES, CATEGORY_COLORS, getGuideBySlug } from '@/lib/guides-data'
import { relatedProductsForGuideCategory, crossHubLinkForGuide } from '@/lib/contentLinks'
import { Clock, ArrowLeft, ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.id }))
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuideBySlug(params.slug)
  if (!guide) {
    return { title: 'Guide not found', robots: { index: false, follow: false } }
  }

  const canonical = `/guides/${guide.id}`

  return {
    title: guide.title,
    description: guide.metaDescription,
    // Same-URL dual-market rationale as app/layout.tsx / app/products/[slug]/page.tsx.
    alternates: {
      canonical,
      languages: { 'en-GB': canonical, 'en-AE': canonical, 'x-default': canonical },
    },
    openGraph: {
      title: `${guide.title} | PepcoLab`,
      description: guide.metaDescription,
      url: `${SITE_URL}${canonical}`,
      type: 'article',
      publishedTime: guide.publishedISO,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${guide.title} | PepcoLab`,
      description: guide.metaDescription,
    },
  }
}

function buildJsonLd(guide: NonNullable<ReturnType<typeof getGuideBySlug>>) {
  const url = `${SITE_URL}/guides/${guide.id}`

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription,
    datePublished: guide.publishedISO,
    dateModified: guide.publishedISO,
    author: { '@type': 'Organization', name: 'PepcoLab' },
    publisher: {
      '@type': 'Organization',
      name: 'PepcoLab',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/pepcologo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
      { '@type': 'ListItem', position: 3, name: guide.title, item: url },
    ],
  }

  return [articleLd, breadcrumbLd]
}

export default function GuideDetailPage({ params }: Props) {
  const guide = getGuideBySlug(params.slug)
  if (!guide) notFound()

  const cat = CATEGORY_COLORS[guide.category] || { bg: '#f5f5f5', color: '#444' }
  const jsonLd = buildJsonLd(guide)
  const relatedProducts = relatedProductsForGuideCategory(guide.category)
  const crossHubLink = crossHubLinkForGuide(guide.id)

  // Same-category guides first, then anything else, capped at 3 — keeps
  // every guide internally linked to its neighbours (topic clustering).
  const related = [
    ...GUIDES.filter((g) => g.id !== guide.id && g.category === guide.category),
    ...GUIDES.filter((g) => g.id !== guide.id && g.category !== guide.category),
  ].slice(0, 3)

  return (
    <>
      {jsonLd.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}

      <Nav />

      <main style={{ background: '#fff', minHeight: '100vh' }}>
        {/* Top bar / breadcrumb */}
        <div style={{ borderBottom: '1px solid rgba(13,13,13,.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/guides" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.55)', textDecoration: 'none' }}>
            <ArrowLeft size={15} /> All Guides
          </Link>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(13,13,13,.35)' }}>
            Research Guides
          </span>
        </div>

        {/* Hero */}
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 999, background: cat.bg, color: cat.color,
            }}>
              {guide.category}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(13,13,13,.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} /> {guide.readTime} read
            </span>
            <span style={{ fontSize: 12, color: 'rgba(13,13,13,.35)' }}>{guide.publishedAt}</span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,3.5vw,38px)', lineHeight: 1.2, letterSpacing: '-.03em', marginBottom: 16, color: '#0d0d0d' }}>
            {guide.title}
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(13,13,13,.55)', maxWidth: 620 }}>
            {guide.excerpt}
          </p>
        </section>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ borderTop: '1px solid rgba(13,13,13,.08)', marginBottom: 48 }} />
        </div>

        {/* Body */}
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 40px' }}>
          <ContentBlocks content={guide.content} />

          {(guide.category === 'Legality & Compliance') && (
            <p style={{ fontSize: 12.5, lineHeight: 1.7, color: 'rgba(13,13,13,.45)', marginTop: 12, paddingTop: 18, borderTop: '1px solid rgba(13,13,13,.08)' }}>
              This guide is general information, not legal advice, and reflects our understanding of the
              regulatory position at time of publication. Rules can change and individual circumstances vary —
              verify anything time-sensitive or high-stakes with a qualified professional or the relevant
              regulator directly.
            </p>
          )}
        </section>

        {/* Cross-hub link for the storage/reconstitution pair — this guide
            covers the step-by-step procedure, its research-data.ts
            counterpart covers the underlying chemistry. See
            lib/contentLinks.ts crossHubLinkForGuide(). */}
        {crossHubLink && (
          <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 24px' }}>
            <Link
              href={crossHubLink.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#3b5bdb', textDecoration: 'none',
                border: '1px solid #dbe4ff', background: '#f0f4ff', borderRadius: 999, padding: '9px 16px',
              }}
            >
              {crossHubLink.label} <ChevronRight size={13} />
            </Link>
          </section>
        )}

        {/* Shop related compounds — content -> product half of the
            internal-link fix; see lib/contentLinks.ts. */}
        {relatedProducts.length > 0 && (
          <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 48px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {relatedProducts.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none',
                    border: '1px solid #e5e7eb', borderRadius: 999, padding: '9px 16px',
                  }}
                >
                  {p.label} <ChevronRight size={13} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related guides — internal linking / topic cluster */}
        {related.length > 0 && (
          <section style={{ background: '#f7f5f1', padding: '48px 24px 72px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 20 }}>
                Related Guides
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {related.map((g) => {
                  const rc = CATEGORY_COLORS[g.category] || { bg: '#f5f5f5', color: '#444' }
                  return (
                    <Link
                      key={g.id}
                      href={`/guides/${g.id}`}
                      style={{
                        background: '#fff', border: '1px solid rgba(13,13,13,.08)', borderRadius: 12,
                        padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        textDecoration: 'none', color: 'inherit', gap: 12,
                      }}
                    >
                      <div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: 999, background: rc.bg, color: rc.color, marginBottom: 8, display: 'inline-block',
                        }}>
                          {g.category}
                        </span>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15.5, color: '#0d0d0d' }}>{g.title}</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'rgba(13,13,13,.3)', flexShrink: 0 }} />
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  )
}