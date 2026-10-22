// src/app/api/admin/crm/consent/route.ts
//
// POST — record a consent event by hand (brief B6, C4, C6, C8).
// Body: { contactId, channel: 'email'|'whatsapp', action: 'granted'|'withdrawn',
//         waMessageText?, note? }
//
//   WhatsApp granted   capture whatsapp_join; waMessageText REQUIRED (the
//                      exact text the customer sent, e.g. "JOIN PepcoLab
//                      updates") — that message is the consent.
//   WhatsApp withdrawn capture whatsapp_stop; removed from every later
//                      broadcast export immediately.
//   Email granted      capture admin_on_request; note REQUIRED (how the
//                      customer asked). Only owner/admin.
//   Email withdrawn    capture admin_on_request.
//
// Consent history is append-only: this adds an event, it never edits one.
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { getContact, grantConsent, withdrawConsent, audit, logInteraction } from '@/lib/crm/store'
import { WHATSAPP_WORDING_VERSION, EMAIL_WORDING_VERSION } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const staff = requireStaff(req)
  if (isResponse(staff)) return staff
  const b = await req.json().catch(() => ({}))
  const contact = await getContact(String(b?.contactId || ''))
  if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 })
  const channel = b?.channel === 'email' ? 'email' : b?.channel === 'whatsapp' ? 'whatsapp' : null
  const action = b?.action === 'granted' ? 'granted' : b?.action === 'withdrawn' ? 'withdrawn' : null
  if (!channel || !action) return NextResponse.json({ error: 'Choose a channel and an action.' }, { status: 400 })
  const waText = typeof b?.waMessageText === 'string' ? b.waMessageText.trim().slice(0, 500) : ''
  const note = typeof b?.note === 'string' ? b.note.trim().slice(0, 500) : ''

  if (channel === 'whatsapp' && !contact.phoneE164) {
    return NextResponse.json({ error: 'This contact has no phone number.' }, { status: 400 })
  }
  if (channel === 'email' && !contact.email) {
    return NextResponse.json({ error: 'This contact has no email address.' }, { status: 400 })
  }

  if (action === 'granted') {
    if (channel === 'whatsapp') {
      if (!waText) return NextResponse.json({ error: 'Paste the exact message the customer sent.' }, { status: 400 })
      const ev = await grantConsent(contact, 'whatsapp', 'whatsapp_join', WHATSAPP_WORDING_VERSION, { waMessageText: waText, staffUser: staff.name })
      if (!ev) return NextResponse.json({ error: 'This number previously replied STOP. Only an owner or admin can record a new opt-in for it, from an explicit request.' }, { status: 409 })
    } else {
      if (staff.role === 'agent') return NextResponse.json({ error: 'Only an owner or admin can record an email opt-in by hand.' }, { status: 403 })
      if (!note) return NextResponse.json({ error: 'Say how the customer asked (e.g. "replied to order email asking for updates").' }, { status: 400 })
      await grantConsent(contact, 'email', 'admin_on_request', EMAIL_WORDING_VERSION, { note, staffUser: staff.name })
    }
  } else {
    await withdrawConsent(contact, channel, channel === 'whatsapp' ? 'whatsapp_stop' : 'admin_on_request', {
      waMessageText: waText || undefined,
      note: note || undefined,
      staffUser: staff.name,
    })
  }

  await logInteraction({
    contactId: contact.id,
    channel,
    direction: 'inbound',
    kind: 'service',
    summary: `${channel === 'whatsapp' ? 'WhatsApp' : 'Email'} consent ${action}${waText ? `: "${waText}"` : note ? `: ${note}` : ''}`,
    staffUser: staff.name,
  })
  await audit({ user: staff.name, role: staff.role, action: `consent.${channel}.${action}`, detail: contact.id })
  return NextResponse.json({ ok: true })
}
