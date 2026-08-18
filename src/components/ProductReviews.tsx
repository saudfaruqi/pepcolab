'use client'
import { useEffect, useState, FormEvent } from 'react'
import { Star, ShieldCheck } from 'lucide-react'

interface ApiReview {
  id: string
  productTitle: string
  authorName: string
  rating: number
  text: string
  verified: boolean
  createdAt: string
}

interface Props {
  productSlug: string
  productTitle: string
}

/**
 * Reviews here are NOT gated behind proof of purchase — anyone can submit
 * one. If they submit with an order number + matching email that checks
 * out, it's shown with a "Verified purchase" badge (see submit/route.ts);
 * otherwise it's shown unbadged. Every submission still goes through manual
 * moderation before it's public. We deliberately never mark an unverified
 * review as verified — that's the fake-review misrepresentation the DMCC
 * Act 2024 targets, not the mere presence of an unverified opinion.
 */
export default function ProductReviews({ productSlug, productTitle }: Props) {
  const [reviews, setReviews] = useState<ApiReview[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [haveOrder, setHaveOrder] = useState(false)

  const [name, setName] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setReviews(data.reviews || [])
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
    return () => {
      cancelled = true
    }
  }, [productSlug])

  const canSubmit =
    rating > 0 &&
    text.trim().length >= 10 &&
    (haveOrder ? orderCode.trim().length > 0 && email.trim().length > 0 : name.trim().length > 0)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle,
          productSlug,
          rating,
          text: text.trim(),
          name: name.trim(),
          orderCode: haveOrder ? orderCode.trim() : '',
          email: haveOrder ? email.trim() : '',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const avg =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <section style={{ borderTop: '1px solid #f0f0f0', background: '#fff', padding: '48px 0 72px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0d0d0d', margin: 0 }}>
              Reviews
            </h2>
            {avg !== null && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} className={n <= Math.round(avg) ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {avg.toFixed(1)} · {reviews!.length} review{reviews!.length === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="h-10 px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Write a review
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 mb-8">
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200/60 flex items-center justify-center mx-auto mb-3">
                  <Star size={20} className="text-green-600" fill="currentColor" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Thanks for the review</h3>
                <p className="text-xs text-gray-500">It'll appear here once we've reviewed it.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Review {productTitle}
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        className="p-1"
                      >
                        <Star size={24} className={n <= rating ? 'text-amber-400' : 'text-gray-200'} fill={n <= rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="reviewText" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Your review
                  </label>
                  <textarea
                    id="reviewText"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="What was your experience like?"
                    maxLength={2000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                  />
                </div>

                {!haveOrder ? (
                  <div>
                    <label htmlFor="reviewName" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Name (shown publicly)
                    </label>
                    <input
                      id="reviewName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ahmed F."
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setHaveOrder(true)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <ShieldCheck size={13} />
                      Bought this? Add your order to get a verified badge
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="orderCode" className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Order number
                        </label>
                        <input
                          id="orderCode"
                          value={orderCode}
                          onChange={(e) => setOrderCode(e.target.value)}
                          placeholder="e.g. PL-1234"
                          className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="orderEmail" className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Order email
                        </label>
                        <input
                          id="orderEmail"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHaveOrder(false)}
                      className="self-start text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Skip — review without an order
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className={`w-full h-11 rounded-xl font-semibold text-sm transition-all ${
                    submitting || !canSubmit
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              </form>
            )}
          </div>
        )}

        {reviews === null ? (
          <p className="text-sm text-gray-400">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-400">No reviews yet for this product.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {reviews.map((r) => (
              <div key={r.id} className="py-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={13} className={n <= r.rating ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{r.authorName}</span>
                    {r.verified && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                        <ShieldCheck size={11} />
                        Verified purchase
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
