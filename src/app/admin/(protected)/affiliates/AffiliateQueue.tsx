'use client'

// src/app/admin/(protected)/affiliates/AffiliateQueue.tsx
//
// Approve / suspend UI for the affiliate queue.
//
// Approving is not cosmetic: it mints a live, unlimited discount code in the
// affiliate's name and lets them start earning. So the approve button asks
// for confirmation and names the person, and the row shows what they have
// actually produced before you decide.

import { useState } from 'react'

export type AffiliateRow = {
  code: string
  name: string
  email: string
  audience: string
  status: 'pending' | 'active' | 'suspended'
  commissionPercent: number
  createdAt: string
  approvedAt: string | null
  clicks: number
  orders: number
  grossCommission: number
  pendingCommission: number
  approvedCommission: number
  currency: string
}

const STATUS_STYLE: Record<AffiliateRow['status'], { bg: string; fg: string; label: string }> = {
  pending: { bg: '#fef3c7', fg: '#92400e', label: 'Awaiting approval' },
  active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
  suspended: { bg: '#fee2e2', fg: '#991b1b', label: 'Suspended' },
}

export default function AffiliateQueue({
  rows,
  loadError,
  defaultCommission,
  minPayout,
}: {
  rows: AffiliateRow[]
  loadError: string | null
  defaultCommission: number
  minPayout: number
}) {
  const [items, setItems] = useState(rows)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function act(code: string, action: 'approve' | 'suspend', name: string) {
    if (action === 'approve' && !confirm(`Approve ${name}?\n\nThis activates their discount code immediately and they can start earning commission.`)) return
    if (action === 'suspend' && !confirm(`Suspend ${name}?\n\nTheir code stops working. Commission already earned is unaffected.`)) return

    setBusy(code)
    setError(null)
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, action }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.message || `Could not ${action}.`)
      setItems((prev) =>
        prev.map((r) =>
          r.code === code
            ? { ...r, status: action === 'approve' ? 'active' : 'suspended', approvedAt: data.affiliate?.approvedAt ?? r.approvedAt }
            : r
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const pendingCount = items.filter((r) => r.status === 'pending').length
  const money = (n: number, c: string) => `${c} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  return (
    <div style={{ padding: '28px 0' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: '0 0 6px' }}>Affiliates</h1>
      <p style={{ color: 'rgba(13,13,13,.6)', fontSize: 14, margin: '0 0 20px' }}>
        {pendingCount > 0
          ? `${pendingCount} application${pendingCount === 1 ? '' : 's'} waiting. Approving activates the discount code immediately.`
          : 'No applications waiting.'}{' '}
        Default rate {defaultCommission}% · minimum payout {money(minPayout, 'AED')}.
      </p>

      {loadError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {loadError}
        </div>
      )}
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {items.length === 0 && !loadError && (
        <div style={{ border: '1px dashed rgba(13,13,13,.18)', borderRadius: 12, padding: '36px 24px', textAlign: 'center', color: 'rgba(13,13,13,.5)' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'rgba(13,13,13,.7)' }}>Nobody has applied yet.</p>
          <p style={{ margin: 0, fontSize: 13.5 }}>
            The programme page is live at /affiliates. Applications appear here for approval.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((r) => {
          const s = STATUS_STYLE[r.status]
          return (
            <div key={r.code} style={{ border: '1px solid rgba(13,13,13,.1)', borderRadius: 12, padding: '16px 18px', background: '#fff' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15.5 }}>{r.name}</span>
                <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999 }}>
                  {s.label}
                </span>
                <code style={{ fontSize: 12.5, background: '#f4f4f5', padding: '3px 8px', borderRadius: 6 }}>{r.code}</code>
                <span style={{ fontSize: 12.5, color: 'rgba(13,13,13,.5)' }}>{r.commissionPercent}% commission</span>
              </div>

              <div style={{ fontSize: 13.5, color: 'rgba(13,13,13,.65)', marginBottom: 10 }}>
                <div>{r.email}</div>
                {r.audience && <div style={{ marginTop: 3 }}><span style={{ color: 'rgba(13,13,13,.45)' }}>Audience:</span> {r.audience}</div>}
                <div style={{ marginTop: 3, color: 'rgba(13,13,13,.45)', fontSize: 12.5 }}>
                  Applied {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {r.approvedAt && ` · approved ${new Date(r.approvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </div>
              </div>

              {r.status !== 'pending' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, padding: '10px 0', borderTop: '1px solid rgba(13,13,13,.07)', fontSize: 13 }}>
                  <span><strong>{r.clicks}</strong> clicks</span>
                  <span><strong>{r.orders}</strong> orders</span>
                  <span style={{ color: '#166534' }}><strong>{money(r.approvedCommission, r.currency)}</strong> payable</span>
                  <span style={{ color: 'rgba(13,13,13,.5)' }}>{money(r.pendingCommission, r.currency)} in hold</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {r.status !== 'active' && (
                  <button
                    onClick={() => act(r.code, 'approve', r.name)}
                    disabled={busy === r.code}
                    style={{ minHeight: 40, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#166534', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: busy === r.code ? 'wait' : 'pointer', opacity: busy === r.code ? 0.6 : 1 }}
                  >
                    {busy === r.code ? 'Working…' : r.status === 'pending' ? 'Approve' : 'Re-activate'}
                  </button>
                )}
                {r.status === 'active' && (
                  <button
                    onClick={() => act(r.code, 'suspend', r.name)}
                    disabled={busy === r.code}
                    style={{ minHeight: 40, padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(13,13,13,.18)', background: '#fff', color: '#991b1b', fontSize: 13.5, fontWeight: 600, cursor: busy === r.code ? 'wait' : 'pointer', opacity: busy === r.code ? 0.6 : 1 }}
                  >
                    {busy === r.code ? 'Working…' : 'Suspend'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}