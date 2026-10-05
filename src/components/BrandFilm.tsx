'use client'

// components/BrandFilm.tsx
//
// NEW (Oct 2026). Full-bleed brand film band, directly under the hero.
//
// ─── WHY THIS IS NOT IN THE HERO CARD ─────────────────────────────────────
//
// The two source files are named pepcolab-hero-desktop.mp4 (1920x1080) and
// pepcolab-hero-mobile.mp4 (720x1280), so the obvious move was to drop them
// into the existing hero video slot in HeroSections.tsx. That slot cannot
// hold them, and it is worth recording exactly why so nobody tries again.
//
// The hero is a two-column grid (1.05fr / 1fr, max-width 1440). The video
// card is therefore about 663px wide and is given height:620px on desktop —
// very nearly square, roughly 1.07:1. Measured against that container:
//
//   desktop film  1920x1080 (1.78:1) -> object-fit:cover crops ~40% of the
//                 WIDTH. The wordmark sits at frame left, so "Pepco Lab."
//                 renders as "co" and the tagline as "de peptides, verified."
//   mobile film   720x1280 (0.56:1) in the ~350x400 mobile card -> crops ~36%
//                 of the HEIGHT, slicing horizontally through "Pepco".
//
// Both films carry baked-in type — the wordmark, "Research-grade peptides,
// verified.", the INDEPENDENTLY TESTED / LOT-TRACED / DOCUMENTED line, and a
// per-vial lot number. A film with its own typography cannot be used as a
// cropped decorative panel; the first thing a crop destroys is the text.
//
// That there are two files at two aspect ratios is itself the instruction:
// each viewport is meant to get its own UNCROPPED, full-width cut. That is a
// full-bleed band, which is what this component is.
//
// ─── WHY ONLY ONE <video> IS EVER RENDERED ────────────────────────────────
//
// Repeating the lesson from the Sep 2026 hero fix, because it is easy to undo
// by accident: `preload="none"` does NOT stop an autoplaying video being
// fetched — autoplay requires the media, and autoplay wins. CSS cannot help
// either; a display:none <video autoplay> still downloads. The only reliable
// way to avoid sending the 1 MB desktop cut to a phone is to not render that
// element at all. So the breakpoint is resolved in JS and exactly one source
// set is mounted.
//
// `ready` starts false so the server render and the first client paint agree
// (no hydration mismatch) and the poster carries the first paint either way.

import { useEffect, useState } from 'react'
import Link from 'next/link'

/** Matches the breakpoint HeroSections.tsx uses for its own video swap. */
const DESKTOP_QUERY = '(min-width: 768px)'

export default function BrandFilm() {
  const [isDesktop, setIsDesktop] = useState(false)
  const [ready, setReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const size = window.matchMedia(DESKTOP_QUERY)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const sync = () => {
      setIsDesktop(size.matches)
      setReducedMotion(motion.matches)
      setReady(true)
    }
    sync()

    size.addEventListener('change', sync)
    motion.addEventListener('change', sync)
    return () => {
      size.removeEventListener('change', sync)
      motion.removeEventListener('change', sync)
    }
  }, [])

  // Each cut is shown at its own aspect ratio so nothing is ever cropped.
  const film = isDesktop
    ? {
        poster: '/pepcolab-hero-desktop-poster.jpg',
        webm: '/pepcolab-hero-desktop.webm',
        mp4: '/pepcolab-hero-desktop.mp4',
        ratio: '16 / 9',
      }
    : {
        poster: '/pepcolab-hero-mobile-poster.jpg',
        // No WebM for the mobile cut on purpose: VP9 came out at 506 KB
        // against 492 KB for H.264 on this footage, so listing it first would
        // make every modern browser fetch the LARGER file. H.264 is universal
        // and smaller here, so it is the only source.
        webm: null,
        mp4: '/pepcolab-hero-mobile.mp4',
        ratio: '9 / 16',
      }

  // A 12-second loop that starts on its own is exactly the content WCAG
  // 2.2.2 is about. Rather than bolt a pause button onto a decorative band,
  // anyone who has asked their OS for reduced motion gets the still frame —
  // which is the same image, and carries the same words.
  const showVideo = ready && !reducedMotion

  return (
    <section
      aria-labelledby="brand-film-heading"
      style={{
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* The band is the full width of the viewport by design — it is the one
          place the film plays at its native framing. */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: film.ratio, background: '#000' }}>
        {showVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={film.poster}
            // The film's own on-screen type is the content, so the label
            // repeats it rather than describing the picture.
            aria-label="PepcoLab — research-grade peptides, verified. Independently tested, lot-traced, documented."
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          >
            {film.webm && <source src={film.webm} type="video/webm" />}
            <source src={film.mp4} type="video/mp4" />
          </video>
        ) : (
          /* Also the server-rendered state, so the first paint is a ~31 KB
             JPEG rather than a multi-megabyte media fetch — the poster is
             what decides LCP here, not the film. */
          <img
            src={film.poster}
            alt="PepcoLab research vials — research-grade peptides, independently tested and lot-traced."
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>

      {/* The film shows real lot numbers against each vial, which is a claim.
          This is the link that makes the claim checkable rather than
          decorative — and it is the one thing no competitor reviewed can
          offer, so it belongs directly beneath the film that implies it. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(10px,2vw,18px)',
          padding: 'clamp(16px,3vw,22px) clamp(16px,4vw,40px)',
          borderTop: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <h2
          id="brand-film-heading"
          style={{
            margin: 0,
            color: 'rgba(255,255,255,.72)',
            fontSize: 'clamp(13px,1.6vw,15px)',
            fontWeight: 500,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          Every vial in this film carries a lot number you can look up.
        </h2>

        <Link
          href="/verify"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 44,
            padding: '11px 20px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,.22)',
            color: '#fff',
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          Verify a batch
        </Link>
      </div>
    </section>
  )
}
