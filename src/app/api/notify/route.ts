// src/app/api/notify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { addNotifyRequest, notifyRequestCount } from '@/lib/notifyStore'
import { sendMailSafe } from '@/lib/mailer'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const ADMIN_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'

const MAX_SUBMISSIONS = 10
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited('notify', ip, MAX_SUBMISSIONS, WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const email = String(body.email || '').trim().toLowerCase()
  const productSlug = String(body.productSlug || '').trim()
  const productName = String(body.productName || '').trim() || productSlug

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!productSlug) {
    return NextResponse.json({ error: 'Missing product.' }, { status: 400 })
  }

  try {
    const { isNew } = await addNotifyRequest(productSlug, email)

    // Only alert admin on genuinely new interest, same reasoning as the
    // newsletter route — re-submitting shouldn't spam the inbox, but a
    // running count per product is useful signal for what to restock first.
    if (isNew) {
      const count = await notifyRequestCount(productSlug)
      await sendMailSafe({
        to: ADMIN_EMAIL,
        subject: `🔔 Back-in-stock request: ${productName}`,
        text: `${email} wants to be notified when ${productName} (${productSlug}) is back in stock.\n\n${count} total request${count === 1 ? '' : 's'} for this product.\n\nOnce restocked, trigger the notification emails via:\nPOST /api/notify/trigger  { "productSlug": "${productSlug}" }  (Authorization: Bearer NOTIFY_ADMIN_TOKEN)`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notify] Failed to store request:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}