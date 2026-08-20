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
      }, 2000)

      // 4s, not 20s: an ad blocker or blocked third-party frame means
      // window.StrablCheckout will simply never appear, so waiting longer
      // just leaves the customer staring at a spinning "Loading payment…"
      // button with no way to know it's already failed.
      deadline = setTimeout(() => {
        stop()
        if (!cancelled) {
          // @ts-ignore
          if (!window.StrablCheckout) {
            setSdkError(
              'Payment system failed to load. Please refresh and try again, or contact support if the problem persists.'
            )
          }
        }
      }, 4000)
    }

    return () => {
      cancelled = true
      stop()
    }
  }, [strablPlatformUuid, STRABL_ENV])

  const handleCheckout = async (
    lines: CartLine[],
    displayCurrency: string,
    detectedCountry?: string | null,
    appliedDiscount?: { code: string; discountAmount: number } | null
  ) => {
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
      let strablLineItems = lines
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

      // HONESTY NOTE: STRABL's checkoutWithRedirect has no dedicated
      // "discount" field in the schema we've verified against, so a
      // discount is applied here by reducing each line item's unit price
      // proportionally to its share of the subtotal — the last line
      // absorbs any rounding remainder so the total matches exactly. This
      // is computed client-side, same trust model the rest of this cart
      // payload already has (nothing here is server-authoritative — see
      // /api/discounts/validate, which checks eligibility server-side, but
      // the actual price sent to STRABL is still built in the browser).
      // That's not a new risk this feature introduces; it's consistent
      // with how price/quantity have always reached STRABL in this
      // integration. It just means "validated" isn't the same guarantee
      // as "enforced" — worth knowing, not worth blocking on.
      if (appliedDiscount && appliedDiscount.discountAmount > 0) {
        const rawSubtotal = strablLineItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
        if (rawSubtotal > 0) {
          // Price floor: the checkout payload later drops any line with
          // price <= 0 (see the .filter() above), so a rounding-driven zero
          // here doesn't just show a $0 line — it silently removes the item
          // from the order the customer thinks they're paying for. Keep
          // every line at least MIN_LINE_PRICE and cap the total discount
          // actually applied so it never eats a line down to nothing.
          const MIN_LINE_PRICE = 0.5
          const maxDiscountable = strablLineItems.reduce(
            (sum, li) => sum + Math.max(0, li.price - MIN_LINE_PRICE) * li.quantity,
            0
          )
          let remaining = Math.min(appliedDiscount.discountAmount, rawSubtotal, maxDiscountable)
          strablLineItems = strablLineItems.map((li, idx) => {
            const lineTotal = li.price * li.quantity
            const lineFloor = MIN_LINE_PRICE * li.quantity
            const lineCapacity = Math.max(0, lineTotal - lineFloor)
            const isLast = idx === strablLineItems.length - 1
            const share = isLast
              ? Math.min(remaining, lineCapacity)
              : Math.min(remaining, lineCapacity, Math.round((lineTotal / rawSubtotal) * appliedDiscount.discountAmount * 100) / 100)
            remaining = Math.max(0, remaining - share)
            const newLineTotal = Math.max(lineFloor, lineTotal - share)
            return { ...li, price: Math.round((newLineTotal / li.quantity) * 100) / 100 }
          })
        }
      }

      const cart = {
        currency,
        country: detectedCountry || 'AE',
        lineItems: strablLineItems,
        // Round-trips into the webhook as orderUpdate.meta (matches the
        // shape observed in real STRABL webhook payloads — see
        // webhook route.ts). Used to attribute/increment redemption counts
        // after a real order is created, not just at validate time.
        extra: appliedDiscount ? { discountCode: appliedDiscount.code } : {},
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