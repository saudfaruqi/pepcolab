// src/app/api/admin/crm/whatsapp-export/route.ts
//
// WhatsApp broadcast export (brief B6, C7). Only numbers whose CURRENT
// WhatsApp consent is "granted" and that are not suppressed, in files of
// 256 to match WhatsApp Business app broadcast lists. Owner/admin only;
// each download writes an audit row.
//
// GET            → { total, parts }
// GET ?part=N    → CSV for part N (1-based): name, phone
import { NextRequest, NextResponse } from 'next/server'
import { requireStaff, isResponse } from '@/lib/crm/adminGuard'
import { audit, marketablePhones } from '@/lib/crm/store'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PART_SIZE = 256

export async function GET(req: NextRequest) {
  const staff = requireStaff(req, ['owner', 'admin'])
  if (isResponse(staff)) return staff
  const contacts = (await marketablePhones()).sort((a, b) => (a.phoneE164 || '').localeCompare(b.phoneE164 || ''))
  const parts = Math.ceil(contacts.length / PART_SIZE)
  const partParam = req.nextUrl.searchParams.get('part')
  if (!partParam) return NextResponse.json({ total: contacts.length, parts, partSize: PART_SIZE })

  const part = Math.max(1, Math.min(parts || 1, parseInt(partParam, 10) || 1))
  const slice = contacts.slice((part - 1) * PART_SIZE, part * PART_SIZE)
  const cell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const csv = ['name,phone', ...slice.map((c) => `${cell([c.firstName, c.lastName].filter(Boolean).join(' '))},${c.phoneE164}`)].join('\n')
  await audit({ user: staff.name, role: staff.role, action: 'export.whatsapp', detail: `part ${part}/${parts}, ${slice.length} numbers` })
  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pepcolab-whatsapp-${stamp}-part${part}of${parts}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
