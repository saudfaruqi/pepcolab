// src/app/api/admin/whatsapp-templates/route.ts
//
// Status of the WhatsApp order-update templates (lib/whatsappOrderUpdates.ts),
// submitting any that are missing for Meta approval.
//
//   GET /api/admin/whatsapp-templates
//   → { templates: [{ name, status: APPROVED | PENDING | REJECTED | …, rejectedReason? }] }
//
// AUTH: the admin session cookie (open it while signed in to /admin), or
// "Authorization: Bearer <CRON_SECRET>".
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { ensureOrderTemplates } from '@/lib/whatsappOrderUpdates'

export const dynamic = 'force-dynamic'

function authorised(req: NextRequest): boolean {
  const bearer = req.headers.get('authorization')
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true
  try {
    return verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const templates = await ensureOrderTemplates({ force: true })
    if (!templates) return NextResponse.json({ error: 'WhatsApp order updates are off (KAPSO_API_KEY missing or WHATSAPP_ORDER_UPDATES=off)' }, { status: 503 })
    return NextResponse.json({ templates })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 })
  }
}
