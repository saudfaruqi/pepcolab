'use client'
// src/components/SignInModal.tsx
//
// Sign in without leaving the page.
//
// WHY A MODAL AND NOT THE PAGE
// /account/login is a full navigation. A visitor part-way through a product
// page, or with a cart open, loses their place to sign in — so they don't,
// and every benefit of having an account goes unused by exactly the people
// it was built for. Signing in is a side errand, not a destination.
//
// The page still exists and still works: it is what the magic link's expiry
// redirect lands on, and it is what a direct /account/login link opens. This
// modal is the same flow triggered from anywhere else.
//
// The email field is prefilled for anyone we already know — see
// lib/customerContext.tsx. In practice that mostly matters for a session that
// has expired rather than a first sign-in.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Mail, CheckCircle, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  /** Optional line explaining why the modal appeared, e.g. from a reorder attempt. */
  reason?: string
}

export default function SignInModal({ open, onClose, reason }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

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
      if (!res.ok) { setMessage(data?.message || 'Something went wrong.'); setStatus('error'); return }
      setStatus('sent')
    } catch {
      setMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div
      className="plsi"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plsi-title"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        .plsi { position: fixed; inset: 0; z-index: 1200;
                display: flex; align-items: center; justify-content: center; padding: 20px;
                background: rgba(13,13,13,.5); backdrop-filter: blur(3px);
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                animation: plsiFade .16s ease-out; }
        @keyframes plsiFade { from { opacity: 0 } to { opacity: 1 } }
        .plsi-card { width: 100%; max-width: 400px; background: #fff;
                     border-radius: 20px; padding: 28px; position: relative;
                     box-shadow: 0 24px 70px rgba(13,13,13,.3);
                     animation: plsiUp .2s cubic-bezier(.2,.8,.3,1); }
        @keyframes plsiUp { from { transform: translateY(12px); opacity: 0 } to { transform: none; opacity: 1 } }
        .plsi-x { position: absolute; top: 14px; right: 14px;
                  display: flex; align-items: center; justify-content: center;
                  width: 34px; height: 34px; border: none; border-radius: 9px;
                  background: none; color: rgba(13,13,13,.4); cursor: pointer; }
        .plsi-x:hover { background: #F2F0EC; color: #0D0D0D; }
        .plsi-title { font-size: 21px; font-weight: 700; letter-spacing: -.03em;
                      color: #0D0D0D; margin: 0 0 8px; padding-right: 34px; }
        .plsi-sub { font-size: 13.5px; line-height: 1.65; color: rgba(13,13,13,.6); margin: 0 0 20px; }
        .plsi-label { display: block; font-size: 12.5px; font-weight: 600; color: #0D0D0D; margin-bottom: 7px; }
        /* 16px: anything smaller and Safari zooms the page on focus. */
        .plsi-input { width: 100%; min-height: 48px; padding: 0 14px; font-size: 16px;
                      font-family: inherit; color: #0D0D0D;
                      border: 1px solid rgba(13,13,13,.15); border-radius: 12px;
                      background: #FCFCFB; outline: none; margin-bottom: 14px; }
        .plsi-input:focus { border-color: rgba(13,13,13,.45); }
        .plsi-go { display: flex; align-items: center; justify-content: center; gap: 9px;
                   width: 100%; min-height: 48px; border: none; border-radius: 999px;
                   background: #0D0D0D; color: #fff; font-family: inherit;
                   font-size: 14px; font-weight: 700; cursor: pointer; }
        .plsi-go:disabled { background: rgba(13,13,13,.15); cursor: not-allowed; }
        .plsi-note { font-size: 12px; line-height: 1.6; color: rgba(13,13,13,.45); margin: 16px 0 0; }
        .plsi-err { font-size: 13px; color: #B91C1C; margin: 10px 0 0; }
        .plsi-ok { display: flex; gap: 11px; align-items: flex-start; }
        .plsi :focus-visible { outline: 2px solid #0D0D0D; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .plsi, .plsi-card { animation: none } }
      `}</style>

      <div className="plsi-card" ref={cardRef}>
        <button className="plsi-x" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden="true" />
        </button>

        {status === 'sent' ? (
          <div className="plsi-ok">
            <CheckCircle size={22} style={{ color: '#0A7B45', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <h2 id="plsi-title" className="plsi-title" style={{ fontSize: 19, marginBottom: 6 }}>
                Check your email
              </h2>
              <p className="plsi-sub" style={{ margin: 0 }}>
                Your sign-in link is on its way. It works once and expires in 15 minutes.
                You can close this and carry on — the link opens your account in a new tab.
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 id="plsi-title" className="plsi-title">Sign in</h2>
            <p className="plsi-sub">
              {reason || 'Your order history, batch certificates and one-tap reorder. No password — we send a link.'}
            </p>

            <form onSubmit={submit}>
              <label className="plsi-label" htmlFor="plsi-email">Email address</label>
              <input
                id="plsi-email" ref={inputRef} className="plsi-input" type="email" required
                autoComplete="email" placeholder="you@lab.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
              <button className="plsi-go" type="submit" disabled={status === 'sending' || !email.trim()}>
                {status === 'sending'
                  ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  : <Mail size={16} aria-hidden="true" />}
                Send sign-in link
              </button>
            </form>

            {status === 'error' && <p className="plsi-err">{message}</p>}

            <p className="plsi-note">
              New here? The same link creates your account — there is no separate sign-up.
            </p>
          </>
        )}
      </div>
    </div>
  )
}