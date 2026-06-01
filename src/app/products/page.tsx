import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductsSection from '@/components/ProductsSection'

export const metadata: Metadata = {
  title: 'All Peptides — PepcoLab',
  description:
    '40+ research-grade peptides, independently tested and cold-chain dispatched across the UK. Every batch has a public COA.',
}

const IMGS = {
  hero: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1400&q=80&auto=format&fit=crop',
  lab1: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=600&q=80&auto=format&fit=crop',
  lab2: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=600&q=80&auto=format&fit=crop',
  coldchain: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80&auto=format&fit=crop',
  scientist: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80&auto=format&fit=crop',
}

export default function ProductsPage() {
  return (
    <>
      <Nav />

      <main style={{ background: '#f5f5f3', minHeight: '100vh' }}>

        {/* ── Hero header ── */}
        <div
          style={{
            position: 'relative',
            borderBottom: '1px solid rgba(13,13,13,.1)',
            overflow: 'hidden',
          }}
        >
          {/* Background lab photo */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${IMGS.hero})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
              opacity: 0.1,
            }}
          />
          <div
            style={{
              position: 'relative',
              maxWidth: 1400,
              margin: '0 auto',
              padding: '42px 24px 56px',
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'rgba(13,13,13,.4)',
                marginBottom: 12,
              }}
            >
              Catalogue
            </p>
            <h1
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(36px,5vw,72px)',
                fontWeight: 700,
                letterSpacing: '-.05em',
                lineHeight: 0.96,
                margin: '0 0 16px',
                color: '#0d0d0d',
              }}
            >
              All Peptides
            </h1>
            <p
              style={{
                fontSize: 15,
                color: 'rgba(13,13,13,.55)',
                lineHeight: 1.75,
                maxWidth: 520,
                margin: 0,
              }}
            >
              40+ research-grade compounds, independently verified by Eurofins
              UK, cold-chain dispatched. Every batch certificate is publicly
              searchable.
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 36 }}>
              {[
                ['99%+', 'Average purity'],
                ['Eurofins UK', 'Independent lab'],
                ['Same-day', 'Cold-chain dispatch'],
                ['40+', 'Active compounds'],
              ].map(([val, label]) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-.03em',
                      color: '#0d0d0d',
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'rgba(13,13,13,.4)',
                      marginTop: 2,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Products grid with filters ── */}
        <div style={{ paddingTop: 40 }}>
          <ProductsSection showAll />
        </div>

        {/* ── Bottom trust section ── */}
        <div
          style={{
            background: '#0d0d0d',
            padding: '72px 64px',
            borderTop: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 64,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.28)',
                  marginBottom: 16,
                }}
              >
                Our Verification Process
              </div>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(26px,3vw,42px)',
                  fontWeight: 700,
                  letterSpacing: '-.04em',
                  lineHeight: 1.05,
                  color: '#fff',
                  margin: '0 0 16px',
                }}
              >
                Every batch.{' '}
                <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,.35)' }}>
                  No exceptions.
                </em>
              </h2>
              <p
                style={{
                  fontSize: 13.5,
                  color: 'rgba(255,255,255,.45)',
                  lineHeight: 1.75,
                  maxWidth: 360,
                  margin: '0 0 28px',
                }}
              >
                Before any compound ships, it passes independent HPLC and
                mass-spectrometry analysis at Eurofins UK. The certificate is
                published immediately and searchable by lot number.
              </p>
              <a
                href="/certificates"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#fff',
                  color: '#0d0d0d',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '.05em',
                  padding: '13px 28px',
                  border: '1.5px solid #fff',
                  textDecoration: 'none',
                  borderRadius: 40,
                  transition: 'opacity .15s',
                }}
              >
                View COA Library
              </a>
            </div>

            {/* 2×2 photo grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[IMGS.lab1, IMGS.lab2, IMGS.coldchain, IMGS.scientist].map(
                (src, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      height: 160,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(.6) grayscale(20%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,.7)',
                        background: 'rgba(0,0,0,.4)',
                        padding: '3px 8px',
                      }}
                    >
                      {
                        ['Synthesis', 'HPLC Analysis', 'Cold Chain', 'Verification'][
                          i
                        ]
                      }
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}