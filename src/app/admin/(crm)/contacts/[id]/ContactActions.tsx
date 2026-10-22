'use client'
// Staff actions on one contact (brief B6, C4, C6, B7). Every action adds a
// record — consent history is append-only and is never edited here.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'

type Role = 'owner' | 'admin' | 'agent'
type Msg = { tone: 'ok' | 'err'; text: string } | null

interface Props {
  contactId: string
  role: Role
  tags: string[]
  hasEmail: boolean
  hasPhone: boolean
  emailGranted: boolean
  whatsappGranted: boolean
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    return res.ok ? { ok: true } : { ok: false, error: data.error || 'Something went wrong.' }
  } catch {
    return { ok: false, error: 'Could not reach the server.' }
  }
}

const card = 'rounded-xl border border-[#0D0D0D]/10 bg-white p-4'
const input = 'w-full rounded-lg border border-[#0D0D0D]/15 px-3 py-2 text-sm text-[#0D0D0D]'
const btn = 'flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50'

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null
  return (
    <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${msg.tone === 'ok' ? 'bg-[#0A7B45]/10 text-[#0A7B45]' : 'bg-red-50 text-red-700'}`}>
      {msg.text}
    </div>
  )
}

export default function ContactActions(p: Props) {
  const router = useRouter()
  const staffFull = p.role !== 'agent'

  // WhatsApp JOIN / STOP
  const [waText, setWaText] = useState('')
  const [waBusy, setWaBusy] = useState(false)
  const [waMsg, setWaMsg] = useState<Msg>(null)
  async function recordWa(action: 'granted' | 'withdrawn') {
    if (action === 'granted' && !waText.trim()) {
      setWaMsg({ tone: 'err', text: 'Paste the exact message they sent, e.g. "JOIN PepcoLab updates".' })
      return
    }
    setWaBusy(true)
    setWaMsg(null)
    const r = await post('/api/admin/crm/consent', { contactId: p.contactId, channel: 'whatsapp', action, waMessageText: waText })
    setWaBusy(false)
    if (!r.ok) return setWaMsg({ tone: 'err', text: r.error! })
    setWaText('')
    setWaMsg({
      tone: 'ok',
      text:
        action === 'granted'
          ? 'Opt-in recorded. Now send the /join quick reply and apply the label "Updates — opted in".'
          : 'STOP recorded. Now send the /stop quick reply, apply the label "Opted out" and remove them from every broadcast list.',
    })
    router.refresh()
  }

  // Interaction log
  const [showLog, setShowLog] = useState(false)
  const [log, setLog] = useState({ channel: 'whatsapp', direction: 'inbound', kind: 'service', summary: '' })
  const [logBusy, setLogBusy] = useState(false)
  const [logMsg, setLogMsg] = useState<Msg>(null)
  async function submitLog(e: React.FormEvent) {
    e.preventDefault()
    setLogBusy(true)
    setLogMsg(null)
    const r = await post('/api/admin/crm/interaction', { contactId: p.contactId, ...log })
    setLogBusy(false)
    if (!r.ok) return setLogMsg({ tone: 'err', text: r.error! })
    setLog({ ...log, summary: '' })
    setShowLog(false)
    router.refresh()
  }

  // Email consent (owner/admin)
  const [emailNote, setEmailNote] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMsg, setEmailMsg] = useState<Msg>(null)
  async function recordEmail(action: 'granted' | 'withdrawn') {
    if (action === 'granted' && !emailNote.trim()) {
      setEmailMsg({ tone: 'err', text: 'Say how the customer asked to receive emails.' })
      return
    }
    setEmailBusy(true)
    setEmailMsg(null)
    const r = await post('/api/admin/crm/consent', { contactId: p.contactId, channel: 'email', action, note: emailNote })
    setEmailBusy(false)
    if (!r.ok) return setEmailMsg({ tone: 'err', text: r.error! })
    setEmailNote('')
    setEmailMsg({ tone: 'ok', text: action === 'granted' ? 'Email opt-in recorded.' : 'Email consent withdrawn and address suppressed.' })
    router.refresh()
  }

  // Tags
  const [tag, setTag] = useState('')
  const [tagMsg, setTagMsg] = useState<Msg>(null)
  async function changeTag(value: string, remove = false) {
    const r = await post('/api/admin/crm/tag', { contactId: p.contactId, tag: value, remove })
    if (!r.ok) return setTagMsg({ tone: 'err', text: r.error! })
    setTag('')
    setTagMsg(null)
    router.refresh()
  }

  // Erasure (owner/admin)
  const [requestedOn, setRequestedOn] = useState('')
  const [confirm, setConfirm] = useState('')
  const [eraseBusy, setEraseBusy] = useState(false)
  const [eraseMsg, setEraseMsg] = useState<Msg>(null)
  async function erase() {
    setEraseBusy(true)
    setEraseMsg(null)
    const r = await post('/api/admin/crm/erase', {
      contactId: p.contactId,
      confirm,
      requestedAt: requestedOn ? new Date(`${requestedOn}T12:00:00Z`).toISOString() : undefined,
    })
    setEraseBusy(false)
    if (!r.ok) return setEraseMsg({ tone: 'err', text: r.error! })
    router.push('/admin/contacts')
  }

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="mb-1 text-sm font-semibold text-[#0D0D0D]">Record WhatsApp opt-in / STOP</h2>
        {!p.hasPhone ? (
          <p className="text-xs text-[#0D0D0D]/50">This contact has no phone number.</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-[#0D0D0D]/55">
              Currently: <strong>{p.whatsappGranted ? 'opted in' : 'not opted in'}</strong>. The customer&rsquo;s own message is the
              consent — paste it exactly.
            </p>
            <label htmlFor="wa-text" className="mb-1 block text-xs text-[#0D0D0D]/60">
              Message they sent
            </label>
            <textarea id="wa-text" rows={2} value={waText} onChange={(e) => setWaText(e.target.value)} placeholder="JOIN PepcoLab updates" className={input} />
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={waBusy} onClick={() => recordWa('granted')} className={`${btn} bg-[#0D0D0D] text-white`}>
                {waBusy && <Loader2 size={13} className="animate-spin" />} JOIN — opt in
              </button>
              <button type="button" disabled={waBusy} onClick={() => recordWa('withdrawn')} className={`${btn} border border-red-200 bg-red-50 text-red-700`}>
                STOP — opt out
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#0D0D0D]/45">
              After JOIN: send <code>/join</code>, label <em>Updates — opted in</em>. After STOP: send <code>/stop</code>, label{' '}
              <em>Opted out</em>, remove from every broadcast list.
            </p>
            <Note msg={waMsg} />
          </>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0D0D0D]">Log interaction</h2>
          {!showLog && (
            <button type="button" onClick={() => setShowLog(true)} className={`${btn} bg-[#0D0D0D] text-white`}>
              Log WhatsApp interaction
            </button>
          )}
        </div>
        {showLog && (
          <form onSubmit={submitLog} className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-[#0D0D0D]/60">
                Channel
                <select value={log.channel} onChange={(e) => setLog({ ...log, channel: e.target.value })} className={input}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </label>
              <label className="text-xs text-[#0D0D0D]/60">
                Direction
                <select value={log.direction} onChange={(e) => setLog({ ...log, direction: e.target.value })} className={input}>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </label>
              <label className="text-xs text-[#0D0D0D]/60">
                Kind
                <select value={log.kind} onChange={(e) => setLog({ ...log, kind: e.target.value })} className={input}>
                  <option value="service">Service</option>
                  <option value="marketing">Marketing</option>
                </select>
              </label>
            </div>
            <label className="block text-xs text-[#0D0D0D]/60">
              Summary
              <textarea rows={3} required value={log.summary} onChange={(e) => setLog({ ...log, summary: e.target.value })} className={input} />
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={logBusy} className={`${btn} bg-[#0D0D0D] text-white`}>
                {logBusy && <Loader2 size={13} className="animate-spin" />} Save
              </button>
              <button type="button" onClick={() => setShowLog(false)} className={`${btn} text-[#0D0D0D]/60`}>
                Cancel
              </button>
            </div>
            <Note msg={logMsg} />
          </form>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-2 text-sm font-semibold text-[#0D0D0D]">Tags</h2>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {p.tags.length === 0 && <span className="text-xs text-[#0D0D0D]/45">No tags.</span>}
          {p.tags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-[#F7F5F1] px-2.5 py-1 text-xs text-[#0D0D0D]">
              {t}
              <button type="button" aria-label={`Remove tag ${t}`} onClick={() => changeTag(t, true)} className="text-[#0D0D0D]/40 hover:text-[#0D0D0D]">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (tag.trim()) changeTag(tag)
          }}
          className="flex gap-2"
        >
          <label htmlFor="new-tag" className="sr-only">New tag</label>
          <input id="new-tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add a tag" className={input} />
          <button type="submit" className={`${btn} bg-[#0D0D0D] text-white`}>Add</button>
        </form>
        <Note msg={tagMsg} />
      </section>

      {staffFull && (
        <section className={card}>
          <h2 className="mb-1 text-sm font-semibold text-[#0D0D0D]">Email consent</h2>
          {!p.hasEmail ? (
            <p className="text-xs text-[#0D0D0D]/50">This contact has no email address.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-[#0D0D0D]/55">
                Currently: <strong>{p.emailGranted ? 'opted in' : 'not opted in'}</strong>. Record an opt-in only when the customer
                explicitly asked for updates.
              </p>
              <label htmlFor="email-note" className="mb-1 block text-xs text-[#0D0D0D]/60">
                How did they ask?
              </label>
              <input id="email-note" value={emailNote} onChange={(e) => setEmailNote(e.target.value)} className={input} />
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={emailBusy} onClick={() => recordEmail('granted')} className={`${btn} bg-[#0D0D0D] text-white`}>
                  Record opt-in
                </button>
                <button type="button" disabled={emailBusy} onClick={() => recordEmail('withdrawn')} className={`${btn} border border-red-200 bg-red-50 text-red-700`}>
                  Withdraw
                </button>
              </div>
              <Note msg={emailMsg} />
            </>
          )}
        </section>
      )}

      {staffFull && (
        <section className="rounded-xl border border-red-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold text-red-700">Erasure request</h2>
          <p className="mb-2 text-xs text-[#0D0D0D]/55">
            Deletes this contact, its consent history, interactions, tags, newsletter entry and guide lead. A scrambled copy of
            the email and phone is kept so they are never messaged again. Order records stay (tax). This cannot be undone.
          </p>
          <label htmlFor="erase-date" className="mb-1 block text-xs text-[#0D0D0D]/60">Request received on</label>
          <input id="erase-date" type="date" value={requestedOn} onChange={(e) => setRequestedOn(e.target.value)} className={`${input} mb-2`} />
          <label htmlFor="erase-confirm" className="mb-1 block text-xs text-[#0D0D0D]/60">Type ERASE to confirm</label>
          <input id="erase-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
          <button
            type="button"
            disabled={eraseBusy || confirm !== 'ERASE'}
            onClick={erase}
            className={`${btn} mt-2 w-full bg-red-700 text-white`}
          >
            {eraseBusy && <Loader2 size={13} className="animate-spin" />} Erase contact
          </button>
          <Note msg={eraseMsg} />
        </section>
      )}
    </div>
  )
}
