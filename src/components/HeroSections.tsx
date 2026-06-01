'use client'

import { useEffect, useRef, useState } from 'react'

export function HeroCinematic() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageWrapRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
    }

    check()

    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let split: any

    ;(async () => {
      try {
        const gsap = (await import('gsap')).default
        const { SplitText } = await import('gsap/SplitText')

        gsap.registerPlugin(SplitText)

        if (!headingRef.current) return

        split = new SplitText(headingRef.current, {
          type: 'chars,words',
        })

        gsap.set(split.chars, {
          opacity: 0,
          y: isMobile ? 24 : 70,
          rotateX: isMobile ? 0 : -40,
          filter: isMobile ? 'blur(4px)' : 'blur(10px)',
        })

        gsap.to(split.chars, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: 'blur(0px)',
          stagger: isMobile ? 0.01 : 0.018,
          duration: isMobile ? 0.6 : 1,
          ease: 'power4.out',
          delay: 0.2,
        })

        gsap.fromTo(
          '.hero-fade',
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.8,
            delay: 0.7,
            ease: 'power3.out',
          }
        )
      } catch (_) {}
    })()

    const section = sectionRef.current
    const imageWrap = imageWrapRef.current
    const content = contentRef.current

    if (!section || !imageWrap || !content) return

    const handleScroll = () => {
      if (isMobile) return

      const rect = section.getBoundingClientRect()
      const total = section.offsetHeight - window.innerHeight

      const progress = Math.max(
        0,
        Math.min(1, -rect.top / total)
      )

      let width = 52
      let height = 90
      let x = 0
      let radius = 36
      let scale = 1

      if (progress <= 0.35) {
        const p = progress / 0.35

        width = 52 + p * 4
        height = 90 + p * 3
        x = p * -30
        radius = 36 - p * 10
        scale = 1 + p * 0.04
      } else if (progress <= 0.75) {
        const p = (progress - 0.35) / 0.4

        width = 56 + p * 44
        height = 90 + p * 21
        x = -30 - p * 70
        radius = 26 - p * 26
        scale = 1.04 + p * 0.06
      } else {
        const p = (progress - 0.75) / 0.25

        width = 100
        height = 100
        x = -100
        radius = 0
        scale = 1.1 + p * 0.08
      }

      imageWrap.style.transform = `
        translate3d(${x}px,0,0)
        scale(${scale})
      `

      imageWrap.style.borderRadius = `${radius}px`

      const card = imageWrap.firstElementChild as HTMLElement

      if (card) {
        card.style.width = `${width}vw`
        card.style.height = `${height}vh`
        card.style.borderRadius = `${radius}px`
      }

      const textOpacity = Math.max(0, 1 - progress * 1.7)

      content.style.opacity = `${textOpacity}`

      content.style.transform = `
        translate3d(${-progress * 80}px,0,0)
      `
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      split?.revert?.()
    }
  }, [isMobile])

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: isMobile ? 'auto' : '240vh',
        background:
          'linear-gradient(to bottom, #f7f5f1 0%, #f3f0ea 100%)',
      }}
    >
      <div
        style={{
          position: isMobile ? 'relative' : 'sticky',
          top: 0,
          minHeight: isMobile ? '100svh' : '100vh',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(13,13,13,.06)',
        }}
      >
        {/* ambient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(circle at top left, rgba(255,255,255,.9), transparent 40%),
              radial-gradient(circle at bottom right, rgba(201,153,42,.08), transparent 35%)
            `,
            zIndex: 0,
          }}
        />

        {/* bg text */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 'clamp(90px, 18vw, 340px)',
              fontWeight: 700,
              letterSpacing: '-.08em',
              color: 'rgba(13,13,13,.03)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 0,
            }}
          >
            VERIFIED
          </div>
        )}

        {/* IMAGE */}
        <div
          ref={imageWrapRef}
          style={{
            position: isMobile ? 'relative' : 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'center' : 'flex-end',
            paddingTop: isMobile ? 40 : 0,
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: isMobile ? '92vw' : '52vw',
              height: isMobile ? '46vh' : '90vh',
              borderRadius: isMobile ? 24 : 36,
              overflow: 'hidden',
              boxShadow: isMobile
                ? '0 20px 50px rgba(0,0,0,.12)'
                : '0 40px 120px rgba(0,0,0,.24)',
            }}
          >
            <img
              src="/pepco1.png"
              alt="Research laboratory"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: 'scale(1.04)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `
                  linear-gradient(to right, rgba(0,0,0,.58), rgba(0,0,0,.08)),
                  linear-gradient(to top, rgba(0,0,0,.32), transparent 40%)
                `,
              }}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div
          ref={contentRef}
          style={{
            position: 'relative',
            zIndex: 3,
            minHeight: isMobile ? 'auto' : '100vh',
            width: '100%',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            padding: isMobile
              ? '16px 20px 28px'
              : '0 clamp(24px,5vw,80px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : 620,
            }}
          >
            {/* heading */}
            <h1
              ref={headingRef}
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: isMobile
                  ? 'clamp(42px, 12vw, 74px)'
                  : 'clamp(48px, 7vw, 108px)',
                lineHeight: isMobile ? '.92' : '.9',
                letterSpacing: '-.07em',
                fontWeight: 700,
                color: '#0d0d0d',
                margin: `0 0 ${isMobile ? 18 : 28}px`,
              }}
            >
              Precision
              <br />
              Peptide
              <br />
              Research.
            </h1>

            {/* sub */}
            <p
              className="hero-fade"
              style={{
                fontSize: isMobile ? 14 : 15,
                lineHeight: isMobile ? 1.7 : 1.9,
                color: 'rgba(13,13,13,.58)',
                maxWidth: isMobile ? '100%' : 430,
                marginBottom: isMobile ? 24 : 34,
              }}
            >
              Pharmaceutical-grade research compounds with transparent
              batch testing, verified purity, and cold-chain UK
              delivery standards.
            </p>

            {/* stats */}
            <div
              className="hero-fade"
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(3, 1fr)'
                  : 'repeat(3, auto)',
                gap: isMobile ? 10 : 18,
                marginBottom: isMobile ? 28 : 40,
              }}
            >
              {[
                ['99%+', 'Purity'],
                ['2,400+', 'Researchers'],
                ['24hr', 'Cold Dispatch'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  style={{
                    padding: isMobile
                      ? '14px 12px'
                      : '18px 20px',
                    borderRadius: isMobile ? 18 : 24,
                    background: 'rgba(255,255,255,.7)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(13,13,13,.08)',
                  }}
                >
                  <div
                    style={{
                      fontSize: isMobile ? 18 : 26,
                      fontWeight: 700,
                      letterSpacing: '-.04em',
                      color: '#0d0d0d',
                      marginBottom: 4,
                    }}
                  >
                    {value}
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 8 : 11,
                      textTransform: 'uppercase',
                      letterSpacing: '.12em',
                      color: 'rgba(13,13,13,.45)',
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div
              className="hero-fade"
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 12,
                width: '100%',
              }}
            >
              <a
                href="/products"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: isMobile ? 50 : 54,
                  width: isMobile ? '100%' : 'auto',
                  padding: isMobile ? '0 20px' : '0 34px',
                  borderRadius: 999,
                  background: '#0d0d0d',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  boxShadow: '0 14px 30px rgba(0,0,0,.18)',
                }}
              >
                Explore Products
              </a>

              <a
                href="/certificates"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: isMobile ? 50 : 54,
                  width: isMobile ? '100%' : 'auto',
                  padding: isMobile ? '0 20px' : '0 28px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.65)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(13,13,13,.1)',
                  color: '#0d0d0d',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                View COA Certificates
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}