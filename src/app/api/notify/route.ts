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

  // UK launch signups share this store under a "uk-launch:" prefix. See the
  // note on the alert below — they must never be treated as restock requests.
  const isUkLaunch = productSlug.startsWith('uk-launch:')
  const ukProductName = isUkLaunch
    ? (productSlug.slice('uk-launch:'.length) || 'catalogue')
    : productName

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
        // UK LAUNCH INTEREST IS NOT A RESTOCK REQUEST (fixed Sep 2026).
        //
        // UK launch signups are stored in this same notify store under a
        // "uk-launch:" prefix — deliberately, so pre-launch demand lands
        // somewhere without standing up a second store. But the alert email
        // didn't know the difference, so a UK enquiry arrived reading
        // "Back-in-stock request", and the instructions told you to fire the
        // restock trigger at it.
        //
        // That was a live footgun: running that command would have emailed
        // someone "PT-141 is back in stock" when what they actually asked was
        // when you'll ship to the UK. Wrong message, to someone already
        // waiting on you. The two are now labelled and instructed separately.
        subject: isUkLaunch
          ? `🇬🇧 UK launch interest: ${ukProductName}`
          : `🔔 Back-in-stock request: ${productName}`,
        text: isUkLaunch
          ? `${email} wants to be told when PepcoLab opens UK dispatch.\n\n` +
            `Compound of interest: ${ukProductName}\n` +
            `${count} total UK request${count === 1 ? '' : 's'} recorded against this compound.\n\n` +
            `DO NOT run the restock trigger for this — it would send a "back in stock" email, which is not what they asked.\n` +
            `These are the UK launch list. Contact them when UK dispatch actually opens.`
          : `${email} wants to be notified when ${productName} (${productSlug}) is back in stock.\n\n${count} total request${count === 1 ? '' : 's'} for this product.\n\nOnce restocked, trigger the notification emails via:\nPOST /api/notify/trigger  { "productSlug": "${productSlug}" }  (Authorization: Bearer NOTIFY_ADMIN_TOKEN)`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[notify] Failed to store request:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}