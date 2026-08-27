// src/app/api/notify/trigger/route.ts
//
// Token-protected, same pattern as /api/discounts/admin. Call this once
// you've restocked a product to email everyone who asked to be notified,
// then the list is cleared. Set NOTIFY_ADMIN_TOKEN in Vercel first.
//
// Usage:
//   curl -X POST https://www.pepcolab.com/api/notify/trigger \
//     -H "Authorization: Bearer YOUR_TOKEN" \
//     -H "Content-Type: application/json" \
//     -d '{"productSlug":"bpc-157","productName":"BPC-157","productUrl":"https://www.pepcolab.com/products/bpc-157"}'
import { NextRequest, NextResponse } from 'next/server'
import { listNotifyRequests, clearNotifyRequests } from '@/lib/notifyStore'
import { sendMailSafe } from '@/lib/mailer'

function checkAuth(req: NextRequest): boolean {
  const token = process.env.NOTIFY_ADMIN_TOKEN
  if (!token) return false
  const header = req.headers.get('authorization')
  return header === `Bearer ${token}`
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const productSlug = String(body.productSlug || '').trim()
  const productName = String(body.productName || '').trim() || productSlug
  const productUrl = String(body.productUrl || '').trim() ||
    `${process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'}/products/${productSlug}`

  if (!productSlug) {
    return NextResponse.json({ error: 'productSlug is required.' }, { status: 400 })
  }

  const emails = await listNotifyRequests(productSlug)
  if (emails.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No pending requests for this product.' })
  }

  // Sent as individual emails (not one email with everyone BCC'd) so a
  // failure on one address doesn't affect the rest, and so nobody's email
  // is exposed to anyone else on the list.
  let sent = 0
  for (const email of emails) {
    await sendMailSafe({
      to: email,
      subject: `${productName} is back in stock — PepcoLab`,
      text: `Good news — ${productName} is back in stock.\n\n${productUrl}\n\nYou're receiving this because you asked to be notified. This is a one-time email; you won't be contacted again unless you request it again.`,
    })
    sent += 1
  }

  await clearNotifyRequests(productSlug)

  return NextResponse.json({ sent })
}