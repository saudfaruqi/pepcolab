// src/app/compare/[slug]/page.tsx
//
// ─── REVISION (Oct 2026) ──────────────────────────────────────────────────
//
// Four things were wrong or missing here and all four are fixed below.
//
// 1. MOBILE. The comparison table was three columns of prose inside
//    overflowX:'auto'. On a 390px viewport that is a horizontally scrolling
//    wall of 14.5px text — the single worst-performing layout on the site
//    against the mobile-first standard the rest of it now meets. It now
//    renders as a real <table> above 720px and as stacked per-attribute
//    cards below it, from the same markup, with no JavaScript and no
//    duplicated content for Google to see twice.
//
// 2. FAQPage JSON-LD. Added, and only when the comparison carries a visible
//    Q&A block. See components/FaqSection.tsx for why this matters on
//    question-shaped queries and for the two rules the answers follow.
//
// 3. BreadcrumbList JSON-LD. /guides/[slug] emits one, this route did not,
//    so comparison pages showed a bare URL in the SERP rather than a
//    Home › Comparisons › … trail.
//
// 4. ANCHOR TEXT. Related links rendered raw slugs — "Shop bpc 157",
//    "Research: ghk-cu". Both now resolve through proper display names
//    (productLabel() in comparisons-data.ts, RESEARCH_TITLES below), because
//    these are the only internal links on the page pointing at a buying page
//    and a slug is wasted anchor text.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import FaqSection, { buildFaqJsonLd } from '@/components/FaqSection'
import { COMPARISONS, getComparisonBySlug, productLabel } from '@/lib/comparisons-data'
import { ARTICLES } from '@/lib/research-data'
import { ArrowLeft, ChevronRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

/**
 * Real titles for the research-article pills, resolved from research-data.ts
 * rather than hardcoded, so a renamed article cannot leave stale anchor text
 * behind. Falls back to the id only if the article has been removed.
 */
function researchTitle(id: string): string {
  return ARTICLES.find((a) => a.id === id)?.title ?? id
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
    twitter: { card: 'summary_large_image', title: `${c.title} | PepcoLab`, description: c.metaDescription },
  }
}

function buildJsonLd(c: NonNullable<ReturnType<typeof getComparisonBySlug>>) {
  const url = `${SITE_URL}/compare/${c.slug}`

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.metaDescription,
    url,
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
      { '@type': 'ListItem', position: 2, name: 'Comparisons', item: `${SITE_URL}/compare` },
      { '@type': 'ListItem', position: 3, name: c.title, item: url },
    ],
  }

  const faqLd = buildFaqJsonLd(c.faq, url)

  return faqLd ? [articleLd, breadcrumbLd, faqLd] : [articleLd, breadcrumbLd]
}

