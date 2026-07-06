// src/app/checkout/cancel/page.tsx
'use client'

import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7f7f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        padding: '48px 40px',
        borderRadius: 24,
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,.08)'
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#0d0d0d',
          margin: '0 0 8px',
          fontFamily: 'Georgia, serif'
        }}>
          Checkout Cancelled
        </h1>
        <p style={{
          fontSize: 15,
          color: 'rgba(13,13,13,.55)',
          lineHeight: 1.6,
          margin: '0 0 24px'
        }}>
          You cancelled the checkout process. Your cart has been saved and you can continue shopping anytime.
        </p>

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/cart"
            style={{
              display: 'inline-block',
              background: '#0d0d0d',
              color: '#fff',
              padding: '12px 32px',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              transition: 'background .2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a1a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0d0d0d'
            }}
          >
            Return to Cart
          </Link>
          <Link
            href="/products"
            style={{
              display: 'inline-block',
              background: 'transparent',
              color: '#0d0d0d',
              padding: '12px 32px',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              border: '1px solid rgba(13,13,13,.15)',
              transition: 'border-color .2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0d0d0d'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(13,13,13,.15)'
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}