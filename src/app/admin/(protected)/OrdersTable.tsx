// src/app/admin/(protected)/OrdersTable.tsx
'use client'
import { Fragment, useMemo, useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import type { OrderRecord, OrderStatus } from '@/lib/orderStore'

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((o) =>
      [o.orderShortCode, o.email, o.customerName, o.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    )
  }, [orders, query])

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#0D0D0D]/10 bg-white px-3 py-2">
        <Search size={14} className="text-[#0D0D0D]/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or order #"
          className="w-full text-sm text-[#0D0D0D] outline-none placeholder:text-[#0D0D0D]/40"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#0D0D0D]/15 py-16 text-center text-sm text-[#0D0D0D]/50">
          {orders.length === 0 ? 'No orders yet.' : 'No orders match that search.'}
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
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[o.status]}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
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
                              <div className="text-[#0D0D0D]/50">
                                Last updated {new Date(o.updatedAt).toLocaleString('en-GB')}
                              </div>
                            </div>
                          </div>
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
