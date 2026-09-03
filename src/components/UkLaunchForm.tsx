// src/components/UkLaunchForm.tsx
'use client'

/**
 * UK launch-list capture for app/uk/page.tsx.
 *
 * Posts to the existing POST /api/notify endpoint rather than introducing a
 * new route or store. Entries are keyed 'uk-launch:general' so UK launch
 * interest is separable from real back-in-stock requests in notifyStore and
 * in the admin dashboard — MarketGuard.tsx uses the same 'uk-launch:' prefix
 * with the specific product slug appended, so between the two you get both a
 * headline UK list and a per-compound demand breakdown.
 *
 * /api/notify already rate-limits by IP (10/hour) and validates the address,
 * so there is nothing extra to guard here.
 */

import { useState, type FormEvent } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function UkLaunchForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'loading' || status === 'done') return
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productSlug: 'uk-launch:general',
          productName: 'UK launch list',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMessage(data?.error || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 14,
          fontWeight: 600,
          color: '#3B6D11',
          background: '#EAF3DE',
          border: '0.5px solid #D3E8BE',
          borderRadius: 14,
          padding: '16px 20px',
        }}
      >
        <CheckCircle size={17} />
        You are on the UK list. We will email you at launch.
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Email address for the UK launch list"
          style={{
            flex: 1,
            minWidth: 200,
            height: 52,
            padding: '0 16px',
            border: '1px solid rgba(0,0,0,.15)',
            borderRadius: 14,
            background: '#fff',
            fontSize: 15,
            color: '#101010',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            height: 52,
            padding: '0 26px',
            borderRadius: 14,
            border: 'none',
            background: '#101010',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {status === 'loading' && <Loader2 size={15} className="animate-spin" />}
          Notify me at launch
        </button>
      </form>

      {status === 'error' && (
        <p style={{ fontSize: 13, color: '#B3261E', margin: '10px 0 0' }}>{message}</p>
      )}
    </>
  )
}