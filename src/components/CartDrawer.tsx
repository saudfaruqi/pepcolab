// src/components/CartDrawer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  X, Minus, Plus, ArrowRight, ShoppingBag, Trash2,
} from 'lucide-react'
import { useCart } from '@/lib/cartContext'
import { useCountry } from '@/lib/countryContext'
import { formatPrice } from '@/lib/utils'

const FREE_SHIPPING_THRESHOLD = 75

export default function CartDrawer() {
  const {
    open, lines, subtotal, totalQuantity, currencyCode,
    loading, error, closeCart, removeItem, updateQty, clearError,
  } = useCart()
  const { country: detectedCountry, currency: detectedCurrency } = useCountry()

  const drawerRef = useRef<HTMLDivElement>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [closeCart])

  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0)
  // currencyCode comes from the cart itself — Shopify's cartBuyerIdentityUpdate
  // recalculates every line item's price AND currency together when the
  // country changes, so it's the only value that's guaranteed to match what
  // `line.price`/`subtotal` are actually denominated in. detectedCurrency is
  // just the country-picker's local label and can be a step ahead of the
  // cart's real (async) re-pricing — using it first was showing the new
  // currency symbol on the old currency's amount. Only fall back to it
  // before the cart has ever loaded a currencyCode at all.
  const displayCurrency = currencyCode || detectedCurrency || 'AED'

  // ============================================================
  // STRABL CHECKOUT INTEGRATION
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
  // Known limitation, not fixable from this file: checkout.strabl.io's own
  // hosted payment page has a confirmed backend bug (transaction_discount /
  // create return 400 even when STRABL's own backend has already resolved
  // the correct amount/currency). That's tracked separately with STRABL
  // support and isn't something a client-side payload change can work around.
  // ============================================================

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
        console.error('[CartDrawer] STRABL init error:', err)
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

  const handleCheckout = async () => {
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
        .map(l => ({
          title: l.title || 'Product',
          description: l.variantTitle || l.title || 'Product',
          price: Number(l.price) || 0,
          quantity: Number(l.quantity) || 1,
          productId: l.variantId,
          variantId: l.variantId,
          image: l.image || `${baseUrl}/pepcologo.png`,
          url: l.slug ? `${baseUrl}/products/${l.slug}` : `${baseUrl}/products`,
          variantOptions: l.variantTitle ? [l.variantTitle] : [],
        }))

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
      console.error('[CartDrawer] Checkout error:', err)
      setSdkError(err.message || 'Something went wrong. Please try again.')
      setCheckingOut(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[420px] bg-white z-[1001] flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[#0b0b0b] text-white px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">
                Research Order
              </div>
              <h2 className="text-2xl font-bold tracking-tight mt-0.5">Cart</h2>
            </div>

            <div className="flex items-center gap-3">
              {totalQuantity > 0 && (
                <span className="bg-white/10 border border-white/15 text-white/70 text-xs font-bold px-3 py-1 rounded-full">
                  {totalQuantity} item{totalQuantity !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 text-white/60 hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Free shipping progress */}
          {totalQuantity > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>
                  {progress >= 100
                    ? '✓ Free shipping unlocked'
                    : `${formatPrice(remaining, displayCurrency)} away from free shipping`}
                </span>
                <span className="text-white/30">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-400 ${
                    progress >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-white/40'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error banner */}
        {(error || sdkError) && (
          <div className="bg-red-50 border-b border-red-200/50 px-5 py-3 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
              </div>
              <span className="text-sm text-red-700">{sdkError || error}</span>
            </div>
            <button
              onClick={() => {
                clearError()
                setSdkError(null)
              }}
              className="text-red-600 hover:text-red-800 p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
          {lines.length === 0 ? (
            /* Empty state */
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-6 py-10">
              <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-100/50 flex items-center justify-center mb-5">
                <ShoppingBag size={32} className="text-blue-400/60" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed mb-6">
                Add research-grade compounds to begin your order.
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                Browse catalogue
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            /* Line items */
            <div className="flex flex-col gap-3 pb-4">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="bg-white rounded-xl p-4 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3">
                    {/* Product image */}
                    <div className="w-16 h-16 rounded-xl bg-blue-50/50 border border-blue-100/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {line.image ? (
                        <img
                          src={line.image}
                          alt={line.title}
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-blue-100/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-1">
                        Research Compound
                      </div>
                      <div className="font-semibold text-gray-900 text-sm leading-tight truncate">
                        {line.title}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {line.variantTitle}
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Qty stepper */}
                        <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-gray-50/80">
                          <button
                            onClick={() => updateQty(line.id, line.quantity - 1)}
                            disabled={loading}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="min-w-[24px] text-center text-sm font-semibold text-gray-900">
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(line.id, line.quantity + 1)}
                            disabled={loading}
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900 text-sm">
                            {formatPrice(line.price * line.quantity, displayCurrency)}
                          </span>
                          <button
                            onClick={() => removeItem(line.id)}
                            aria-label="Remove item"
                            className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-4 pb-6 flex-shrink-0">
            <div className="flex justify-between items-baseline mb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Subtotal
                </div>
                <div className="text-[10px] text-gray-400">
                  Shipping calculated at checkout
                </div>
              </div>
              <strong className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatPrice(subtotal, displayCurrency)}
              </strong>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={checkingOut || loading || !sdkReady}
              className={`w-full h-12 rounded-xl border-0 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all ${
                checkingOut || loading || !sdkReady
                  ? 'bg-gray-300 text-white/60 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20 hover:shadow-gray-900/30'
              }`}
            >
              {checkingOut ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting…
                </>
              ) : !sdkReady ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading payment…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Proceed to Checkout
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Trust badges */}
            <div className="flex justify-center items-center gap-4 flex-wrap mt-3">
              {[
                { icon: '.', label: 'Visa' },
                { icon: '.', label: 'Mastercard' },
                { icon: '.', label: 'American Express' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                  <span className="text-xs">{icon}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-2 text-[10px] text-gray-300 text-center italic leading-relaxed">
              For research use only · Not for human consumption
            </div>
          </div>
        )}
      </aside>
    </>
  )
}