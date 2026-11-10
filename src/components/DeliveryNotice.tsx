// src/components/DeliveryNotice.tsx
'use client'
//
// Shown in the cart and cart drawer when ordering is refused because of the
// visitor's location (lib/delivery.ts). Lets them leave an email so they hear
// when delivery to them opens.
import { useState, type FormEvent } from 'react'
import { useCanDeliver, deliveryRefusal } from '@/lib/delivery'

export default function DeliveryNotice({ compact = false, slug = 'general' }: { compact?: boolean; slug?: string }) {
  const ok = useCanDeliver()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  if (ok !== false) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (state === 'saving' || state === 'done') return
    setState('saving')
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), productSlug: `intl-launch:${slug}`, productName: 'Delivery to my country' }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div
      role="status"
      style={{
        background: '#FFFBEB',
        border: '1px solid #FDE68A',
        borderRadius: compact ? 0 : 12,
        padding: compact ? '12px 20px' : '14px 18px',
        marginBottom: compact ? 0 : 24,
        fontSize: 13.5,
        lineHeight: 1.55,
        color: '#78350F',
      }}
    >
      <div>{deliveryRefusal()}</div>
      {state === 'done' ? (
        <div style={{ marginTop: 8, fontWeight: 600 }}>Thanks — we\u2019ll email you when we deliver to you.</div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            aria-label="Email for delivery updates"
            style={{ flex: '1 1 180px', minWidth: 0, border: '1px solid #E5E7EB', borderRadius: 999, padding: '8px 14px', fontSize: 13.5, background: '#fff', color: '#111' }}
          />
          <button
            type="submit"
            disabled={state === 'saving'}
            style={{ border: 0, borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#0D0D0D', color: '#fff', cursor: 'pointer' }}
          >
            {state === 'saving' ? 'Saving\u2026' : 'Tell me when'}
          </button>
          {state === 'error' && <span style={{ width: '100%', fontSize: 12.5, color: '#B91C1C' }}>Couldn\u2019t save that — please check the email and try again.</span>}
        </form>
      )}
    </div>
  )
}
