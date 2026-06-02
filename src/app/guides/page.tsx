'use client'

import { useMemo, useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Search, BookOpen, Clock } from 'lucide-react'

const GUIDES = [
  {
    title: 'Peptide Reconstitution: Complete Step-by-Step Guide',
    category: 'Lab Basics',
    readTime: '6 min',
    desc: 'Proper reconstitution techniques to maintain peptide stability and research integrity.',
  },
  {
    title: 'Storage Conditions for Research Peptides',
    category: 'Storage',
    readTime: '5 min',
    desc: 'Temperature control, freeze-thaw cycles, and long-term preservation best practices.',
  },
  {
    title: 'Sterile Handling Procedures in Research Environments',
    category: 'Lab Basics',
    readTime: '8 min',
    desc: 'Minimizing contamination risk during peptide preparation and handling.',
  },
  {
    title: 'Dosage Calculation Principles for In Vitro Research',
    category: 'Calculations',
    readTime: '7 min',
    desc: 'Understanding concentration, dilution, and measurement accuracy.',
  },
  {
    title: 'Understanding Peptide Half-Life in Research Models',
    category: 'Pharmacology',
    readTime: '9 min',
    desc: 'How peptide stability impacts experimental outcomes and data interpretation.',
  },
  {
    title: 'COA Interpretation Guide (HPLC & Mass Spec)',
    category: 'Documentation',
    readTime: '10 min',
    desc: 'How to read and verify Certificate of Analysis reports properly.',
  },
]

const CATEGORIES = [
  'All',
  'Lab Basics',
  'Storage',
  'Calculations',
  'Pharmacology',
  'Documentation',
]

export default function GuidesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = useMemo(() => {
    return GUIDES.filter((g) => {
      const matchCategory = category === 'All' || g.category === category
      const matchSearch =
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.desc.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [search, category])

  return (
    <>
      <Nav />

      <main style={{ background: '#f7f5f1', minHeight: '100vh' }}>
        {/* ── HERO ── */}
        <section
          style={{
            padding: '72px 24px 40px',
            borderBottom: '1px solid rgba(13,13,13,.08)',
            background: '#fff',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'rgba(13,13,13,.4)',
                marginBottom: 10,
              }}
            >
              Knowledge Base
            </div>

            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(28px,4vw,44px)',
                letterSpacing: '-.04em',
                marginBottom: 10,
              }}
            >
              Research Guides
            </h1>

            <p
              style={{
                maxWidth: 600,
                fontSize: 14,
                lineHeight: 1.7,
                color: 'rgba(13,13,13,.6)',
              }}
            >
              Structured protocols, lab techniques, and foundational knowledge for peptide
              research and handling. Built for consistency and reproducibility.
            </p>

            {/* Search */}
            <div
              style={{
                marginTop: 20,
                display: 'flex',
                gap: 10,
                maxWidth: 520,
              }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(13,13,13,.35)',
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search guides..."
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    fontSize: 13,
                    border: '1px solid rgba(13,13,13,.15)',
                    borderRadius: 10,
                    outline: 'none',
                    background: '#fff',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FILTERS ── */}
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid rgba(13,13,13,.15)',
                background: category === c ? '#0d0d0d' : '#fff',
                color: category === c ? '#fff' : 'rgba(13,13,13,.6)',
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* ── GRID ── */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
              gap: 16,
            }}
          >
            {filtered.map((g) => (
              <article
                key={g.title}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(13,13,13,.08)',
                  borderRadius: 14,
                  padding: 18,
                  transition: 'transform .2s ease, box-shadow .2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      color: 'rgba(13,13,13,.45)',
                    }}
                  >
                    {g.category}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: 'rgba(13,13,13,.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Clock size={12} /> {g.readTime}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 18,
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  {g.title}
                </h3>

                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(13,13,13,.6)',
                    lineHeight: 1.6,
                  }}
                >
                  {g.desc}
                </p>

                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#0d0d0d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Read Guide →
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 0',
                color: 'rgba(13,13,13,.5)',
              }}
            >
              No guides found for your search.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}