// src/app/api/admin/crm/interaction/route.ts
// POST — log a WhatsApp / email / phone interaction (brief B6 "Log WhatsApp interaction").
// Body: { contactId, channel, direction, kind, summary }
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { getContact, logInteraction } from '@/lib/crm/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const staff = requireStaff(req)
  if (isResponse(staff)) return staff
  const b = await req.json().catch(() => ({}))
  const contact = await getContact(String(b?.contactId || ''))
  if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 })
  const channel = ['whatsapp', 'email', 'phone'].includes(b?.channel) ? b.channel : null
  const direction = ['inbound', 'outbound'].includes(b?.direction) ? b.direction : null
  const kind = ['service', 'marketing'].includes(b?.kind) ? b.kind : 'service'
  const summary = typeof b?.summary === 'string' ? b.summary.trim().slice(0, 2000) : ''
  if (!channel || !direction || !summary) return NextResponse.json({ error: 'Channel, direction and a summary are required.' }, { status: 400 })
  const row = await logInteraction({ contactId: contact.id, channel, direction, kind, summary, staffUser: staff.name })
  return NextResponse.json({ ok: true, interaction: row })
}
