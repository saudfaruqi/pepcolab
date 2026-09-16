// src/components/FloatingCalculator.tsx
'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Calculator, X, ChevronRight } from 'lucide-react'
import { claimNudgeSlot, releaseNudgeSlot } from '@/lib/nudgeCoordinator'

/**
 * Floating reconstitution calculator — one instance, mounted globally in
 * layout.tsx, available on every page without touching Nav.
 *
 * NAMING — deliberate. This is a "reconstitution" / concentration calculator,
 * not a "dosage calculator":
 *
 *   1. "Dosage" implies administration to a person, which contradicts the
 *      research-use-only statement on every other surface of the site.
 *   2. "peptide reconstitution calculator" is the term people actually search,
 *      and no UK or UAE supplier ranks for it.
 *
 * The maths is dilution arithmetic only: mass in, volume in, concentration out.
 * It does not and should not take personal inputs of any kind.
 *
 * STYLING — mobile-first and flat. Base rules describe the phone layout
 * (circular FAB, full-width bottom sheet); the `min-width: 641px` block layers
 * the desktop pill and anchored card on top. Separation comes from borders and
 * fill contrast rather than drop shadows — there are none in this file.
 */

/** Routes where a floating button is unwelcome — it can overlap the Strabl
 *  checkout UI, and it's a distraction at the point of payment. */
const HIDDEN_PREFIXES = ['/checkout']

/* Nudge timing. The bubble RECURS: it hides itself after PROMPT_VISIBLE and
   returns after PROMPT_REPEAT, up to PROMPT_MAX_SHOWS times. Only an explicit
   dismissal (the ×) or opening the calculator stops it for the session.
   Previously one timer hid it for good, so anyone who glanced away during the
   first few seconds never saw it again. */
const PROMPT_DISMISS_KEY = 'fc:prompt-dismissed'
const PROMPT_FIRST_DELAY = 2600
const PROMPT_VISIBLE = 9000
const PROMPT_REPEAT = 40000
const PROMPT_MAX_SHOWS = 4

/** Identity used with nudgeCoordinator so this widget's nudge and the chat
 *  widget's nudge never show at the same time. */
const NUDGE_ID = 'reconstitution-calculator'

