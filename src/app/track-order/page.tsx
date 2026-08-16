// src/app/track-order/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { formatPrice } from '@/lib/utils'
import { Search, Package, XCircle, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react'

interface OrderProduct {
  title: string
  price: number
  quantity: number
  variantOptions?: string[]
}

interface OrderResult {
  orderShortCode: string
  status: 'created' | 'updated' | 'failed' | 'abandoned' | 'refunded' | 'chargeback'
  failureReason: string | null
  customerName: string | null
  products: OrderProduct[]
  currency: string
  total: number
  createdAt: string
}

const STATUS_DISPLAY: Record<OrderResult['status'], { label: string; color: string; bg: string; icon: typeof Package }> = {
  created: { label: 'Confirmed', color: 'text-green-700', bg: 'bg-green-50 border-green-200/60', icon: Package },
  updated: { label: 'Confirmed', color: 'text-green-700', bg: 'bg-green-50 border-green-200/60', icon: Package },
  failed: { label: 'Payment Failed', color: 'text-red-700', bg: 'bg-red-50 border-red-200/60', icon: XCircle },
  abandoned: { label: 'Not Completed', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200/60', icon: XCircle },
  refunded: { label: 'Refunded', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200/60', icon: RotateCcw },
  chargeback: { label: 'Chargeback', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/60', icon: AlertTriangle },
}

// Human-readable versions of STRABL's failureReason enum values. Falls back
// to a generic message for any reason we haven't seen/mapped yet, rather
// than showing a raw enum string to a customer.
const FAILURE_REASON_COPY: Record<string, string> = {
  AUTHENTICATION_UNAVAILABLE: "Your bank couldn't complete the 3D Secure verification for this card.",
  INSUFFICIENT_FUNDS: 'The payment was declined due to insufficient funds.',
  CARD_DECLINED: 'Your card issuer declined this transaction.',
  EXPIRED_CARD: 'The card used had expired.',
}

export default function TrackOrderPage() {
  const [orderCode, setOrderCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OrderResult | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!orderCode.trim() || !email.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode: orderCode.trim(), email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setResult(data.order)
    } catch {
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = result ? STATUS_DISPLAY[result.status] : null
  const StatusIcon = statusInfo?.icon

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-14">
        <div className="mb-8 text-center">
          <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">
            Order Status
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Track Your Order</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your order number and the email used at checkout.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
        >
          <div>
            <label htmlFor="orderCode" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Order Number
            </label>
            <input
              id="orderCode"
              type="text"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="SOR-A5EVGI"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
              autoCapitalize="characters"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-1 ${
              loading
                ? 'bg-gray-300 text-white/60 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search size={14} />
                Track Order
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>

        {result && statusInfo && StatusIcon && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-5">
            <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 mb-5 ${statusInfo.bg}`}>
              <StatusIcon size={18} className={statusInfo.color} />
              <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
              <span className="text-xs text-gray-400 ml-auto">{result.orderShortCode}</span>
            </div>

            {result.status === 'failed' && (
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {(result.failureReason && FAILURE_REASON_COPY[result.failureReason]) ||
                  "This payment couldn't be completed. No charge was made — feel free to try again with a different card."}
              </p>
            )}
            {result.status === 'abandoned' && (
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Looks like checkout wasn't completed for this order. No charge was made — you're welcome to pick up where you left off.
              </p>
            )}

            <div className="flex flex-col gap-3 mb-5">
              {result.products.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{p.title}</div>
                    {p.variantOptions && p.variantOptions.length > 0 && p.variantOptions[0] !== 'Default Title' && (
                      <div className="text-xs text-gray-400">{p.variantOptions.join(', ')}</div>
                    )}
                    <div className="text-xs text-gray-400">Qty {p.quantity}</div>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {formatPrice(p.price * p.quantity, result.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <strong className="text-xl font-bold text-gray-900">
                {formatPrice(result.total, result.currency)}
              </strong>
            </div>

            {(result.status === 'failed' || result.status === 'abandoned') && (
              <Link
                href="/products"
                className="w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors mt-5"
              >
                Try Again
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          Still need help?{' '}
          <a href="mailto:hello@pepcolab.com" className="text-gray-600 font-medium hover:underline">
            hello@pepcolab.com
          </a>
        </p>
      </main>

      <Footer />
    </div>
  )
}