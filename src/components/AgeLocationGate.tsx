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
import { useEffect, useState } from 'react'
import { useCountry } from '@/lib/countryContext'

const GATE_KEY = 'pepcolab_gate_v1'

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

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(GATE_KEY)
      if (stored) {
        const rec: GateRecord = JSON.parse(stored)
        if (rec?.ageConfirmed) {
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
      <div
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
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,.6)', margin: 0 }}>
              PepcoLab is only available to visitors aged 21 and over. Please come back once you meet the age requirement.
            </p>
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
            <div style={{ marginBottom: 22 }}>
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
                    onClick={() => setMarket(opt.code)}
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
                  transition: 'background .15s',
                }}
              >
                Enter site
              </button>
              <button
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

            <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,.3)', marginTop: 18, lineHeight: 1.6 }}>
              Research-grade compounds — for laboratory research use only, not for human consumption.
            </p>
          </>
        )}
      </div>
    </div>
  )
}