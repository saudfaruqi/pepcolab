// src/lib/ownerAlert.ts
//
// "A customer needs a person" alerts to the owner's own WhatsApp, plus email
// (Nov 2026, website chat agent).
//
// WhatsApp delivery uses CallMeBot (callmebot.com), a free service that sends
// notification messages to YOUR OWN WhatsApp number from its number. It is not
// the WhatsApp Business API and never messages customers: it only reaches the
// phone that activated it. Set up once:
//   1. From the owner's phone, add the number on
//      callmebot.com/blog/free-api-whatsapp-messages (+34 644 91 07 79 in
//      Nov 2026) and send it "I allow callmebot to send me messages".
//   2. It replies with an API key.
//   3. In Vercel set OWNER_WHATSAPP_PHONE (international format, e.g.
//      +447700900123) and CALLMEBOT_APIKEY (the key from step 2).
// Without those two variables the alert goes by email only.
//
// Email goes to ORDER_ALERT_EMAIL (default hello@pepcolab.com), the same
// inbox every other order alert uses.
import { sendMailSafe } from '@/lib/mailer'

const ALERT_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'
const WHATSAPP_MAX = 900

export interface OwnerAlert {
  /** One line, shown first on WhatsApp and as the email subject. */
  title: string
  /** Plain text body. */
  body: string
  /** Visitor email, set as Reply-To on the alert email. */
  replyTo?: string
}

/** WhatsApp only, for callers that already send their own email. Never throws. */
export async function sendWhatsApp(text: string): Promise<boolean> {
  const phone = process.env.OWNER_WHATSAPP_PHONE
  const apikey = process.env.CALLMEBOT_APIKEY
  if (!phone || !apikey) return false
  const url =
    'https://api.callmebot.com/whatsapp.php' +
    `?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text.slice(0, WHATSAPP_MAX))}` +
    `&apikey=${encodeURIComponent(apikey)}`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) {
      console.error('[ownerAlert] WhatsApp alert failed:', res.status)
      return false
    }
    return true
  } catch (err) {
    console.error('[ownerAlert] WhatsApp alert error:', err)
    return false
  }
}

/** Sends the alert by WhatsApp (when configured) and email. Never throws. */
export async function alertOwner(alert: OwnerAlert): Promise<{ whatsapp: boolean }> {
  const [whatsapp] = await Promise.all([
    sendWhatsApp(`${alert.title}\n\n${alert.body}`),
    sendMailSafe({ to: ALERT_EMAIL, replyTo: alert.replyTo, subject: alert.title, text: alert.body }),
  ])
  return { whatsapp }
}
