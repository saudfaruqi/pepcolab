// src/app/api/admin/crm/import/route.ts
//
// POST { kind, csv? } — bring contacts in (brief B3). Owner/admin only.
//   orders       every order record → contacts, order figures refreshed
//   newsletter   footer sign-ups → contacts + "footer-legacy" email consent
//   leads        /learn guide leads → contacts (+ email-v1 consent if opted in)
//   strabl_csv   STRABL payer export (CSV text) → contacts, no consent
//   inbox_csv    inbox export (CSV text) → contacts with an order only, no consent
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { audit } from '@/lib/crm/store'
import { syncAllOrders, importNewsletter, importLeads, importStrablCsv, importInboxCsv } from '@/lib/crm/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_CSV_BYTES = 2_000_000

export async function POST(req: NextRequest) {
  const staff = requireStaff(req, ['owner', 'admin'])
  if (isResponse(staff)) return staff
  const b = await req.json().catch(() => ({}))
  const kind = String(b?.kind || '')
  const csv = typeof b?.csv === 'string' ? b.csv : ''
  if ((kind === 'strabl_csv' || kind === 'inbox_csv') && (!csv.trim() || csv.length > MAX_CSV_BYTES)) {
    return NextResponse.json({ error: 'Attach a CSV file (up to 2 MB).' }, { status: 400 })
  }
  let result: unknown
  try {
    if (kind === 'orders') result = await syncAllOrders()
    else if (kind === 'newsletter') result = await importNewsletter()
    else if (kind === 'leads') result = await importLeads()
    else if (kind === 'strabl_csv') result = await importStrablCsv(csv)
    else if (kind === 'inbox_csv') result = await importInboxCsv(csv)
    else return NextResponse.json({ error: 'Unknown import.' }, { status: 400 })
  } catch (err) {
    console.error('[crm/import] failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Import failed.' }, { status: 500 })
  }
  await audit({ user: staff.name, role: staff.role, action: `import.${kind}`, detail: JSON.stringify(result).slice(0, 500) })
  return NextResponse.json({ ok: true, result })
}
