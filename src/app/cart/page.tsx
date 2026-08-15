// src/app/cart/page.tsx
'use client'

import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useCart } from '@/lib/cartContext'
import { useCountry } from '@/lib/countryContext'
import { useStrablCheckout } from '@/lib/useStrablCheckout'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react'

export default function CartPage() {
  const {
    lines, subtotal, totalQuantity, currencyCode,
    loading, error, removeItem, updateQty, clearError,
  } = useCart()
  const { country: detectedCountry, currency: detectedCurrency } = useCountry()
  const { sdkReady, sdkError, checkingOut, handleCheckout, clearSdkError } = useStrablCheckout()

  // Same reasoning as CartDrawer: currencyCode is the source of truth once
  // the cart has loaded, since Shopify recalculates price AND currency
  // together on cartBuyerIdentityUpdate. detectedCurrency is only a
  // pre-cart-load fallback.
  const displayCurrency = currencyCode || detectedCurrency || 'AED'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Cart</h1>
        </div>

        {(error || sdkError) && (
          <div className="bg-red-50 border border-red-200/50 rounded-xl px-5 py-3 mb-6 flex items-center justify-between gap-3">
            <span className="text-sm text-red-700">{sdkError || error}</span>
            <button
              onClick={() => { clearError(); clearSdkError() }}
              className="text-red-600 hover:text-red-800 p-1 flex-shrink-0"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {lines.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-100 py-20 px-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-100/50 flex items-center justify-center mb-5">
              <ShoppingBag size={32} className="text-blue-400/60" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed mb-6">
              Add research-grade compounds to begin your order.
            </p>
            <Link
              href="/products"
              className="bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              Browse catalogue
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Line items */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="bg-white rounded-xl p-4 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow flex gap-4"
                >
                  {/* Product image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-blue-50/50 border border-blue-100/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {line.image ? (
                      <img
                        src={line.image}
                        alt={line.title}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded bg-blue-100/30" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-1">
                        Research Compound
                      </div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                        {line.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {line.variantTitle}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-shrink-0">
                      {/* Qty stepper */}
                      <div className="flex items-center border border-gray-200 rounded-full overflow-hidden bg-gray-50/80">
                        <button
                          onClick={() => updateQty(line.id, line.quantity - 1)}
                          disabled={loading}
                          aria-label="Decrease quantity"
                          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="min-w-[28px] text-center text-sm font-semibold text-gray-900">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(line.id, line.quantity + 1)}
                          disabled={loading}
                          aria-label="Increase quantity"
                          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>

                      <span className="font-semibold text-gray-900 text-sm sm:text-base w-24 text-right">
                        {formatPrice(line.price * line.quantity, displayCurrency)}
                      </span>

                      <button
                        onClick={() => removeItem(line.id)}
                        aria-label="Remove item"
                        className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mt-2"
              >
                ← Continue shopping
              </Link>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Order Summary
              </h2>

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Items ({totalQuantity})</span>
                <span>{formatPrice(subtotal, displayCurrency)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-4">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-gray-900">Subtotal</span>
                <strong className="text-2xl font-bold text-gray-900 tracking-tight">
                  {formatPrice(subtotal, displayCurrency)}
                </strong>
              </div>
              <button
                onClick={() => handleCheckout(lines, displayCurrency, detectedCountry)}
                disabled={checkingOut || loading || !sdkReady}
                className={`w-full h-12 rounded-xl border-0 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all mt-4 ${
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

              <div className="flex justify-center items-center gap-4 flex-wrap mt-4">
                {['STRABL', 'Visa', 'Mastercard', 'American Express'].map((label) => (
                  <span key={label} className="text-[10px] font-medium text-gray-400">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}