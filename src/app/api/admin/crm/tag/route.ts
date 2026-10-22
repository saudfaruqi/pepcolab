// src/app/api/admin/crm/tag/route.ts
// POST { contactId, tag, remove? } — add or remove a tag.
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { getContact, addTag, removeTag } from '@/lib/crm/store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const staff = requireStaff(req)
  if (isResponse(staff)) return staff
  const b = await req.json().catch(() => ({}))
  const contact = await getContact(String(b?.contactId || ''))
  if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 })
  const tag = typeof b?.tag === 'string' ? b.tag : ''
  if (!tag.trim()) return NextResponse.json({ error: 'Enter a tag.' }, { status: 400 })
  if (b?.remove) await removeTag(contact.id, tag)
  else await addTag(contact.id, tag)
  return NextResponse.json({ ok: true })
}