export default function ComparisonPage({ params }: Props) {
  const c = getComparisonBySlug(params.slug)
  if (!c) notFound()

  const jsonLd = buildJsonLd(c)
  const others = COMPARISONS.filter((o) => o.slug !== c.slug)

  return (
    <>
      {jsonLd.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}
      <Nav />

      {/* The one media query this page needs. Inline styles cannot express a
          breakpoint, and the alternative — rendering two copies of the table
          and hiding one — ships the comparison content twice in the HTML,
          which is worth avoiding on the page whose entire value is that
          table.
          NOTE: no backticks inside this template literal. */}
      {/* All table geometry lives here rather than in inline style props,
          because an inline style wins against a class selector regardless of
          media query — padding set inline on a <td> would silently defeat
          every mobile rule below. */}
      <style>{`
        .cmp-table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
        .cmp-table th {
          text-align: left;
          padding: 10px 14px;
          border-bottom: 2px solid #e5e7eb;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: rgba(13,13,13,.5);
          font-weight: 700;
        }
        .cmp-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: top;
          color: rgba(13,13,13,.75);
          line-height: 1.6;
        }
        .cmp-row-label { font-weight: 700; color: #0d0d0d; background: #f7f5f1; }
        .cmp-stack-label { display: none; }

        @media (max-width: 719px) {
          .cmp-table, .cmp-table tbody, .cmp-table tr, .cmp-table td { display: block; width: 100%; }
          .cmp-table thead { display: none; }
          .cmp-table tr {
            border: 1px solid rgba(13,13,13,.1);
            border-radius: 12px;
            margin-bottom: 14px;
            overflow: hidden;
            background: #fff;
          }
          .cmp-table td { border-bottom: none; }
          .cmp-row-label {
            padding: 11px 15px;
            font-size: 11.5px;
            letter-spacing: .07em;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(13,13,13,.08);
          }
          .cmp-cell { padding: 13px 15px 16px; font-size: 14.5px; line-height: 1.65; }
          .cmp-cell + .cmp-cell { border-top: 1px solid rgba(13,13,13,.07); }
          .cmp-stack-label {
            display: block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: rgba(13,13,13,.4);
            margin-bottom: 5px;
          }
        }
      `}</style>

      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <div style={{ borderBottom: '1px solid rgba(13,13,13,.07)', padding: '16px 24px' }}>
          <Link href="/compare" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.55)', textDecoration: 'none', width: 'fit-content' }}>
            <ArrowLeft size={15} /> All Comparisons
          </Link>
        </div>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 8px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,3.5vw,36px)', lineHeight: 1.2, letterSpacing: '-.03em', marginBottom: 16, color: '#0d0d0d' }}>
            {c.title}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(13,13,13,.6)' }}>{c.intro}</p>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '24px 24px 8px' }}>
          <table className="cmp-table">
            <thead>
              <tr>
                <th></th>
                <th>{c.compoundA}</th>
                <th>{c.compoundB}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.label}>
                  <td className="cmp-row-label">{r.label}</td>
                  <td className="cmp-cell">
                    {/* Visible only under the mobile breakpoint, where the
                        column header is gone and the cell would otherwise be
                        an unattributed paragraph. */}
                    <span className="cmp-stack-label">{c.compoundA}</span>
                    {renderCell(r.a)}
                  </td>
                  <td className="cmp-cell">
                    <span className="cmp-stack-label">{c.compoundB}</span>
                    {renderCell(r.b)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '24px 24px 16px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 19, marginBottom: 10, color: '#0d0d0d' }}>Takeaway</h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'rgba(13,13,13,.7)' }}>{c.takeaway}</p>

          {c.kind !== 'practice' && (
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: 'rgba(13,13,13,.45)', marginTop: 18 }}>
              Research-profile comparison for laboratory reference only — not a usage, dosing, or stacking guide. See our{' '}
              <Link href="/legal" style={{ color: 'rgba(13,13,13,.6)', fontWeight: 600 }}>legal &amp; compliance hub</Link> for the regulatory position on either compound.
            </p>
          )}
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '8px 24px 16px' }}>
          <FaqSection faq={c.faq} maxWidth={820} />
        </section>

        <section style={{ maxWidth: 820, margin: '0 auto', padding: '8px 24px 48px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {(c.relatedProductSlugs ?? []).map((slug) => (
              <Link key={slug} href={`/products/${slug}`} style={pillStyle}>
                Shop {productLabel(slug)} <ChevronRight size={13} />
              </Link>
            ))}
            {(c.relatedResearchIds ?? []).map((id) => (
              <Link key={id} href={`/research/${id}`} style={pillStyle}>
                {researchTitle(id)} <ChevronRight size={13} />
              </Link>
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

/** Matches [label](target) — kept in step with components/ContentBlocks.tsx. */
const LINK_RE = /\[([^\]]+?)\]\(([^)\s]+?)\)/g

/**
 * Table cells may carry inline [label](/href) links, same syntax as the guide
 * body copy. Internal paths and https: only; anything else renders as literal
 * text so a bad href in a data file is a visible copy bug, never a live
 * javascript: URL.
 */
function renderCell(text: string): React.ReactNode {
  if (!text || !text.includes('](')) return text

  const out: React.ReactNode[] = []
  let last = 0
  let n = 0
  LINK_RE.lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = LINK_RE.exec(text)) !== null) {
    const [full, label, target] = m
    const href = target.trim()
    const internal = href.startsWith('/') || href.startsWith('#')
    const external = /^https:\/\/[^\s]+$/i.test(href)

    if (m.index > last) out.push(text.slice(last, m.index))

    if (href.startsWith('//') || (!internal && !external)) {
      out.push(full)
    } else if (external) {
      out.push(
        <a key={`c${n}`} href={href} target="_blank" rel="noopener noreferrer" style={cellLinkStyle}>{label}</a>
      )
    } else {
      out.push(<Link key={`c${n}`} href={href} style={cellLinkStyle}>{label}</Link>)
    }

    last = m.index + full.length
    n++
  }

  if (last < text.length) out.push(text.slice(last))
  return out
}

const cellLinkStyle = { color: '#3b5bdb', textDecoration: 'underline', textUnderlineOffset: 2 } as const
// thStyle/tdStyle deliberately removed — see the <style> block above. Table
// geometry cannot live in inline style props and also respond to a breakpoint.
const pillStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none',
  border: '1px solid #e5e7eb', borderRadius: 999, padding: '10px 16px', background: '#fff',
  minHeight: 44, boxSizing: 'border-box' as const,
} as const