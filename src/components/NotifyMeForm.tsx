// src/components/NotifyMeForm.tsx
'use client'
import { useState, type FormEvent } from 'react'
import { Bell, CheckCircle } from 'lucide-react'

interface Props {
  productSlug: string
  productName: string
}

export default function NotifyMeForm({ productSlug, productName }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'loading' || status === 'done') return
    setStatus('loading')
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productSlug, productName }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 600, color: '#3B6D11',
        background: '#EAF3DE', border: '0.5px solid #D3E8BE',
        borderRadius: 12, padding: '13px 18px', marginBottom: 24,
      }}>
        <CheckCircle size={16} />
        We'll email you the moment it's back.
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: 8, marginBottom: status === 'error' ? 8 : 24, flexWrap: 'wrap' }}
    >
      <div style={{
        flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8,
        border: '1px solid #DDE3F0', borderRadius: 12, padding: '0 14px', background: '#fff',
      }}>
        <Bell size={15} color="#AAB3C8" />
        <input
          type="email"
          required
          placeholder="Email me when back in stock"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13.5,
            padding: '13px 0', color: '#0D0F14', background: 'transparent',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          fontSize: 13, fontWeight: 600, color: '#fff',
          padding: '13px 20px', borderRadius: 12, border: 'none',
          background: '#0D0F14', cursor: status === 'loading' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.6 : 1, transition: 'all .2s',
        }}
      >
        {status === 'loading' ? 'Sending…' : 'Notify Me'}
      </button>
      {status === 'error' && (
        <p style={{ width: '100%', fontSize: 12, color: '#A32D2D', margin: 0 }}>
          Something went wrong — please try again.
        </p>
      )}
    </form>
  )
}