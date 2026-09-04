'use client'
// src/app/reviews/write/page.tsx
//
// Open review submission — no order required.
//
// WHY OPEN, AND HOW IT STAYS HONEST
// Until now the only way to leave a review was through /track-order, which
// demands an order code and a matching email. That excluded everyone who has
// dealt with PepcoLab without buying: people who asked questions and got
// straight answers, people who compared documentation and chose elsewhere,
// people whose lab ordered under someone else's name.
//
// The API has always supported unverified reviews (reviewStore.Review carries
// `verified: boolean` and a nullable orderShortCode) — only the UI was
// gating it. This page opens it, and keeps three rules that matter:
//
//   1. VERIFIED IS EARNED, NEVER ASSUMED. Supplying an order code that
//      matches gets a "Verified purchase" badge. Not supplying one, or
//      supplying one that doesn't match, is accepted and published as
//      unverified. A review is never silently upgraded — presenting an
//      unverified review as order-backed is a DMCC Act 2024 misrepresentation,
//      and it is the specific thing this codebase was cleaned up to stop.
//   2. ANONYMOUS IS A DISPLAY CHOICE, NOT AN AUDIT HOLE. "Anonymous" controls
//      the published name only. Everything still goes through the same
//      moderation queue before it appears.
//   3. EVERYTHING IS MODERATED. Open submission plus automatic publishing is
//      how a review section fills with spam and competitor sabotage.
//
// One thing for whoever moderates: reject reviews describing effects or
// outcomes, however positive. A product page full of user-reported results
// would undo the research-use-only position the whole catalogue holds.

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useCustomer } from '@/lib/customerContext'
import { Loader2, CheckCircle, Star } from 'lucide-react'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

const inputStyle: React.CSSProperties = {
  width: '100%', minHeight: 48, padding: '0 14px', fontSize: 16,
  border: `1px solid rgba(13,13,13,.15)`, borderRadius: 12,
  background: '#fff', color: INK, outline: 'none',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: INK, margin: '18px 0 7px',
}
const hint: React.CSSProperties = {
  fontSize: 12, lineHeight: 1.6, color: 'rgba(13,13,13,.45)', margin: '6px 0 0',
}

