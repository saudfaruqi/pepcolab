// src/app/api/admin/crm/export/route.ts
// GET ?<same filters as the Contacts page> — CSV export. OWNER ONLY (brief
// B6); every export writes an audit row.
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { audit } from '@/lib/crm/store'
import { parseFilters, queryContacts, contactsToCsv } from '@/lib/crm/query'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const staff = requireStaff(req, ['owner'])
  if (isResponse(staff)) return staff
  const filters = parseFilters(Object.fromEntries(req.nextUrl.searchParams.entries()))
  const rows = await queryContacts(filters)
  await audit({ user: staff.name, role: staff.role, action: 'export.contacts', detail: `${rows.length} rows ${JSON.stringify(filters)}` })
  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(contactsToCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pepcolab-contacts-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
