'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function CancelInner() {
  const params = useSearchParams()
  const orderId = params.get('order')

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0a0a 0%, #111318 60%, #0d0f14 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Logo */}
      <Link href="/" style={{ marginBottom: 48, display: 'block' }}>
        <img src="/pepcologo.png" alt="PepcoLab" style={{ height: 36, width: 'auto', filter: 'brightness(0) invert(1)', opacity: .85 }} />
      </Link>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,.035)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 24,
        padding: 'clamp(36px,5vw,56px) clamp(28px,5vw,52px)',
        maxWidth: 500,
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        </div>

        {/* Label */}
        <div style={{
          fontSize: 11,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.28)',
          marginBottom: 12,
          fontWeight: 600,
        }}>
          Checkout Cancelled
        </div>

        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(24px,4vw,32px)',
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 14px',
          letterSpacing: '-.03em',
          lineHeight: 1.15,
        }}>
          Order not placed
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,.45)',
          lineHeight: 1.75,
          margin: '0 0 32px',
          maxWidth: 340,
          marginInline: 'auto',
        }}>
          You cancelled checkout. Your card was not charged and your cart is still intact.
        </p>

        {/* Cart still saved notice */}
        <div style={{
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255,255,255,.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: 2 }}>
              Your cart is saved
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', lineHeight: 1.5 }}>
              Items are still waiting — return whenever you're ready.
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/products" style={{
            display: 'block',
            background: '#fff',
            color: '#0a0a0a',
            padding: '14px 24px',
            borderRadius: 12,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '.02em',
          }}>
            Return to cart
          </Link>
          <Link href="/products" style={{
            display: 'block',
            background: 'transparent',
            color: 'rgba(255,255,255,.4)',
            padding: '13px 24px',
            borderRadius: 12,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            border: '1px solid rgba(255,255,255,.08)',
          }}>
            Continue browsing
          </Link>
        </div>
      </div>

      {/* Footer note */}
      <p style={{
        marginTop: 32,
        fontSize: 11,
        color: 'rgba(255,255,255,.18)',
        textAlign: 'center',
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        For research use only · Not for human consumption
      </p>
    </main>
  )
}

export default function CheckoutCancel() {
  return (
    <Suspense fallback={null}>
      <CancelInner />
    </Suspense>
  )
}