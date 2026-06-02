
//products/page.tsx

import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductsSection from '@/components/ProductsSection'

export const metadata: Metadata = {
  title: 'Research Peptides — PepcoLab',
  description:
    'Research-grade peptides independently verified and publicly certified.',
}

const IMGS = {
  hero:
    'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=2000&q=80&auto=format&fit=crop',
  lab:
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1400&q=80&auto=format&fit=crop',
  scientist:
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80&auto=format&fit=crop',
}

export default function ProductsPage() {
  return (
    <>
      <Nav />

      <main
        style={{
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* ====================================================== */}
        {/* HERO */}
        {/* ====================================================== */}

        <section
          style={{
            position: 'relative',
            minHeight: '88vh',
            background: '#090909',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,.06)',
          }}
        >
          <img
            src={IMGS.hero}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.18,
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, rgba(0,0,0,.4), rgba(0,0,0,.8))',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 1500,
              margin: '0 auto',
              width: '100%',
              padding: 'clamp(20px,2vw,70px)',
            }}
          >
            <div
              style={{
                maxWidth: 760,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                  fontWeight: 700,
                  marginBottom: 28,
                }}
              >
                Research Catalogue
              </div>

              <h1
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(56px,9vw,120px)',
                  lineHeight: 0.9,
                  letterSpacing: '-.07em',
                  color: '#fff',
                  margin: '0 0 24px',
                }}
              >
                Research
                <br />
                Peptides
              </h1>

              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.9,
                  color: 'rgba(255,255,255,.55)',
                  maxWidth: 620,
                  marginBottom: 40,
                }}
              >
                Independently verified peptide compounds manufactured for
                laboratory and scientific research. Every batch includes public
                purity documentation and certificate verification.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href="#catalogue"
                  style={{
                    background: '#fff',
                    color: '#000',
                    textDecoration: 'none',
                    padding: '16px 20px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Browse Catalogue
                </a>

                <a
                  href="/certificates"
                  style={{
                    border: '1px solid rgba(255,255,255,.12)',
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '16px 30px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  View Certificates
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* ====================================================== */}
        {/* TRUST STRIP */}
        {/* ====================================================== */}

        <section
          style={{
            background: '#fff',
            borderBottom: '1px solid rgba(13,13,13,.08)',
            padding: '36px 14px',
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(260px,1fr))',
              gap: 20,
            }}
          >
            {[
              {
                title: 'Independent Verification',
                desc: 'Purity and identity testing documented for every lot.',
              },
              {
                title: 'Cold-Chain Dispatch',
                desc: 'Temperature-conscious packaging and rapid fulfilment.',
              },
              {
                title: 'Public COA Library',
                desc: 'Batch certificates searchable by product and lot.',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  padding: '28px 14px',
                  background: '#fafafa',
                  border: '1px solid rgba(13,13,13,.06)',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 10,
                    fontSize: 15,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    color: 'rgba(13,13,13,.55)',
                    lineHeight: 1.8,
                    fontSize: 13,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================== */}
        {/* PRODUCTS */}
        {/* ====================================================== */}

        <section
          id="catalogue"
          style={{
            paddingTop: 50,
            paddingBottom: 50,
            background: '#f7f7f5',
          }}
        >
          <ProductsSection showAll />
        </section>

        {/* ====================================================== */}
        {/* RESEARCH STANDARDS */}
        {/* ====================================================== */}

        <section
          style={{
            background: '#0b0b0b',
            color: '#fff',
            padding: 'clamp(20px,5vw,70px) 24px',
          }}
        >
          <div
            className='flex lg:flex-row flex-col'
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              gap: 40,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.35)',
                  marginBottom: 20,
                }}
              >
                Research Standards
              </div>

              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(42px,5vw,72px)',
                  lineHeight: .95,
                  letterSpacing: '-.06em',
                  margin: '0 0 24px',
                }}
              >
                Built around
                <br />
                transparency.
              </h2>

              <p
                style={{
                  maxWidth: 520,
                  lineHeight: 1.9,
                  color: 'rgba(255,255,255,.55)',
                  fontSize: 15,
                  marginBottom: 40,
                }}
              >
                Every product listing is connected to batch documentation,
                laboratory verification records and purity analysis data.
                Researchers can independently verify every lot before purchase.
              </p>

              <a
                href="/certificates"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '15px 28px',
                  borderRadius: 999,
                  background: '#fff',
                  color: '#000',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                Explore COA Library
              </a>
            </div>

            <div
              style={{
                position: 'relative',
                height: 620,
                overflow: 'hidden',
                borderRadius: 28,
              }}
            >
              <img
                src={IMGS.lab}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}