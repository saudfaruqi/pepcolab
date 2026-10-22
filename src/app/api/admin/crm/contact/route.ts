// src/app/api/admin/crm/contact/route.ts
//
// POST — create (or find) a contact by hand, e.g. a new WhatsApp enquirer
// (brief C8: every new WhatsApp contact must be in the CRM by end of day).
// Body: { phone?, email?, firstName?, lastName?, market?, source? }
// Consent is NEVER set here — use /api/admin/crm/consent with the evidence.
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { upsertContact, audit, logInteraction } from '@/lib/crm/store'
import { CONTACT_SOURCES, type ContactSource, type Market } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const staff = requireStaff(req)
  if (isResponse(staff)) return staff
  const b = await req.json().catch(() => ({}))
  const source: ContactSource = CONTACT_SOURCES.includes(b?.source) ? b.source : 'whatsapp_inbound'
  const market: Market | undefined = b?.market === 'UK' || b?.market === 'UAE' ? b.market : undefined
  const contact = await upsertContact({
    email: typeof b?.email === 'string' ? b.email : undefined,
    phone: typeof b?.phone === 'string' ? b.phone : undefined,
    firstName: typeof b?.firstName === 'string' ? b.firstName : undefined,
    lastName: typeof b?.lastName === 'string' ? b.lastName : undefined,
    market,
    source,
  })
  if (!contact) return NextResponse.json({ error: 'Enter a valid phone number (with country code) or email.' }, { status: 400 })
  if (source === 'whatsapp_inbound' && typeof b?.summary === 'string' && b.summary.trim()) {
    await logInteraction({
      contactId: contact.id,
      channel: 'whatsapp',
      direction: 'inbound',
      kind: 'service',
      summary: b.summary.trim().slice(0, 1000),
      staffUser: staff.name,
    })
  }
  await audit({ user: staff.name, role: staff.role, action: 'contact.create', detail: contact.id })
  return NextResponse.json({ ok: true, id: contact.id })
}
