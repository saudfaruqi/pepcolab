// src/app/cart/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useCart } from '@/lib/cartContext'
import { useCountry } from '@/lib/countryContext'
import { useStrablCheckout } from '@/lib/useStrablCheckout'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, ArrowRight, ShoppingBag, Trash2, X, Tag, MessageCircle } from 'lucide-react'
import { isWhatsAppConfigured, whatsAppCartLink } from '@/lib/whatsapp'
import { chargeNotice, displayedTotalToAed } from '@/lib/pricing'

interface AppliedDiscount {
  code: string
  type: 'percent' | 'fixed'
  value: number
  discountAmount: number
}

export default function CartPage() {
  // useSearchParams (used below for the ?restore= abandoned-cart link)
  // requires a Suspense boundary in the App Router, or Next.js errors at
  // build time trying to statically render this page.
  return (
    <Suspense fallback={null}>
      <CartPageInner />
    </Suspense>
  )
}

function CartPageInner() {
  const {
    lines, subtotal, totalQuantity, currencyCode,
    loading, error, removeItem, updateQty, clearError, restoreItems,
  } = useCart()
  const { country: detectedCountry, currency: detectedCurrency } = useCountry()
  const { sdkReady, sdkError, checkingOut, handleCheckout, clearSdkError } = useStrablCheckout()
  const searchParams = useSearchParams()
  const router = useRouter()

  // ── Abandoned-cart restore ────────────────────────────────────────────────
  // The recovery email's "Complete Your Order" button links here with
  // ?restore=<orderShortCode>. On load, fetch that checkout's saved line
  // items and add them back to whatever cart already exists client-side —
  // covers the common case where localStorage already lost the cart
  // (different device, cleared browser, or the 24hr-later email) instead
  // of relying on local state still being there.
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'done' | 'partial' | 'empty' | 'error'>('idle')

  useEffect(() => {
    const code = searchParams.get('restore')
    if (!code) return

    setRestoreStatus('loading')
    fetch(`/api/cart/restore/${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then(async (data: { items: { variantId: string; quantity: number }[]; skipped?: number }) => {
        if (!data.items || data.items.length === 0) {
          setRestoreStatus('empty')
          return
        }
        const restoredCount = await restoreItems(data.items)
        setRestoreStatus(restoredCount < data.items.length + (data.skipped || 0) ? 'partial' : 'done')
      })
      .catch((err) => {
        console.error('[Cart] restore fetch failed:', err)
        setRestoreStatus('error')
      })
      .finally(() => {
        // Strip ?restore= so a refresh doesn't re-add the same items again.
        router.replace('/cart')
      })
    // Intentionally runs once on mount only — restoreItems/router are stable
    // enough for this one-shot case, and re-running on every dep change
    // would risk re-adding items after the query param is already stripped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Same reasoning as CartDrawer: currencyCode is the source of truth once
  // the cart has loaded, since Shopify recalculates price AND currency
  // together on cartBuyerIdentityUpdate. detectedCurrency is only a
  // pre-cart-load fallback.
  const displayCurrency = currencyCode || detectedCurrency || 'AED'

  // KNOWN SIMPLIFICATION: subtotal here is already converted into
  // displayCurrency (AED or GBP depending on market — see cartContext).
  // Percent discounts are currency-agnostic so this is fine, but a
  // "fixed" discount code's value is applied as-is in whatever currency
  // is currently showing, not converted — a 10-unit fixed code is 10 AED
  // off on the UAE market and 10 GBP off on the UK market. Fine for
  // percent-only codes; worth knowing before creating fixed-value codes
  // for a multi-currency launch.
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplying, setDiscountApplying] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [referralPrefill, setReferralPrefill] = useState<string | null>(null)

  // Referrals: ReferralWidget stashes an incoming ?ref= code in localStorage
  // (see components/ReferralWidget.tsx) when a visitor lands via a friend's
  // link. If they haven't already typed a code by the time they reach the
  // cart, pre-fill it here so the discount isn't left on the table — the
  // referral code IS a regular discount code under the hood (see
  // lib/referralStore.ts), so this needs no changes to applyDiscount().
  useEffect(() => {
    if (discountCode || appliedDiscount) return
    try {
      const stored = localStorage.getItem('pepcolab_referral')
      if (stored) {
        setDiscountCode(stored)
        setReferralPrefill(stored)
      }
    } catch {
      // localStorage can throw in private/incognito contexts — non-critical
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyDiscount = async () => {
    const code = discountCode.trim()
    if (!code) return
    setDiscountApplying(true)
    setDiscountError(null)
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setDiscountError(data.error || 'That code isn\u2019t valid.')
        setAppliedDiscount(null)
        return
      }
      setAppliedDiscount({
        code: data.code,
        type: data.type,
        value: data.value,
        discountAmount: data.discountAmount,
      })
    } catch {
      setDiscountError('Something went wrong. Please try again.')
    } finally {
      setDiscountApplying(false)
    }
  }

  const removeDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCode('')
    setDiscountError(null)
  }

  const total = appliedDiscount ? Math.max(0, subtotal - appliedDiscount.discountAmount) : subtotal

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">
            Research Order
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Cart</h1>
        </div>

        {restoreStatus === 'loading' && (
          <div className="bg-blue-50 border border-blue-200/60 rounded-xl px-5 py-3 mb-6 text-sm text-blue-700">
            Restoring your saved cart…
          </div>
        )}
        {restoreStatus === 'done' && (
          <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl px-5 py-3 mb-6 text-sm text-emerald-700">
            Welcome back — we've restored your saved cart.
          </div>
        )}
        {restoreStatus === 'partial' && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-3 mb-6 text-sm text-amber-700">
            We've restored what we could — one or more items from your saved cart are no longer available and need to be re-added manually.
          </div>
        )}
        {restoreStatus === 'empty' && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-3 mb-6 text-sm text-amber-700">
            That saved cart link has expired. Feel free to re-add your items below.
          </div>
        )}
        {restoreStatus === 'error' && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-3 mb-6 text-sm text-amber-700">
            We couldn't restore your saved cart automatically — please re-add your items below, or message us on WhatsApp and we'll sort it out.
          </div>
        )}

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
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>

              {/* Discount code */}
              {appliedDiscount ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200/60 rounded-lg px-3 py-2.5 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag size={13} className="text-green-700 flex-shrink-0" />
                    <span className="text-xs font-semibold text-green-800 truncate">{appliedDiscount.code}</span>
                    <span className="text-xs text-green-700 flex-shrink-0">
                      −{formatPrice(appliedDiscount.discountAmount, displayCurrency)}
                    </span>
                  </div>
                  <button
                    onClick={removeDiscount}
                    aria-label="Remove discount code"
                    className="text-green-700/60 hover:text-green-800 p-1 flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(null) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyDiscount() } }}
                      placeholder="Discount code"
                      className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                    />
                    <button
                      onClick={applyDiscount}
                      disabled={discountApplying || !discountCode.trim()}
                      className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      {discountApplying ? '…' : 'Apply'}
                    </button>
                  </div>
                  {discountError && (
                    <p className="text-xs text-red-600 mt-1.5">{discountError}</p>
                  )}
                  {referralPrefill && discountCode === referralPrefill && !discountError && (
                    <p className="text-xs text-gray-500 mt-1.5">Referral code applied from your link — hit Apply to use it.</p>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-gray-900">
                  {appliedDiscount ? 'Total' : 'Subtotal'}
                </span>
                <strong className="text-2xl font-bold text-gray-900 tracking-tight">
                  {formatPrice(total, displayCurrency)}
                </strong>
              </div>

              {chargeNotice(displayedTotalToAed(total, detectedCountry), detectedCountry) && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 mb-1 mt-3 leading-relaxed">
                  {chargeNotice(displayedTotalToAed(total, detectedCountry), detectedCountry)}
                </p>
              )}

              <button
                onClick={() => handleCheckout(lines, displayCurrency, detectedCountry, appliedDiscount)}
                disabled={checkingOut || loading || !sdkReady}
                className={`w-full h-12 rounded-xl border-0 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all mt-1 ${
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

              {isWhatsAppConfigured() && (
                <a
                  href={whatsAppCartLink(lines, displayCurrency)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 mt-2.5 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ borderColor: '#C7ECD3', color: '#128C4A', background: '#F0FDF4', textDecoration: 'none' }}
                >
                  <MessageCircle size={15} />
                  Order via WhatsApp instead
                </a>
              )}

              <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-3">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                You'll be securely redirected to STRABL to complete payment
              </p>

              <div className="flex justify-center items-center gap-3 flex-wrap mt-4">
                {[
                  { label: 'Visa', style: 'font-serif italic font-bold text-[13px] tracking-tight' },
                  { label: 'Mastercard', style: 'font-bold text-[11px]' },
                  { label: 'Amex', style: 'font-bold text-[11px]' },
                  { label: 'Apple Pay', style: 'font-semibold text-[11px]' },
                ].map((m) => (
                  <span
                    key={m.label}
                    className={`${m.style} text-gray-400 border border-gray-200 rounded-md px-2.5 py-1 bg-white`}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
              <p className="text-center text-[10px] text-gray-300 mt-2">Powered by STRABL · PCI-DSS compliant</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}