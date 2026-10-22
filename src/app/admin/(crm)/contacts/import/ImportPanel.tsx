'use client'
// Import buttons and CSV uploads for /api/admin/crm/import (brief B3).
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

type Kind = 'orders' | 'newsletter' | 'leads' | 'strabl_csv' | 'inbox_csv'

const ACTIONS: { kind: Exclude<Kind, 'strabl_csv' | 'inbox_csv'>; label: string; help: string }[] = [
  {
    kind: 'orders',
    label: 'Sync orders',
    help: 'Every order record becomes a contact with order count, lifetime value and dates. No consent is written — an order is not a marketing opt-in. Also runs nightly.',
  },
  {
    kind: 'newsletter',
    label: 'Import newsletter list',
    help: 'Footer sign-ups become contacts with a granted email consent, wording "footer-legacy", capture "footer form", dated at the original sign-up time.',
  },
  {
    kind: 'leads',
    label: 'Import guide leads',
    help: 'Free-guide leads become contacts. Those who ticked the opt-in get a granted email-v1 consent with the evidence stored at sign-up.',
  },
]

const CSVS: { kind: 'strabl_csv' | 'inbox_csv'; label: string; help: string }[] = [
  {
    kind: 'strabl_csv',
    label: 'STRABL payer export',
    help: 'The payer CSV from the STRABL dashboard. Columns are detected by header (email, phone, name, country). Source "payment link"; no consent written.',
  },
  {
    kind: 'inbox_csv',
    label: 'Inbox export',
    help: 'People who emailed about orders (columns: email or from, optionally order number and name). Only rows that match a PepcoLab order are imported; no consent written.',
  },
]

export default function ImportPanel() {
  const router = useRouter()
  const [busy, setBusy] = useState<Kind | null>(null)
  const [results, setResults] = useState<Partial<Record<Kind, { ok: boolean; text: string }>>>({})

  async function run(kind: Kind, csv?: string) {
    setBusy(kind)
    try {
      const res = await fetch('/api/admin/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, csv }),
      })
      const data = await res.json().catch(() => ({}))
      setResults((r) => ({
        ...r,
        [kind]: res.ok ? { ok: true, text: JSON.stringify(data.result, null, 2) } : { ok: false, text: data.error || 'Import failed.' },
      }))
      if (res.ok) router.refresh()
    } catch {
      setResults((r) => ({ ...r, [kind]: { ok: false, text: 'Could not reach the server.' } }))
    } finally {
      setBusy(null)
    }
  }

  function readFile(kind: 'strabl_csv' | 'inbox_csv', file: File | undefined) {
    if (!file) return
    if (file.size > 2_000_000) {
      setResults((r) => ({ ...r, [kind]: { ok: false, text: 'That file is over 2 MB. Split it and import each part.' } }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => run(kind, String(reader.result || ''))
    reader.onerror = () => setResults((r) => ({ ...r, [kind]: { ok: false, text: 'Could not read that file.' } }))
    reader.readAsText(file)
  }

  const Result = ({ kind }: { kind: Kind }) => {
    const r = results[kind]
    if (!r) return null
    return (
      <pre className={`mt-2 overflow-x-auto rounded-lg px-3 py-2 text-[11px] ${r.ok ? 'bg-[#0A7B45]/10 text-[#0A7B45]' : 'bg-red-50 text-red-700'}`}>
        {r.text}
      </pre>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ACTIONS.map((a) => (
        <div key={a.kind} className="rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
          <div className="mb-1 text-sm font-semibold text-[#0D0D0D]">{a.label}</div>
          <p className="mb-3 text-xs text-[#0D0D0D]/55">{a.help}</p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => run(a.kind)}
            className="flex items-center gap-1.5 rounded-full bg-[#0D0D0D] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy === a.kind && <Loader2 size={13} className="animate-spin" />} {a.label}
          </button>
          <Result kind={a.kind} />
        </div>
      ))}
      {CSVS.map((c) => (
        <div key={c.kind} className="rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
          <div className="mb-1 text-sm font-semibold text-[#0D0D0D]">{c.label}</div>
          <p className="mb-3 text-xs text-[#0D0D0D]/55">{c.help}</p>
          <label className="text-xs text-[#0D0D0D]/60">
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={busy !== null}
              onChange={(e) => {
                readFile(c.kind, e.target.files?.[0])
                e.target.value = ''
              }}
              className="mt-1 block w-full text-xs"
            />
          </label>
          {busy === c.kind && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#0D0D0D]/60">
              <Loader2 size={13} className="animate-spin" /> Importing…
            </div>
          )}
          <Result kind={c.kind} />
        </div>
      ))}
    </div>
  )
}
