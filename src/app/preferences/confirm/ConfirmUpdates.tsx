'use client'
// Client half of /preferences/confirm — POSTs the signed token to
// /api/crm/confirm when the customer presses Confirm.
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CONSENT_WORDING } from '@/lib/crm/types'

type State = 'idle' | 'saving' | 'done' | 'already' | 'invalid' | 'error'

const h1: React.CSSProperties = { fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', color: '#0D0D0D', margin: '0 0 10px' }
const p: React.CSSProperties = { fontSize: 14, color: 'rgba(13,13,13,.6)', lineHeight: 1.65, margin: '0 0 18px' }
const btn: React.CSSProperties = {
  display: 'block', width: '100%', border: 0, borderRadius: 999, background: '#0D0D0D', color: '#fff',
  padding: '14px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
}

export default function ConfirmUpdates() {
  const params = useSearchParams()
  const token = params.get('t') || ''
  const [state, setState] = useState<State>(token ? 'idle' : 'invalid')
  const [message, setMessage] = useState<string | null>(null)

  async function confirm() {
    setState('saving')
    setMessage(null)
    try {
      const res = await fetch('/api/crm/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, pageUrl: window.location.origin + window.location.pathname }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setState(data?.already ? 'already' : 'done')
        return
      }
      setMessage(data?.error || null)
      setState(res.status === 400 || res.status === 404 || res.status === 409 ? 'invalid' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done' || state === 'already') {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={h1}>{state === 'done' ? 'You’re subscribed.' : 'You’re already subscribed.'}</h1>
        <p style={p}>
          We&apos;ll email you when a new lot is tested and its certificate is published, at most once a week. Every email has
          an unsubscribe link, and you can change this in your account at any time.
        </p>
        <Link href="/products" style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D' }}>Back to the catalogue →</Link>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={h1}>This link can&apos;t be used</h1>
        <p style={p}>
          {message || 'It has expired, has already been used, or is incomplete.'} You can switch updates on from your
          account instead.
        </p>
        <Link href="/account/profile" style={{ fontSize: 13, fontWeight: 600, color: '#0D0D0D' }}>Go to your account →</Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.4)', marginBottom: 8 }}>
        Research updates
      </div>
      <h1 style={h1}>Confirm email updates</h1>
      <p style={{ ...p, padding: '12px 14px', background: '#F7F5F1', borderRadius: 12, color: 'rgba(13,13,13,.75)' }}>
        {CONSENT_WORDING['email-v1']}
      </p>
      <button type="button" onClick={confirm} disabled={state === 'saving'} style={{ ...btn, opacity: state === 'saving' ? 0.6 : 1 }}>
        {state === 'saving' ? 'Confirming…' : 'Confirm — email me updates'}
      </button>
      {state === 'error' && (
        <p role="alert" style={{ fontSize: 12.5, color: '#9b2c22', margin: '12px 0 0', textAlign: 'center' }}>
          That didn&apos;t go through. Please try again.
        </p>
      )}
      <p style={{ fontSize: 12, color: 'rgba(13,13,13,.45)', margin: '14px 0 0', textAlign: 'center' }}>
        Not interested? Just close this page — nothing changes.
      </p>
    </div>
  )
}
