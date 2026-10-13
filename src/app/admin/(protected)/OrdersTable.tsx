// src/app/admin/(protected)/OrdersTable.tsx
'use client'
import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, Truck, Loader2, Replace, AlertTriangle } from 'lucide-react'
import type { OrderRecord, OrderStatus } from '@/lib/orderStore'

// Mirrors lib/orderStore.ts PAID_ORDER_STATUSES (kept local: this is a client
// component and orderStore imports the Redis client).
const PAID: ReadonlySet<OrderStatus> = new Set<OrderStatus>(['created', 'updated', 'awaiting_payment_mark', 'processing'])

// Mirrors lib/orderStore.ts isPaidOrder(): paid AND a real parcel. A top-up
// payment (topUpFor set) is paid but is never shipped on its own.
function isLiveOrder(o: OrderRecord): boolean {
  return PAID.has(o.status) && !o.topUpFor
}

/** One purchasable variant, for the Change item picker (built in page.tsx). */
export interface CatalogueVariant {
  variantId: string
  productTitle: string
  variantTitle: string
  price: number
  available: boolean
}

function lastDigits(phone?: string) {
  return (phone || '').replace(/\D/g, '').slice(-9)
}

/**
 * Paid orders that could be the top-up for `order`: same customer (email or
 * phone), placed at or after it, not shipped, not already a top-up for
 * something else, and not changed themselves.
 */
function topUpCandidates(order: OrderRecord, all: OrderRecord[]): OrderRecord[] {
  const email = (order.email || '').toLowerCase()
  const phone = lastDigits(order.phone)
  const from = new Date(order.createdAt).getTime()
  return all.filter((o) => {
    if (o.orderShortCode === order.orderShortCode) return false
    if (!PAID.has(o.status) || o.shippedAt || o.amendments?.length) return false
    if (o.topUpFor && o.topUpFor !== order.orderShortCode) return false
    if (new Date(o.createdAt).getTime() < from) return false
    const sameEmail = Boolean(email) && (o.email || '').toLowerCase() === email
    const samePhone = Boolean(phone) && lastDigits(o.phone) === phone
    return sameEmail || samePhone
  })
}

