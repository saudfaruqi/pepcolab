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
import { emailShell, primaryButton, trustStrip, INK, INK_60, INK_40, GOLD_TEXT, GOLD_TINT } from '@/lib/orderEmails'

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
    // HTML ADDED (Sep 2026). This was text-only — the single most important
    // email in the catalogue (someone asked to be told, so intent is already
    // proven) arriving as unstyled plain text from a brand whose other emails
    // are designed. That reads as spam, and plain text has no way to declare
    // light-only, so a dark-mode client renders it however it likes.
    //
    // Now goes through emailShell like everything else: same light background,
    // same light-only declaration, same brand. The plain-text alternative is
    // kept as the multipart fallback, which is what it should always have been.
    await sendMailSafe({
      to: email,
      subject: `${productName} is back in stock — PepcoLab`,
      text: `Good news — ${productName} is back in stock.\n\n${productUrl}\n\nYou're receiving this because you asked to be notified. This is a one-time email; you won't be contacted again unless you request it again.`,
      html: emailShell(`
        <div style="display:inline-block; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${GOLD_TEXT}; background:${GOLD_TINT}; padding:7px 16px; border-radius:999px; margin-bottom:20px;">Back in stock</div>
        <h1 style="font-size:24px; font-weight:700; letter-spacing:-.03em; line-height:1.15; color:${INK}; margin:0 0 12px;">${productName} is available again.</h1>
        <p style="font-size:14px; line-height:1.7; color:${INK_60}; margin:0 0 24px;">
          A fresh batch has arrived, with its own independently tested certificate matched to the lot number on the vial.
        </p>
        ${primaryButton('View ' + productName, productUrl, 16)}
        ${trustStrip()}
        <p style="font-size:11px; line-height:1.6; color:${INK_40}; margin:20px 0 0; text-align:center;">
          You asked to be told when this came back. This is a one-time email &mdash; you won&rsquo;t hear from us again unless you ask.<br />
          Supplied for in-vitro laboratory research use only.
        </p>
      `),
    })
    sent += 1
  }

  await clearNotifyRequests(productSlug)

  return NextResponse.json({ sent })
}