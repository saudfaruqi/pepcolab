// src/app/admin/(protected)/marketing/MarketingHome.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Megaphone } from 'lucide-react'
import { SEGMENT_LABELS, type AudienceSegment, type CampaignStatus } from '@/lib/marketing/types'
import { MARKETING_SENDS_PAUSED, MARKETING_PAUSED_REASON } from '@/lib/marketingGate'

export interface CampaignRow {
  id: string
  name: string
  status: CampaignStatus
  segment: AudienceSegment
  subject: string
  code: string | null
  redemptions: number | null
  sent: number
  failed: number
  recipients: number
  updatedAt: string
  sentAt: string | null
}

const STATUS_STYLE: Record<CampaignStatus, string> = {
  draft: 'bg-[#0D0D0D]/10 text-[#0D0D0D]/60',
  sending: 'bg-[#C8992A]/15 text-[#8A6A1E]',
  sent: 'bg-[#0A7B45]/10 text-[#0A7B45]',
}

function fmt(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MarketingHome({
  rows,
  excluded,
  templates,
  loadError,
}: {
  rows: CampaignRow[]
  excluded: string[]
  templates: { key: string; name: string; description: string }[]
  loadError: string
}) {
  const router = useRouter()
  const [creating, setCreating] = useState<string | null>(null)
  const [error, setError] = useState(loadError)
  const [exText, setExText] = useState(excluded.join('\n'))
  const [exSaving, setExSaving] = useState(false)
  const [exMessage, setExMessage] = useState('')

  const create = async (templateKey: string) => {
    setCreating(templateKey)
    setError('')
    try {
      const res = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', templateKey }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not create the campaign.')
        return
      }
      router.push(`/admin/marketing/${data.campaign.id}`)
    } catch {
      setError('Network error — nothing was created.')
    } finally {
      setCreating(null)
    }
  }

  const saveExcluded = async () => {
    setExSaving(true)
    setExMessage('')
    try {
      const res = await fetch('/api/admin/marketing/excluded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: exText.split(/[\s,;]+/).filter(Boolean) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setExMessage(data.message || 'Could not save.')
        return
      }
      setExText(data.emails.join('\n'))
      setExMessage(`Saved — ${data.emails.length} address${data.emails.length === 1 ? '' : 'es'} never receive campaigns.`)
    } catch {
      setExMessage('Network error — nothing was saved.')
    } finally {
      setExSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-[#0D0D0D]">
          <Megaphone size={18} /> Marketing
        </h1>
        <p className="text-sm text-[#0D0D0D]/50">
          Branded campaign emails to customers who opted in to email updates (consent recorded in Contacts). Every send
          skips anyone without a current opt-in, anyone who has unsubscribed or is on the exclusion list, and anyone who
          has already had 2 marketing emails this week.
        </p>
      </div>

      {MARKETING_SENDS_PAUSED && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Sending is paused.</strong> {MARKETING_PAUSED_REASON} You can still draft campaigns and send test copies.
        </div>
      )}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-8">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#0D0D0D]/50">New campaign</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => create(t.key)}
              disabled={creating !== null}
              className="flex flex-col items-start rounded-lg border border-[#0D0D0D]/10 bg-white p-4 text-left hover:border-[#0D0D0D]/30 disabled:opacity-50"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-[#0D0D0D]">
                {creating === t.key ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {t.name}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-[#0D0D0D]/55">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#0D0D0D]/50">Campaigns</div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#0D0D0D]/15 py-12 text-center text-sm text-[#0D0D0D]/50">
          No campaigns yet. Start one from a template above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#0D0D0D]/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#0D0D0D]/10 text-xs text-[#0D0D0D]/50">
                <th className="px-4 py-2.5 font-medium">Campaign</th>
                <th className="px-4 py-2.5 font-medium">Audience</th>
                <th className="px-4 py-2.5 font-medium">Sent</th>
                <th className="px-4 py-2.5 font-medium">Code used</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#0D0D0D]/5 last:border-0 hover:bg-[#F7F5F1]/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/marketing/${r.id}`} className="font-medium text-[#0D0D0D] underline-offset-2 hover:underline">
                      {r.name}
                    </Link>
                    <div className="text-xs text-[#0D0D0D]/50">{r.subject || '(no subject yet)'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#0D0D0D]/60">{SEGMENT_LABELS[r.segment]}</td>
                  <td className="px-4 py-3 text-xs text-[#0D0D0D]/70">
                    {r.status === 'draft' ? '—' : `${r.sent} of ${r.recipients}${r.failed ? ` · ${r.failed} failed` : ''}`}
                    {r.sentAt && <div className="text-[#0D0D0D]/40">{fmt(r.sentAt)}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#0D0D0D]/70">
                    {r.code ? (
                      <>
                        <span className="font-mono">{r.code}</span>
                        <div className="text-[#0D0D0D]/50">{r.redemptions ?? 0} order{r.redemptions === 1 ? '' : 's'}</div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                    {r.status === 'draft' && <div className="mt-1 text-xs text-[#0D0D0D]/40">edited {fmt(r.updatedAt)}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-[#0D0D0D]/10 bg-white p-4">
        <div className="text-sm font-semibold text-[#0D0D0D]">Never email these addresses</div>
        <p className="mb-2 text-xs text-[#0D0D0D]/55">
          Test accounts, staff and spam sign-ups. One per line. Applies to every campaign. (Unsubscribes are handled
          automatically and don&rsquo;t need adding here.)
        </p>
        <textarea
          value={exText}
          onChange={(e) => setExText(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-[#0D0D0D]/15 px-2.5 py-1.5 font-mono text-xs text-[#0D0D0D] outline-none focus:border-[#0D0D0D]/40"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={saveExcluded}
            disabled={exSaving}
            className="flex items-center gap-2 rounded-md bg-[#0D0D0D] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {exSaving && <Loader2 size={13} className="animate-spin" />}
            Save list
          </button>
          {exMessage && <span className="text-xs text-[#0D0D0D]/60">{exMessage}</span>}
        </div>
      </div>
    </div>
  )
}
