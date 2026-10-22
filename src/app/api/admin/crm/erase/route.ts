// src/app/api/admin/crm/erase/route.ts
//
// POST { contactId, requestedAt?, confirm } — erasure request (brief B7).
// Owner/admin only. Writes the suppression hashes for email and phone, then
// deletes the contact, its consent history, interactions, tags, newsletter
// entry and guide lead. Order records are kept for tax and carry no
// marketing data. The request and completion dates are logged.
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { getContact, audit } from '@/lib/crm/store'
import { eraseContactEverywhere } from '@/lib/crm/sync'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const staff = requireStaff(req, ['owner', 'admin'])
  if (isResponse(staff)) return staff
  const b = await req.json().catch(() => ({}))
  const contact = await getContact(String(b?.contactId || ''))
  if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 })
  if (b?.confirm !== 'ERASE') return NextResponse.json({ error: 'Type ERASE to confirm.' }, { status: 400 })
  const requestedAt = typeof b?.requestedAt === 'string' && Number.isFinite(new Date(b.requestedAt).getTime())
    ? new Date(b.requestedAt).toISOString()
    : undefined
  await eraseContactEverywhere(contact.id, staff.name, requestedAt)
  await audit({ user: staff.name, role: staff.role, action: 'contact.erase', detail: `${contact.id}${requestedAt ? ` requested ${requestedAt}` : ''}` })
  return NextResponse.json({ ok: true })
}
