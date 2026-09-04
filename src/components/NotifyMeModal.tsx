'use client'
// src/components/NotifyMeModal.tsx
//
// "Tell me when this is back" — openable from a product card.
//
// WHY FROM THE CARD
// The card is where most people meet an out-of-stock product, not the product
// page. Previously the card showed an overlay saying "Out of stock" and a
// dead add-to-cart button: the answer was no, with nothing to do about it. So
// the demand signal was lost precisely where it was strongest — someone who
// wanted that compound enough to reach for the button.
//
// Posts to the existing /api/notify endpoint, so entries land in the same
// notify store the back-in-stock email already reads from. Nothing new to
// operate: restock a product, trigger the notify send, these people get told.

import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, CheckCircle, X, BellRing } from 'lucide-react'
import { useCustomer } from '@/lib/customerContext'

interface Props {
  open: boolean
  onClose: () => void
  productName: string
  productSlug: string
}

export default function NotifyMeModal({ open, onClose, productName, productSlug }: Props) {
  const { email: customerEmail } = useCustomer()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (customerEmail && !email) setEmail(customerEmail)
  }, [customerEmail, email])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
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
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productSlug, productName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error || 'Something went wrong.'); setStatus('error'); return }
      setStatus('sent')
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div
      className="plnm"
      role="dialog" aria-modal="true" aria-labelledby="plnm-title"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        .plnm { position: fixed; inset: 0; z-index: 1200; display: flex;
                align-items: center; justify-content: center; padding: 20px;
                background: rgba(13,13,13,.5); backdrop-filter: blur(3px);
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
        .plnm-card { width: 100%; max-width: 380px; background: #fff; border-radius: 20px;
                     padding: 26px; position: relative; box-shadow: 0 24px 70px rgba(13,13,13,.3); }
        .plnm-x { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px;
                  display: flex; align-items: center; justify-content: center; border: none;
                  border-radius: 9px; background: none; color: rgba(13,13,13,.4); cursor: pointer; }
        .plnm-x:hover { background: #F2F0EC; color: #0D0D0D; }
        .plnm-in { width: 100%; min-height: 46px; padding: 0 14px; font-size: 16px;
                   font-family: inherit; color: #0D0D0D; border: 1px solid rgba(13,13,13,.15);
                   border-radius: 12px; background: #FCFCFB; outline: none; margin-bottom: 12px; }
        .plnm-in:focus { border-color: rgba(13,13,13,.45); }
        .plnm-go { display: flex; align-items: center; justify-content: center; gap: 8px;
                   width: 100%; min-height: 46px; border: none; border-radius: 999px;
                   background: #0D0D0D; color: #fff; font-family: inherit;
                   font-size: 13.5px; font-weight: 700; cursor: pointer; }
        .plnm-go:disabled { background: rgba(13,13,13,.15); cursor: not-allowed; }
        .plnm :focus-visible { outline: 2px solid #0D0D0D; outline-offset: 2px; }
      `}</style>

      <div className="plnm-card">
        <button className="plnm-x" onClick={onClose} aria-label="Close"><X size={17} aria-hidden="true" /></button>

        {status === 'sent' ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircle size={20} style={{ color: '#0A7B45', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <div id="plnm-title" style={{ fontSize: 16, fontWeight: 700, color: '#0D0D0D', marginBottom: 4 }}>
                You&apos;re on the list
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(13,13,13,.6)', margin: 0 }}>
                One email when {productName} is back, with the new batch&apos;s certificate.
                Nothing else.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <BellRing size={17} aria-hidden="true" />
              <h2 id="plnm-title" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.02em', color: '#0D0D0D', margin: 0 }}>
                Notify me
              </h2>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(13,13,13,.6)', margin: '0 0 16px' }}>
              We&apos;ll email you once, the day <strong>{productName}</strong> is back in stock.
              No newsletter, no follow-ups.
            </p>

            <form onSubmit={submit}>
              <label htmlFor="plnm-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                Email address
              </label>
              <input id="plnm-email" className="plnm-in" type="email" required autoComplete="email"
                     value={email} onChange={e => setEmail(e.target.value)} placeholder="you@lab.com" />
              <button className="plnm-go" type="submit" disabled={status === 'sending' || !email.trim()}>
                {status === 'sending' && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                Email me when it&apos;s back
              </button>
            </form>

            {status === 'error' && (
              <p role="alert" style={{ fontSize: 12.5, color: '#B91C1C', margin: '10px 0 0' }}>{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}