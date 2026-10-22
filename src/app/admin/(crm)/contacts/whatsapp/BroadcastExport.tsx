'use client'
// Fetches the broadcast export summary and offers one download per 256-number file.
import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function BroadcastExport() {
  const [data, setData] = useState<{ total: number; parts: number; partSize: number } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/crm/whatsapp-export', { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) setError(body.error || 'Could not load the export.')
        else setData(body)
      })
      .catch(() => !cancelled && setError('Could not reach the server.'))
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#0D0D0D]/50">
        <Loader2 size={14} className="animate-spin" /> Counting opted-in numbers…
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
      <div className="mb-3 text-sm text-[#0D0D0D]">
        <strong>{data.total}</strong> number{data.total === 1 ? '' : 's'} opted in to WhatsApp updates
        {data.parts > 0 && ` · ${data.parts} file${data.parts === 1 ? '' : 's'} of up to ${data.partSize}`}
      </div>
      {data.parts === 0 ? (
        <p className="text-sm text-[#0D0D0D]/50">No one is opted in yet. Opt-ins are recorded from the contact page when a JOIN message arrives.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: data.parts }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={`/api/admin/crm/whatsapp-export?part=${n}`}
              className="flex items-center gap-1.5 rounded-full bg-[#0D0D0D] px-4 py-2 text-xs font-semibold text-white"
            >
              <Download size={13} /> File {n} of {data.parts}
            </a>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-[#0D0D0D]/45">Each download is recorded in the audit log.</p>
    </div>
  )
}
