'use client'
// "New WhatsApp contact" — the VA's same-day logging form (brief C8). Creates
// the contact (source whatsapp_inbound) with the first message as a service
// interaction. It never records consent; use the contact page for JOIN/STOP.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'

export default function NewContactForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ phone: '', firstName: '', lastName: '', market: 'UAE', summary: '' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/crm/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'whatsapp_inbound' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not create the contact.')
        return
      }
      router.push(`/admin/contacts/${data.id}`)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  const input = 'rounded-lg border border-[#0D0D0D]/15 px-3 py-2 text-sm text-[#0D0D0D]'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-1.5 rounded-full bg-[#0D0D0D] px-4 py-2 text-xs font-semibold text-white"
      >
        <Plus size={13} /> New WhatsApp contact
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mb-4 rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
      <div className="mb-3 text-sm font-semibold text-[#0D0D0D]">New WhatsApp contact</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Phone (with country code)
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+971 50 123 4567" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          First name
          <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Last name
          <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Market
          <select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} className={input}>
            <option value="UAE">UAE</option>
            <option value="UK">UK</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60 sm:col-span-4">
          What did they ask? (logged as an inbound service interaction)
          <textarea
            rows={2}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            className={input}
          />
        </label>
      </div>
      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      <p className="mt-3 text-xs text-[#0D0D0D]/50">
        This does not opt them in. If they sent &ldquo;JOIN PepcoLab updates&rdquo;, record it on their contact page.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={busy} className="flex items-center gap-1.5 rounded-full bg-[#0D0D0D] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {busy && <Loader2 size={13} className="animate-spin" />} Create contact
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-xs text-[#0D0D0D]/60">
          Cancel
        </button>
      </div>
    </form>
  )
}
