// src/app/research/[slug]/page.tsx
//
// CRITICAL FIX (Aug 2026 audit): this file was a leftover copy-paste of
// app/products/[slug]/page.tsx — it imported getProductByHandle and tried
// to resolve params.slug (e.g. "bpc-157") as a Shopify product HANDLE
// (real handles are "bpc-157-uae"). Every "Read more" link out of
// /research (which points to `/research/${article.id}`) was 404ing.
//
// Rebuilt to do what the filename says: render an individual research
// article from lib/research-data.ts, mirroring the working pattern already
// used by app/guides/[slug]/page.tsx (Article + BreadcrumbList JSON-LD,
// full body in server-rendered HTML, related-content internal links).

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ContentBlocks from '@/components/ContentBlocks'
import { ARTICLES, getArticleBySlug, tagColors } from '@/lib/research-data'
import { relatedProductsForResearchArticle, crossHubLinkForResearchArticle } from '@/lib/contentLinks'
import { Clock, ArrowLeft, ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.id }))
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticleBySlug(params.slug)
  if (!article) {
    return { title: 'Article not found', robots: { index: false, follow: false } }
  }

  const canonical = `/research/${article.id}`

  return {
    title: article.title,
    description: article.metaDescription,
    // Same-URL dual-market rationale as app/products/[slug]/page.tsx —
    // see the comment there for why self-referencing hreflang, not a
    // second URL, is the correct fix while there's one catalogue/content
    // set shared across both markets.
    alternates: {
      canonical,
      languages: { 'en-GB': canonical, 'en-AE': canonical, 'x-default': canonical },
    },
    openGraph: {
      title: `${article.title} | PepcoLab`,
      description: article.metaDescription,
      url: `${SITE_URL}${canonical}`,
      type: 'article',
      publishedTime: article.dateISO,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | PepcoLab`,
      description: article.metaDescription,
    },
  }
}

function buildJsonLd(article: NonNullable<ReturnType<typeof getArticleBySlug>>) {
  const url = `${SITE_URL}/research/${article.id}`

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.dateISO,
    dateModified: article.dateISO,
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
      { '@type': 'ListItem', position: 2, name: 'Research Hub', item: `${SITE_URL}/research` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  }

  return [articleLd, breadcrumbLd]
}

export default function ResearchArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug)
  if (!article) notFound()

  const tagColor = tagColors[article.tag] || { bg: '#f5f5f5', color: '#444' }
  const jsonLd = buildJsonLd(article)
  const relatedProducts = relatedProductsForResearchArticle(article.id)
  const crossHubLink = crossHubLinkForResearchArticle(article.id)

  // Same-tag articles first, then anything else, capped at 3 — same
  // topic-clustering pattern as app/guides/[slug]/page.tsx.
  const related = [
    ...ARTICLES.filter((a) => a.id !== article.id && a.tag === article.tag),
    ...ARTICLES.filter((a) => a.id !== article.id && a.tag !== article.tag),
  ].slice(0, 3)

  return (
    <>
      {jsonLd.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}

      <Nav />

      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <div style={{ borderBottom: '1px solid rgba(13,13,13,.07)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/research" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.55)', textDecoration: 'none' }}>
            <ArrowLeft size={15} /> Research Hub
          </Link>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(13,13,13,.35)' }}>
            Research
          </span>
        </div>

        <section style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 999, background: tagColor.bg, color: tagColor.text,
            }}>
              {article.tag}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(13,13,13,.4)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} /> {article.readTime} read
            </span>
            <span style={{ fontSize: 12, color: 'rgba(13,13,13,.35)' }}>{article.date}</span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,3.5vw,38px)', lineHeight: 1.2, letterSpacing: '-.03em', marginBottom: 16, color: '#0d0d0d' }}>
            {article.title}
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(13,13,13,.55)', maxWidth: 620 }}>
            {article.excerpt}
          </p>
        </section>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ borderTop: '1px solid rgba(13,13,13,.08)', marginBottom: 48 }} />
        </div>

        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 40px' }}>
          <ContentBlocks content={article.content} />
        </section>

        {/* Cross-hub link for the storage/reconstitution pair — this
            research article covers the chemistry, its guides.ts
            counterpart covers the step-by-step procedure. See
            lib/contentLinks.ts crossHubLinkForResearchArticle(). */}
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

        {/* Shop related compounds — the content -> product half of the
            internal-link fix; product -> content half is in
            app/products/[slug]/page.tsx via relatedContentForProduct(). */}
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

        {related.length > 0 && (
          <section style={{ background: '#f7f5f1', padding: '48px 24px 72px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 20 }}>
                Related Research
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {related.map((a) => {
                  const rc = tagColors[a.tag] || { bg: '#f5f5f5', color: '#444' }
                  return (
                    <Link
                      key={a.id}
                      href={`/research/${a.id}`}
                      style={{
                        background: '#fff', border: '1px solid rgba(13,13,13,.08)', borderRadius: 12,
                        padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        textDecoration: 'none', color: 'inherit', gap: 12,
                      }}
                    >
                      <div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: 999, background: rc.bg, color: rc.text, marginBottom: 8, display: 'inline-block',
                        }}>
                          {a.tag}
                        </span>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15.5, color: '#0d0d0d' }}>{a.title}</div>
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