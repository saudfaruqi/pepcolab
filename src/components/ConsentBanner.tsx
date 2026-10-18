'use client'
// src/components/ConsentBanner.tsx
//
// Cookie choice, shown once until answered (see lib/consent.ts for what each
// category controls). Equal-weight Accept / Reject buttons — a reject that is
// harder to find than accept is not valid consent under UK guidance.
// "Choose" opens the two toggles for someone who wants analytics but not
// marketing.
//
// Sits under the 21+ gate (z-index 9999), so on a first visit the gate is
// answered first and this appears behind it.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readConsent, saveConsent } from '@/lib/consent'

export default function ConsentBanner() {
  const [show, setShow] = useState(false)
  const [custom, setCustom] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!readConsent()) setShow(true)
    const reopen = () => setShow(true)
    window.addEventListener('pepcolab:open-consent', reopen)
    return () => window.removeEventListener('pepcolab:open-consent', reopen)
  }, [])

  if (!show) return null

  const choose = (a: boolean, m: boolean) => {
    saveConsent(a, m)
    setShow(false)
    setCustom(false)
  }

  const btn: React.CSSProperties = {
    flex: '1 1 0',
    minWidth: 110,
    padding: '11px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: '1px solid #0D0D0D',
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9000,
        maxWidth: 560,
        margin: '0 auto',
        background: '#FFFFFF',
        color: '#0D0D0D',
        border: '1px solid rgba(13,13,13,.12)',
        borderRadius: 18,
        padding: '18px 18px 16px',
        boxShadow: '0 12px 40px rgba(13,13,13,.18)',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Cookies</div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(13,13,13,.65)', margin: '0 0 14px' }}>
        We use essential storage to run the site and your cart. With your permission we also use analytics (Google) to see
        how the site is used, and marketing cookies (Meta) to measure our ads. See our{' '}
        <Link href="/privacy" style={{ color: '#0D0D0D', fontWeight: 600 }}>
          privacy policy
        </Link>
        .
      </p>

      {custom && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
          <label style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'flex-start' }}>
            <input type="checkbox" checked disabled style={{ marginTop: 3 }} />
            <span>
              <strong>Essential</strong> — cart, sign-in, age confirmation. Always on.
            </span>
          </label>
          <label style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              <strong>Analytics</strong> — Google Analytics, to understand which pages are used.
            </span>
          </label>
          <label style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              <strong>Marketing</strong> — Meta Pixel, to measure whether our Facebook and Instagram ads work.
            </span>
          </label>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {custom ? (
          <button type="button" onClick={() => choose(analytics, marketing)} style={{ ...btn, background: '#0D0D0D', color: '#fff' }}>
            Save choices
          </button>
        ) : (
          <>
            <button type="button" onClick={() => choose(false, false)} style={{ ...btn, background: '#fff', color: '#0D0D0D' }}>
              Reject all
            </button>
            <button type="button" onClick={() => choose(true, true)} style={{ ...btn, background: '#0D0D0D', color: '#fff' }}>
              Accept all
            </button>
          </>
        )}
      </div>
      {!custom && (
        <button
          type="button"
          onClick={() => setCustom(true)}
          style={{ marginTop: 10, background: 'none', border: 0, padding: 0, fontSize: 12, color: 'rgba(13,13,13,.6)', textDecoration: 'underline', cursor: 'pointer' }}
        >
          Choose what to allow
        </button>
      )}
    </div>
  )
}
