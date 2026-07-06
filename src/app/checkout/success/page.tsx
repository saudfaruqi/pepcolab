// src/app/checkout/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/products')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

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
          background: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#0d0d0d',
          margin: '0 0 8px',
          fontFamily: 'Georgia, serif'
        }}>
          Order Confirmed! 🎉
        </h1>
        <p style={{
          fontSize: 15,
          color: 'rgba(13,13,13,.55)',
          lineHeight: 1.6,
          margin: '0 0 8px'
        }}>
          Thank you for your order. You will receive a confirmation email shortly.
        </p>
        <p style={{
          fontSize: 13,
          color: 'rgba(13,13,13,.35)',
          lineHeight: 1.6,
          margin: '0 0 24px'
        }}>
          Your order is being processed and will be dispatched within 24-48 hours.
        </p>

        <div style={{
          background: '#fafaf9',
          padding: '14px',
          borderRadius: 12,
          fontSize: 13,
          color: 'rgba(13,13,13,.45)',
          marginBottom: 24
        }}>
          Redirecting to shop in {countdown}s
        </div>

        <Link
          href="/products"
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
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}