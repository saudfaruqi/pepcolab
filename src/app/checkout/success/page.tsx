'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

function SuccessInner() {
  const params = useSearchParams()
  const ref = params.get('ref')

  const [status, setStatus]   = useState<'pending' | 'complete' | 'failed'>('pending')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!ref || status !== 'pending') return
    if (attempts > 10) { setStatus('failed'); return } // ~15s of polling, then give up gracefully

    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/checkout/status?ref=${ref}`).then(r => r.json())
        if (r.status === 'complete') {
          setStatus('complete')
          setOrderId(r.shopifyOrderId ?? null)
        } else if (r.status === 'failed') {
          setStatus('failed')
        } else {
          setAttempts(a => a + 1)
        }
      } catch {
        setAttempts(a => a + 1)
      }
    }, 1500)

    return () => clearTimeout(t)
  }, [ref, status, attempts])

  const heading = status === 'complete'
    ? 'Payment received'
    : status === 'failed'
      ? 'Confirming your order'
      : 'Confirming your payment…'

  const body = status === 'complete'
    ? "Your research order has been placed and payment confirmed. You'll receive a confirmation email shortly with tracking details."
    : status === 'failed'
      ? "We're still finalizing your order confirmation. You'll receive an email as soon as it's ready — no need to place the order again."
      : 'Hang tight while we confirm your payment with STRABL.'

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

      <Link href="/" style={{ marginBottom: 48, display: 'block' }}>
        <img src="/pepcologo.png" alt="PepcoLab" style={{ height: 36, width: 'auto', filter: 'brightness(0) invert(1)', opacity: .85 }} />
      </Link>

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

        {/* Icon: spinner while pending, check once complete */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: status === 'complete'
            ? 'linear-gradient(135deg, #1a5c2a, #22c55e22)'
            : 'rgba(255,255,255,.05)',
          border: status === 'complete'
            ? '1px solid rgba(34,197,94,.3)'
            : '1px solid rgba(255,255,255,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          {status === 'pending' ? (
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,.2)',
              borderTopColor: '#fff',
              animation: 'success-spin .8s linear infinite',
            }} />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={status === 'complete' ? '#22c55e' : 'rgba(255,255,255,.5)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <div style={{
          fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.3)', marginBottom: 12, fontWeight: 600,
        }}>
          {status === 'complete' ? 'Order Confirmed' : 'Processing'}
        </div>

        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,4vw,34px)',
          fontWeight: 700, color: '#fff', margin: '0 0 14px',
          letterSpacing: '-.03em', lineHeight: 1.15,
        }}>
          {heading}
        </h1>
        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,.45)', lineHeight: 1.75,
          margin: '0 0 32px', maxWidth: 340, marginInline: 'auto',
        }}>
          {body}
        </p>

        {status === 'complete' && orderId && (
          <div style={{
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '14px 20px', marginBottom: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' }}>
              Order Reference
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: 'rgba(255,255,255,.65)', letterSpacing: '.04em' }}>
              #{orderId}
            </span>
          </div>
        )}

        {status === 'complete' && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 32,
          }}>
            {[
              { icon: '🔬', label: 'Lab Verified' },
              { icon: '❄️', label: 'Cold-Chain' },
              { icon: '📦', label: 'Tracked Dispatch' },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 10, padding: '12px 8px', fontSize: 11,
                color: 'rgba(255,255,255,.35)', fontWeight: 600, letterSpacing: '.04em',
              }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                {label}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/" style={{
            display: 'block', background: '#fff', color: '#0a0a0a', padding: '14px 24px',
            borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700, letterSpacing: '.02em',
          }}>
            Return to PepcoLab
          </Link>
          <Link href="/products" style={{
            display: 'block', background: 'transparent', color: 'rgba(255,255,255,.4)',
            padding: '13px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 13,
            fontWeight: 500, border: '1px solid rgba(255,255,255,.08)',
          }}>
            Continue browsing
          </Link>
        </div>
      </div>

      <p style={{ marginTop: 32, fontSize: 11, color: 'rgba(255,255,255,.18)', textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic' }}>
        For research use only · Not for human consumption
      </p>

      <style>{`@keyframes success-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  )
}