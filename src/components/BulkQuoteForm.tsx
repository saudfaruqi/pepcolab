'use client'
// src/components/BulkQuoteForm.tsx
//
// Quote request for institutional and volume buyers.
//
// Posts to the existing /api/contact endpoint rather than adding a route:
// that endpoint already alerts the team, already sends the requester an
// auto-reply, and already handles rate limiting and validation. A second
// near-identical route would be a second thing to keep working.
//
// The structured detail (quantities, institution, invoicing needs) is folded
// into the message body, so the alert email reads as a complete brief rather
// than "someone wants a quote, go and ask them everything".

import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { useCustomer } from '@/lib/customerContext'

const INK = '#0D0D0D'
const BORDER = 'rgba(13,13,13,.08)'

const field: React.CSSProperties = {
  width: '100%', minHeight: 48, padding: '0 14px', fontSize: 16,
  border: '1px solid rgba(13,13,13,.15)', borderRadius: 12,
  background: '#fff', color: INK, outline: 'none', fontFamily: 'inherit',
}
const label: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: INK, margin: '18px 0 7px',
}

const NEEDS = [
  'Purchase order (PO) accepted',
  'Invoice with payment terms',
  'Quotation document for procurement',
  'Recurring / scheduled supply',
  'Certificates supplied in advance',
]

export default function BulkQuoteForm() {
  const { email: customerEmail, name: customerName } = useCustomer()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [role, setRole] = useState('')
  const [items, setItems] = useState('')
  const [needs, setNeeds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (customerEmail && !email) setEmail(customerEmail)
    if (customerName && !name) setName(customerName)
  }, [customerEmail, customerName, email, name])

  const toggle = (n: string) =>
    setNeeds(prev => (prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending'); setMessage('')

    const body = [
      `Organisation: ${org || '(not given)'}`,
      `Role: ${role || '(not given)'}`,
      '',
      'Compounds and quantities:',
      items,
      '',
      `Procurement requirements: ${needs.length ? needs.join('; ') : 'none specified'}`,
      '',
      notes ? `Notes:\n${notes}` : '',
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, company: org,
          subject: `Bulk / institutional quote request${org ? ` — ${org}` : ''}`,
          message: body,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setMessage(data?.message || 'Something went wrong.'); setStatus('error'); return }
      setStatus('sent')
    } catch {
      setMessage('Something went wrong. Please email hello@pepcolab.com directly.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, textAlign: 'center' }}>
        <CheckCircle size={26} style={{ color: '#0A7B45', marginBottom: 12 }} aria-hidden="true" />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, margin: '0 0 8px' }}>Request received</h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: 0 }}>
          A person will come back to you with pricing and availability, usually the same working
          day. If it&apos;s urgent, message us on WhatsApp and reference your organisation.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 'clamp(22px,4vw,30px)' }}>
      <label style={{ ...label, marginTop: 0 }} htmlFor="bq-name">Your name</label>
      <input id="bq-name" required style={field} value={name} onChange={e => setName(e.target.value)} />

      <label style={label} htmlFor="bq-email">Work email</label>
      <input id="bq-email" type="email" required style={field} value={email} onChange={e => setEmail(e.target.value)} />

      <label style={label} htmlFor="bq-org">Institution or company</label>
      <input id="bq-org" style={field} value={org} onChange={e => setOrg(e.target.value)}
             placeholder="University, CRO, laboratory, distributor" />

      <label style={label} htmlFor="bq-role">Your role</label>
      <input id="bq-role" style={field} value={role} onChange={e => setRole(e.target.value)}
             placeholder="Principal investigator, lab manager, procurement" />

      <label style={label} htmlFor="bq-items">Compounds and quantities</label>
      <textarea id="bq-items" required rows={5} value={items} onChange={e => setItems(e.target.value)}
                placeholder={'e.g.\nBPC-157 10mg — 20 units\nGHK-Cu 50mg — 10 units'}
                style={{ ...field, minHeight: 120, padding: '13px 14px', lineHeight: 1.6, resize: 'vertical' }} />

      <div style={label}>What your procurement needs</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {NEEDS.map(n => (
          <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: INK, cursor: 'pointer' }}>
            <input type="checkbox" checked={needs.includes(n)} onChange={() => toggle(n)}
                   style={{ width: 16, height: 16, accentColor: INK, flexShrink: 0 }} />
            {n}
          </label>
        ))}
      </div>

      <label style={label} htmlFor="bq-notes">Anything else</label>
      <textarea id="bq-notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Timelines, delivery location, documentation requirements"
                style={{ ...field, minHeight: 84, padding: '13px 14px', lineHeight: 1.6, resize: 'vertical' }} />

      <button type="submit" disabled={status === 'sending'} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        width: '100%', minHeight: 50, marginTop: 26, borderRadius: 999, border: 'none',
        background: INK, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}>
        {status === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        Request a quote
      </button>

      {status === 'error' && <p role="alert" style={{ fontSize: 13, color: '#B91C1C', margin: '12px 0 0' }}>{message}</p>}

      <p style={{ fontSize: 12, lineHeight: 1.65, color: 'rgba(13,13,13,.45)', margin: '16px 0 0' }}>
        Materials are supplied for in-vitro laboratory research use only. We&apos;ll ask about
        intended research use before confirming any institutional supply.
      </p>
    </form>
  )
}