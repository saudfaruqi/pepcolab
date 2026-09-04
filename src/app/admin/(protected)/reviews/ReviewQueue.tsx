'use client'
// src/app/admin/(protected)/reviews/ReviewQueue.tsx
//
// The moderation queue. Approve or reject without leaving the page.
//
// Actioned rows stay visible with their outcome rather than vanishing —
// moderating a list that reflows under you is how the wrong review gets
// rejected. They clear on the next page load.

import { useState } from 'react'
import { Check, X, Loader2, BadgeCheck, Star } from 'lucide-react'

export interface PendingReview {
  id: string
  productTitle: string
  productSlug: string | null
  authorName: string
  rating: number
  text: string
  verified: boolean
  orderShortCode: string | null
  createdAt: string
}

export default function ReviewQueue({ reviews }: { reviews: PendingReview[] }) {
  const [state, setState] = useState<Record<string, 'idle' | 'working' | 'approved' | 'rejected' | 'error'>>({})

  async function act(id: string, action: 'approve' | 'reject') {
    setState(s => ({ ...s, [id]: 'working' }))
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      setState(s => ({ ...s, [id]: res.ok ? (action === 'approve' ? 'approved' : 'rejected') : 'error' }))
      if (!res.ok) console.error('[admin/reviews]', data)
    } catch (err) {
      console.error('[admin/reviews]', err)
      setState(s => ({ ...s, [id]: 'error' }))
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-[#0D0D0D]/10 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#0D0D0D]">Nothing waiting</p>
        <p className="mt-1 text-sm text-[#0D0D0D]/50">
          New reviews land here as soon as they&apos;re submitted.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {reviews.map(r => {
        const s = state[r.id] || 'idle'
        const done = s === 'approved' || s === 'rejected'
        return (
          <article
            key={r.id}
            className={`rounded-xl border bg-white p-5 ${done ? 'border-[#0D0D0D]/5 opacity-60' : 'border-[#0D0D0D]/10'}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={13} aria-hidden="true"
                        fill={i <= r.rating ? '#C8992A' : 'none'}
                        color={i <= r.rating ? '#C8992A' : 'rgba(13,13,13,.2)'} />
                ))}
              </span>
              {r.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-800">
                  <BadgeCheck size={12} /> Verified{r.orderShortCode ? ` · ${r.orderShortCode}` : ''}
                </span>
              ) : (
                <span className="rounded-full border border-[#0D0D0D]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0D0D0D]/45">
                  Unverified
                </span>
              )}
              <span className="ml-auto text-xs text-[#0D0D0D]/40">
                {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="mb-1 text-sm font-bold text-[#0D0D0D]">{r.productTitle}</div>
            <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-[#0D0D0D]/75">{r.text}</p>
            <div className="mb-4 text-xs text-[#0D0D0D]/50">— {r.authorName}</div>

            {done ? (
              <div className={`text-sm font-semibold ${s === 'approved' ? 'text-green-700' : 'text-[#0D0D0D]/45'}`}>
                {s === 'approved' ? 'Approved — now live' : 'Rejected'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => act(r.id, 'approve')}
                  disabled={s === 'working'}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#0A7B45] px-4 text-[13px] font-bold text-white disabled:opacity-50"
                >
                  {s === 'working' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Approve
                </button>
                <button
                  onClick={() => act(r.id, 'reject')}
                  disabled={s === 'working'}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-red-50 px-4 text-[13px] font-bold text-red-800 disabled:opacity-50"
                >
                  <X size={14} /> Reject
                </button>
                {s === 'error' && (
                  <span className="self-center text-[13px] text-red-700">Failed — try again.</span>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}