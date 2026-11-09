// src/app/admin/(protected)/emails/OutboxTable.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, RotateCw } from 'lucide-react'
import type { FailedEmailEntry } from '@/lib/emailLog'

export default function OutboxTable({ entries }: { entries: FailedEmailEntry[] }) {
  const router = useRouter()
  const [sending, setSending] = useState<string | null>(null)
  const [notice, setNotice] = useState<Record<string, { tone: 'ok' | 'error'; text: string }>>({})

  const resend = async (id: string) => {
    setSending(id)
    setNotice((n) => {
      const next = { ...n }
      delete next[id]
      return next
    })
    try {
      const res = await fetch('/api/admin/emails/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        setNotice((n) => ({ ...n, [id]: { tone: 'error', text: data?.message || 'Resend failed.' } }))
        return
      }
      setNotice((n) => ({ ...n, [id]: { tone: 'ok', text: 'Sent.' } }))
      router.refresh()
    } catch {
      setNotice((n) => ({ ...n, [id]: { tone: 'error', text: 'Network error — not sent.' } }))
    } finally {
      setSending(null)
    }
  }

  if (entries.length === 0) return null

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle size={15} className="text-red-700" />
        <h2 className="text-sm font-semibold text-[#0D0D0D]">Retry failed sends</h2>
        <span className="text-xs text-[#0D0D0D]/45">({entries.length})</span>
      </div>
      <p className="mb-3 text-xs text-[#0D0D0D]/50">
        Full payloads of failed emails, kept for 7 days. Resending uses the same message.
      </p>

      <div className="flex flex-col gap-2">
        {entries.map((e) => {
          const n = notice[e.id]
          return (
            <div key={e.id} className="rounded-lg border border-[#0D0D0D]/10 bg-white px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#0D0D0D]">{e.subject}</div>
                  <div className="text-xs text-[#0D0D0D]/55">
                    {e.to} · {new Date(e.failedAt).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                  {e.error && <div className="mt-1 text-xs text-red-700">{e.error}</div>}
                  {n && (
                    <div className={`mt-1 text-xs ${n.tone === 'ok' ? 'text-[#0A7B45]' : 'text-red-700'}`}>
                      {n.text}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => resend(e.id)}
                  disabled={sending === e.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#0D0D0D] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {sending === e.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
                  Resend
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
