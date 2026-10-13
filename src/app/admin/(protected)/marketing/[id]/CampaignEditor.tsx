// src/app/admin/(protected)/marketing/[id]/CampaignEditor.tsx
'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Send, FlaskConical, Copy, Trash2, Tag, RotateCcw, Users } from 'lucide-react'
import {
  SEGMENT_LABELS,
  type AudienceSegment,
  type Campaign,
  type CampaignStats,
  type Recipient,
  type RecipientResult,
} from '@/lib/marketing/types'

type Row = Recipient & { flag: string | null; result: RecipientResult | null }
type Msg = { tone: 'ok' | 'warn' | 'error'; text: string } | null

const SEGMENTS = Object.keys(SEGMENT_LABELS) as AudienceSegment[]
const TEST_EMAIL_KEY = 'pepcolab_marketing_test_email'

const input =
  'w-full rounded-md border border-[#0D0D0D]/15 bg-white px-2.5 py-1.5 text-sm text-[#0D0D0D] outline-none focus:border-[#0D0D0D]/40 disabled:bg-[#F7F5F1] disabled:text-[#0D0D0D]/60'
const label = 'mb-1 block text-xs font-medium text-[#0D0D0D]/60'

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null
  const tone = msg.tone === 'ok' ? 'text-[#0A7B45]' : msg.tone === 'warn' ? 'text-[#8A6A1E]' : 'text-red-700'
  return <div className={`mt-2 text-xs ${tone}`}>{msg.text}</div>
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#0D0D0D]/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-[#0D0D0D]">{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

const RESULT_LABEL: Record<RecipientResult['status'], string> = {
  sent: 'sent',
  failed: 'failed',
  skipped_unsubscribed: 'skipped · unsubscribed',
  skipped_recent: 'skipped · mailed recently',
  skipped_excluded: 'skipped · excluded',
}

