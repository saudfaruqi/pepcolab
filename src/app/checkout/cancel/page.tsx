// src/app/checkout/cancel/page.tsx
'use client'

import Link from 'next/link'
import Nav from '@/components/Nav'

export default function CheckoutCancelPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F5F1' }}>
      <Nav />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', background: 'rgba(13,13,13,.06)', padding: '7px 16px', borderRadius: 999, marginBottom: 24 }}>
            Checkout Cancelled
          </div>

          <h1 style={{ fontSize: 'clamp(30px,4vw,40px)', fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.05, color: '#0D0D0D', margin: '0 0 12px' }}>
            No charge was made.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(13,13,13,.55)', maxWidth: 380, margin: '0 auto 32px' }}>
            Your cart is still saved — pick up right where you left off whenever you're ready.
          </p>

          <Link
            href="/cart"
            style={{ display: 'block', background: '#0D0D0D', color: '#fff', padding: '15px', borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 700, marginBottom: 12, transition: 'background .2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#0D0D0D' }}
          >
            Return to Cart
          </Link>

          <Link
            href="/products"
            style={{ display: 'block', color: 'rgba(13,13,13,.5)', fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '10px' }}
          >
            Continue Shopping →
          </Link>

          <p style={{ fontSize: 11, color: 'rgba(13,13,13,.3)', lineHeight: 1.6, marginTop: 32 }}>
            For laboratory and research purposes only. Not for human or veterinary use.
          </p>
        </div>
      </main>
    </div>
  )
}