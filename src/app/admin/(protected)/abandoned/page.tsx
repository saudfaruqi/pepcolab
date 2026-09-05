// src/app/admin/(protected)/abandoned/page.tsx
//
// Abandoned checkouts. The cron emails on a schedule; this is where you can
// see the list, tell a recoverable cart from an empty record, and reach
// someone now rather than at the next scheduled run.
import { listAbandonedOrders } from '@/lib/orderStore'
import AbandonedTable, { type AbandonedRow } from './AbandonedTable'

export const dynamic = 'force-dynamic'

export default async function AdminAbandonedPage() {
  let rows: AbandonedRow[] = []
  let loadError: string | null = null

  try {
    rows = (await listAbandonedOrders(200)).map(o => ({
      orderShortCode: o.orderShortCode,
      email: o.email,
      phone: o.phone ?? null,
      customerName: o.customerName ?? null,
      createdAt: o.createdAt,
      currency: o.currency,
      total: o.total,
      itemCount: o.products?.length ?? 0,
      recoveryEmailStage: o.recoveryEmailStage ?? 0,
      products: (o.products ?? []).map(p => ({ title: p.title, quantity: p.quantity })),
    }))
  } catch (err) {
    console.error('[admin/abandoned] Failed to load:', err)
    loadError = 'Could not load abandoned checkouts — check the server logs.'
  }

  const withItems = rows.filter(r => r.itemCount > 0).length
  const withoutItems = rows.length - withItems

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Abandoned checkouts</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          {rows.length} records &mdash; {withItems} with items, {withoutItems} without. Grouped by
          person, since one customer retrying creates several records.
        </p>
      </div>

      {withoutItems > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[13px] leading-relaxed text-amber-900">
            <strong>{withoutItems} of these captured no items.</strong> STRABL is recording the
            checkout before a cart is attached, so those records hold an email and a phone number
            but nothing to recover. The automated email skips them entirely &mdash; correctly,
            since it would show an empty basket. They are still worth a direct message, and the
            pattern is worth raising with STRABL: if the cart were attached at that point, every
            one of these would be recoverable automatically.
          </p>
        </div>
      )}

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>
      ) : (
        <AbandonedTable rows={rows} />
      )}
    </div>
  )
}