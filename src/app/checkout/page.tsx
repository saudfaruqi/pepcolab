'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'

function CheckoutInner() {
  const params = useSearchParams()
  const orderId = params.get('order')
  const [cartData, setCartData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setError('Missing order reference.')
      return
    }
    fetch(`/api/checkout/order?order_id=${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setCartData(data.cartData)
      })
      .catch(() => setError('Could not load order.'))
  }, [orderId])

  useEffect(() => {
    if (!sdkReady) return
    // @ts-ignore — loaded from CDN
    if (window.StrablCheckout) {
      // @ts-ignore
      window.StrablCheckout.initialize({
        platformUuid: process.env.NEXT_PUBLIC_STRABL_PLATFORM_UUID,
        environment: process.env.NEXT_PUBLIC_STRABL_ENVIRONMENT || 'production',
        storeName: 'PepcoLab',
        storeUrl: 'https://www.pepcolab.com',
        storeLogo: 'https://www.pepcolab.com/logo.png',
        buttonSelector: '#checkout-button',
      })
    }
  }, [sdkReady])

  const handlePay = async () => {
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32 }}>
      <Script
        src="https://cdn.jsdelivr.net/npm/@strabl-engineering/checkout-sdk@latest/dist/index.global.js"
        onLoad={() => setSdkReady(true)}
      />
      <div style={{ background: '#fff', borderRadius: 12, padding: '2.5rem 2rem', maxWidth: 440, width: '100%', boxShadow: '0 1px 8px rgba(0,0,0,.08)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Complete your payment</h1>
        <p style={{ color: '#666', fontSize: '.9rem', marginBottom: 24 }}>
          You'll be redirected to STRABL's secure checkout to complete your order.
        </p>

        {error && <p style={{ color: '#A32D2D', marginBottom: 16 }}>{error}</p>}

        <button
          id="checkout-button"
          onClick={handlePay}
          disabled={!cartData || !sdkReady || redirecting}
          style={{
            width: '100%', padding: '.85rem', background: redirecting ? '#666' : '#111',
            color: '#fff', border: 'none', borderRadius: 6, fontSize: '1rem',
            fontWeight: 600, cursor: cartData && sdkReady ? 'pointer' : 'not-allowed',
          }}
        >
          {redirecting ? 'Redirecting…' : 'Pay with STRABL'}
        </button>

        <a href="/products" style={{ display: 'block', marginTop: 16, fontSize: '.8rem', color: '#999' }}>
          ← Return to shop
        </a>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  )
}