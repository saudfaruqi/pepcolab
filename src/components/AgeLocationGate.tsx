'use client'
// src/components/AgeLocationGate.tsx
//
// Full-site entry gate: confirms the visitor is 21+ and records their market
// before they browse. Mounted once in layout.tsx inside CountryProvider, so a
// selection here also sets the site's live country context.
//
// THREE FIXES (Sep 2026)
// ----------------------
// 1. DUPLICATE H1. This component rendered an <h1> ("Confirm your age &
//    location") on EVERY page of the site, above the page's own H1 in the
//    DOM. On the homepage that meant the first H1 a crawler encountered was
//    a consent dialog rather than anything about peptides. It is now a
//    role="heading" element at level 2 — identical for screen readers, no
//    longer competing for the document's primary heading.
//
// 2. UK RESTORED. August removed 'United Kingdom' as an option, leaving UK
//    visitors to pick "Somewhere else" — while the helper text underneath
//    still read "dispatches to the UAE and UK only", contradicting itself on
//    screen. GB is a real option again, with copy that states plainly that
//    UK dispatch is not open yet and points at /uk.
//
// 3. FRICTION. The gate required three interactions (pick region, tick age,
//    press enter) before any content was reachable, on every first visit,
//    including from paid and organic traffic. Region is now PRE-SELECTED
//    from the country middleware already resolved, so the common path is one
//    tick and one press. The visitor can still change it.
//
// The gate is deliberately not dismissible by backdrop click or Escape.

import { useEffect, useRef, useState } from 'react'
import { useCountry } from '@/lib/countryContext'

const GATE_KEY = 'pepcolab_gate_v1'

// Re-ask periodically rather than trusting a confirmation made once, ever.
const GATE_TTL_MS = 1000 * 60 * 60 * 24 * 180

type GateMarket = 'AE' | 'GB' | 'OTHER'

interface GateRecord {
  ageConfirmed: true
  market: GateMarket
  ts: number
}

const MARKET_OPTIONS: { code: GateMarket; label: string }[] = [
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'OTHER', label: 'Somewhere else' },
]

const MARKET_NOTE: Record<GateMarket, string | null> = {
  AE: null,
  GB: 'PepcoLab does not dispatch to the UK yet. You can browse the full catalogue and every published certificate, and join the launch list to be told when UK ordering opens.',
  OTHER:
    'PepcoLab currently dispatches within the UAE only. You are welcome to browse, but checkout will not be available for your location.',
}

