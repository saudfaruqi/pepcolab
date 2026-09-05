'use client'
// src/app/admin/(protected)/abandoned/AbandonedTable.tsx
//
// Abandoned checkouts, grouped by person rather than by record.
//
// WHY GROUPED
// STRABL writes a new abandoned record every time someone opens checkout, so
// one person retrying four times in twenty minutes produces four rows. Listed
// flat, that reads as four lost sales when it is one hesitant customer — and
// it would invite four recovery emails to the same inbox, which is how you
// turn a recoverable lead into an unsubscribe.
//
// Grouping by email shows one row per person, with the attempt count as the
// signal it actually is: repeated attempts usually mean a payment that kept
// failing, which is worth a personal message rather than an automated one.

import { useState } from 'react'
import { Loader2, Mail, AlertTriangle, Send, Phone } from 'lucide-react'

export interface AbandonedRow {
  orderShortCode: string
  email: string
  phone: string | null
  customerName: string | null
  createdAt: string
  currency: string
  total: number
  itemCount: number
  recoveryEmailStage: number
  products: { title: string; quantity: number }[]
  /** True when this person later placed a real order — never email them. */
  laterOrdered: boolean
}

interface Group {
  email: string
  name: string | null
  phone: string | null
  laterOrdered: boolean
  attempts: AbandonedRow[]
  best: AbandonedRow
}

function group(rows: AbandonedRow[]): Group[] {
  const map = new Map<string, AbandonedRow[]>()
  for (const r of rows) {
    const key = (r.email || 'unknown').toLowerCase()
    ;(map.get(key) ?? map.set(key, []).get(key)!).push(r)
  }
  return [...map.entries()].map(([email, attempts]) => {
    // The most useful attempt is the one that actually captured items — that
    // is the only one a recovery email can be built from.
    const best = [...attempts].sort((a, b) =>
      (b.itemCount - a.itemCount) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    )[0]
    return {
      email,
      name: attempts.find(a => a.customerName)?.customerName ?? null,
      laterOrdered: attempts.some(a => a.laterOrdered),
      phone: attempts.find(a => a.phone)?.phone ?? null,
      attempts,
      best,
    }
  }).sort((a, b) => new Date(b.best.createdAt).getTime() - new Date(a.best.createdAt).getTime())
}

export default function AbandonedTable({ rows }: { rows: AbandonedRow[] }) {
  const [state, setState] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const groups = group(rows)

  async function send(code: string, attempts = 1) {
    setState(s => ({ ...s, [code]: 'sending' }))
    try {
      const res = await fetch('/api/admin/abandoned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderShortCode: code, attempts }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors(e => ({ ...e, [code]: data?.message || 'Failed to send.' }))
        setState(s => ({ ...s, [code]: 'error' }))
        return
      }
      setState(s => ({ ...s, [code]: 'sent' }))
    } catch {
      setErrors(e => ({ ...e, [code]: 'Failed to send.' }))
      setState(s => ({ ...s, [code]: 'error' }))
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-[#0D0D0D]/10 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-[#0D0D0D]">No abandoned checkouts</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {groups.map(g => {
        const code = g.best.orderShortCode
        const s = state[code] || 'idle'
        // Never offer a send to someone who actually bought.
        const recoverable = g.best.itemCount > 0 && !g.laterOrdered
        const canEmail = !g.laterOrdered
        return (
          <article key={g.email} className="rounded-xl border border-[#0D0D0D]/10 bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[#0D0D0D]">{g.name || g.email}</span>
              {g.laterOrdered && (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-800">
                  Later ordered — do not email
                </span>
              )}
              {g.attempts.length > 1 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  {g.attempts.length} attempts
                </span>
              )}
              {g.best.recoveryEmailStage > 0 && (
                <span className="rounded-full border border-[#0D0D0D]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0D0D0D]/45">
                  {g.best.recoveryEmailStage === 1 ? '1 email sent' : '2 emails sent'}
                </span>
              )}
              <span className="ml-auto text-xs text-[#0D0D0D]/40">
                {new Date(g.best.createdAt).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#0D0D0D]/60">
              <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {g.email}</span>
              {g.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {g.phone}</span>}
              <span className="font-mono text-xs">{code}</span>
            </div>

            {recoverable ? (
              <div className="mb-4 text-[13px] text-[#0D0D0D]/75">
                {g.best.products.map((p, i) => (
                  <div key={i}>{p.title}{p.quantity > 1 ? ` × ${p.quantity}` : ''}</div>
                ))}
                <div className="mt-1 font-semibold text-[#0D0D0D]">
                  {g.best.currency} {g.best.total.toFixed(2)}
                </div>
              </div>
            ) : g.laterOrdered ? (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-[13px] leading-relaxed text-green-900">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>
                  <strong>This person went on to order.</strong> The abandoned record was never
                  cleared, so they&rsquo;re still listed here. Nothing to recover, and nothing to send.
                </span>
              </div>
            ) : (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-900">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>
                  <strong>No items captured.</strong> STRABL recorded this checkout before a cart
                  was attached, so there is nothing to put in a recovery email. Reach out
                  personally instead &mdash; {g.attempts.length > 1
                    ? 'repeated attempts usually mean a payment that kept failing, which is worth a direct message.'
                    : 'you have their email and phone number.'}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!recoverable && canEmail && (
                s === 'sent' ? (
                  <span className="text-sm font-semibold text-green-700">Email sent</span>
                ) : (
                  <button
                    onClick={() => send(code, g.attempts.length)}
                    disabled={s === 'sending'}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#0D0D0D] px-4 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    {s === 'sending' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send &ldquo;did something go wrong?&rdquo;
                  </button>
                )
              )}
              {recoverable && (
                s === 'sent' ? (
                  <span className="text-sm font-semibold text-green-700">Recovery email sent</span>
                ) : (
                  <button
                    onClick={() => send(code)}
                    disabled={s === 'sending'}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[#0D0D0D] px-4 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    {s === 'sending' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {g.best.recoveryEmailStage > 0 ? 'Send follow-up' : 'Send recovery email'}
                  </button>
                )
              )}
              <a
                href={`mailto:${g.email}`}
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[#0D0D0D]/12 px-4 text-[13px] font-semibold text-[#0D0D0D]/70"
              >
                <Mail size={14} /> Email directly
              </a>
              {g.phone && (
                <a
                  href={`https://wa.me/${g.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[#0D0D0D]/12 px-4 text-[13px] font-semibold text-[#0D0D0D]/70"
                >
                  <Phone size={14} /> WhatsApp
                </a>
              )}
              {s === 'error' && (
                <span className="self-center text-[13px] text-red-700">{errors[code]}</span>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}