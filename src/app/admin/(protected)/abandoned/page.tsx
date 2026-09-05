// src/app/admin/(protected)/abandoned/page.tsx
//
// Abandoned checkouts. The cron emails on a schedule; this is where you can
// see the list, tell a recoverable cart from an empty record, and reach
// someone now rather than at the next scheduled run.
import { listAbandonedOrders, getOrdersForEmail } from '@/lib/orderStore'
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
      laterOrdered: false,
    }))

    // WHO ACTUALLY BOUGHT (Sep 2026).
    //
    // STRABL writes the abandoned record when checkout OPENS, under its own
    // AC-* code; a completed order gets a different code, so nothing ever
    // clears the abandoned one. People who went on to buy stay on this list
    // indefinitely, looking like lost sales.
    //
    // Resolved per unique email rather than per record, so a customer with
    // four attempts costs one lookup, not four.
    const uniqueEmails = [...new Set(rows.map(r => r.email).filter(Boolean))]
    const converted = new Set<string>()
    await Promise.all(
      uniqueEmails.map(async email => {
        const history = await getOrdersForEmail(email, 50)
        const real = history.filter(
          o => o.status !== 'abandoned' && o.status !== 'failed' && (o.products?.length ?? 0) > 0
        )
        if (real.length > 0) converted.add(email.toLowerCase())
      })
    )
    rows = rows.map(r => ({ ...r, laterOrdered: converted.has((r.email || '').toLowerCase()) }))
  } catch (err) {
    console.error('[admin/abandoned] Failed to load:', err)
    loadError = 'Could not load abandoned checkouts — check the server logs.'
  }

  const withItems = rows.filter(r => r.itemCount > 0).length
  const withoutItems = rows.length - withItems
  const converted = new Set(rows.filter(r => r.laterOrdered).map(r => r.email.toLowerCase())).size

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Abandoned checkouts</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          {rows.length} records &mdash; {withItems} with items, {withoutItems} without
          {converted > 0 && <>, {converted} from people who went on to order</>}. Grouped by
          person, since one customer retrying creates several records.
        </p>
      </div>

      {converted > 0 && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[13px] leading-relaxed text-green-900">
            <strong>{converted} of these people went on to place a real order.</strong> STRABL
            writes the abandoned record when checkout opens, and the completed order arrives under
            a different code &mdash; so nothing ever clears the first one and paying customers sit
            here looking like lost sales. They&rsquo;re marked below and the send button is
            disabled for them: emailing &ldquo;did something go wrong?&rdquo; to someone whose
            order you already shipped tells them you don&rsquo;t know what you sold them.
          </p>
        </div>
      )}

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