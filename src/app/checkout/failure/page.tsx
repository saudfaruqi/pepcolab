// src/app/checkout/failure/page.tsx
'use client'

import Link from 'next/link'
import Nav from '@/components/Nav'

export default function CheckoutFailurePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F5F1' }}>
      <Nav />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#B91C1C', background: 'rgba(185,28,28,.08)', padding: '7px 16px', borderRadius: 999, marginBottom: 24 }}>
            Payment Not Completed
          </div>

          <h1 style={{ fontSize: 'clamp(30px,4vw,40px)', fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.05, color: '#0D0D0D', margin: '0 0 12px' }}>
            Your payment didn't go through.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(13,13,13,.55)', maxWidth: 380, margin: '0 auto 28px' }}>
            No charge was made. If your bank shows a pending hold, it will release automatically.
          </p>

          <div style={{ background: '#fff', border: '1px solid rgba(13,13,13,.08)', borderRadius: 20, padding: '28px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.4)', marginBottom: 12 }}>
              This is usually one of
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {[
                'The bank declined or couldn\u2019t complete 3D Secure verification',
                'Insufficient funds or a card limit',
                'Incorrect card details entered',
              ].map((reason, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.6, color: 'rgba(13,13,13,.6)', marginBottom: i < 2 ? 10 : 0 }}>
                  <span style={{ color: '#C8992A', flexShrink: 0, marginTop: 1 }}>—</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/products"
            style={{ display: 'block', background: '#0D0D0D', color: '#fff', padding: '15px', borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 700, marginBottom: 12, transition: 'background .2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#0D0D0D' }}
          >
            Try Again
          </Link>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
            <Link href="/track-order" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.5)', textDecoration: 'none' }}>
              Check order status
            </Link>
            <span style={{ color: 'rgba(13,13,13,.2)' }}>·</span>
            <a href="mailto:hello@pepcolab.com" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.5)', textDecoration: 'none' }}>
              Contact support
            </a>
          </div>

          <p style={{ fontSize: 11, color: 'rgba(13,13,13,.3)', lineHeight: 1.6, marginTop: 32 }}>
            For laboratory and research purposes only. Not for human or veterinary use.
          </p>
        </div>
      </main>
    </div>
  )
}