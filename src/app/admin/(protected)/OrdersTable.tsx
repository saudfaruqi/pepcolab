// src/app/admin/(protected)/OrdersTable.tsx
'use client'
import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, Truck, Loader2 } from 'lucide-react'
import type { OrderRecord, OrderStatus } from '@/lib/orderStore'

// Mirrors lib/orderStore.ts PAID_ORDER_STATUSES (kept local: this is a client
// component and orderStore imports the Redis client).
const PAID: ReadonlySet<OrderStatus> = new Set<OrderStatus>(['created', 'updated', 'awaiting_payment_mark', 'processing'])

// Keys match CARRIER_URLS in app/api/admin/tracking/route.ts, so a tracking
// link is built automatically. "Other" stores the number without a link
// unless a URL is pasted.
const CARRIERS = [
  { value: 'Aramex', label: 'Aramex' },
  { value: 'DHL', label: 'DHL' },
  { value: 'FedEx', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' },
  { value: 'Emirates Post', label: 'Emirates Post' },
  { value: 'SMSA', label: 'SMSA' },
  { value: '', label: 'Other' },
]

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DispatchForm({ order }: { order: OrderRecord }) {
  const router = useRouter()
  const knownCarrier = CARRIERS.find((c) => c.value && c.value.toLowerCase() === (order.carrier || '').toLowerCase())
  const [showTracking, setShowTracking] = useState(Boolean(order.trackingNumber))
  const [carrier, setCarrier] = useState(knownCarrier ? knownCarrier.value : order.carrier ? '' : 'Aramex')
  const [otherCarrier, setOtherCarrier] = useState(knownCarrier ? '' : order.carrier || '')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [trackingUrl, setTrackingUrl] = useState(knownCarrier ? '' : order.trackingUrl || '')
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(null)

  const dispatched = Boolean(order.shippedAt)
  const alreadyEmailed = Boolean(order.shippedEmailSentAt)

  const post = async (payload: Record<string, unknown>) => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderShortCode: order.orderShortCode, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage({ tone: 'error', text: data.message || 'Could not save. Try again.' })
        return null
      }
      router.refresh()
      return data
    } catch {
      setMessage({ tone: 'error', text: 'Network error — nothing was saved.' })
      return null
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    const withTracking = showTracking && trackingNumber.trim()
    const data = await post({
      trackingNumber: withTracking ? trackingNumber.trim() : '',
      carrier: withTracking ? (carrier || otherCarrier.trim()) : '',
      trackingUrl: withTracking && !carrier ? trackingUrl.trim() : '',
      notifyCustomer: notify && !alreadyEmailed,
    })
    if (!data) return
    if (data.emailed) {
      setMessage({ tone: 'ok', text: `Saved. ${order.email} has been emailed that it's on its way.` })
    } else if (data.emailSkippedReason) {
      setMessage({ tone: 'warn', text: `Saved, but no email sent: ${data.emailSkippedReason}` })
    } else {
      setMessage({ tone: 'ok', text: 'Saved. Customer not emailed.' })
    }
  }

  const undo = async () => {
    const data = await post({ clearDispatch: true })
    if (data) setMessage({ tone: 'ok', text: 'Dispatch undone.' })
  }

  const input = 'w-full rounded-md border border-[#0D0D0D]/15 bg-white px-2.5 py-1.5 text-sm text-[#0D0D0D] outline-none focus:border-[#0D0D0D]/40'

  return (
    <div className="mt-4 rounded-lg border border-[#0D0D0D]/10 bg-white p-3" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-[#0D0D0D]/60">
        <Truck size={13} />
        {dispatched ? `Dispatched ${formatDate(order.shippedAt)}` : 'Not dispatched yet'}
        {alreadyEmailed && <span className="text-[#0A7B45]">· customer emailed {formatDate(order.shippedEmailSentAt)}</span>}
        {dispatched && !alreadyEmailed && (
          <button type="button" onClick={undo} disabled={saving} className="ml-auto text-xs text-[#0D0D0D]/50 underline">
            Undo dispatch
          </button>
        )}
      </div>

      {!showTracking ? (
        <button type="button" onClick={() => setShowTracking(true)} className="mb-2 text-xs font-medium text-[#0D0D0D]/60 underline">
          + Add tracking number (optional)
        </button>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={input} aria-label="Carrier">
              {CARRIERS.map((c) => (
                <option key={c.label} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Tracking number"
              className={input}
              aria-label="Tracking number"
            />
            {carrier === '' ? (
              <input
                value={otherCarrier}
                onChange={(e) => setOtherCarrier(e.target.value)}
                placeholder="Carrier name"
                className={input}
                aria-label="Carrier name"
              />
            ) : <div className="hidden sm:block" />}
          </div>
          {carrier === '' && (
            <input
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="Tracking link (optional, https://…)"
              className={`${input} mt-2`}
              aria-label="Tracking link"
            />
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!alreadyEmailed && (
          <label className="flex items-center gap-2 text-sm text-[#0D0D0D]/80">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Email the customer it&rsquo;s on its way
          </label>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="ml-auto flex items-center gap-2 rounded-md bg-[#0D0D0D] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {dispatched ? 'Save' : 'Mark as dispatched'}
        </button>
      </div>
      {message && (
        <div className={`mt-2 text-xs ${message.tone === 'ok' ? 'text-[#0A7B45]' : message.tone === 'warn' ? 'text-[#8A6A1E]' : 'text-red-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  created: 'bg-[#0A7B45]/10 text-[#0A7B45]',
  updated: 'bg-[#0A7B45]/10 text-[#0A7B45]',
  awaiting_payment_mark: 'bg-[#C8992A]/15 text-[#8A6A1E]',
  processing: 'bg-[#C8992A]/15 text-[#8A6A1E]',
  failed: 'bg-red-100 text-red-700',
  abandoned: 'bg-[#0D0D0D]/10 text-[#0D0D0D]/60',
  refunded: 'bg-[#0D0D0D]/10 text-[#0D0D0D]/60',
  chargeback: 'bg-red-100 text-red-700',
}

function formatMoney(total: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(total)
  } catch {
    return `${currency} ${total.toFixed(2)}`
  }
}

export default function OrdersTable({ orders }: { orders: OrderRecord[] }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toShipOnly, setToShipOnly] = useState(false)

  const toShipCount = useMemo(
    () => orders.filter((o) => PAID.has(o.status) && !o.shippedAt).length,
    [orders]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = toShipOnly ? orders.filter((o) => PAID.has(o.status) && !o.shippedAt) : orders
    if (!q) return base
    return base.filter((o) =>
      [o.orderShortCode, o.email, o.customerName, o.phone, o.trackingNumber]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    )
  }, [orders, query, toShipOnly])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-[#0D0D0D]/10 bg-white px-3 py-2">
          <Search size={14} className="text-[#0D0D0D]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, order # or tracking #"
            className="w-full text-sm text-[#0D0D0D] outline-none placeholder:text-[#0D0D0D]/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setToShipOnly((v) => !v)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
            toShipOnly ? 'border-[#0D0D0D] bg-[#0D0D0D] text-white' : 'border-[#0D0D0D]/10 bg-white text-[#0D0D0D]'
          }`}
        >
          <Truck size={14} />
          To ship ({toShipCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#0D0D0D]/15 py-16 text-center text-sm text-[#0D0D0D]/50">
          {orders.length === 0
            ? 'No orders yet.'
            : toShipOnly && !query
              ? 'Nothing waiting to ship.'
              : 'No orders match that search.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#0D0D0D]/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#0D0D0D]/10 text-xs text-[#0D0D0D]/50">
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const isOpen = expanded === o.orderShortCode
                return (
                  <Fragment key={o.orderShortCode}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : o.orderShortCode)}
                      className="cursor-pointer border-b border-[#0D0D0D]/5 last:border-0 hover:bg-[#F7F5F1]/60"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#0D0D0D]/70">{o.orderShortCode}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0D0D0D]">{o.customerName || '—'}</div>
                        <div className="text-xs text-[#0D0D0D]/50">{o.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#0D0D0D]/60">
                        {new Date(o.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#0D0D0D]">
                        {formatMoney(o.total, o.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[o.status]}`}>
                            {o.status.replace(/_/g, ' ')}
                          </span>
                          {PAID.has(o.status) && (
                            o.shippedAt ? (
                              <span className="rounded-full bg-[#0A7B45]/10 px-2.5 py-1 text-xs font-medium text-[#0A7B45]">dispatched</span>
                            ) : (
                              <span className="rounded-full bg-[#C8992A]/15 px-2.5 py-1 text-xs font-medium text-[#8A6A1E]">to ship</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#0D0D0D]/30">
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-[#0D0D0D]/5 bg-[#F7F5F1]/40">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <div className="mb-1 text-xs font-medium text-[#0D0D0D]/50">Items</div>
                              <ul className="space-y-1 text-sm text-[#0D0D0D]">
                                {o.products.map((p, i) => (
                                  <li key={i}>
                                    {p.quantity}× {p.title}
                                    {p.variantOptions?.length ? ` (${p.variantOptions.join(', ')})` : ''}
                                    <span className="text-[#0D0D0D]/50"> — {formatMoney(p.price, o.currency)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="text-sm text-[#0D0D0D]/70">
                              {o.phone && <div>Phone: {o.phone}</div>}
                              {o.shopifyOrderId && <div>Shopify order ID: {o.shopifyOrderId}</div>}
                              {o.failureReason && (
                                <div className="text-red-700">Failure reason: {o.failureReason}</div>
                              )}
                              {o.trackingNumber && (
                                <div>
                                  Tracking: {o.carrier ? `${o.carrier} · ` : ''}
                                  {o.trackingUrl ? (
                                    <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline" onClick={(e) => e.stopPropagation()}>
                                      {o.trackingNumber}
                                    </a>
                                  ) : o.trackingNumber}
                                </div>
                              )}
                              <div className="mt-1 text-xs text-[#0D0D0D]/50">
                                Emails: {[
                                  o.shippedEmailSentAt && `dispatch ${formatDate(o.shippedEmailSentAt)}`,
                                  o.aftercareEmailSentAt && `check-in ${formatDate(o.aftercareEmailSentAt)}`,
                                  o.reviewRequestSentAt && `review ${formatDate(o.reviewRequestSentAt)}`,
                                  o.crossSellEmailSentAt && `cross-sell ${formatDate(o.crossSellEmailSentAt)}`,
                                  o.reorderReminderSentAt && `reorder ${formatDate(o.reorderReminderSentAt)}`,
                                ].filter(Boolean).join(' · ') || 'confirmation only'}
                              </div>
                              <div className="text-[#0D0D0D]/50">
                                Last updated {new Date(o.updatedAt).toLocaleString('en-GB')}
                              </div>
                            </div>
                          </div>
                          {PAID.has(o.status) && <DispatchForm order={o} />}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}