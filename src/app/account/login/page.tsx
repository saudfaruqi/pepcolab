'use client'
// src/app/account/login/page.tsx
//
// Passwordless sign-in. Email in, link out, no password anywhere.
//
// The response is deliberately identical whether or not the address has ever
// ordered — see api/account/request-link. This page must not undo that by
// saying anything more specific than "if that address has ordered from us".

import { Suspense, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

function LoginForm() {
  const params = useSearchParams()
  const expired = params.get('expired') === '1'

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/account/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data?.message || 'Something went wrong. Please try again.')
        setStatus('error')
        return
      }
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
        <h2 style={{ fontSize: 19, fontWeight: 700, color: INK, margin: '0 0 8px' }}>Check your email</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: 0 }}>
          Your sign-in link is on its way. It works once and expires in 15 minutes.
        </p>
        <p style={{ fontSize: 12.5, color: 'rgba(13,13,13,.45)', marginTop: 18 }}>
          Nothing arrived? Check spam, or email{' '}
          <a href="mailto:hello@pepcolab.com" style={{ color: INK }}>hello@pepcolab.com</a>.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 'clamp(24px,4vw,32px)' }}>
      {expired && (
        <div role="status" style={{
          background: 'rgba(200,153,42,.12)', color: '#8A6A1E', borderRadius: 12,
          padding: '11px 14px', fontSize: 13, fontWeight: 600, marginBottom: 18,
        }}>
          That link has expired. Enter your email for a fresh one.
        </div>
      )}

      <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 20px' }}>
        Enter your email and we&apos;ll send a sign-in link — no password to
        remember, and no separate sign-up step. If you&apos;ve ordered before, use
        the address you ordered with and your history will be there.
      </p>

      <form onSubmit={submit}>
        <label htmlFor="acct-email" style={{ fontSize: 12.5, fontWeight: 600, color: INK, display: 'block', marginBottom: 7 }}>
          Email address
        </label>
        <input
          id="acct-email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@lab.com"
          autoComplete="email"
          style={{
            width: '100%', minHeight: 48, padding: '0 14px', fontSize: 15,
            border: `1px solid rgba(13,13,13,.15)`, borderRadius: 12,
            background: PAPER, color: INK, marginBottom: 14,
          }}
        />
        <button
          type="submit"
          disabled={status === 'sending' || !email.trim()}
          style={{
            width: '100%', minHeight: 48, borderRadius: 999, border: 'none',
            background: email.trim() ? INK : 'rgba(13,13,13,.15)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: email.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          }}
        >
          {status === 'sending'
            ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            : <Mail size={16} aria-hidden="true" />}
          Send sign-in link
        </button>
      </form>

      {status === 'error' && (
        <p role="alert" style={{ fontSize: 13, color: '#B91C1C', margin: '12px 0 0' }}>{message}</p>
      )}

      <p style={{ fontSize: 12.5, color: 'rgba(13,13,13,.45)', margin: '20px 0 0', lineHeight: 1.65 }}>
        Just tracking a single order?{' '}
        <Link href="/track-order" style={{ color: INK, fontWeight: 600 }}>Track it without signing in</Link>.
      </p>
    </div>
  )
}

export default function AccountLoginPage() {
  return (
    <>
      <Nav />
      <main style={{ background: PAPER, minHeight: '70vh', padding: 'clamp(32px,5vw,64px) 20px' }}>
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(26px,4vw,34px)', fontWeight: 700, letterSpacing: '-.03em', color: INK, margin: '0 0 8px' }}>
            Sign in or create an account
          </h1>
          <p style={{ fontSize: 14.5, color: 'rgba(13,13,13,.55)', margin: '0 0 24px' }}>
            Order history, batch certificates and one-tap reorder. Same link does both —
            there is no separate registration.
          </p>
          {/* useSearchParams needs a Suspense boundary for static rendering. */}
          <Suspense fallback={<div style={{ height: 240 }} />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}