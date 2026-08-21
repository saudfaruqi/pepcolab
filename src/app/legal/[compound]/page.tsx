// src/app/legal/[compound]/page.tsx
//
// SEO FIX (growth-playbook §04 Phase 1, "Legal / compliance cluster"):
// per-compound "Is [X] legal in the UK/UAE?" pages — the audit's own words:
// "High-intent, zero competition, fully RUO-safe. No rival has any of this."
// Answer-first structure per §05 (GEO): each page opens with a direct,
// quotable answer before the supporting detail, so AI answer engines can
// lift a clean sentence and attribute it to PepcoLab.

import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { LEGAL_NOTES, getLegalNoteBySlug } from '@/lib/legal-data'
import { ArrowLeft, ChevronRight, ShieldAlert } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { compound: string }
}

export function generateStaticParams() {
  return LEGAL_NOTES.map((n) => ({ compound: n.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const note = getLegalNoteBySlug(params.compound)
  if (!note) return { title: 'Not found', robots: { index: false, follow: false } }

  const canonical = `/legal/${note.slug}`
  const title = `Is ${note.compound} Legal in the UK and UAE?`
  const description = `${note.ukSummary} ${note.uaeSummary}`.slice(0, 300)

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { 'en-GB': canonical, 'en-AE': canonical, 'x-default': canonical },
    },
    openGraph: { title: `${title} | PepcoLab`, description, url: `${SITE_URL}${canonical}`, type: 'article' },
  }
}

function buildJsonLd(note: NonNullable<ReturnType<typeof getLegalNoteBySlug>>) {
  const url = `${SITE_URL}/legal/${note.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${note.compound} legal in the UK?`,
        acceptedAnswer: { '@type': 'Answer', text: note.ukSummary },
      },
      {
        '@type': 'Question',
        name: `Is ${note.compound} legal in the UAE?`,
        acceptedAnswer: { '@type': 'Answer', text: note.uaeSummary },
      },
    ],
    url,
  }
}

export default function LegalStatusPage({ params }: Props) {
  const note = getLegalNoteBySlug(params.compound)
  if (!note) notFound()

  const jsonLd = buildJsonLd(note)
  const others = LEGAL_NOTES.filter((n) => n.slug !== note.slug).slice(0, 4)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Nav />

      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <div style={{ borderBottom: '1px solid rgba(13,13,13,.07)', padding: '16px 24px' }}>
          <Link href="/legal" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.55)', textDecoration: 'none', width: 'fit-content' }}>
            <ArrowLeft size={15} /> Legal & Compliance Hub
          </Link>
        </div>

        <section style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 24px' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 999, background: '#f3f4f6', color: '#374151',
          }}>
            Legality & Compliance
          </span>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,3.5vw,36px)', lineHeight: 1.2, letterSpacing: '-.03em', margin: '16px 0 8px', color: '#0d0d0d' }}>
            Is {note.compound} Legal in the UK and UAE?
          </h1>
        </section>

        {/* Answer-first blocks — GEO §05: extractable, self-contained, quotable */}
        <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 8px', display: 'grid', gap: 16 }}>
          <div style={{ background: '#f7f5f1', borderRadius: 14, padding: '22px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 8 }}>
              United Kingdom — short answer
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#0d0d0d', margin: 0 }}>{note.ukSummary}</p>
          </div>
          <div style={{ background: '#f7f5f1', borderRadius: 14, padding: '22px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 8 }}>
              United Arab Emirates — short answer
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#0d0d0d', margin: 0 }}>{note.uaeSummary}</p>
          </div>
        </section>

        <section style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px', display: 'grid', gap: 28 }}>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 10, color: '#0d0d0d' }}>UK detail</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'rgba(13,13,13,.7)' }}>{note.ukDetail}</p>
          </div>
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, marginBottom: 10, color: '#0d0d0d' }}>UAE detail</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'rgba(13,13,13,.7)' }}>{note.uaeDetail}</p>
          </div>

          <div style={{ display: 'flex', gap: 10, padding: '16px 18px', border: '1px solid #e5e7eb', borderRadius: 12, alignItems: 'flex-start' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 2, color: 'rgba(13,13,13,.4)' }} />
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(13,13,13,.6)', margin: 0 }}>
              This is a general overview, not legal advice, and law in this area can change. For a specific situation, consult a solicitor with life-sciences regulatory experience (UK) or MOHAP/DHA directly (UAE). See our full{' '}
              <Link href="/guides/research-peptides-legal-status-uk" style={{ color: '#0d0d0d', fontWeight: 600 }}>UK compliance guide</Link>{' '}and{' '}
              <Link href="/guides/research-peptides-legal-status-uae" style={{ color: '#0d0d0d', fontWeight: 600 }}>UAE compliance guide</Link>{' '}for the full legal framework this page summarises.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {note.relatedProductSlug && (
              <Link href={`/products/${note.relatedProductSlug}`} style={pillStyle}>
                Shop {note.compound} <ChevronRight size={13} />
              </Link>
            )}
            {note.relatedResearchId && (
              <Link href={`/research/${note.relatedResearchId}`} style={pillStyle}>
                Research: {note.compound} <ChevronRight size={13} />
              </Link>
            )}
            <Link href="/certificates" style={pillStyle}>
              Verify a batch COA <ChevronRight size={13} />
            </Link>
          </div>
        </section>

        {others.length > 0 && (
          <section style={{ background: '#f7f5f1', padding: '40px 24px 64px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', marginBottom: 16 }}>
                Other compounds
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {others.map((o) => (
                  <Link key={o.slug} href={`/legal/${o.slug}`} style={pillStyle}>
                    {o.compound} <ChevronRight size={13} />
                  </Link>
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

const pillStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 13, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none',
  border: '1px solid #e5e7eb', borderRadius: 999, padding: '9px 16px', background: '#fff',
}
