// src/lib/useCodCheckout.ts
'use client'

// CASH ON DELIVERY (Nov 2026).
//
// Mirrors lib/useStrablCheckout.ts for the online-payment path, but hands the
// customer to Shopify's own checkout instead of STRABL. That is the only
// checkout where Shopify's "Cash on Delivery (COD)" manual payment method
// exists, and it is also what collects the delivery address.
//
// The browser sends the checkout reference + attestation to
// /api/checkout/cod, which stamps them onto the Shopify cart and returns the
// cart's checkoutUrl. See that route for why the attributes are needed.
import { useState } from 'react'
import type { CartLine } from '@/lib/cartContext'
import { useCart } from '@/lib/cartContext'
import { trackBeginCheckout, lineToItem } from '@/lib/analytics'
import type { ConsentChoice } from '@/components/ConsentBoxes'
import { canDeliverHere, deliveryRefusal } from '@/lib/delivery'

export function useCodCheckout() {
  const { cartId } = useCart()
  const [checkingOutCod, setCheckingOutCod] = useState(false)
  const [codError, setCodError] = useState<string | null>(null)

  const handleCodCheckout = async (
    lines: CartLine[],
    _displayCurrency: string,
    _detectedCountry: string | null | undefined,
    appliedDiscount: { code: string } | null | undefined,
    researchAttestedAt?: string | null,
    consents?: ConsentChoice | null
  ) => {
    // UAE ONLY (Nov 2026): refused outside the delivery countries; the
    // server checks again (app/api/checkout/cod).
    if (!canDeliverHere()) {
      setCodError(deliveryRefusal())
      return
    }
    if (!cartId) {
      setCodError('Your cart is not ready yet. Please refresh and try again.')
      return
    }
    if (!lines.length) {
      setCodError('Your cart is empty.')
      return
    }

    setCheckingOutCod(true)
    setCodError(null)

    try {
      const ref = trackBeginCheckout(
        lines.map((l) => lineToItem(l)),
        appliedDiscount?.code
      )

      const res = await fetch('/api/checkout/cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId,
          ref,
          ...(researchAttestedAt ? { attestedAt: researchAttestedAt } : {}),
          consents: { email: Boolean(consents?.email), whatsapp: Boolean(consents?.whatsapp) },
          pageUrl: window.location.href.split('#')[0],
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.checkoutUrl) {
        setCodError(data?.error || 'Could not start cash on delivery checkout. Please try again.')
        setCheckingOutCod(false)
        return
      }

      window.location.href = data.checkoutUrl
    } catch (err) {
      console.error('[useCodCheckout] checkout error:', err)
      setCodError('Something went wrong. Please try again.')
      setCheckingOutCod(false)
    }
  }

  return {
    checkingOutCod,
    codError,
    handleCodCheckout,
    clearCodError: () => setCodError(null),
  }
}
