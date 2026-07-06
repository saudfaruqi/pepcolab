// src/app/checkout/failure/page.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function CheckoutFailurePage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('support@pepcolab.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          Payment Failed
        </h1>
        <p style={{
          fontSize: 15,
          color: 'rgba(13,13,13,.55)',
          lineHeight: 1.6,
          margin: '0 0 8px'
        }}>
          We couldn't process your payment. This could be due to:
        </p>
        <ul style={{
          textAlign: 'left',
          fontSize: 13,
          color: 'rgba(13,13,13,.45)',
          lineHeight: 1.8,
          paddingLeft: 20,
          margin: '0 0 24px'
        }}>
          <li>Insufficient funds or payment method decline</li>
          <li>Incorrect payment details entered</li>
          <li>Bank security restrictions</li>
        </ul>

        <div style={{
          background: '#fafaf9',
          padding: '14px',
          borderRadius: 12,
          fontSize: 13,
          color: 'rgba(13,13,13,.45)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}>
          <span>Need help? Contact us at</span>
          <button
            onClick={handleCopy}
            style={{
              background: 'none',
              border: 'none',
              color: '#0d0d0d',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 13
            }}
          >
            support@pepcolab.com
          </button>
          {copied && (
            <span style={{
              fontSize: 11,
              color: '#22c55e',
              fontWeight: 500
            }}>
              ✓ Copied!
            </span>
          )}
        </div>

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
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}