export default function AgeLocationGate() {
  const { setCountry, country } = useCountry()

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [ageOk, setAgeOk] = useState(false)
  const [market, setMarket] = useState<GateMarket | null>(null)
  const [blocked, setBlocked] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(GATE_KEY)
      if (stored) {
        const rec: GateRecord = JSON.parse(stored)
        if (rec?.ageConfirmed && Date.now() - rec.ts < GATE_TTL_MS) {
          setOpen(false)
          return
        }
      }
    } catch {
      // localStorage unavailable (private mode etc.) — gate every visit
    }
    setOpen(true)
  }, [])

  // Pre-select from the country middleware resolved (cookie -> context), so
  // the visitor usually only has to confirm their age. Runs once the country
  // context is ready and only if they haven't chosen manually yet.
  useEffect(() => {
    if (market !== null) return
    if (country === 'AE' || country === 'GB') setMarket(country)
  }, [country, market])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus trap. Without it, Tab walks focus into the blocked page beneath.
  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function handleKeydown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !first || !last) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [open, blocked])

  function handleContinue() {
    if (!ageOk || !market) return

    // AE and GB are both real, supported countries now — record either.
    // 'OTHER' deliberately does not call setCountry(): the site keeps
    // whatever it already detected rather than being told a country it
    // cannot represent.
    if (market === 'AE' || market === 'GB') {
      setCountry(market)
    }

    try {
      const rec: GateRecord = { ageConfirmed: true, market, ts: Date.now() }
      localStorage.setItem(GATE_KEY, JSON.stringify(rec))
    } catch {
      // ignore storage failures — worst case we ask again next visit
    }
    setOpen(false)
  }

  if (!mounted || !open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-heading"
      aria-describedby="gate-desc"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5,5,5,.92)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <style>{`
        .gate-btn { transition: background .15s, border-color .15s, opacity .15s, transform .1s; }
        .gate-btn:hover:not(:disabled) { border-color: rgba(255,255,255,.4); }
        .gate-btn.gate-market:hover:not(:disabled) { background: rgba(255,255,255,.06); }
        .gate-btn.gate-primary:hover:not(:disabled) { background: rgba(255,255,255,.88); }
        .gate-btn.gate-secondary:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.75); }
        .gate-btn:active:not(:disabled) { transform: scale(.98); }
        .gate-btn:focus-visible { outline: 2px solid rgba(255,255,255,.85); outline-offset: 2px; }
        .gate-checkbox:focus-visible { outline: 2px solid rgba(255,255,255,.85); outline-offset: 3px; }
        .gate-link { color: rgba(255,255,255,.75); text-decoration: underline; }
      `}</style>

      <div
        ref={dialogRef}
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20,
          padding: 'clamp(28px,5vw,40px)',
          color: '#fff',
        }}
      >
        {blocked ? (
          <>
            <div
              id="gate-heading"
              role="heading"
              aria-level={2}
              style={{ fontFamily: 'Georgia, serif', fontSize: 28, letterSpacing: '-.03em', margin: '0 0 12px' }}
            >
              Access restricted
            </div>
            <p id="gate-desc" style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,.6)', margin: '0 0 24px' }}>
              PepcoLab is only available to visitors aged 21 and over. Please come back once you meet the age requirement.
            </p>
            <button
              className="gate-btn gate-secondary"
              onClick={() => setBlocked(false)}
              style={{
                height: 44,
                padding: '0 20px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,.15)',
                background: 'transparent',
                color: 'rgba(255,255,255,.6)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go back
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', fontWeight: 700, marginBottom: 14 }}>
              Before you continue
            </div>

            {/* Was an <h1>. See the file header — it was competing with every
                page's real H1 on every route. */}
            <div
              id="gate-heading"
              role="heading"
              aria-level={2}
              style={{ fontFamily: 'Georgia, serif', fontSize: 32, letterSpacing: '-.04em', lineHeight: 1.05, margin: '0 0 20px' }}
            >
              Confirm your age<br />&amp; location
            </div>

            {/* Market select */}
            <div style={{ marginBottom: 22 }} role="group" aria-label="Where are you browsing from?">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginBottom: 10 }}>
                Where are you browsing from?
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MARKET_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    className="gate-btn gate-market"
                    onClick={() => setMarket(opt.code)}
                    aria-pressed={market === opt.code}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: market === opt.code ? '1.5px solid #fff' : '1px solid rgba(255,255,255,.15)',
                      background: market === opt.code ? '#fff' : 'transparent',
                      color: market === opt.code ? '#0d0d0d' : 'rgba(255,255,255,.85)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {market && MARKET_NOTE[market] && (
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.42)', marginTop: 10, lineHeight: 1.65 }}>
                  {MARKET_NOTE[market]}
                  {market === 'GB' && (
                    <>
                      {' '}
                      <a href="/uk" className="gate-link">More on the UK launch</a>.
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Age confirmation */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="gate-checkbox"
                checked={ageOk}
                onChange={e => setAgeOk(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: '#fff', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,.8)' }}>
                I confirm I am 21 years of age or older.
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="gate-btn gate-primary"
                onClick={handleContinue}
                disabled={!ageOk || !market}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  cursor: ageOk && market ? 'pointer' : 'not-allowed',
                  background: ageOk && market ? '#fff' : 'rgba(255,255,255,.12)',
                  color: ageOk && market ? '#0d0d0d' : 'rgba(255,255,255,.35)',
                }}
              >
                Enter site
              </button>
              <button
                className="gate-btn gate-secondary"
                onClick={() => setBlocked(true)}
                style={{
                  height: 48,
                  padding: '0 18px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,.15)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,.5)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                I&apos;m under 21
              </button>
            </div>

            <p id="gate-desc" style={{ fontSize: 10.5, color: 'rgba(255,255,255,.3)', marginTop: 18, lineHeight: 1.6 }}>
              Research-grade compounds — for laboratory research use only, not for human consumption.
            </p>
          </>
        )}
      </div>
    </div>
  )
}