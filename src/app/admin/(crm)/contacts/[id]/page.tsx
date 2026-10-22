// src/app/admin/(crm)/contacts/[id]/page.tsx
//
// One contact (brief B6): details, orders, the read-only consent timeline,
// interactions and tags, plus the staff actions each role may take.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  getContact,
  getConsentHistory,
  currentFromHistory,
  getInteractions,
  getTags,
  isEmailSuppressed,
  isPhoneSuppressed,
} from '@/lib/crm/store'
import { getOrdersForEmail } from '@/lib/orderStore'
import { CAPTURE_LABELS, CONSENT_WORDING, SOURCE_LABELS, type Channel } from '@/lib/crm/types'
import { requirePageStaff } from '../../session'
import { ConsentBadge, fmtDate, fmtDateTime } from '../../ui'
import ContactActions from './ContactActions'

export const dynamic = 'force-dynamic'

export default async function ContactPage({ params }: { params: { id: string } }) {
  const staff = await requirePageStaff()
  const contact = await getContact(params.id)
  if (!contact) notFound()

  const [history, interactions, tags, orders, emailSuppressed, phoneSuppressed] = await Promise.all([
    getConsentHistory(contact.id),
    getInteractions(contact.id),
    getTags(contact.id),
    contact.email ? getOrdersForEmail(contact.email, 100) : Promise.resolve([]),
    contact.email ? isEmailSuppressed(contact.email) : Promise.resolve(false),
    contact.phoneE164 ? isPhoneSuppressed(contact.phoneE164) : Promise.resolve(false),
  ])
  const current = currentFromHistory(history)
  const marketable: Record<Channel, boolean> = {
    email: current.email?.action === 'granted' && Boolean(contact.email) && !emailSuppressed,
    whatsapp: current.whatsapp?.action === 'granted' && Boolean(contact.phoneE164) && !phoneSuppressed,
  }
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unnamed contact'

  const field = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 border-b border-[#0D0D0D]/5 py-1.5 text-sm">
      <span className="text-[#0D0D0D]/50">{label}</span>
      <span className="text-right text-[#0D0D0D]">{value || '—'}</span>
    </div>
  )

  return (
    <div>
      <Link href="/admin/contacts" className="mb-4 inline-flex items-center gap-1 text-xs text-[#0D0D0D]/50 hover:text-[#0D0D0D]">
        <ArrowLeft size={13} /> All contacts
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-[#0D0D0D]">{name}</h1>
      <p className="mb-6 text-sm text-[#0D0D0D]/50">
        {contact.email || 'no email'} · {contact.phoneE164 || 'no phone'} · {contact.market}
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-[#0D0D0D]">Details</h2>
            {field('Email', contact.email)}
            {field('Phone', contact.phoneE164)}
            {field('Market', contact.market)}
            {field('Source', SOURCE_LABELS[contact.source] ?? contact.source)}
            {field('Shopify customer', contact.shopifyCustomerId)}
            {field('Paid orders', String(contact.orderCount))}
            {field('Lifetime value', `AED ${contact.lifetimeValueAed.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`)}
            {field('First order', fmtDate(contact.firstOrderAt))}
            {field('Last order', fmtDate(contact.lastOrderAt))}
            {field('Research attestation', contact.researchAttestedAt ? fmtDateTime(contact.researchAttestedAt) : 'not recorded')}
            {field('Created', fmtDateTime(contact.createdAt))}
            {field('Updated', fmtDateTime(contact.updatedAt))}
          </section>

          <section className="rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-[#0D0D0D]">Consent</h2>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              {(['email', 'whatsapp'] as Channel[]).map((ch) => (
                <div key={ch} className="rounded-lg bg-[#F7F5F1] p-3">
                  <div className="mb-1 text-xs font-medium text-[#0D0D0D]/60">{ch === 'email' ? 'Email' : 'WhatsApp'}</div>
                  <ConsentBadge current={current[ch]} marketable={marketable[ch]} />
                  {(ch === 'email' ? emailSuppressed : phoneSuppressed) && (
                    <div className="mt-1 text-[11px] text-red-700">On the suppression list</div>
                  )}
                </div>
              ))}
            </div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0D0D0D]/45">Timeline (append-only)</h3>
            {history.length === 0 ? (
              <p className="text-sm text-[#0D0D0D]/50">No consent recorded. This contact cannot receive marketing.</p>
            ) : (
              <ol className="space-y-3">
                {[...history].reverse().map((e) => (
                  <li key={e.id} className="rounded-lg border border-[#0D0D0D]/8 p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          e.action === 'granted' ? 'bg-[#0A7B45]/10 text-[#0A7B45]' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {e.channel} {e.action}
                      </span>
                      <span className="text-[#0D0D0D]/60">{fmtDateTime(e.occurredAt)}</span>
                      <span className="text-[#0D0D0D]/60">· {CAPTURE_LABELS[e.capturePoint] ?? e.capturePoint}</span>
                      <span className="text-[#0D0D0D]/40">· wording {e.wordingVersion}</span>
                    </div>
                    {CONSENT_WORDING[e.wordingVersion] && (
                      <p className="mt-1.5 italic text-[#0D0D0D]/60">&ldquo;{CONSENT_WORDING[e.wordingVersion]}&rdquo;</p>
                    )}
                    <dl className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-0.5 text-[#0D0D0D]/55 sm:grid-cols-2">
                      {e.evidence.waMessageText && <div><dt className="inline font-medium">Message: </dt><dd className="inline">&ldquo;{e.evidence.waMessageText}&rdquo;</dd></div>}
                      {e.evidence.staffUser && <div><dt className="inline font-medium">Recorded by: </dt><dd className="inline">{e.evidence.staffUser}</dd></div>}
                      {e.evidence.note && <div><dt className="inline font-medium">Note: </dt><dd className="inline">{e.evidence.note}</dd></div>}
                      {e.evidence.orderShortCode && <div><dt className="inline font-medium">Order: </dt><dd className="inline">{e.evidence.orderShortCode}</dd></div>}
                      {e.evidence.ip && <div><dt className="inline font-medium">IP: </dt><dd className="inline">{e.evidence.ip}</dd></div>}
                      {e.evidence.pageUrl && <div className="break-all"><dt className="inline font-medium">Page: </dt><dd className="inline">{e.evidence.pageUrl}</dd></div>}
                      {e.evidence.userAgent && <div className="break-all sm:col-span-2"><dt className="inline font-medium">Browser: </dt><dd className="inline">{e.evidence.userAgent}</dd></div>}
                    </dl>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-[#0D0D0D]">Orders</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-[#0D0D0D]/50">No orders on record for this email.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[#0D0D0D]/45">
                  <tr>
                    <th className="py-1.5 font-medium">Order</th>
                    <th className="py-1.5 font-medium">Date</th>
                    <th className="py-1.5 font-medium">Status</th>
                    <th className="py-1.5 font-medium">Total</th>
                    <th className="py-1.5 font-medium">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderShortCode} className="border-t border-[#0D0D0D]/5 align-top">
                      <td className="py-1.5 font-mono">{o.orderShortCode}</td>
                      <td className="py-1.5">{fmtDate(o.createdAt)}</td>
                      <td className="py-1.5">{o.status.replace(/_/g, ' ')}</td>
                      <td className="py-1.5">{o.currency} {Number(o.total).toFixed(2)}</td>
                      <td className="py-1.5 text-[#0D0D0D]/60">{o.products.map((p) => `${p.quantity}× ${p.title}`).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-[#0D0D0D]">Interactions</h2>
            {interactions.length === 0 ? (
              <p className="text-sm text-[#0D0D0D]/50">Nothing logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {interactions.map((i) => (
                  <li key={i.id} className="rounded-lg bg-[#F7F5F1] p-2.5 text-xs">
                    <div className="mb-0.5 text-[#0D0D0D]/50">
                      {fmtDateTime(i.occurredAt)} · {i.channel} · {i.direction} · {i.kind} · {i.staffUser}
                    </div>
                    <div className="whitespace-pre-wrap text-[#0D0D0D]">{i.summary}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <ContactActions
          contactId={contact.id}
          role={staff.role}
          tags={tags}
          hasEmail={Boolean(contact.email)}
          hasPhone={Boolean(contact.phoneE164)}
          emailGranted={current.email?.action === 'granted'}
          whatsappGranted={current.whatsapp?.action === 'granted'}
        />
      </div>
    </div>
  )
}
