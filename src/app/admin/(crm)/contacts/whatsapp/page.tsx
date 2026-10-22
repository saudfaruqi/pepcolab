// src/app/admin/(crm)/contacts/whatsapp/page.tsx
// WhatsApp broadcast export and procedure (brief B6, C5, C7). Owner/admin only.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requirePageStaff } from '../../session'
import BroadcastExport from './BroadcastExport'

export const dynamic = 'force-dynamic'

const ALLOWED = [
  'Replies to a customer’s own message',
  'Order and delivery updates',
  '“A new batch certificate has been published” notices',
  'Links to storage, handling and COA-reading guides',
  '“Our number has changed” notices',
]
const NEVER = [
  'Prices, discounts or offers',
  'Links to product, cart or checkout pages',
  'Product photos',
  'Anything about dosing, administration, effects or human use',
  'Messages to anyone who hasn’t opted in or messaged first',
  'More than one broadcast per week',
]

export default async function WhatsAppExportPage() {
  const staff = await requirePageStaff()
  if (staff.role === 'agent') redirect('/admin/contacts')

  return (
    <div>
      <Link href="/admin/contacts" className="mb-4 inline-flex items-center gap-1 text-xs text-[#0D0D0D]/50 hover:text-[#0D0D0D]">
        <ArrowLeft size={13} /> All contacts
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-[#0D0D0D]">WhatsApp broadcast export</h1>
      <p className="mb-6 text-sm text-[#0D0D0D]/50">
        Only numbers whose latest WhatsApp consent is &ldquo;granted&rdquo; and that are not suppressed, in files of 256 to match
        WhatsApp Business broadcast lists.
      </p>

      <BroadcastExport />

      <section className="mt-8 rounded-xl border border-[#0D0D0D]/10 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-[#0D0D0D]">Weekly broadcast procedure (at most once a week)</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[#0D0D0D]/75">
          <li>Download the files above. Only numbers with current &ldquo;granted&rdquo; consent appear in them.</li>
          <li>
            In WhatsApp Business, delete last week&rsquo;s broadcast lists first, then rebuild them from these files — so anyone who
            replied STOP is never re-added.
          </li>
          <li>The message must be one of the Allowed types below. Mohammed approves the text before it goes.</li>
          <li>Log one marketing interaction per broadcast on a contact record, or note it in the audit.</li>
        </ol>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#0A7B45]/20 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-[#0A7B45]">Allowed</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#0D0D0D]/75">
            {ALLOWED.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-red-700">Never</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#0D0D0D]/75">
            {NEVER.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      </section>
    </div>
  )
}
