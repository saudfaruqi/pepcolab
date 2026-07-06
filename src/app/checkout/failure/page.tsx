
// src/app/checkout/failure/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

const FAILURE_REASONS: Record<string, { title: string; body: string }> = {
  DECLINED:        { title: 'Card declined',         body: 'Your bank declined the transaction. Check your card details or try a different payment method.' },
  INSUFFICIENT:    { title: 'Insufficient funds',    body: 'Your card didn\'t have enough balance to cover this order.' },
  EXPIRED:         { title: 'Card expired',          body: 'The card you used has expired. Please try again with a valid card.' },
  INVALID:         { title: 'Invalid card details',  body: 'The card information entered was invalid. Please double-check and try again.' },
  TIMEOUT:         { title: 'Session timed out',     body: 'Your checkout session expired. Return to cart and start again.' },
}

function FailureInner() {
  const params = useSearchParams()
  const ref = params.get('ref')   // ← was 'order'; unused otherwise so this is a no-op fix
  const orderId = params.get('order')
  const rawReason = (params.get('failureReason') || '').toUpperCase()
  const reason = FAILURE_REASONS[rawReason] || {
    title: 'Payment not completed',
    body: 'Something went wrong during checkout. Your card was not charged. Please try again.',
  }

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
          background: 'linear-gradient(135deg, #5c1a1a, #ef444422)',
          border: '1px solid rgba(239,68,68,.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Label */}
        <div style={{
          fontSize: 11,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'rgba(239,68,68,.55)',
          marginBottom: 12,
          fontWeight: 600,
        }}>
          Payment Failed
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
          {reason.title}
        </h1>
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,.45)',
          lineHeight: 1.75,
          margin: '0 0 32px',
          maxWidth: 340,
          marginInline: 'auto',
        }}>
          {reason.body}
        </p>

        {/* Raw reason badge if unknown */}
        {rawReason && !FAILURE_REASONS[rawReason] && (
          <div style={{
            background: 'rgba(239,68,68,.06)',
            border: '1px solid rgba(239,68,68,.15)',
            borderRadius: 8,
            padding: '8px 14px',
            marginBottom: 24,
            fontSize: 11,
            color: 'rgba(239,68,68,.5)',
            fontFamily: 'monospace',
            letterSpacing: '.06em',
          }}>
            Error code: {rawReason}
          </div>
        )}

        {/* What to try */}
        <div style={{
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 14,
          padding: '20px 22px',
          marginBottom: 28,
          textAlign: 'left',
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.25)',
            marginBottom: 14,
          }}>
            What to try
          </div>
          {[
            'Verify your card number, expiry, and CVV',
            'Ensure your card supports international payments',
            'Contact your bank if the issue persists',
            'Try a different card or payment method',
          ].map((tip, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: i < 3 ? 10 : 0,
            }}>
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: 'rgba(255,255,255,.3)',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,.4)', lineHeight: 1.55 }}>{tip}</span>
            </div>
          ))}
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
          <Link href="/contact" style={{
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
            Contact support
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
        Your card was not charged · For research use only
      </p>
    </main>
  )
}

export default function CheckoutFailure() {
  return (
    <Suspense fallback={null}>
      <FailureInner />
    </Suspense>
  )
}