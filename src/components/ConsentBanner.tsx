'use client'
// src/components/ConsentBanner.tsx
//
// Cookie choice, shown once until answered (see lib/consent.ts). One optional
// category — analytics. Equal-weight Accept / Reject buttons: a reject that is
// harder to find than accept is not valid consent under UK guidance.
//
// Sits under the 21+ gate (z-index 9999), so on a first visit the gate is
// answered first and this appears behind it.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readConsent, saveConsent } from '@/lib/consent'

export default function ConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!readConsent()) setShow(true)
    const reopen = () => setShow(true)
    window.addEventListener('pepcolab:open-consent', reopen)
    return () => window.removeEventListener('pepcolab:open-consent', reopen)
  }, [])

  if (!show) return null

  const choose = (a: boolean) => {
    saveConsent(a)
    setShow(false)
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
        We use essential storage to run the site and your cart. With your permission we also use Google Analytics to
        see which pages are used. We do not use advertising cookies. See our{' '}
        <Link href="/privacy" style={{ color: '#0D0D0D', fontWeight: 600 }}>
          privacy policy
        </Link>
        .
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" onClick={() => choose(false)} style={{ ...btn, background: '#fff', color: '#0D0D0D' }}>
          Reject analytics
        </button>
        <button type="button" onClick={() => choose(true)} style={{ ...btn, background: '#0D0D0D', color: '#fff' }}>
          Accept analytics
        </button>
      </div>
    </div>
  )
}
