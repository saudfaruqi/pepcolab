// src/app/admin/(crm)/ui.tsx — small shared pieces for the CRM pages (server-safe).
import type { CurrentConsent } from '@/lib/crm/types'

export function fmtDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export function ConsentBadge({ current, marketable }: { current?: CurrentConsent; marketable: boolean }) {
  if (!current) {
    return <span className="rounded-full bg-[#0D0D0D]/5 px-2 py-0.5 text-[11px] font-medium text-[#0D0D0D]/50">none</span>
  }
  const granted = current.action === 'granted'
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span
        className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${
          granted ? (marketable ? 'bg-[#0A7B45]/10 text-[#0A7B45]' : 'bg-amber-100 text-amber-800') : 'bg-red-50 text-red-700'
        }`}
        title={granted && !marketable ? 'Granted, but the address/number is suppressed' : undefined}
      >
        {granted ? (marketable ? 'granted' : 'granted · suppressed') : 'withdrawn'}
      </span>
      <span className="text-[10.5px] text-[#0D0D0D]/40">{fmtDate(current.occurredAt)}</span>
    </span>
  )
}
