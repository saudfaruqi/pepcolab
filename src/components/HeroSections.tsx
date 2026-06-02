'use client'

import { useEffect, useRef } from 'react'

export function HeroCinematic() {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const gsap = (await import('gsap')).default

        gsap.fromTo(
          '.hero-item',
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
          }
        )
      } catch {}
    })()
  }, [])

  return (
    <section
      style={{
        background: '#0A0A0A',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '120px 0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 clamp(24px,5vw,80px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
        >
          {/* LEFT */}
          <div>

            <h1
              ref={headingRef}
              className="hero-item"
              style={{
                fontSize: 'clamp(64px,8vw,120px)',
                lineHeight: '.9',
                letterSpacing: '-.08em',
                color: '#fff',
                fontWeight: 700,
                marginBottom: 32,
              }}
            >
              Research
              <br />
              Compounds
              <br />
              Without
              <br />
              Compromise.
            </h1>

            <p
              className="hero-item"
              style={{
                color: 'rgba(255,255,255,.65)',
                fontSize: 18,
                lineHeight: 1.8,
                maxWidth: 520,
                marginBottom: 40,
              }}
            >
              Pharmaceutical-grade compounds backed by
              independent testing, transparent batch verification,
              and temperature-controlled delivery.
            </p>

            <div
              className="hero-item"
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                marginBottom: 60,
              }}
            >
              <a
                href="/products"
                style={{
                  background: '#fff',
                  color: '#000',
                  height: 56,
                  padding: '0 28px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Explore Products
              </a>

              <a
                href="/certificates"
                style={{
                  border: '1px solid rgba(255,255,255,.15)',
                  color: '#fff',
                  height: 56,
                  padding: '0 28px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                View COA Certificates
              </a>
            </div>

            <div
              className="hero-item"
              style={{
                display: 'flex',
                gap: 40,
                flexWrap: 'wrap',
              }}
            >
              {[
                ['99%+', 'Purity'],
                ['2400+', 'Researchers'],
                ['24hr', 'Cold Dispatch'],
              ].map(([value, label]) => (
                <div key={label}>
                  <div
                    style={{
                      color: '#fff',
                      fontSize: 36,
                      fontWeight: 700,
                      letterSpacing: '-.05em',
                    }}
                  >
                    {value}
                  </div>

                  <div
                    style={{
                      color: 'rgba(255,255,255,.45)',
                      textTransform: 'uppercase',
                      fontSize: 11,
                      letterSpacing: '.12em',
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div
            className="hero-item"
            style={{
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '-20%',
                background:
                  'radial-gradient(circle, rgba(255,255,255,.08), transparent 70%)',
                filter: 'blur(80px)',
              }}
            />

            <img
              src="/pepco1.png"
              alt="Research Laboratory"
              style={{
                width: '100%',
                height: '760px',
                objectFit: 'cover',
                borderRadius: 32,
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}