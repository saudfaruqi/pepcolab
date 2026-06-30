'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'

interface CartLineItem {
  title: string
  description: string
  price: number
  quantity: number
  image?: string
}

interface CartData {
  currency: string
  lineItems: CartLineItem[]
}

function CheckoutInner() {
  const params = useSearchParams()
  const orderId = params.get('order')
  const [cartData, setCartData] = useState<CartData | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!orderId) { setError('Missing order reference.'); setLoading(false); return }
    fetch(`/api/checkout/order?order_id=${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setCartData(data.cartData)
      })
      .catch(() => setError('Could not load order. Please go back and try again.'))
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    if (!sdkReady) return
    // @ts-ignore
    if (window.StrablCheckout) {
      // @ts-ignore
      window.StrablCheckout.initialize({
        platformUuid:   process.env.NEXT_PUBLIC_STRABL_PLATFORM_UUID,
        environment:    process.env.NEXT_PUBLIC_STRABL_ENVIRONMENT || 'production',
        storeName:      'PepcoLab',
        storeUrl:       'https://www.pepcolab.com',
        storeLogo:      'https://www.pepcolab.com/pepcologo.png',
        buttonSelector: '#checkout-button',
      })
    }
  }, [sdkReady])

  const handlePay = async () => {
    if (!cartData || !sdkReady || redirecting) return
    setRedirecting(true)
    try {
      // @ts-ignore
      await window.StrablCheckout.checkoutWithRedirect({ cart: cartData })
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setRedirecting(false)
    }
  }

  const subtotal = cartData?.lineItems.reduce((s, l) => s + l.price * l.quantity, 0) ?? 0
  const currency = cartData?.currency ?? 'AED'
  const fmt = (n: number) => new Intl.NumberFormat('en-AE', { style: 'currency', currency }).format(n)
  const ready = !!cartData && sdkReady && !redirecting

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f7f7f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Script
        src="https://cdn.jsdelivr.net/npm/@strabl-engineering/checkout-sdk@latest/dist/index.global.js"
        onLoad={() => setSdkReady(true)}
      />

      {/* ── Top bar ── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid rgba(13,13,13,.07)',
        padding: '0 clamp(16px,4vw,48px)',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/pepcologo.png" alt="PepcoLab" style={{ height: 32, width: 'auto' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* SSL badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, color: 'rgba(13,13,13,.38)',
            letterSpacing: '.04em',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secure Checkout
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)',
        gap: 0,
        maxWidth: 960,
        margin: '0 auto',
        width: '100%',
        padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,40px)',
        alignItems: 'start',
        boxSizing: 'border-box',
      }}>

        {/* ── Left: payment panel ── */}
        <div style={{ paddingRight: 'clamp(0px,4vw,48px)' }}>

          {/* Step breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 600, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'rgba(13,13,13,.3)',
            marginBottom: 28,
          }}>
            <span style={{ color: 'rgba(13,13,13,.22)' }}>Cart</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{ color: '#0d0d0d' }}>Payment</span>
          </div>

          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(22px,3vw,30px)',
            fontWeight: 700,
            color: '#0d0d0d',
            margin: '0 0 6px',
            letterSpacing: '-.03em',
            lineHeight: 1.2,
          }}>
            Complete your order
          </h1>
          <p style={{
            fontSize: 13.5,
            color: 'rgba(13,13,13,.45)',
            margin: '0 0 32px',
            lineHeight: 1.6,
          }}>
            You'll be redirected to STRABL's encrypted payment page to complete this transaction.
          </p>

          {/* Error state */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid rgba(220,38,38,.18)',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.55 }}>{error}</span>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div style={{ marginBottom: 24 }}>
              {[80, 60, 90].map((w, i) => (
                <div key={i} style={{
                  height: 14, width: `${w}%`,
                  background: 'rgba(13,13,13,.06)',
                  borderRadius: 6, marginBottom: 10,
                  animation: 'pulse 1.4s ease-in-out infinite',
                }} />
              ))}
            </div>
          )}

          {/* Pay button */}
          <button
            id="checkout-button"
            onClick={handlePay}
            disabled={!ready}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 14,
              border: 'none',
              background: ready
                ? 'linear-gradient(135deg,#0d0d0d 0%,#222 100%)'
                : 'rgba(13,13,13,.12)',
              color: ready ? '#fff' : 'rgba(13,13,13,.3)',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '.02em',
              cursor: ready ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all .2s',
              boxShadow: ready ? '0 4px 24px rgba(13,13,13,.18)' : 'none',
              marginBottom: 14,
            }}
          >
            {redirecting ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff',
                  animation: 'spin .7s linear infinite',
                  flexShrink: 0,
                }} />
                Redirecting to secure checkout…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {!cartData || !sdkReady ? 'Loading secure checkout…' : 'Pay now with STRABL'}
              </>
            )}
          </button>

          {/* Back link */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/products" style={{
              fontSize: 12.5, color: 'rgba(13,13,13,.38)',
              textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', gap: 5,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Return to shop
            </Link>
          </div>

          {/* Trust row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10,
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid rgba(13,13,13,.07)',
          }}>
            {[
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                label: '256-bit SSL',
                sub: 'Bank-grade encryption',
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                ),
                label: '3DS Secured',
                sub: 'Verified by your bank',
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ),
                label: 'No data stored',
                sub: 'PCI-DSS compliant',
              },
            ].map(({ icon, label, sub }) => (
              <div key={label} style={{
                background: '#fff',
                border: '1px solid rgba(13,13,13,.07)',
                borderRadius: 12,
                padding: '14px 12px',
                textAlign: 'center',
              }}>
                <div style={{ color: 'rgba(13,13,13,.35)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                  {icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0d0d0d', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'rgba(13,13,13,.35)', lineHeight: 1.4 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(13,13,13,.08)',
          borderRadius: 18,
          overflow: 'hidden',
          position: 'sticky',
          top: 76,
        }}>
          {/* Summary header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(13,13,13,.07)',
            background: '#fafaf9',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.14em',
              textTransform: 'uppercase', color: 'rgba(13,13,13,.35)',
            }}>
              Order Summary
            </div>
          </div>

          {/* Line items */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(13,13,13,.06)' }}>
            {loading ? (
              [1, 2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(13,13,13,.06)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: '70%', background: 'rgba(13,13,13,.06)', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 10, width: '40%', background: 'rgba(13,13,13,.04)', borderRadius: 4 }} />
                  </div>
                </div>
              ))
            ) : cartData?.lineItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, alignItems: 'center',
                paddingBottom: i < cartData.lineItems.length - 1 ? 14 : 0,
                marginBottom: i < cartData.lineItems.length - 1 ? 14 : 0,
                borderBottom: i < cartData.lineItems.length - 1 ? '1px solid rgba(13,13,13,.05)' : 'none',
              }}>
                {/* Product image or placeholder */}
                <div style={{
                  width: 52, height: 52, borderRadius: 10,
                  background: 'linear-gradient(135deg,#f0f4ff,#e8ecfa)',
                  border: '1px solid rgba(13,13,13,.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(26,86,219,.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0d0d', marginBottom: 2, lineHeight: 1.3 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(13,13,13,.38)' }}>
                    {item.description} · Qty {item.quantity}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0d0d', flexShrink: 0 }}>
                  {fmt(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: 'rgba(13,13,13,.45)' }}>Subtotal</span>
              <span style={{ fontSize: 12.5, color: '#0d0d0d', fontWeight: 600 }}>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12.5, color: 'rgba(13,13,13,.45)' }}>Shipping</span>
              <span style={{ fontSize: 12.5, color: 'rgba(13,13,13,.45)' }}>Calculated at checkout</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid rgba(13,13,13,.08)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0d0d0d' }}>Total</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0d0d0d', letterSpacing: '-.03em' }}>
                {fmt(subtotal)}
              </span>
            </div>
          </div>

          {/* Powered by */}
          <div style={{
            padding: '14px 24px',
            background: '#fafaf9',
            borderTop: '1px solid rgba(13,13,13,.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 10.5,
            color: 'rgba(13,13,13,.3)',
            fontWeight: 600,
            letterSpacing: '.06em',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secured & processed by STRABL
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        textAlign: 'center',
        padding: '16px 24px 28px',
        fontSize: 11,
        color: 'rgba(13,13,13,.22)',
        fontStyle: 'italic',
        lineHeight: 1.6,
      }}>
        For research use only · Not for human consumption · PepcoLab Ltd
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @media (max-width: 640px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f7f5' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(13,13,13,.1)', borderTopColor: '#0d0d0d', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  )
}