function ChangeItemForm({
  order,
  catalogue,
  candidates,
}: {
  order: OrderRecord
  catalogue: CatalogueVariant[]
  candidates: OrderRecord[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [productIndex, setProductIndex] = useState(0)
  const [variantId, setVariantId] = useState('')
  const [topUpCode, setTopUpCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn' | 'error'; text: string } | null>(null)

  const line = order.products[productIndex]
  const chosen = catalogue.find((v) => v.variantId === variantId)
  const quantity = line?.quantity || 1
  const difference = chosen && line ? Math.round((chosen.price * quantity - line.price * quantity) * 100) / 100 : null

  // Pre-select the top-up whose amount matches the difference exactly — the
  // common case, and the one most likely to be right.
  const pickDefaultTopUp = (diff: number | null) => {
    if (diff === null || diff <= 0) return ''
    const exact = candidates.find((c) => Math.abs(c.total - diff) < 0.01)
    return exact ? exact.orderShortCode : ''
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogueVariant[]>()
    for (const v of catalogue) {
      if (!map.has(v.productTitle)) map.set(v.productTitle, [])
      map.get(v.productTitle)!.push(v)
    }
    return Array.from(map.entries())
  }, [catalogue])

  const submit = async () => {
    if (!chosen) {
      setMessage({ tone: 'error', text: 'Pick the new item.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/orders/amend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'amend',
          orderShortCode: order.orderShortCode,
          productIndex,
          newVariantId: chosen.variantId,
          topUpOrderShortCode: topUpCode || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage({ tone: 'error', text: data.message || 'Could not change the item. Nothing was saved.' })
        return
      }
      const notes: string[] = []
      if (!data.shopifyEdited && data.shopifyError) notes.push(`Shopify stock NOT changed: ${data.shopifyError}`)
      if (data.warnings?.length) notes.push(...data.warnings)
      setMessage({
        tone: notes.length ? 'warn' : 'ok',
        text: `Changed. Now update Orcaflo by hand (alert emailed).${notes.length ? ' ' + notes.join(' ') : ''}`,
      })
      setOpen(false)
      router.refresh()
    } catch {
      setMessage({ tone: 'error', text: 'Network error — nothing was saved.' })
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full rounded-md border border-[#0D0D0D]/15 bg-white px-2.5 py-1.5 text-sm text-[#0D0D0D] outline-none focus:border-[#0D0D0D]/40'

  if (!open) {
    return (
      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={catalogue.length === 0}
          title={catalogue.length === 0 ? 'Catalogue could not be loaded from Shopify' : undefined}
          className="flex items-center gap-1.5 text-xs font-medium text-[#0D0D0D]/70 underline disabled:opacity-40"
        >
          <Replace size={13} /> Change item / strength
        </button>
        {message && (
          <div className={`mt-2 text-xs ${message.tone === 'ok' ? 'text-[#0A7B45]' : message.tone === 'warn' ? 'text-[#8A6A1E]' : 'text-red-700'}`}>
            {message.text}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-lg border border-[#0D0D0D]/10 bg-white p-3" onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#0D0D0D]/60">
        <Replace size={13} /> Change item
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {order.products.length > 1 ? (
          <select
            value={productIndex}
            onChange={(e) => {
              setProductIndex(Number(e.target.value))
              setVariantId('')
              setTopUpCode('')
            }}
            className={input}
            aria-label="Item to change"
          >
            {order.products.map((p, i) => (
              <option key={i} value={i}>
                Replace: {p.quantity}× {p.title}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-md border border-dashed border-[#0D0D0D]/15 px-2.5 py-1.5 text-sm text-[#0D0D0D]/70">
            Replace: {line?.quantity}× {line?.title} ({formatMoney(line?.price || 0, order.currency)})
          </div>
        )}
        <select
          value={variantId}
          onChange={(e) => {
            setVariantId(e.target.value)
            const v = catalogue.find((x) => x.variantId === e.target.value)
            const diff = v && line ? Math.round((v.price * quantity - line.price * quantity) * 100) / 100 : null
            setTopUpCode(pickDefaultTopUp(diff))
          }}
          className={input}
          aria-label="New item"
        >
          <option value="">With…</option>
          {grouped.map(([product, variants]) => (
            <optgroup key={product} label={product}>
              {variants.map((v) => (
                <option key={v.variantId} value={v.variantId}>
                  {product} — {v.variantTitle} · {formatMoney(v.price, 'AED')}{v.available ? '' : ' (out of stock)'}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {difference !== null && (
        <div className="mt-2 text-sm text-[#0D0D0D]/80">
          Price difference:{' '}
          <strong>
            {difference > 0 ? '+' : ''}
            {formatMoney(difference, order.currency)}
          </strong>
          {difference > 0 && ' — customer pays this'}
          {difference < 0 && ' — you may owe a refund'}
        </div>
      )}

      {difference !== null && difference > 0 && (
        <div className="mt-2">
          <select value={topUpCode} onChange={(e) => setTopUpCode(e.target.value)} className={input} aria-label="Top-up payment">
            <option value="">Difference not paid yet / paid another way</option>
            {candidates.map((c) => (
              <option key={c.orderShortCode} value={c.orderShortCode}>
                Paid by top-up {c.orderShortCode} · {formatMoney(c.total, c.currency)} · {formatDate(c.createdAt)}
                {c.products[0] ? ` · “${c.products[0].title}”` : ''}
              </option>
            ))}
          </select>
          {candidates.length === 0 && (
            <div className="mt-1 text-xs text-[#0D0D0D]/50">
              No paid order from this customer since this one. Send them a payment link for {formatMoney(difference, order.currency)} first, then come back and link it.
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-[#0D0D0D]/50 underline">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving || !chosen}
          className="ml-auto flex items-center gap-2 rounded-md bg-[#0D0D0D] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Change item
        </button>
      </div>
      <div className="mt-2 text-xs text-[#0D0D0D]/50">
        Updates this order and Shopify stock, folds the top-up in, and emails you what to change in Orcaflo. The customer is not emailed.
      </div>
      {message && (
        <div className={`mt-2 text-xs ${message.tone === 'ok' ? 'text-[#0A7B45]' : message.tone === 'warn' ? 'text-[#8A6A1E]' : 'text-red-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

function OrcafloPending({ order }: { order: OrderRecord }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const last = order.amendments?.[order.amendments.length - 1]

  const done = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/orders/amend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'orcaflo-done', orderShortCode: order.orderShortCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not save.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — nothing was saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start gap-2">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-semibold">Update Orcaflo by hand — the driver still sees the old item.</div>
          {last && (
            <div className="mt-1">
              Cancel the Orcaflo order for {last.from.quantity}× {last.from.title}, then create a new one for {last.to.quantity}× {last.to.title} (sold {formatMoney(last.to.price * last.to.quantity, order.currency)}, payment Card).
              {last.topUpOrderShortCode ? ` Difference already paid online (${last.topUpOrderShortCode}) — nothing to collect.` : ''}
            </div>
          )}
          {error && <div className="mt-1 text-xs">{error}</div>}
        </div>
        <button
          type="button"
          onClick={done}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-red-700 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          Orcaflo updated
        </button>
      </div>
    </div>
  )
}

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
  awaiting_payment: 'bg-[#0D0D0D]/10 text-[#0D0D0D]/60',
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

export default function OrdersTable({ orders, catalogue = [] }: { orders: OrderRecord[]; catalogue?: CatalogueVariant[] }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toShipOnly, setToShipOnly] = useState(false)

  const toShipCount = useMemo(
    () => orders.filter((o) => isLiveOrder(o) && !o.shippedAt).length,
    [orders]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = toShipOnly ? orders.filter((o) => isLiveOrder(o) && !o.shippedAt) : orders
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
                          {o.topUpFor && (
                            <span className="rounded-full bg-[#0D0D0D]/10 px-2.5 py-1 text-xs font-medium text-[#0D0D0D]/70">
                              top-up for {o.topUpFor}
                            </span>
                          )}
                          {o.orcafloUpdatePending && (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">update Orcaflo</span>
                          )}
                          {isLiveOrder(o) && (
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
                          {o.topUpFor && (
                            <div className="mt-3 text-sm text-[#0D0D0D]/70">
                              This payment is the price difference for <span className="font-mono">{o.topUpFor}</span>. It is not shipped on its own and gets no follow-up emails.
                            </div>
                          )}
                          {o.amendments?.length ? (
                            <div className="mt-3">
                              <div className="mb-1 text-xs font-medium text-[#0D0D0D]/50">Changes</div>
                              <ul className="space-y-1 text-xs text-[#0D0D0D]/70">
                                {o.amendments.map((a, i) => (
                                  <li key={i}>
                                    {formatDate(a.at)}: {a.from.quantity}× {a.from.title} → {a.to.quantity}× {a.to.title}
                                    {' '}({a.priceDifference > 0 ? '+' : ''}{formatMoney(a.priceDifference, o.currency)})
                                    {a.topUpOrderShortCode ? ` · paid by ${a.topUpOrderShortCode}` : ''}
                                    {a.shopifyEdited ? ' · Shopify stock updated' : ` · Shopify NOT updated${a.shopifyError ? `: ${a.shopifyError}` : ''}`}
                                    {a.orcafloUpdatedAt ? ` · Orcaflo updated ${formatDate(a.orcafloUpdatedAt)}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {o.orcafloUpdatePending && <OrcafloPending order={o} />}
                          {isLiveOrder(o) && !o.shippedAt && (
                            <ChangeItemForm order={o} catalogue={catalogue} candidates={topUpCandidates(o, orders)} />
                          )}
                          {isLiveOrder(o) && <DispatchForm order={o} />}
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