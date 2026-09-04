'use client'
// src/app/search/page.tsx
//
// One box for everything: compounds, certificates, guides, research and lot
// numbers. Previously a visitor had to know which of those their thing was
// before they could find it — "BPC-157" is a product, a research article and
// a lot number on a certificate, and there was nowhere to type it.

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Search as SearchIcon, Loader2, ArrowUpRight } from 'lucide-react'
import { KIND_LABEL, type SearchHit, type SearchKind } from '@/lib/searchIndex'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

const KIND_TINT: Record<SearchKind, string> = {
  product: 'rgba(13,13,13,.06)',
  certificate: 'rgba(10,123,69,.10)',
  guide: 'rgba(200,153,42,.12)',
  research: 'rgba(13,13,13,.06)',
}
const KIND_COLOR: Record<SearchKind, string> = {
  product: 'rgba(13,13,13,.6)',
  certificate: '#0A7B45',
  guide: '#8A6A1E',
  research: 'rgba(13,13,13,.6)',
}

function SearchInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initial = params.get('q') ?? ''

  const [query, setQuery] = useState(initial)
  const [results, setResults] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const run = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(Array.isArray(data.results) ? data.results : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }, [])

  // Debounced as you type — 250ms is long enough not to fire on every
  // keystroke, short enough that results feel immediate.
  useEffect(() => {
    const t = setTimeout(() => {
      run(query)
      // Keep the URL in step so a search is shareable and survives a reload,
      // without pushing a history entry per keystroke.
      const url = query.trim().length >= 2 ? `/search?q=${encodeURIComponent(query)}` : '/search'
      window.history.replaceState(null, '', url)
    }, 250)
    return () => clearTimeout(t)
  }, [query, run])

  const grouped = results.reduce<Record<string, SearchHit[]>>((acc, hit) => {
    (acc[hit.kind] ||= []).push(hit)
    return acc
  }, {})
  const order: SearchKind[] = ['product', 'certificate', 'guide', 'research']

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <SearchIcon
          size={18}
          aria-hidden="true"
          style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(13,13,13,.35)' }}
        />
        <label htmlFor="site-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          Search products, certificates, guides and lot numbers
        </label>
        <input
          id="site-search"
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Compound, lot number, or a question…"
          style={{
            width: '100%', minHeight: 58, padding: '0 18px 0 48px',
            fontSize: 16, fontFamily: 'inherit', color: INK,
            border: `1px solid ${BORDER}`, borderRadius: 16,
            background: '#fff', outline: 'none',
          }}
        />
        {loading && (
          <Loader2 size={17} className="animate-spin" aria-hidden="true"
                   style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(13,13,13,.35)' }} />
        )}
      </div>

      {!searched && query.trim().length < 2 && (
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(13,13,13,.55)' }}>
          <p style={{ margin: '0 0 14px' }}>Searches everything at once:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Compound names — <strong>BPC-157</strong>, <strong>retatrutide</strong></li>
            <li>Lot numbers printed on your vial</li>
            <li>Guides and research articles</li>
          </ul>
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 26 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: INK, margin: '0 0 6px' }}>
            Nothing matched &ldquo;{query}&rdquo;
          </p>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 16px' }}>
            If that&rsquo;s a lot number from a vial you received and it isn&rsquo;t here, tell us
            &mdash; that&rsquo;s something we want to know about straight away.
          </p>
          <Link href="/contact" style={{
            display: 'inline-flex', alignItems: 'center', minHeight: 42, padding: '0 18px',
            borderRadius: 999, background: INK, color: '#fff',
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>Tell us about it</Link>
        </div>
      )}

      {order.filter(k => grouped[k]?.length).map(kind => (
        <section key={kind} style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase',
            color: 'rgba(13,13,13,.4)', margin: '0 0 10px',
          }}>
            {KIND_LABEL[kind]}{grouped[kind].length > 1 ? 's' : ''} · {grouped[kind].length}
          </h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {grouped[kind].map((hit, i) => (
              <Link key={`${hit.href}-${i}`} href={hit.href} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
                padding: '14px 16px', textDecoration: 'none',
              }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                  color: KIND_COLOR[hit.kind], background: KIND_TINT[hit.kind],
                  padding: '5px 10px', borderRadius: 999, flexShrink: 0,
                }}>{KIND_LABEL[hit.kind]}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: INK }}>{hit.title}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'rgba(13,13,13,.5)', marginTop: 2 }}>{hit.subtitle}</span>
                </span>
                <ArrowUpRight size={15} style={{ color: 'rgba(13,13,13,.3)', flexShrink: 0 }} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export default function SearchPage() {
  return (
    <>
      <Nav />
      <main style={{ background: PAPER, minHeight: '70vh', padding: 'clamp(32px,5vw,56px) 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 700, letterSpacing: '-.035em', color: INK, margin: '0 0 20px' }}>
            Search
          </h1>
          <Suspense fallback={<div style={{ height: 300 }} />}>
            <SearchInner />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}