function WriteReviewForm() {
  const params = useSearchParams()
  const { email: customerEmail, name: customerName, signedIn } = useCustomer()

  const [productTitle, setProductTitle] = useState(params.get('product') || '')
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [orderCode, setOrderCode] = useState(params.get('code') || '')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // Prefill for a signed-in customer — they should not be retyping an address
  // and a name we already hold just to verify a review.
  useEffect(() => {
    if (customerEmail && !email) setEmail(customerEmail)
    if (customerName && !name) setName(customerName)
  }, [customerEmail, customerName, email, name])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    if (!rating) { setMessage('Please choose a rating.'); setStatus('error'); return }
    setStatus('sending'); setMessage('')
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: productTitle.trim() || 'PepcoLab',
          rating,
          text: text.trim(),
          // 'Anonymous' is the published display name. The API still records
          // the submission normally and it still goes through moderation.
          name: anonymous ? 'Anonymous' : name.trim(),
          orderCode: orderCode.trim(),
          email: email.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage(data?.error || 'Something went wrong.'); setStatus('error'); return }
      setStatus('sent')
    } catch {
      setMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, textAlign: 'center' }}>
        <CheckCircle size={26} style={{ color: '#0A7B45', marginBottom: 12 }} aria-hidden="true" />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, margin: '0 0 8px' }}>Thank you</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 20px' }}>
          Your review has been submitted. Everything is read by a person before it goes live,
          so it may take a day or two to appear.
        </p>
        <Link href="/reviews" style={{
          display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 20px',
          borderRadius: 999, background: INK, color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
        }}>
          Read other reviews
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 'clamp(22px,4vw,30px)' }}>
      <label style={{ ...labelStyle, marginTop: 0 }} id="rating-label">Your rating</label>
      <div role="radiogroup" aria-labelledby="rating-label" style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n} type="button" role="radio" aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
            style={{
              width: 46, height: 46, borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${n <= rating ? INK : 'rgba(13,13,13,.15)'}`,
              background: n <= rating ? INK : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Star size={19} fill={n <= rating ? '#fff' : 'none'} color={n <= rating ? '#fff' : 'rgba(13,13,13,.3)'} aria-hidden="true" />
          </button>
        ))}
      </div>

      <label style={labelStyle} htmlFor="rv-product">What is this about?</label>
      <input id="rv-product" style={inputStyle} value={productTitle}
             onChange={e => setProductTitle(e.target.value)}
             placeholder="A compound name, or leave blank for PepcoLab overall" />

      <label style={labelStyle} htmlFor="rv-text">Your review</label>
      <textarea
        id="rv-text" required minLength={10} maxLength={2000} rows={6}
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Documentation, packaging, delivery, how questions were answered…"
        style={{ ...inputStyle, minHeight: 130, padding: '13px 14px', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }}
      />
      <p style={hint}>
        Please keep it to supply, documentation and service. We can&apos;t publish reviews
        describing effects or outcomes &mdash; everything here is supplied for laboratory
        research only.
      </p>

      <label style={labelStyle} htmlFor="rv-name">Display name</label>
      <input id="rv-name" style={{ ...inputStyle, opacity: anonymous ? .5 : 1 }} value={anonymous ? 'Anonymous' : name}
             onChange={e => setName(e.target.value)} disabled={anonymous}
             placeholder="How you'd like to appear" />
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '11px 0 0', cursor: 'pointer', fontSize: 13.5, color: INK }}>
        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
               style={{ width: 16, height: 16, accentColor: INK }} />
        Post anonymously
      </label>

      <div style={{ marginTop: 26, paddingTop: 22, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 4 }}>
          Bought from us? Optional
        </div>
        <p style={{ ...hint, margin: '0 0 4px' }}>
          Add your order number and the email you ordered with, and your review carries a
          <strong> verified purchase</strong> badge. Skip it and your review is still published
          &mdash; just marked unverified, which is the honest label.
        </p>

        <label style={labelStyle} htmlFor="rv-code">Order number</label>
        <input id="rv-code" style={inputStyle} value={orderCode}
               onChange={e => setOrderCode(e.target.value)} placeholder="e.g. PL7K2M" />

        <label style={labelStyle} htmlFor="rv-email">Order email</label>
        <input id="rv-email" type="email" style={inputStyle} value={email}
               onChange={e => setEmail(e.target.value)} placeholder="you@lab.com" />
        {signedIn && <p style={hint}>Filled in from your account.</p>}
      </div>

      <button type="submit" disabled={status === 'sending'} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        width: '100%', minHeight: 50, marginTop: 26, borderRadius: 999, border: 'none',
        background: INK, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}>
        {status === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        Submit review
      </button>

      {status === 'error' && (
        <p role="alert" style={{ fontSize: 13, color: '#B91C1C', margin: '12px 0 0' }}>{message}</p>
      )}

      <p style={{ ...hint, marginTop: 16 }}>
        Every review is read by a person before publication. We don&apos;t offer discounts or
        anything else in exchange for one, and we don&apos;t edit what you write.
      </p>
    </form>
  )
}

export default function WriteReviewPage() {
  return (
    <>
      <Nav />
      <main style={{ background: PAPER, minHeight: '70vh', padding: 'clamp(32px,5vw,56px) 20px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 700, letterSpacing: '-.03em', color: INK, margin: '0 0 8px' }}>
            Write a review
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 26px' }}>
            You don&apos;t need to have ordered. If you&apos;ve dealt with us at all &mdash; asked a
            question, compared our documentation, received a shipment &mdash; we&apos;d rather hear it.
          </p>
          <Suspense fallback={<div style={{ height: 400 }} />}>
            <WriteReviewForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}