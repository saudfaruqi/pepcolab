// src/components/FloatingCalculator.tsx
'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Calculator, X } from 'lucide-react'

/**
 * Floating reconstitution calculator — one instance, mounted globally in
 * layout.tsx, available on every page without touching Nav.
 *
 * NAMING — deliberate. This is a "reconstitution" / concentration calculator,
 * not a "dosage calculator":
 *
 *   1. "Dosage" implies administration to a person, which contradicts the
 *      research-use-only statement on every other surface of the site. It's
 *      the most quotable word on the page for anyone assessing whether the
 *      RUO framing is genuine.
 *   2. "peptide reconstitution calculator" is the term people actually search,
 *      and no UK or UAE supplier ranks for it. "Dosage calculator" has neither
 *      the volume nor the open field.
 *
 * The maths is identical either way: mass in, volume in, concentration out.
 */

/** Routes where a floating button is unwelcome — it can overlap the Strabl
 *  checkout UI, and it's a distraction at the point of payment. */
const HIDDEN_PREFIXES = ['/checkout']

export default function FloatingCalculator() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [mg, setMg] = useState('10')
  const [ml, setMl] = useState('2')
  const [target, setTarget] = useState('250')

  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Defer the first paint by a tick so the button fades in after the page
  // settles rather than competing with LCP.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Close whenever the route changes — otherwise the panel stays open on top
  // of a page the visitor has already navigated away from.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Outside click + Escape.
  useEffect(() => {
    if (!open) return

    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const result = useMemo(() => {
    const mass = parseFloat(mg)
    const volume = parseFloat(ml)
    const want = parseFloat(target)

    if (!isFinite(mass) || !isFinite(volume) || mass <= 0 || volume <= 0) return null

    const mgPerMl = mass / volume
    const mcgPerMl = mgPerMl * 1000
    // Per 0.01 ml — the smallest graduation on a 1 ml syringe, and the
    // practical unit for measuring small volumes at the bench.
    const mcgPerGraduation = mcgPerMl / 100
    const volumeForTarget = isFinite(want) && want > 0 ? want / mcgPerMl : null

    return {
      mgPerMl,
      mcgPerMl,
      mcgPerGraduation,
      volumeForTarget,
      graduationsForTarget: volumeForTarget != null ? volumeForTarget * 100 : null,
      portions: isFinite(want) && want > 0 ? (mass * 1000) / want : null,
    }
  }, [mg, ml, target])

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null

  const field = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    suffix: string,
    step = '1'
  ) => (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: '#9ca3af',
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: '100%',
            height: 42,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: '#fff',
            padding: '0 46px 0 12px',
            fontSize: 16, // 16px prevents iOS Safari zooming on focus
            fontWeight: 600,
            color: '#0d0d0d',
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 12,
            fontWeight: 600,
            color: '#9ca3af',
            pointerEvents: 'none',
          }}
        >
          {suffix}
        </span>
      </div>
    </label>
  )

  const row = (label: string, value: string) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        padding: '9px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <span style={{ fontSize: 12.5, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0d0d0d', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  )

  return (
    <>
      {open && <div className="fc-backdrop" onClick={() => setOpen(false)} />}

      {open && (
        <div ref={panelRef} role="dialog" aria-label="Reconstitution calculator" className="fc-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0d0d0d', letterSpacing: '-.02em' }}>
                Reconstitution calculator
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
                Concentration after adding diluent.
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close calculator"
              style={{
                border: 'none',
                background: '#f3f4f6',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                color: '#6b7280',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {field('Vial contents', mg, setMg, 'mg', '0.5')}
            {field('Diluent added', ml, setMl, 'ml', '0.1')}
          </div>

          <div style={{ marginBottom: 14 }}>{field('Target quantity', target, setTarget, 'mcg', '10')}</div>

          {result ? (
            <div style={{ background: '#F9FAFB', border: '1px solid #f0f0f0', borderRadius: 12, padding: '4px 14px 10px' }}>
              {row('Concentration', `${result.mgPerMl.toFixed(2)} mg/ml`)}
              {row('', `${Math.round(result.mcgPerMl).toLocaleString()} mcg/ml`)}
              {row('Per 0.01 ml', `${Math.round(result.mcgPerGraduation).toLocaleString()} mcg`)}
              {result.volumeForTarget != null && (
                <>
                  {row(`Volume for ${Number(target).toLocaleString()} mcg`, `${result.volumeForTarget.toFixed(3)} ml`)}
                  {row('Graduations (0.01 ml)', result.graduationsForTarget!.toFixed(1))}
                  {result.portions != null && (
                    <div style={{ paddingTop: 9, fontSize: 12, color: '#6b7280' }}>
                      Vial yields <strong style={{ color: '#0d0d0d' }}>{Math.floor(result.portions)}</strong> portions at that quantity.
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 12.5,
                color: '#92400E',
              }}
            >
              Enter a vial mass and a diluent volume greater than zero.
            </div>
          )}

          <p style={{ fontSize: 10.5, lineHeight: 1.6, color: '#9ca3af', margin: '12px 0 0' }}>
            For laboratory use only. Figures are dilution arithmetic, not guidance on administration.
          </p>
        </div>
      )}

      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Reconstitution calculator"
        className={`fc-fab${mounted ? ' fc-in' : ''}`}
      >
        {open ? <X size={18} /> : <Calculator size={18} />}
        <span className="fc-fab-label">Calculator</span>
      </button>

      <style>{`
        .fc-fab {
          position: fixed;
          right: 20px;
          /* --fc-offset lets a page with its own sticky bar (e.g. a mobile
             add-to-cart bar) push the button up without editing this file:
             set --fc-offset on :root or a page wrapper. */
          bottom: calc(20px + env(safe-area-inset-bottom) + var(--fc-offset, 0px));
          z-index: 45;               /* under CartDrawer, over page content */
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 48px;
          padding: 0 18px 0 16px;
          border: none;
          border-radius: 999px;
          background: #0d0d0d;
          color: #fff;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -.01em;
          cursor: pointer;
          box-shadow: 0 8px 28px rgba(0,0,0,.28);
          opacity: 0;
          transform: translateY(12px) scale(.96);
          transition: opacity .35s ease, transform .35s ease, box-shadow .25s ease;
        }
        .fc-fab.fc-in { opacity: 1; transform: translateY(0) scale(1); }
        .fc-fab:hover { box-shadow: 0 12px 34px rgba(0,0,0,.36); }
        .fc-fab:focus-visible { outline: 2px solid #1A56DB; outline-offset: 3px; }

        .fc-panel {
          position: fixed;
          right: 20px;
          bottom: calc(84px + env(safe-area-inset-bottom) + var(--fc-offset, 0px));
          width: 340px;
          max-height: calc(100vh - 140px);
          overflow-y: auto;
          z-index: 46;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0,0,0,.18);
          padding: 18px;
        }

        .fc-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.35);
          z-index: 44;
          animation: fcFade .2s ease;
        }
        @keyframes fcFade { from { opacity: 0 } to { opacity: 1 } }

        @media (max-width: 640px) {
          /* Icon-only circle on phones — a pill with a label eats real screen
             width and overlaps content on narrow viewports. */
          .fc-fab {
            right: 16px;
            width: 52px;
            height: 52px;
            padding: 0;
            justify-content: center;
          }
          .fc-fab-label { display: none; }

          /* Bottom sheet rather than a floating card: a 340px panel anchored
             to a corner is unusable one-handed. */
          .fc-panel {
            right: 0;
            left: 0;
            bottom: 0;
            width: auto;
            max-height: 88vh;
            border-radius: 18px 18px 0 0;
            padding-bottom: max(18px, env(safe-area-inset-bottom));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fc-fab { transition: none; opacity: 1; transform: none; }
          .fc-backdrop { animation: none; }
        }

        @media print { .fc-fab, .fc-panel, .fc-backdrop { display: none !important; } }
      `}</style>
    </>
  )
}