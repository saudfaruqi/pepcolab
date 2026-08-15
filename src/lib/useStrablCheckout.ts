// src/lib/useStrablCheckout.ts
'use client'

import { useEffect, useState } from 'react'
import type { CartLine } from '@/lib/cartContext'

// ============================================================
// STRABL CHECKOUT INTEGRATION
// Extracted from CartDrawer so the cart drawer and the standalone /cart
// page share one implementation instead of drifting out of sync — the
// numeric-ID fix below already had to be applied once after a live bug;
// a second copy is a second place to forget it next time.
//
// Rewritten from scratch and verified against three independent sources:
//   1. The actual installed SDK source (@strabl-engineering/checkout-sdk@1.0.2,
//      decompiled dist/index.js) — confirms the exact fields checkoutWithRedirect
//      reads and validates.
//   2. Live successful API responses captured during testing — the cart
//      session creation (POST /v2/public/api/cart/) and the resulting
//      Paymob payment intention both came back with fully correct data
//      using this exact shape.
//   3. The npm README's documented Cart/Product interfaces.
//
// 2026-08-15 update: productId/variantId must be the bare numeric Shopify
// ID (not the full gid://shopify/ProductVariant/... string) with a hard
// 20-char max — STRABL support confirmed this is what was breaking the
// Paymob transaction_discount call (400 + the blocked cross-origin frame
// on checkout.strabl.io). Same extraction the STRABL webhook route already
// does on the way back in, applied here on the way out.
// ============================================================

const toNumericId = (gid: string): string => {
  const match = gid.match(/(\d+)$/)
  const numeric = match ? match[1] : gid
  return numeric.slice(0, 20)
}

export function useStrablCheckout() {
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)

  const STRABL_ENV = process.env.NEXT_PUBLIC_STRABL_ENVIRONMENT || 'production'
  const strablPlatformUuid = process.env.NEXT_PUBLIC_STRABL_PLATFORM_UUID

  // Readiness polling: the SDK loads from a third-party CDN (see layout.tsx),
  // so on a slow connection `window.StrablCheckout` may not exist yet on
  // first render. Poll briefly rather than checking once and giving up.
  useEffect(() => {
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | undefined
    let deadline: ReturnType<typeof setTimeout> | undefined

    if (!strablPlatformUuid) {
      setSdkError('STRABL configuration is missing. Please contact support.')
      return
    }

    const stop = () => {
      if (interval) clearInterval(interval)
      if (deadline) clearTimeout(deadline)
    }

    const tryInit = (): boolean => {
      if (cancelled) return true
      // @ts-ignore
      if (!window.StrablCheckout) return false

      try {
        const origin = process.env.NEXT_PUBLIC_SERVER_BASE_URL || window.location.origin
        // @ts-ignore
        window.StrablCheckout.initialize({
          // Lowercase platformUuid, NOT the README's "platformUUID" — verified
          // against the actual decompiled SDK source, which destructures
          // { platformUuid, environment, storeLogo, storeUrl, storeName }.
          // The README has already proven unreliable elsewhere (wrong items/
          // lineItems key, wrongly marking sku as required), so source wins.
          platformUuid: strablPlatformUuid,
          environment: STRABL_ENV,
          storeName: 'PepcoLab',
          storeUrl: origin, // must be an absolute HTTPS URL
          storeLogo: `${origin}/pepcologo.png`, // must be an absolute HTTPS URL
        })
        setSdkReady(true)
      } catch (err) {
        console.error('[useStrablCheckout] STRABL init error:', err)
        setSdkError('Failed to initialize payment system')
      }
      return true
    }

    if (!tryInit()) {
      interval = setInterval(() => {
        if (tryInit()) stop()
      }, 250)

      deadline = setTimeout(() => {
        stop()
        if (!cancelled) {
          // @ts-ignore
          if (!window.StrablCheckout) {
            setSdkError(
              'Payment system could not be loaded. Disable any ad blocker and refresh, or contact us to complete your order.'
            )
          }
        }
      }, 20000)
    }

    return () => {
      cancelled = true
      stop()
    }
  }, [strablPlatformUuid, STRABL_ENV])

  const handleCheckout = async (lines: CartLine[], displayCurrency: string, detectedCountry?: string | null) => {
    if (lines.length === 0) return

    setCheckingOut(true)
    setSdkError(null)

    try {
      // @ts-ignore
      if (!window.StrablCheckout) {
        setSdkError('Payment system is not available. Please refresh and try again.')
        setCheckingOut(false)
        return
      }
      if (!strablPlatformUuid) {
        setSdkError('STRABL configuration is missing. Please contact support.')
        setCheckingOut(false)
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_SERVER_BASE_URL || window.location.origin
      const currency = displayCurrency || 'AED'

      // lineItems: required fields per the actual SDK validation are title,
      // price, quantity>0, productId, variantId — everything else is
      // optional but included where we have real data.
      const strablLineItems = lines
        .filter(l => l.variantId && l.quantity > 0 && l.price > 0)
        .map(l => {
          const numericId = toNumericId(l.variantId)
          return {
            title: l.title || 'Product',
            description: l.variantTitle || l.title || 'Product',
            price: Number(l.price) || 0,
            quantity: Number(l.quantity) || 1,
            productId: numericId,
            variantId: numericId,
            image: l.image || `${baseUrl}/pepcologo.png`,
            url: l.slug ? `${baseUrl}/products/${l.slug}` : `${baseUrl}/products`,
            variantOptions: l.variantTitle ? [l.variantTitle] : [],
          }
        })

      if (strablLineItems.length === 0) {
        setSdkError('Your cart is empty or contains invalid items.')
        setCheckingOut(false)
        return
      }

      const cart = {
        currency,
        country: detectedCountry || 'AE',
        lineItems: strablLineItems,
        extra: {},
        merchantUrls: {
          successUrl: `${baseUrl}/checkout/success`,
          failureUrl: `${baseUrl}/checkout/failure`,
          cancelUrl: `${baseUrl}/checkout/cancel`,
        },
      }

      // @ts-ignore
      await window.StrablCheckout.checkoutWithRedirect({ cart, isExpressCheckout: false })
    } catch (err: any) {
      console.error('[useStrablCheckout] Checkout error:', err)
      setSdkError(err.message || 'Something went wrong. Please try again.')
      setCheckingOut(false)
    }
  }

  return {
    sdkReady,
    sdkError,
    checkingOut,
    handleCheckout,
    clearSdkError: () => setSdkError(null),
  }
}