export default function FloatingCalculator() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [prompt, setPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const [mg, setMg] = useState('10')
  const [ml, setMl] = useState('2')
  const [target, setTarget] = useState('250')

  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const hidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))

  const dismissPrompt = useCallback(() => {
    setPrompt(false)
    setDismissed(true)
    releaseNudgeSlot(NUDGE_ID)
    try {
      sessionStorage.setItem(PROMPT_DISMISS_KEY, '1')
    } catch {
      /* private mode — the bubble just cycles again next page. No harm. */
    }
  }, [])

  // Defer the first paint by a tick so the button fades in after the page
  // settles rather than competing with LCP.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400)
    return () => clearTimeout(t)
  }, [])

  // Read the dismissal client-side — reading storage in a useState initialiser
  // would break SSR hydration.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PROMPT_DISMISS_KEY) === '1') setDismissed(true)
    } catch { /* ignore */ }
  }, [])

  // Recurring nudge cycle: wait → show → hide → wait → show … Guarded by
  // nudgeCoordinator so this bubble and the chat widget's bubble never land
  // on screen in the same moment — if the slot is taken, this widget backs
  // off and retries a few times before giving up on that cycle entirely
  // (rather than showing very late, out of step with its own schedule).
  useEffect(() => {
    if (hidden || dismissed) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let shows = 0

    const cycle = (delay: number) => {
      timer = setTimeout(() => attemptShow(4), delay)
    }

    const attemptShow = (retriesLeft: number) => {
      if (cancelled) return
      if (!claimNudgeSlot(NUDGE_ID)) {
        if (retriesLeft > 0) {
          timer = setTimeout(() => attemptShow(retriesLeft - 1), 1500)
        } else if (shows < PROMPT_MAX_SHOWS) {
          cycle(PROMPT_REPEAT)
        }
        return
      }
      shows += 1
      setPrompt(true)
      timer = setTimeout(() => {
        releaseNudgeSlot(NUDGE_ID)
        if (cancelled) return
        setPrompt(false)
        if (shows < PROMPT_MAX_SHOWS) cycle(PROMPT_REPEAT)
      }, PROMPT_VISIBLE)
    }

    cycle(PROMPT_FIRST_DELAY)
    return () => {
      cancelled = true
      clearTimeout(timer)
      setPrompt(false)
      releaseNudgeSlot(NUDGE_ID)
    }
  }, [hidden, dismissed])

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

  // Lock the page behind the sheet on phones. overflow:hidden alone does not
  // stop iOS Safari rubber-banding — position-fixed with a scroll restore does.
  useEffect(() => {
    if (!open) return
    if (!window.matchMedia('(max-width: 640px)').matches) return
    const y = window.scrollY
    const { overflow, position, top, width } = document.body.style
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = overflow
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.width = width
      window.scrollTo(0, y)
    }
  }, [open])

  // Focus the first field on open so a keyboard user lands inside the panel,
  // and phones raise the numeric keypad without an extra tap.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => firstFieldRef.current?.focus(), 120)
    return () => clearTimeout(t)
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

  if (hidden) return null

  const field = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    suffix: string,
    step: string,
    ref?: React.Ref<HTMLInputElement>
  ) => (
    <label className="fc-field">
      <span className="fc-label">{label}</span>
      <div className="fc-input-wrap">
        <input
          ref={ref}
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          className="fc-input"
        />
        {/* Suffix sits on the right, and the input reserves padding on the
            right to match. The previous version padded right but drew the
            suffix on the left, so it overlapped the typed value. */}
        <span className="fc-suffix">{suffix}</span>
      </div>
    </label>
  )

  const row = (label: string, value: string, strong = false) => (
    <div className="fc-row">
      <span className="fc-row-label">{label}</span>
      <span className={`fc-row-value${strong ? ' fc-row-value-strong' : ''}`}>{value}</span>
    </div>
  )

  return (
    <>
      {open && <div className="fc-backdrop" onClick={() => setOpen(false)} />}

      {open && (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Reconstitution calculator" className="fc-panel">
          <div className="fc-grabber" aria-hidden="true" />

          <div className="fc-head">
            <div>
              <div className="fc-title">Reconstitution calculator</div>
              <div className="fc-sub">Concentration after adding diluent.</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close calculator" className="fc-close">
              <X size={16} />
            </button>
          </div>

          <div className="fc-grid">
            {field('Vial contents', mg, setMg, 'mg', '0.5', firstFieldRef)}
            {field('Diluent added', ml, setMl, 'ml', '0.1')}
          </div>

          <div className="fc-grid-single">{field('Target quantity', target, setTarget, 'mcg', '10')}</div>

          {result ? (
            <div className="fc-result">
              {row('Concentration', `${result.mgPerMl.toFixed(2)} mg/ml`, true)}
              {row('In micrograms', `${Math.round(result.mcgPerMl).toLocaleString()} mcg/ml`)}
              {row('Per 0.01 ml', `${Math.round(result.mcgPerGraduation).toLocaleString()} mcg`)}
              {result.volumeForTarget != null && (
                <>
                  {row(`Volume for ${Number(target).toLocaleString()} mcg`, `${result.volumeForTarget.toFixed(3)} ml`, true)}
                  {row('Graduations (0.01 ml)', result.graduationsForTarget!.toFixed(1))}
                  {result.portions != null && (
                    <div className="fc-note">
                      Vial yields <strong>{Math.floor(result.portions)}</strong> portions at that quantity.
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="fc-warn">Enter a vial mass and a diluent volume greater than zero.</div>
          )}

          <p className="fc-disclaimer">
            For laboratory use only. Figures are dilution arithmetic, not guidance on administration.
          </p>
        </div>
      )}

      {/* Nudge bubble. Tapping it opens the calculator; the × stops the cycle
          for the session so it never becomes nagging. */}
      {prompt && !open && mounted && (
        <div className="fc-prompt" role="status">
          <button
            className="fc-prompt-body"
            onClick={() => {
              dismissPrompt()
              setOpen(true)
            }}
          >
            <span>Work out your vial concentration</span>
            <ChevronRight size={14} className="fc-prompt-chev" />
          </button>
          <button className="fc-prompt-x" onClick={dismissPrompt} aria-label="Dismiss">
            <X size={12} />
          </button>
        </div>
      )}

      <button
        ref={buttonRef}
        onClick={() => {
          dismissPrompt()
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Reconstitution calculator"
        className={`fc-fab${mounted ? ' fc-in' : ''}${prompt && !open ? ' fc-attn' : ''}`}
      >
        {open ? <X size={22} /> : <Calculator size={22} />}
        <span className="fc-fab-label">Calculator</span>
      </button>

      <style>{`
        /* ---------- MOBILE FIRST: base = phone ---------- */

        .fc-fab {
          position: fixed;
          left: 16px;
          /* --fc-offset lets a page with its own sticky bar (e.g. a mobile
             add-to-cart bar) push the button up without editing this file:
             set --fc-offset on :root or a page wrapper. */
          bottom: calc(16px + env(safe-area-inset-bottom) + var(--fc-offset, 0px));
          z-index: 45;               /* under CartDrawer, over page content */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          padding: 0;
          /* Flat. Contrast against the page does the separating, not a shadow. */
          border: 1px solid #0d0d0d;
          border-radius: 999px;
          background: #0d0d0d;
          color: #fff;
          cursor: pointer;
          opacity: 0;
          transform: translateY(12px) scale(.94);
          transition: opacity .35s ease, transform .2s ease, background .15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .fc-fab.fc-in { opacity: 1; transform: translateY(0) scale(1); }
        .fc-fab:active { transform: scale(.94); }
        .fc-fab:focus-visible { outline: 2px solid #1A56DB; outline-offset: 3px; }
        .fc-fab-label { display: none; }

        /* Attention ring — pulses only while the nudge is on screen. */
        .fc-fab.fc-attn::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 999px;
          border: 2px solid rgba(26,86,219,.55);
          animation: fcRing 1.9s ease-out infinite;
          pointer-events: none;
        }
        @keyframes fcRing {
          0%   { transform: scale(.94); opacity: .9 }
          70%  { transform: scale(1.22); opacity: 0 }
          100% { transform: scale(1.22); opacity: 0 }
        }

        .fc-prompt {
          position: fixed;
          left: 16px;
          bottom: calc(84px + env(safe-area-inset-bottom) + var(--fc-offset, 0px));
          z-index: 45;
          display: flex;
          align-items: stretch;
          max-width: calc(100vw - 32px);
          background: #0d0d0d;
          color: #fff;
          border: 1px solid #0d0d0d;
          border-radius: 12px;
          opacity: 0;
          transform: translateY(8px);
          animation: fcPromptIn .3s ease forwards;
          overflow: hidden;
        }
        @keyframes fcPromptIn { to { opacity: 1; transform: translateY(0) } }
        .fc-prompt-body {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: inherit;
          font: 600 13px/1.3 inherit;
          text-align: left;
          padding: 11px 6px 11px 13px;
          cursor: pointer;
        }
        .fc-prompt-chev { flex-shrink: 0; opacity: .7 }
        .fc-prompt-x {
          background: none;
          border: none;
          border-left: 1px solid rgba(255,255,255,.14);
          color: rgba(255,255,255,.6);
          padding: 0 10px;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        /* Bottom sheet: a corner-anchored card is unusable one-handed. */
        .fc-panel {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 46;
          max-height: 88vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          background: #fff;
          border-top: 1px solid #e5e7eb;
          border-radius: 18px 18px 0 0;
          padding: 10px 18px max(18px, env(safe-area-inset-bottom));
          animation: fcSheetIn .26s cubic-bezier(.32,.72,0,1);
        }
        @keyframes fcSheetIn { from { transform: translateY(100%) } to { transform: translateY(0) } }

        .fc-grabber {
          width: 38px;
          height: 4px;
          border-radius: 999px;
          background: #e5e7eb;
          margin: 0 auto 12px;
        }

        .fc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px }
        .fc-title { font-size: 15px; font-weight: 800; color: #0d0d0d; letter-spacing: -.02em }
        .fc-sub { font-size: 12px; color: #9ca3af; margin-top: 2px }
        .fc-close {
          border: none; background: #f3f4f6; border-radius: 9px;
          width: 32px; height: 32px; display: grid; place-items: center;
          cursor: pointer; color: #6b7280; flex-shrink: 0;
        }

        .fc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px }
        .fc-grid-single { margin-bottom: 14px }
        .fc-field { display: block }
        .fc-label {
          display: block; font-size: 10px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: #9ca3af; margin-bottom: 6px;
        }
        .fc-input-wrap { position: relative }
        .fc-input {
          width: 100%;
          height: 46px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 0 42px 0 12px;
          font-size: 16px;          /* 16px prevents iOS Safari zooming on focus */
          font-weight: 600;
          color: #0d0d0d;
          outline: none;
          font-variant-numeric: tabular-nums;
          -moz-appearance: textfield;
          transition: border-color .15s ease;
        }
        .fc-input::-webkit-outer-spin-button,
        .fc-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0 }
        /* Focus reads as a colour change on the border — the soft ring it
           replaced was a box-shadow. */
        .fc-input:focus { border-color: #1A56DB }
        .fc-suffix {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          font-size: 12px; font-weight: 600; color: #9ca3af; pointer-events: none;
        }

        .fc-result { background: #F9FAFB; border: 1px solid #f0f0f0; border-radius: 12px; padding: 4px 14px 10px }
        .fc-row {
          display: flex; justify-content: space-between; align-items: baseline;
          gap: 12px; padding: 9px 0; border-bottom: 1px solid #f0f0f0;
        }
        .fc-row:last-child { border-bottom: none }
        .fc-row-label { font-size: 12.5px; color: #6b7280 }
        .fc-row-value { font-size: 14px; font-weight: 700; color: #0d0d0d; font-variant-numeric: tabular-nums; text-align: right }
        .fc-row-value-strong { font-size: 15.5px }
        .fc-note { padding-top: 9px; font-size: 12px; color: #6b7280 }
        .fc-note strong { color: #0d0d0d }
        .fc-warn {
          background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px;
          padding: 10px 14px; font-size: 12.5px; color: #92400E;
        }
        .fc-disclaimer { font-size: 10.5px; line-height: 1.6; color: #9ca3af; margin: 12px 0 0 }

        /* ---------- DESKTOP layered on top ---------- */

        @media (min-width: 641px) {
          .fc-fab {
            left: 20px;
            bottom: calc(20px + env(safe-area-inset-bottom) + var(--fc-offset, 0px));
            width: auto;
            height: 52px;
            gap: 9px;
            padding: 0 20px 0 17px;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: -.01em;
          }
          .fc-fab-label { display: inline }
          .fc-fab:hover { background: #262626; border-color: #262626 }

          .fc-prompt { bottom: calc(84px + var(--fc-offset, 0px)); max-width: 260px }

          .fc-panel {
            left: 20px;
            right: auto;
            bottom: calc(84px + var(--fc-offset, 0px));
            width: 348px;
            max-height: calc(100vh - 140px);
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 18px;
            animation: fcCardIn .2s ease;
          }
          @keyframes fcCardIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
          .fc-grabber { display: none }
        }

        /* The backdrop does the work the panel shadow used to: it separates
           the calculator from the page without any blur. */
        .fc-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.4);
          z-index: 44;
          animation: fcFade .2s ease;
        }
        @media (min-width: 641px) { .fc-backdrop { background: rgba(0,0,0,.2) } }
        @keyframes fcFade { from { opacity: 0 } to { opacity: 1 } }

        @media (prefers-reduced-motion: reduce) {
          .fc-fab, .fc-panel, .fc-prompt, .fc-backdrop { animation: none !important; transition: none !important }
          .fc-fab { opacity: 1; transform: none }
          .fc-fab.fc-attn::after { animation: none; opacity: .8 }
          .fc-prompt { opacity: 1; transform: none }
        }

        @media print { .fc-fab, .fc-panel, .fc-backdrop, .fc-prompt { display: none !important } }
      `}</style>
    </>
  )
}