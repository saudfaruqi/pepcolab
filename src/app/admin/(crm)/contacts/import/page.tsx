// src/app/admin/(crm)/contacts/import/page.tsx
// Imports (brief B3) and the CRM audit log. Owner/admin only.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { listAudit } from '@/lib/crm/store'
import { requirePageStaff } from '../../session'
import { fmtDateTime } from '../../ui'
import ImportPanel from './ImportPanel'

export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const staff = await requirePageStaff()
  if (staff.role === 'agent') redirect('/admin/contacts')
  const rows = await listAudit(100)

  return (
    <div>
      <Link href="/admin/contacts" className="mb-4 inline-flex items-center gap-1 text-xs text-[#0D0D0D]/50 hover:text-[#0D0D0D]">
        <ArrowLeft size={13} /> All contacts
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-[#0D0D0D]">Imports &amp; audit</h1>
      <p className="mb-6 text-sm text-[#0D0D0D]/50">
        Every contact comes from a PepcoLab order, form or inbound message. Never import a bought, shared or scraped list.
      </p>

      <ImportPanel />

      <h2 className="mb-2 mt-10 text-sm font-semibold text-[#0D0D0D]">Audit log (latest 100)</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#0D0D0D]/50">Nothing recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0D0D0D]/10 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#0D0D0D]/10 text-[#0D0D0D]/45">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Who</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.at}-${i}`} className="border-b border-[#0D0D0D]/5 align-top">
                  <td className="whitespace-nowrap px-3 py-2">{fmtDateTime(r.at)}</td>
                  <td className="px-3 py-2">{r.user} <span className="text-[#0D0D0D]/40">({r.role})</span></td>
                  <td className="px-3 py-2 font-mono">{r.action}</td>
                  <td className="break-all px-3 py-2 text-[#0D0D0D]/60">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
