'use client'
// src/components/ContactModal.tsx
//
// Ask a question without leaving the page.
//
// WHY IN-CONTEXT MATTERS MORE THAN A CONTACT PAGE
// The questions worth capturing are the ones people have while they are
// looking at something specific: "does this come as a pen or a vial", "can I
// see the COA for the current lot", "my lot number isn't in the library". A
// contact page is a destination you have to decide to visit, and by the time
// someone has decided, most of them have simply left instead.
//
// So this is a modal openable from anywhere, pre-loaded with the subject and
// the context of wherever it was opened. The person types one sentence rather
// than re-explaining which product they were on.
//
// Posts to /api/contact — the same endpoint as the contact page, so it
// inherits the existing alerting, the customer auto-reply and rate limiting.
// The page context is appended to the message body, so the alert arrives with
// the answer to "about what?" already in it.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2, CheckCircle, X, Send } from 'lucide-react'
import { useCustomer } from '@/lib/customerContext'

const INK = '#0D0D0D'

interface Props {
  open: boolean
  onClose: () => void
  /** Pre-filled subject, e.g. "Question about BPC-157". */
  subject?: string
  /** Heading shown in the modal. */
  title?: string
  /** One line under the heading explaining what this is for. */
  blurb?: string
  /** Placeholder for the message field. */
  placeholder?: string
  /** Extra context appended to the message for whoever reads it. */
  context?: string
}

export default function ContactModal({
  open, onClose,
  subject = 'Question from the website',
  title = 'Ask us a question',
  blurb = 'A person reads these, usually the same working day.',
  placeholder = 'What would you like to know?',
  context,
}: Props) {
  const pathname = usePathname() || '/'
  const { email: customerEmail, name: customerName } = useCustomer()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (customerEmail && !email) setEmail(customerEmail)
    if (customerName && !name) setName(customerName)
  }, [customerEmail, customerName, email, name])

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
    setStatus('sending'); setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, subject,
          // Context first, so whoever picks this up knows what it is about
          // before reading the question.
          message: [
            context ? `[${context}]` : null,
            `[Sent from ${pathname}]`,
            '',
            message,
          ].filter(v => v !== null).join('\n'),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.message || 'Something went wrong.'); setStatus('error'); return }
      setStatus('sent')
    } catch {
      setError('Something went wrong. Please email hello@pepcolab.com.')
      setStatus('error')
    }
  }

  return (
    <div
      className="plcm"
      role="dialog" aria-modal="true" aria-labelledby="plcm-title"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        .plcm { position: fixed; inset: 0; z-index: 1200; display: flex;
                align-items: center; justify-content: center; padding: 20px;
                background: rgba(13,13,13,.5); backdrop-filter: blur(3px);
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                animation: plcmFade .16s ease-out; }
        @keyframes plcmFade { from { opacity: 0 } to { opacity: 1 } }
        .plcm-card { width: 100%; max-width: 440px; background: #fff; border-radius: 20px;
                     padding: 28px; position: relative; max-height: calc(100dvh - 40px); overflow-y: auto;
                     box-shadow: 0 24px 70px rgba(13,13,13,.3);
                     animation: plcmUp .2s cubic-bezier(.2,.8,.3,1); }
        @keyframes plcmUp { from { transform: translateY(12px); opacity: 0 } to { transform: none; opacity: 1 } }
        .plcm-x { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px;
                  display: flex; align-items: center; justify-content: center;
                  border: none; border-radius: 9px; background: none;
                  color: rgba(13,13,13,.4); cursor: pointer; }
        .plcm-x:hover { background: #F2F0EC; color: #0D0D0D; }
        .plcm-title { font-size: 20px; font-weight: 700; letter-spacing: -.03em;
                      color: #0D0D0D; margin: 0 0 6px; padding-right: 34px; }
        .plcm-blurb { font-size: 13.5px; line-height: 1.65; color: rgba(13,13,13,.6); margin: 0 0 18px; }
        .plcm-label { display: block; font-size: 12.5px; font-weight: 600; color: #0D0D0D; margin: 14px 0 6px; }
        /* 16px — smaller and Safari zooms the page on focus. */
        .plcm-in { width: 100%; min-height: 46px; padding: 12px 14px; font-size: 16px;
                   font-family: inherit; color: #0D0D0D; border: 1px solid rgba(13,13,13,.15);
                   border-radius: 12px; background: #FCFCFB; outline: none; }
        .plcm-in:focus { border-color: rgba(13,13,13,.45); }
        .plcm-go { display: flex; align-items: center; justify-content: center; gap: 9px;
                   width: 100%; min-height: 48px; margin-top: 20px; border: none; border-radius: 999px;
                   background: #0D0D0D; color: #fff; font-family: inherit;
                   font-size: 14px; font-weight: 700; cursor: pointer; }
        .plcm-go:disabled { background: rgba(13,13,13,.15); cursor: not-allowed; }
        .plcm :focus-visible { outline: 2px solid #0D0D0D; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .plcm, .plcm-card { animation: none } }
      `}</style>

      <div className="plcm-card">
        <button className="plcm-x" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>

        {status === 'sent' ? (
          <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <CheckCircle size={22} style={{ color: '#0A7B45', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <h2 id="plcm-title" className="plcm-title" style={{ fontSize: 18, marginBottom: 6 }}>Sent</h2>
              <p className="plcm-blurb" style={{ margin: 0 }}>
                A person will come back to you, usually the same working day. There&apos;s a copy
                in your inbox.
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 id="plcm-title" className="plcm-title">{title}</h2>
            <p className="plcm-blurb">{blurb}</p>

            <form onSubmit={submit}>
              <label className="plcm-label" htmlFor="plcm-msg">Your question</label>
              <textarea
                id="plcm-msg" ref={inputRef} required rows={4}
                className="plcm-in" style={{ minHeight: 104, lineHeight: 1.6, resize: 'vertical' }}
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder={placeholder}
              />

              <label className="plcm-label" htmlFor="plcm-name">Your name</label>
              <input id="plcm-name" required className="plcm-in" value={name} onChange={e => setName(e.target.value)} />

              <label className="plcm-label" htmlFor="plcm-email">Email</label>
              <input id="plcm-email" type="email" required autoComplete="email"
                     className="plcm-in" value={email} onChange={e => setEmail(e.target.value)}
                     placeholder="you@lab.com" />

              <button className="plcm-go" type="submit" disabled={status === 'sending' || !message.trim()}>
                {status === 'sending'
                  ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  : <Send size={15} aria-hidden="true" />}
                Send
              </button>
            </form>

            {status === 'error' && (
              <p role="alert" style={{ fontSize: 13, color: '#B91C1C', margin: '12px 0 0' }}>{error}</p>
            )}

            <p style={{ fontSize: 11.5, lineHeight: 1.6, color: 'rgba(13,13,13,.42)', margin: '16px 0 0' }}>
              We can&apos;t answer dosing, administration or protocol questions &mdash; everything
              we supply is for in-vitro laboratory research only.
            </p>
          </>
        )}
      </div>
    </div>
  )
}