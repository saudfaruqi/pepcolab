// src/app/api/admin/marketing/excluded/route.ts
// GET → global marketing exclusion list. POST { emails: string[] } → replace it.
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/marketing/adminGuard'
import { listExcluded, setExcluded } from '@/lib/marketing/store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ success: true, emails: await listExcluded() })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const emails = Array.isArray(body?.emails) ? body.emails.map((e: unknown) => String(e)) : []
  return NextResponse.json({ success: true, emails: await setExcluded(emails) })
}
