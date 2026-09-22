'use client'

// src/app/affiliates/AffiliateClient.tsx
//
// The application form and the affiliate's own dashboard, in one component
// because they are the same conversation at different stages: apply, then
// come back and check what you have earned.
//
// No login, deliberately: the dashboard is keyed on the email the person
// applied with, and a miss returns the same message as a wrong address so
// the endpoint cannot be used to find out who our affiliates are.

import { useState, useCallback } from 'react'

const INK = '#0D0D0D'
const BORDER = 'rgba(13,13,13,.14)'
const SOFT = 'rgba(13,13,13,.08)'
const GREEN = '#0A7B45'

interface Stats {
  clicks: number
  orders: number
  grossCommission: number
  pendingCommission: number
  approvedCommission: number
  paidCommission: number
  currency: string
}

interface Profile {
  code: string
  name: string
  status: 'pending' | 'active' | 'suspended'
  commissionPercent: number
  createdAt: string
  approvedAt: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 15px',
  fontSize: 15,
  color: INK,
  background: '#fff',
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: '.04em',
  textTransform: 'uppercase',
  color: 'rgba(13,13,13,.5)',
  margin: '0 0 7px',
}

export default function AffiliateClient({ siteOrigin }: { siteOrigin: string }) {
  const [mode, setMode] = useState<'apply' | 'check'>('apply')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [audience, setAudience] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<{ code: string } | null>(null)
  const [dash, setDash] = useState<{ profile: Profile; stats: Stats } | null>(null)
  const [notFound, setNotFound] = useState<string | null>(null)

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return { ok: res.ok, data: await res.json().catch(() => null) }
  }, [])

  const submitApplication = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setBusy(true)
      setError(null)
      const { ok, data } = await post({ action: 'apply', name, email, audience })
      setBusy(false)
      if (!ok || !data?.ok) {
        setError(data?.error || 'Could not submit that just now.')
        return
      }
      setApplied({ code: data.code })
    },
    [name, email, audience, post]
  )

  const checkStats = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setBusy(true)
      setError(null)
      setNotFound(null)
      setDash(null)
      const { ok, data } = await post({ action: 'stats', email })
      setBusy(false)
      if (!ok) {
        setError(data?.error || 'Could not check that just now.')
        return
      }
      if (!data?.found) {
        setNotFound(data?.message || 'No application found under that address.')
        return
      }
      setDash({ profile: data.profile, stats: data.stats })
    },
    [email, post]
  )

  const money = (n: number, c: string) => `${c} ${n.toFixed(2)}`

  if (applied) {
    return (
      <div style={{ padding: '22px 24px', border: `1px solid ${GREEN}33`, background: `${GREEN}0A`, borderRadius: 16, maxWidth: 620 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: GREEN }}>
          Application received
        </p>
        <p style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.7, color: INK }}>
          Your code will be <strong style={{ fontFamily: "'DM Mono',ui-monospace,monospace" }}>{applied.code}</strong>.
        </p>
        <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.75, color: 'rgba(13,13,13,.65)' }}>
          It does not work yet. We look at every application by hand before
          switching a code on, because an active code is a standing discount
          with our name attached. You will hear from us at {email}. Once it is
          live, come back to this page and check your earnings with that same
          address.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <div role="tablist" style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {(['apply', 'check'] as const).map(m => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setError(null); setNotFound(null); setDash(null) }}
            style={{
              padding: '10px 18px', fontSize: 14, fontWeight: 700,
              color: mode === m ? '#fff' : INK,
              background: mode === m ? INK : 'transparent',
              border: `1px solid ${mode === m ? INK : BORDER}`,
              borderRadius: 999, cursor: 'pointer',
            }}
          >
            {m === 'apply' ? 'Apply' : 'Check earnings'}
          </button>
        ))}
      </div>

      {mode === 'apply' ? (
        <form onSubmit={submitApplication}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="aff-name" style={labelStyle}>Name</label>
            <input id="aff-name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required maxLength={80} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="aff-email" style={labelStyle}>Email</label>
            <input id="aff-email" type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="aff-audience" style={labelStyle}>Where would you be promoting?</label>
            <textarea
              id="aff-audience"
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
              value={audience}
              onChange={e => setAudience(e.target.value)}
              required
              maxLength={500}
              placeholder="A channel, a newsletter, a community, a clinic — a sentence is plenty."
            />
          </div>
          <button type="submit" disabled={busy} style={{ padding: '14px 28px', fontSize: 15, fontWeight: 700, color: '#fff', background: INK, border: 'none', borderRadius: 12, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Sending…' : 'Apply to the programme'}
          </button>
        </form>
      ) : (
        <form onSubmit={checkStats}>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="aff-check-email" style={labelStyle}>The email you applied with</label>
            <input id="aff-check-email" type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
          </div>
          <button type="submit" disabled={busy} style={{ padding: '14px 28px', fontSize: 15, fontWeight: 700, color: '#fff', background: INK, border: 'none', borderRadius: 12, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Checking…' : 'Check earnings'}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" style={{ marginTop: 16, fontSize: 14.5, color: '#B3261E' }}>{error}</p>
      )}

      {notFound && (
        <p style={{ marginTop: 16, fontSize: 14.5, lineHeight: 1.7, color: 'rgba(13,13,13,.65)' }}>{notFound}</p>
      )}

      {dash && (
        <div style={{ marginTop: 28, border: `1px solid ${SOFT}`, borderRadius: 16, background: '#fff', padding: '22px 24px' }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: dash.profile.status === 'active' ? GREEN : 'rgba(13,13,13,.45)' }}>
            {dash.profile.status === 'active' ? 'Active' : dash.profile.status === 'pending' ? 'Awaiting review' : 'Suspended'}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 800, color: INK, fontFamily: "'DM Mono',ui-monospace,monospace" }}>
            {dash.profile.code}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(13,13,13,.6)' }}>
            {dash.profile.commissionPercent}% of every order placed with it.
          </p>

          {dash.profile.status === 'active' && (
            <p style={{ margin: '14px 0 0', fontSize: 13.5, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', wordBreak: 'break-all' }}>
              Your link:{' '}
              <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", color: INK }}>
                {siteOrigin}/?ref={dash.profile.code}
              </span>
            </p>
          )}

          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 18, margin: '24px 0 0' }}>
            {[
              ['Clicks', String(dash.stats.clicks)],
              ['Orders', String(dash.stats.orders)],
              ['Earned', money(dash.stats.grossCommission, dash.stats.currency)],
              ['On hold', money(dash.stats.pendingCommission, dash.stats.currency)],
              ['Payable', money(dash.stats.approvedCommission, dash.stats.currency)],
              ['Paid out', money(dash.stats.paidCommission, dash.stats.currency)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)' }}>
                  {label}
                </dt>
                <dd style={{ margin: '5px 0 0', fontSize: 18, fontWeight: 700, color: INK }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}