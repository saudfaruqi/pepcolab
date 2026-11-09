// src/app/api/admin/emails/resend/route.ts
//
// Retry a failed send from the admin email outbox.
//
// The normal email log stores only a short preview (bodies can contain
// account sign-in links). Failed sends are therefore ALSO written to a
// separate short-lived outbox with their full payload — see lib/emailLog.ts.
// This route is the only thing that reads that payload back and sends it.
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { getFailedEmail, deleteFailedEmail } from '@/lib/emailLog'
import { sendMail } from '@/lib/mailer'

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

export async function POST(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  if (!id) {
    return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 })
  }

  const entry = await getFailedEmail(id)
  if (!entry) {
    return NextResponse.json(
      { success: false, message: 'That failed email has expired or was already resent.' },
      { status: 404 }
    )
  }

  try {
    await sendMail({
      to: entry.to,
      subject: entry.subject,
      text: entry.text,
      html: entry.html,
      replyTo: entry.replyTo,
      headers: entry.headers,
      stream: entry.stream,
      // Reuse the id: if this retry fails too, mailer updates the same
      // outbox entry rather than creating a duplicate for the same email.
      outboxId: entry.id,
    })
    await deleteFailedEmail(entry.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Send failed.' },
      { status: 502 }
    )
  }
}
