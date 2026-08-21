// src/app/compare/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { COMPARISONS } from '@/lib/comparisons-data'
import { ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Peptide Comparisons — Research Profile Reference',
  description: 'Side-by-side research-profile comparisons between commonly co-discussed research peptides — structure, mechanism, and research literature focus.',
  alternates: {
    canonical: '/compare',
    languages: { 'en-GB': '/compare', 'en-AE': '/compare', 'x-default': '/compare' },
  },
}

export default function CompareHubPage() {
  return (
    <>
      <Nav />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        <section style={{ maxWidth: 900, margin: '0 auto', padding: '56px 24px 32px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,42px)', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 14, color: '#0d0d0d' }}>
            Peptide Comparisons
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(13,13,13,.6)', maxWidth: 640 }}>
            Structure and mechanism, side by side, for compounds that are frequently discussed together. Research-profile reference only.
          </p>
        </section>

        <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 72px', display: 'grid', gap: 12 }}>
          {COMPARISONS.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: '#f7f5f1', borderRadius: 12, padding: '18px 20px',
              textDecoration: 'none', color: '#0d0d0d',
            }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 17 }}>{c.compoundA} vs {c.compoundB}</span>
              <ChevronRight size={16} style={{ color: 'rgba(13,13,13,.3)', flexShrink: 0 }} />
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </>
  )
}
