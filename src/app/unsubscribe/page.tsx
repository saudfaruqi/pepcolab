// src/app/unsubscribe/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'

function UnsubscribeForm() {
  const params = useSearchParams()
  const linkEmail = params.get('email') || ''
  const linkToken = params.get('token')

  const [email, setEmail] = useState(linkEmail)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (emailToUse: string, token?: string | null) => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setStatus('error')
        return
      }
      setStatus('done')
    } catch {
      setError('Something went wrong. Please check your connection.')
      setStatus('error')
    }
  }

  // A one-click link (email + valid-looking token both present) unsubscribes
  // immediately on load — that's the whole point of "one click" from an
  // email. A bare visit to /unsubscribe with no token shows the form below
  // instead of auto-submitting anything.
  useEffect(() => {
    if (linkEmail && linkToken) {
      submit(linkEmail, linkToken)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (linkEmail && linkToken && status !== 'error') {
    return (
      <div style={{ textAlign: 'center' }}>
        {status === 'done' ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', color: '#0D0D0D', margin: '0 0 8px' }}>
              You're unsubscribed.
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(13,13,13,.55)', lineHeight: 1.6 }}>
              {linkEmail} won't receive further research updates from us.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'rgba(13,13,13,.5)' }}>Unsubscribing…</p>
        )}
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', color: '#0D0D0D', margin: '0 0 8px' }}>
        Unsubscribe
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(13,13,13,.55)', lineHeight: 1.6, margin: '0 0 24px' }}>
        Enter the email address you subscribed with.
      </p>

      {status === 'done' ? (
        <p style={{ fontSize: 14, color: '#0A7B45', fontWeight: 600 }}>
          ✓ {email} has been unsubscribed.
        </p>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (email.trim()) submit(email.trim().toLowerCase()) }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{ height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid rgba(13,13,13,.15)', fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{ height: 48, borderRadius: 999, border: 'none', background: '#0D0D0D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}
          >
            {status === 'loading' ? 'Unsubscribing…' : 'Unsubscribe'}
          </button>
          {error && <p style={{ fontSize: 13, color: '#B91C1C' }}>{error}</p>}
        </form>
      )}
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F5F1' }}>
      <Nav />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 380, width: '100%', background: '#fff', border: '1px solid rgba(13,13,13,.08)', borderRadius: 20, padding: '36px 32px' }}>
          <Suspense fallback={<p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(13,13,13,.5)' }}>Loading…</p>}>
            <UnsubscribeForm />
          </Suspense>
          <Link href="/" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'rgba(13,13,13,.4)', marginTop: 20, textDecoration: 'none' }}>
            ← Back to Pepco Lab
          </Link>
        </div>
      </main>
    </div>
  )
}