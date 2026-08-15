// src/components/CartDrawer.tsx
'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  X, Minus, Plus, ArrowRight, ShoppingBag, Trash2,
} from 'lucide-react'
import { useCart } from '@/lib/cartContext'
import { useCountry } from '@/lib/countryContext'
import { useStrablCheckout } from '@/lib/useStrablCheckout'
import { formatPrice } from '@/lib/utils'

const FREE_SHIPPING_THRESHOLD = 0

export default function CartDrawer() {
  const {
    open, lines, subtotal, totalQuantity, currencyCode,
    loading, error, closeCart, removeItem, updateQty, clearError,
  } = useCart()
  const { country: detectedCountry, currency: detectedCurrency } = useCountry()
  const { sdkReady, sdkError, checkingOut, handleCheckout: strablCheckout, clearSdkError } = useStrablCheckout()

  const drawerRef = useRef<HTMLDivElement>(null)

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

  // STRABL checkout SDK init + checkoutWithRedirect() now live in
  // useStrablCheckout() (src/lib/useStrablCheckout.ts) so this drawer and
  // the standalone /cart page share one implementation. See that file for
  // the full history/verification notes on the integration.
  const handleCheckout = () => strablCheckout(lines, displayCurrency, detectedCountry)

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
                  {progress >= 0
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
                clearSdkError()
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

            <p className="text-center text-[10px] text-gray-400 leading-relaxed px-2 mb-2">
              For in-vitro research use only. Not intended for human or veterinary use.
            </p>

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

            <Link
              href="/cart"
              onClick={closeCart}
              className="block text-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors mt-3"
            >
              View full cart
            </Link>

            {/* Trust badges */}
            <div className="flex justify-center items-center gap-4 flex-wrap mt-3">
              {[
                { icon: '.', label: 'STRABL' },
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
          </div>
        )}
      </aside>
    </>
  )
}