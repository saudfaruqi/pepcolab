// src/app/admin/(crm)/contacts/page.tsx
//
// Contacts list (brief B6): search by name, email, phone or order number,
// filter by market, consent, order activity and tag. Every staff role can
// view; exports are owner-only and imports owner/admin.
import Link from 'next/link'
import { Contact as ContactIcon, Download, Upload, MessageCircle } from 'lucide-react'
import { parseFilters, queryContacts } from '@/lib/crm/query'
import { allTags } from '@/lib/crm/store'
import { SOURCE_LABELS } from '@/lib/crm/types'
import { requirePageStaff } from '../session'
import { ConsentBadge, fmtDate } from '../ui'
import NewContactForm from './NewContactForm'

export const dynamic = 'force-dynamic'

const MAX_ROWS = 500

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const staff = await requirePageStaff()
  const filters = parseFilters(searchParams)
  const [rows, tags] = await Promise.all([queryContacts(filters), allTags()])
  const emailMarketable = rows.filter((r) => r.emailMarketable).length
  const waMarketable = rows.filter((r) => r.whatsappMarketable).length
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString()

  const select = 'rounded-lg border border-[#0D0D0D]/15 bg-white px-2.5 py-2 text-sm text-[#0D0D0D]'

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-[#0D0D0D]">
            <ContactIcon size={18} /> Contacts
          </h1>
          <p className="text-sm text-[#0D0D0D]/50">
            Every customer and subscriber, with consent history per channel. Marketing goes only to contacts whose latest
            consent is granted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {staff.role === 'owner' && (
            <a
              href={`/api/admin/crm/export${qs ? `?${qs}` : ''}`}
              className="flex items-center gap-1.5 rounded-full border border-[#0D0D0D]/15 bg-white px-3.5 py-2 text-xs font-medium text-[#0D0D0D]"
            >
              <Download size={13} /> Export CSV
            </a>
          )}
          {staff.role !== 'agent' && (
            <>
              <Link
                href="/admin/contacts/import"
                className="flex items-center gap-1.5 rounded-full border border-[#0D0D0D]/15 bg-white px-3.5 py-2 text-xs font-medium text-[#0D0D0D]"
              >
                <Upload size={13} /> Imports &amp; audit
              </Link>
              <Link
                href="/admin/contacts/whatsapp"
                className="flex items-center gap-1.5 rounded-full border border-[#0D0D0D]/15 bg-white px-3.5 py-2 text-xs font-medium text-[#0D0D0D]"
              >
                <MessageCircle size={13} /> WhatsApp broadcast export
              </Link>
            </>
          )}
        </div>
      </div>

      <NewContactForm />

      <form method="GET" className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-[#0D0D0D]/10 bg-white p-3">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Search
          <input
            name="q"
            defaultValue={filters.q ?? ''}
            placeholder="Name, email, phone or order number"
            className="rounded-lg border border-[#0D0D0D]/15 px-3 py-2 text-sm text-[#0D0D0D]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Market
          <select name="market" defaultValue={filters.market ?? ''} className={select}>
            <option value="">Any</option>
            <option value="UAE">UAE</option>
            <option value="UK">UK</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Email consent
          <select name="email" defaultValue={filters.email ?? ''} className={select}>
            <option value="">Any</option>
            <option value="yes">Can email</option>
            <option value="no">Cannot email</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          WhatsApp consent
          <select name="whatsapp" defaultValue={filters.whatsapp ?? ''} className={select}>
            <option value="">Any</option>
            <option value="yes">Can WhatsApp</option>
            <option value="no">Cannot WhatsApp</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Orders
          <select name="activity" defaultValue={filters.activity ?? ''} className={select}>
            <option value="">Any</option>
            <option value="recent90">Ordered in last 90 days</option>
            <option value="lapsed">Lapsed 90–180 days</option>
            <option value="never">Never ordered</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[#0D0D0D]/60">
          Tag
          <select name="tag" defaultValue={filters.tag ?? ''} className={select}>
            <option value="">Any</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-full bg-[#0D0D0D] px-4 py-2 text-sm font-semibold text-white">
          Apply
        </button>
        {qs && (
          <Link href="/admin/contacts" className="px-2 py-2 text-xs text-[#0D0D0D]/50 underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white px-3 py-1.5 font-medium text-[#0D0D0D]">{rows.length} contacts</span>
        <span className="rounded-full bg-[#0A7B45]/10 px-3 py-1.5 font-medium text-[#0A7B45]">{emailMarketable} emailable</span>
        <span className="rounded-full bg-[#0A7B45]/10 px-3 py-1.5 font-medium text-[#0A7B45]">{waMarketable} on WhatsApp updates</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#0D0D0D]/15 bg-white py-16 text-center text-sm text-[#0D0D0D]/50">
          {qs ? 'No contacts match these filters.' : 'No contacts yet. An owner or admin can sync orders from Imports.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0D0D0D]/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#0D0D0D]/10 text-xs text-[#0D0D0D]/50">
              <tr>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">Email / phone</th>
                <th className="px-3 py-2.5 font-medium">Market</th>
                <th className="px-3 py-2.5 font-medium">Source</th>
                <th className="px-3 py-2.5 font-medium">Orders</th>
                <th className="px-3 py-2.5 font-medium">LTV (AED)</th>
                <th className="px-3 py-2.5 font-medium">Last order</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">WhatsApp</th>
                <th className="px-3 py-2.5 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, MAX_ROWS).map((r) => (
                <tr key={r.id} className="border-b border-[#0D0D0D]/5 align-top hover:bg-[#F7F5F1]/60">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/contacts/${r.id}`} className="font-medium text-[#0D0D0D] underline-offset-2 hover:underline">
                      {[r.firstName, r.lastName].filter(Boolean).join(' ') || 'Unnamed'}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[#0D0D0D]/70">
                    <div>{r.email || '—'}</div>
                    <div className="text-[#0D0D0D]/45">{r.phoneE164 || ''}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{r.market}</td>
                  <td className="px-3 py-2.5 text-xs text-[#0D0D0D]/60">{SOURCE_LABELS[r.source] ?? r.source}</td>
                  <td className="px-3 py-2.5 text-xs">{r.orderCount}</td>
                  <td className="px-3 py-2.5 text-xs">{r.lifetimeValueAed.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2.5 text-xs text-[#0D0D0D]/60">{fmtDate(r.lastOrderAt)}</td>
                  <td className="px-3 py-2.5">
                    <ConsentBadge current={r.consent.email} marketable={r.emailMarketable} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ConsentBadge current={r.consent.whatsapp} marketable={r.whatsappMarketable} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[#0D0D0D]/60">{r.tags.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > MAX_ROWS && (
            <div className="border-t border-[#0D0D0D]/10 px-3 py-2.5 text-xs text-[#0D0D0D]/50">
              Showing the first {MAX_ROWS} of {rows.length}. Narrow the filters to see the rest.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
