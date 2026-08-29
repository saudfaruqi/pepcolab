'use client'
// src/components/AgeLocationGate.tsx
//
// Full-site entry gate: confirms the visitor is 21+ and captures their
// market (UAE / UK) before they can browse. Mounted once in layout.tsx,
// inside CountryProvider, so a UAE/UK selection here also sets the site's
// live currency/country context — no separate state to keep in sync.
//
// Per business decision: PepcoLab only operates in the UAE and UK. A
// visitor who selects neither is allowed to continue browsing (not
// blocked), but their choice does not set a shipping country — the site
// falls back to its existing AE default, same as undetected/failed
// geolocation already does in countryContext.tsx.
import { useEffect, useRef, useState } from 'react'
import { useCountry } from '@/lib/countryContext'

const GATE_KEY = 'pepcolab_gate_v1'

// Re-ask periodically rather than trusting a confirmation made once, ever —
// a stale localStorage entry from months ago isn't meaningful consent.
// 180 days is a common compliance baseline for age gates; adjust freely.
const GATE_TTL_MS = 1000 * 60 * 60 * 24 * 180

interface GateRecord {
  ageConfirmed: true
  market: 'AE' | 'GB' | 'OTHER'
  ts: number
}

export default function AgeLocationGate() {
  const { setCountry } = useCountry()

  const [mounted, setMounted]   = useState(false)   // avoids SSR/client mismatch
  const [open, setOpen]         = useState(false)
  const [ageOk, setAgeOk]       = useState(false)
  const [market, setMarket]     = useState<'AE' | 'GB' | 'OTHER' | null>(null)
  const [blocked, setBlocked]   = useState(false)    // visitor said they're under 21

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
      // localStorage unavailable (private mode etc.) — fall through and gate every visit
    }
    setOpen(true)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus trap: this gate has no backdrop-click or Escape dismissal by
  // design (it's mandatory), but without a trap Tab can still walk focus
  // out into the page underneath, which is both a real accessibility bug
  // and a way to interact with content that's supposed to be blocked.
  // Re-runs whenever the visible content changes (blocked vs. form) so it
  // always targets the elements that are actually on screen.
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

    if (market === 'AE' || market === 'GB') {
      setCountry(market)
    }
    // market === 'OTHER' → deliberately does not call setCountry(); site
    // keeps whatever default/detected country it already had.

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
        /* Outline (not box-shadow) so it renders outside the button, against
           the dark card background, and stays visible regardless of the
           button's own fill color (white primary button included). */
        .gate-btn:focus-visible { outline: 2px solid rgba(255,255,255,.85); outline-offset: 2px; }
        .gate-checkbox:focus-visible { outline: 2px solid rgba(255,255,255,.85); outline-offset: 3px; }
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
            <h1 id="gate-heading" style={{ fontFamily: 'Georgia, serif', fontSize: 28, letterSpacing: '-.03em', margin: '0 0 12px' }}>
              Access restricted
            </h1>
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
            <h1 id="gate-heading" style={{ fontFamily: 'Georgia, serif', fontSize: 32, letterSpacing: '-.04em', lineHeight: 1.05, margin: '0 0 20px' }}>
              Confirm your age<br />&amp; location
            </h1>

            {/* Market select */}
            <div style={{ marginBottom: 22 }} role="group" aria-label="Where are you browsing from?">
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.7)', marginBottom: 10 }}>
                Where are you browsing from?
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {([
                  { code: 'AE', label: 'United Arab Emirates' },
                  { code: 'GB', label: 'United Kingdom' },
                  { code: 'OTHER', label: 'Somewhere else' },
                ] as const).map(opt => (
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
              {market === 'OTHER' && (
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)', marginTop: 8, lineHeight: 1.6 }}>
                  PepcoLab currently dispatches to the UAE and UK only. You're welcome to browse, but checkout may not be available.
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
                I'm under 21
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