export default function CampaignEditor({ initial }: { initial: Campaign }) {
  const router = useRouter()
  const [c, setC] = useState<Campaign>(initial)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<Msg>(null)

  const editable = c.status === 'draft'

  // ── preview ─────────────────────────────────────────────────────────────
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [withName, setWithName] = useState(true)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshPreview = useCallback(
    async (campaign: Campaign, named: boolean) => {
      try {
        const res = await fetch('/api/admin/marketing/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign, sample: named ? undefined : { firstName: '' } }),
        })
        const data = await res.json().catch(() => ({}))
        if (data.success) {
          setPreviewHtml(data.html)
          setPreviewSubject(data.subject)
        }
      } catch {
        // Preview is best-effort; the next edit retries.
      }
    },
    []
  )

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => refreshPreview(c, withName), 500)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [c, withName, refreshPreview])

  // ── audience ────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<Row[]>([])
  const [audLoading, setAudLoading] = useState(false)
  const [frozen, setFrozen] = useState(false)
  const [showList, setShowList] = useState(false)
  const audTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadAudience = useCallback(async (campaign: Campaign) => {
    setAudLoading(true)
    try {
      const res = await fetch('/api/admin/marketing/audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          campaign.status === 'draft' ? { audience: campaign.audience } : { id: campaign.id }
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (data.success) {
        setRows(data.recipients)
        setFrozen(Boolean(data.frozen))
      }
    } finally {
      setAudLoading(false)
    }
  }, [])

  const audienceKey = JSON.stringify(c.audience) + c.status
  useEffect(() => {
    if (audTimer.current) clearTimeout(audTimer.current)
    audTimer.current = setTimeout(() => loadAudience(c), 400)
    return () => {
      if (audTimer.current) clearTimeout(audTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey, loadAudience])

  const excludedHere = useMemo(() => new Set(c.audience.excludeEmails || []), [c.audience.excludeEmails])
  const willSend = rows.filter((r) => !r.flag && !r.result && !excludedHere.has(r.email)).length

  // ── edits ───────────────────────────────────────────────────────────────
  const update = (patch: Partial<Campaign>) => {
    if (!editable) return
    setC((prev) => ({ ...prev, ...patch }))
    setDirty(true)
    setSaveMsg(null)
  }
  const updateAudience = (patch: Partial<Campaign['audience']>) => update({ audience: { ...c.audience, ...patch } })

  const toggleExclude = (email: string) => {
    const set = new Set(c.audience.excludeEmails || [])
    if (set.has(email)) set.delete(email)
    else set.add(email)
    updateAudience({ excludeEmails: Array.from(set) })
  }

  const save = async (): Promise<boolean> => {
    if (!editable) return true
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', id: c.id, campaign: c }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setSaveMsg({ tone: 'error', text: data.message || 'Could not save.' })
        return false
      }
      setC(data.campaign)
      setDirty(false)
      setSaveMsg({ tone: 'ok', text: 'Saved.' })
      return true
    } catch {
      setSaveMsg({ tone: 'error', text: 'Network error — not saved.' })
      return false
    } finally {
      setSaving(false)
    }
  }

  // ── discount code ───────────────────────────────────────────────────────
  const [codePercent, setCodePercent] = useState(10)
  const [codeDays, setCodeDays] = useState(7)
  const [codePrefix, setCodePrefix] = useState(
    initial.audience.segment === 'non_buyers' ? 'WELCOME' : initial.audience.segment === 'buyers' ? 'THANKS' : 'PEPCO'
  )
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeMsg, setCodeMsg] = useState<Msg>(null)

  const createCode = async () => {
    if (dirty && !(await save())) return
    setCodeBusy(true)
    setCodeMsg(null)
    try {
      const res = await fetch('/api/admin/marketing/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, prefix: codePrefix, percent: codePercent, days: codeDays }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setCodeMsg({ tone: 'error', text: data.message || 'Could not create the code.' })
        return
      }
      setC(data.campaign)
      setDirty(false)
      setCodeMsg({ tone: 'ok', text: `Created ${data.campaign.offer.code}. It works in the cart now.` })
    } catch {
      setCodeMsg({ tone: 'error', text: 'Network error — no code created.' })
    } finally {
      setCodeBusy(false)
    }
  }

  // ── test send ───────────────────────────────────────────────────────────
  const [testTo, setTestTo] = useState('')
  const [testBusy, setTestBusy] = useState(false)
  const [testMsg, setTestMsg] = useState<Msg>(null)
  useEffect(() => {
    try {
      setTestTo(localStorage.getItem(TEST_EMAIL_KEY) || 'hello@pepcolab.com')
    } catch {
      setTestTo('hello@pepcolab.com')
    }
  }, [])

  const sendTest = async () => {
    if (dirty && !(await save())) return
    setTestBusy(true)
    setTestMsg(null)
    try {
      try {
        localStorage.setItem(TEST_EMAIL_KEY, testTo)
      } catch {
        // not important
      }
      const res = await fetch('/api/admin/marketing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, action: 'test', to: testTo }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setTestMsg({ tone: 'error', text: data.message || 'Test failed.' })
        return
      }
      setTestMsg({ tone: 'ok', text: `Test sent to ${testTo}. Check the inbox (and spam) before sending for real.` })
    } catch {
      setTestMsg({ tone: 'error', text: 'Network error — test not sent.' })
    } finally {
      setTestBusy(false)
    }
  }

  // ── real send ───────────────────────────────────────────────────────────
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<CampaignStats | null>(initial.stats ?? null)
  const [sendMsg, setSendMsg] = useState<Msg>(null)
  const [ignoreCap, setIgnoreCap] = useState(false)
  const stopRef = useRef(false)

  const runSend = async () => {
    setConfirming(false)
    if (dirty && !(await save())) return
    setSending(true)
    setSendMsg(null)
    stopRef.current = false
    try {
      for (let guard = 0; guard < 500 && !stopRef.current; guard++) {
        const res = await fetch('/api/admin/marketing/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: c.id, action: 'batch', minGapHours: ignoreCap ? 0 : undefined }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.success) {
          setSendMsg({ tone: 'error', text: `${data.message || 'Sending stopped.'} Press Send again to resume — nobody gets it twice.` })
          break
        }
        setProgress(data.stats)
        if (data.done) {
          setSendMsg({
            tone: data.stats.failed ? 'warn' : 'ok',
            text: `Finished: ${data.stats.sent} sent${data.stats.failed ? `, ${data.stats.failed} failed` : ''}.`,
          })
          break
        }
        if (data.busy) await new Promise((r) => setTimeout(r, 2500))
      }
      if (stopRef.current) setSendMsg({ tone: 'warn', text: 'Paused. Press Send to continue where it stopped.' })
    } catch {
      setSendMsg({ tone: 'error', text: 'Network error. Press Send again to resume — nobody gets it twice.' })
    } finally {
      setSending(false)
      router.refresh()
      const res = await fetch('/api/admin/marketing/campaigns').catch(() => null)
      const data = await res?.json().catch(() => null)
      const fresh = data?.campaigns?.find((x: Campaign) => x.id === c.id)
      if (fresh) setC(fresh)
      loadAudience(fresh ?? c)
    }
  }

  const requeueFailed = async () => {
    const res = await fetch('/api/admin/marketing/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, action: 'requeue-failed' }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.success) {
      setSendMsg({ tone: 'ok', text: `${data.requeued} failed recipient(s) queued again. Press Send to retry them.` })
      setC((prev) => ({ ...prev, status: data.requeued ? 'sending' : prev.status }))
      loadAudience(c)
    }
  }

  const duplicate = async () => {
    const res = await fetch('/api/admin/marketing/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'duplicate', id: c.id }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.success) router.push(`/admin/marketing/${data.campaign.id}`)
  }

  const [deleteArmed, setDeleteArmed] = useState(false)
  const remove = async () => {
    const res = await fetch(`/api/admin/marketing/campaigns?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (data.success) router.push('/admin/marketing')
    else setSaveMsg({ tone: 'error', text: data.message || 'Could not delete.' })
  }

  const subjectLen = c.subject.length

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/marketing" className="flex items-center gap-1 text-sm text-[#0D0D0D]/60 hover:text-[#0D0D0D]">
          <ArrowLeft size={14} /> Marketing
        </Link>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            c.status === 'sent' ? 'bg-[#0A7B45]/10 text-[#0A7B45]' : c.status === 'sending' ? 'bg-[#C8992A]/15 text-[#8A6A1E]' : 'bg-[#0D0D0D]/10 text-[#0D0D0D]/60'
          }`}
        >
          {c.status}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={duplicate} className="flex items-center gap-1.5 rounded-md border border-[#0D0D0D]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#0D0D0D]">
            <Copy size={13} /> Duplicate
          </button>
          {editable &&
            (deleteArmed ? (
              <button type="button" onClick={remove} className="flex items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white">
                <Trash2 size={13} /> Confirm delete
              </button>
            ) : (
              <button type="button" onClick={() => setDeleteArmed(true)} className="flex items-center gap-1.5 rounded-md border border-[#0D0D0D]/15 bg-white px-3 py-1.5 text-xs font-medium text-red-700">
                <Trash2 size={13} /> Delete
              </button>
            ))}
          {editable && (
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="flex items-center gap-1.5 rounded-md bg-[#0D0D0D] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {dirty ? 'Save draft' : 'Saved'}
            </button>
          )}
        </div>
      </div>
      <Note msg={saveMsg} />

      <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_560px]">
        {/* ── left: form ── */}
        <div className="space-y-4">
          <Section title="Campaign">
            <label className={label}>Internal name (customers never see this)</label>
            <input className={input} value={c.name} onChange={(e) => update({ name: e.target.value })} disabled={!editable} />
          </Section>

          <Section
            title="Audience"
            right={
              <span className="flex items-center gap-1.5 text-xs text-[#0D0D0D]/60">
                {audLoading ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
                {frozen ? `${rows.length} on the send list` : `${willSend} will receive it`}
                {!frozen && rows.length !== willSend && ` · ${rows.length - willSend} skipped`}
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={label}>Who</label>
                <select
                  className={input}
                  value={c.audience.segment}
                  onChange={(e) => updateAudience({ segment: e.target.value as AudienceSegment })}
                  disabled={!editable}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>
                      {SEGMENT_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              {c.audience.segment === 'lapsed_buyers' && (
                <div>
                  <label className={label}>No paid order in the last (days)</label>
                  <input
                    type="number"
                    min={1}
                    className={input}
                    value={c.audience.lapsedDays ?? 45}
                    onChange={(e) => updateAudience({ lapsedDays: Number(e.target.value) })}
                    disabled={!editable}
                  />
                </div>
              )}
              {c.audience.segment === 'bought_product' && (
                <div>
                  <label className={label}>Product name contains</label>
                  <input
                    className={input}
                    placeholder="e.g. GHK-Cu"
                    value={c.audience.productQuery ?? ''}
                    onChange={(e) => updateAudience({ productQuery: e.target.value })}
                    disabled={!editable}
                  />
                </div>
              )}
            </div>
            <button type="button" onClick={() => setShowList((v) => !v)} className="mt-3 text-xs font-medium text-[#0D0D0D]/70 underline">
              {showList ? 'Hide' : 'Show'} recipients
            </button>
            {showList && (
              <div className="mt-2 max-h-80 overflow-auto rounded-md border border-[#0D0D0D]/10">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#F7F5F1] text-[#0D0D0D]/50">
                    <tr>
                      {editable && <th className="px-2 py-1.5 font-medium">Send</th>}
                      <th className="px-2 py-1.5 font-medium">Customer</th>
                      <th className="px-2 py-1.5 font-medium">Paid orders</th>
                      <th className="px-2 py-1.5 font-medium">Last product</th>
                      <th className="px-2 py-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const manuallyOut = excludedHere.has(r.email)
                      return (
                        <tr key={r.email} className="border-t border-[#0D0D0D]/5">
                          {editable && (
                            <td className="px-2 py-1.5">
                              <input type="checkbox" checked={!manuallyOut} disabled={Boolean(r.flag)} onChange={() => toggleExclude(r.email)} />
                            </td>
                          )}
                          <td className="px-2 py-1.5">
                            <div className="font-medium text-[#0D0D0D]">{r.name || '—'}</div>
                            <div className="text-[#0D0D0D]/50">{r.email}</div>
                          </td>
                          <td className="px-2 py-1.5">{r.paidOrders}</td>
                          <td className="px-2 py-1.5 text-[#0D0D0D]/70">{r.lastProduct || '—'}</td>
                          <td className="px-2 py-1.5">
                            {r.result ? (
                              <span className={r.result.status === 'sent' ? 'text-[#0A7B45]' : r.result.status === 'failed' ? 'text-red-700' : 'text-[#0D0D0D]/50'}>
                                {RESULT_LABEL[r.result.status]}
                                {r.result.detail && r.result.status === 'failed' ? ` — ${r.result.detail}` : ''}
                              </span>
                            ) : r.flag ? (
                              <span className="text-[#8A6A1E]">will skip · {r.flag}</span>
                            ) : manuallyOut ? (
                              <span className="text-[#0D0D0D]/50">removed</span>
                            ) : (
                              <span className="text-[#0D0D0D]/60">{frozen ? 'queued' : 'will receive'}</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-2 py-6 text-center text-[#0D0D0D]/50">
                          {audLoading ? 'Loading…' : 'Nobody matches this audience.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Email">
            <div className="space-y-3">
              <div>
                <label className={label}>
                  Subject line <span className={subjectLen > 60 ? 'text-[#8A6A1E]' : ''}>({subjectLen}/60 shows in full on phones)</span>
                </label>
                <input className={input} value={c.subject} onChange={(e) => update({ subject: e.target.value })} disabled={!editable} />
              </div>
              <div>
                <label className={label}>Preview text (grey line next to the subject in the inbox)</label>
                <input className={input} value={c.preheader} onChange={(e) => update({ preheader: e.target.value })} disabled={!editable} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Label above heading (optional)</label>
                  <input className={input} value={c.eyebrow} onChange={(e) => update({ eyebrow: e.target.value })} disabled={!editable} />
                </div>
                <div>
                  <label className={label}>Heading</label>
                  <input className={input} value={c.heading} onChange={(e) => update({ heading: e.target.value })} disabled={!editable} />
                </div>
              </div>
              <div>
                <label className={label}>Body</label>
                <textarea
                  className={`${input} font-mono text-[13px] leading-relaxed`}
                  rows={14}
                  value={c.body}
                  onChange={(e) => update({ body: e.target.value })}
                  disabled={!editable}
                />
                <div className="mt-1 text-[11px] leading-relaxed text-[#0D0D0D]/45">
                  Blank line = new paragraph · <code>- </code> at the start of a line = bullet · <code>**bold**</code> ·{' '}
                  <code>[text](/products)</code> = link · <code>{'{{firstName}}'}</code> and <code>{'{{lastProduct}}'}</code> fill in
                  per customer. Keep it about supply (testing, packing, delivery, service): never what a compound does, and no
                  certificate or verify page links.
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={label}>Button text</label>
                  <input className={input} value={c.cta.label} onChange={(e) => update({ cta: { ...c.cta, label: e.target.value } })} disabled={!editable} />
                </div>
                <div>
                  <label className={label}>Button link (/path on the site)</label>
                  <input className={input} value={c.cta.url} onChange={(e) => update({ cta: { ...c.cta, url: e.target.value } })} disabled={!editable} />
                </div>
                <div>
                  <label className={label}>Second link text (optional)</label>
                  <input
                    className={input}
                    value={c.secondaryCta?.label ?? ''}
                    onChange={(e) => update({ secondaryCta: { label: e.target.value, url: c.secondaryCta?.url ?? '' } })}
                    disabled={!editable}
                  />
                </div>
                <div>
                  <label className={label}>Second link</label>
                  <input
                    className={input}
                    value={c.secondaryCta?.url ?? ''}
                    onChange={(e) => update({ secondaryCta: { label: c.secondaryCta?.label ?? '', url: e.target.value } })}
                    disabled={!editable}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Discount code" right={<Tag size={14} className="text-[#0D0D0D]/40" />}>
            {c.offer ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-md bg-[#F7F5F1] px-2.5 py-1 font-mono font-semibold">{c.offer.code}</span>
                <span className="text-[#0D0D0D]/70">
                  {c.offer.percent}% off · until{' '}
                  {new Date(c.offer.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {editable && (
                  <button type="button" onClick={() => update({ offer: null })} className="text-xs text-[#0D0D0D]/50 underline">
                    Remove from email
                  </button>
                )}
              </div>
            ) : editable ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={label}>Code starts with</label>
                  <input className={input} value={codePrefix} onChange={(e) => setCodePrefix(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className={label}>% off</label>
                  <input type="number" min={1} max={50} className={input} value={codePercent} onChange={(e) => setCodePercent(Number(e.target.value))} />
                </div>
                <div>
                  <label className={label}>Valid for (days)</label>
                  <input type="number" min={1} max={60} className={input} value={codeDays} onChange={(e) => setCodeDays(Number(e.target.value))} />
                </div>
                <button
                  type="button"
                  onClick={createCode}
                  disabled={codeBusy}
                  className="col-span-3 flex items-center justify-center gap-2 rounded-md border border-[#0D0D0D] px-3 py-1.5 text-sm font-medium text-[#0D0D0D] disabled:opacity-50"
                >
                  {codeBusy && <Loader2 size={13} className="animate-spin" />}
                  Create code and add it to this email
                </button>
                <div className="col-span-3 text-[11px] text-[#0D0D0D]/45">
                  Creates a real code the cart accepts, usable as many times as there are people in this audience. The email
                  shows the code and expiry, and the button pre-fills it in the cart. Not valid on GLP (payment links).
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#0D0D0D]/50">No code on this campaign.</div>
            )}
            <Note msg={codeMsg} />
          </Section>

          <Section title={editable ? 'Test and send' : 'Sending'}>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[220px] flex-1">
                <label className={label}>Send a test to</label>
                <input className={input} value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              </div>
              <button
                type="button"
                onClick={sendTest}
                disabled={testBusy}
                className="flex items-center gap-1.5 rounded-md border border-[#0D0D0D]/20 bg-white px-3 py-1.5 text-sm font-medium text-[#0D0D0D] disabled:opacity-50"
              >
                {testBusy ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />} Send test
              </button>
            </div>
            <Note msg={testMsg} />

            {progress && (
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-[#0D0D0D]/10">
                  <div
                    className="h-full bg-[#0A7B45] transition-all"
                    style={{
                      width: `${progress.recipients ? Math.round(((progress.sent + progress.failed + progress.skippedExcluded + progress.skippedRecentlyMailed + progress.skippedUnsubscribed) / progress.recipients) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-xs text-[#0D0D0D]/60">
                  {progress.sent} sent · {progress.failed} failed · {progress.skippedUnsubscribed} unsubscribed ·{' '}
                  {progress.skippedRecentlyMailed} mailed recently · {progress.skippedExcluded} excluded · of {progress.recipients}
                </div>
              </div>
            )}

            {c.status !== 'sent' && (
              <div className="mt-4 border-t border-[#0D0D0D]/10 pt-4">
                <label className="mb-3 flex items-center gap-2 text-xs text-[#0D0D0D]/70">
                  <input type="checkbox" checked={ignoreCap} onChange={(e) => setIgnoreCap(e.target.checked)} disabled={sending} />
                  Also send to people who got a campaign in the last 3 days
                </label>
                {sending ? (
                  <button
                    type="button"
                    onClick={() => {
                      stopRef.current = true
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-[#0D0D0D] px-3 py-2 text-sm font-medium text-[#0D0D0D]"
                  >
                    <Loader2 size={14} className="animate-spin" /> Sending… click to pause
                  </button>
                ) : confirming ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={runSend}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#0A7B45] px-3 py-2 text-sm font-semibold text-white"
                    >
                      <Send size={14} /> Yes, send to {frozen ? 'the remaining recipients' : `${willSend} people`} now
                    </button>
                    <button type="button" onClick={() => setConfirming(false)} className="rounded-md border border-[#0D0D0D]/15 px-3 py-2 text-sm">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    disabled={!frozen && willSend === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0D0D0D] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Send size={14} /> {c.status === 'sending' ? 'Continue sending' : `Send to ${willSend} people`}
                  </button>
                )}
              </div>
            )}
            {(progress?.failed ?? 0) > 0 && !sending && (
              <button type="button" onClick={requeueFailed} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#0D0D0D]/70 underline">
                <RotateCcw size={12} /> Retry the {progress?.failed} that failed
              </button>
            )}
            <Note msg={sendMsg} />
          </Section>
        </div>

        {/* ── right: live preview ── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-[#0D0D0D]/10 bg-white">
            <div className="flex items-center justify-between border-b border-[#0D0D0D]/10 px-4 py-2.5">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-[#0D0D0D]/40">Inbox preview</div>
                <div className="truncate text-sm font-semibold text-[#0D0D0D]">{previewSubject || '(no subject)'}</div>
                <div className="truncate text-xs text-[#0D0D0D]/50">{c.preheader}</div>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-[#0D0D0D]/60">
                <input type="checkbox" checked={withName} onChange={(e) => setWithName(e.target.checked)} />
                with first name
              </label>
            </div>
            <iframe title="Email preview" srcDoc={previewHtml} className="h-[78vh] w-full rounded-b-lg" sandbox="" />
          </div>
        </div>
      </div>
    </div>
  )
}
