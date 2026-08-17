// src/app/checkout/success/page.tsx
'use client'

import Link from 'next/link'
import Nav from '@/components/Nav'

export default function CheckoutSuccessPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F5F1' }}>
      <Nav />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0A7B45', background: 'rgba(10,123,69,.1)', padding: '7px 16px', borderRadius: 999, marginBottom: 24 }}>
            ✓ Order Confirmed
          </div>

          <h1 style={{ fontSize: 'clamp(30px,4vw,40px)', fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.05, color: '#0D0D0D', margin: '0 0 12px' }}>
            Thanks for your order.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(13,13,13,.55)', maxWidth: 380, margin: '0 auto 32px' }}>
            We're preparing it now — batch-documented and cold-chain dispatched, typically within 24–48 hours.
          </p>

          <div style={{ background: '#fff', border: '1px solid rgba(13,13,13,.08)', borderRadius: 20, padding: '28px 28px 24px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.4)', marginBottom: 6 }}>
              Order Confirmation
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: 0 }}>
              We've emailed your order number and a link to track status to the address you checked out with.
            </p>
          </div>

          <Link
            href="/track-order"
            style={{ display: 'block', background: '#0D0D0D', color: '#fff', padding: '15px', borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 700, marginBottom: 12, transition: 'background .2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#0D0D0D' }}
          >
            Track Your Order
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