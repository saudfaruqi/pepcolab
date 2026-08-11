'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCountry } from '@/lib/countryContext'

export default function HeroCinematic() {
  // FIX: the dispatch stat below hardcoded "UK Dispatch" regardless of who
  // was looking at it — inconsistent with the footer, which already reads
  // "Cold-Chain Dispatch" market-neutrally, and a bad first impression for
  // a UAE visitor on a site that otherwise treats UAE as a first-class
  // market (see AgeLocationGate, countryContext.tsx). Now reads the same
  // resolved country every other component on the page already uses.
  const { country } = useCountry()
  const dispatchLabel = country === 'GB' ? 'UK Dispatch' : 'UAE Dispatch'

  useEffect(() => {
    ;(async () => {
      try {
        const gsap = (await import('gsap')).default

        gsap.fromTo(
          '.hero-fade',
          {
            opacity: 0,
            y: 40,
          },
          {
            opacity: 1,
            y: 0,
            stagger: 0.12,
            duration: 1,
            ease: 'power3.out',
          }
        )

        gsap.fromTo(
          '.hero-video',
          {
            opacity: 0,
            scale: 0.92,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 1.6,
            ease: 'power4.out',
          }
        )
      } catch {}
    })()
  }, [])

  return (
    <section
      style={{
        position: 'relative',
        background: '#050505',
        overflow: 'hidden',
      }}
    >
      {/* Background Effects */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,.05), transparent 35%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: '-200px',
          top: '20%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,.08), transparent 70%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '60px 20px 40px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 40,
          }}
          className="hero-layout"
        >
          {/* LEFT CONTENT */}
          <div>

            {/*
              Heading: was "Research Without Compromise." — a strong brand
              line, but it's also the single most important line on the
              site for on-page SEO, and it previously carried no keyword
              signal at all (no "peptides," no "research-grade," no market).
              Kept the tagline as a smaller kicker above the H1 so the brand
              voice isn't lost, and moved the actual keyword-bearing copy
              into the H1 itself.

              FIX: added explicit "UK & UAE" — the stated ranking goal is
              #1 for "peptides in UAE and UK", and neither the kicker nor
              the H1 previously said either market by name anywhere above
              the fold. The 24h/UK-only stat further down was the only
              geographic signal on the whole first screen, and it excluded
              UAE entirely (see the dispatchLabel fix above).
            */}
            <div
              className="hero-fade"
              style={{
                color: 'rgba(255,255,255,.5)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              Research Without Compromise · UK &amp; UAE
            </div>

            <h1
              className="hero-fade"
              style={{
                color: '#fff',
                fontWeight: 800,
                lineHeight: 0.92,
                letterSpacing: '-0.08em',
                fontSize: 'clamp(42px,8vw,90px)',
                marginBottom: 24,
              }}
            >
              Research-Grade
              <br />
              Peptides,
              <br />
              Verified.
            </h1>

            {/* Description */}
            <p
              className="hero-fade"
              style={{
                color: 'rgba(255,255,255,.65)',
                fontSize: 'clamp(12px,2vw,16px)',
                lineHeight: 1.8,
                maxWidth: 520,
                marginBottom: 36,
              }}
            >
              Premium research compounds manufactured to exceptional
              standards and verified through independent laboratory testing.
              Transparent batch data, pharmaceutical-grade quality, and
              temperature-controlled fulfilment — shipped across the UK
              and UAE.
            </p>

            {/* CTA Buttons */}
            <div
              className="hero-fade"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                marginBottom: 50,
              }}
            >
              <Link
                href="/products"
                style={{
                  height: 58,
                  borderRadius: 999,
                  background: '#fff',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                Explore Research Compounds
              </Link>

              <Link
                href="/certificates"
                style={{
                  height: 58,
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.12)',
                  background: 'rgba(255,255,255,.03)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  backdropFilter: 'blur(20px)',
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                View Laboratory Certificates
              </Link>
            </div>

            {/* Stats */}
            <div
              className="hero-fade"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 20,
                maxWidth: 500,
              }}
            >
              <div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  99%+
                </div>

                <div
                  style={{
                    color: 'rgba(255,255,255,.55)',
                    fontSize: 12,
                  }}
                >
                  Verified Purity
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  24h
                </div>

                <div
                  style={{
                    color: 'rgba(255,255,255,.55)',
                    fontSize: 12,
                  }}
                >
                  {dispatchLabel}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  COA
                </div>

                <div
                  style={{
                    color: 'rgba(255,255,255,.55)',
                    fontSize: 12,
                  }}
                >
                  Batch Verified
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT VIDEO */}
          <div
            className="hero-video"
            style={{
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-15%',
                background:
                  'radial-gradient(circle, rgba(255,255,255,.08), transparent 70%)',
                filter: 'blur(120px)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 32,
                border: '1px solid rgba(255,255,255,.08)',
                background: '#0d0d0d',
                boxShadow:
                  '0 60px 140px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)',
              }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                // No poster meant this box painted solid black until the
                // video buffered — worst case for LCP, and gave crawlers no
                // image to associate with the hero at all. pepcovideo.jpg
                // below is a placeholder still frame — swap it for a real
                // exported still once you have one.
                poster="/pepcovideo.jpg"
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              >
                <source src="/pepcovideo2.mp4" type="video/mp4" />
              </video>

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,.45), transparent 45%)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 24,
                  right: 24,
                }}
              >

                <div
                  style={{
                    color: 'rgba(255,255,255,.65)',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  Every batch independently tested and fully traceable.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <style jsx>{`
        @media (min-width: 1024px) {
          .hero-layout {
            grid-template-columns: 1.05fr 1fr !important;
            align-items: center;
            gap: 40px !important;
          }
          .hero-video video {
            height: 620px !important;
          }
        }
      `}</style>
    </section>
  )
}