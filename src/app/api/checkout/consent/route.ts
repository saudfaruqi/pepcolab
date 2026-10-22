// src/app/api/checkout/consent/route.ts
//
// POST { ref, items, email, whatsapp } from the order-confirmed page (brief
// B4 "post-purchase thank-you page"). Each ticked box writes one granted
// consent event with evidence {ip, user agent, page}. If the order is not in
// yet, the choice waits under the checkout reference for the webhook.
import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { cleanCheckoutRef, cleanCheckoutItems, resolveCheckoutOrder } from '@/lib/heardFrom'
import { syncContactFromOrder } from '@/lib/crm/sync'
import { grantConsent } from '@/lib/crm/store'
import { savePendingConsents, type PendingConsent } from '@/lib/crm/pending'
import { EMAIL_WORDING_VERSION, WHATSAPP_WORDING_VERSION } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited('checkout-consent', ip, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  const b = await req.json().catch(() => ({}))
  const ref = cleanCheckoutRef(b?.ref)
  if (!ref) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const wantsEmail = b?.email === true
  const wantsWa = b?.whatsapp === true
  if (!wantsEmail && !wantsWa) return NextResponse.json({ ok: true })

  const evidence = {
    ip: ip && ip !== 'unknown' ? ip : undefined,
    userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || undefined,
    pageUrl: typeof b?.pageUrl === 'string' ? b.pageUrl.slice(0, 500) : undefined,
  }
  const now = new Date().toISOString()
  const items: PendingConsent[] = []
  if (wantsEmail) items.push({ channel: 'email', wordingVersion: EMAIL_WORDING_VERSION, capturePoint: 'post_purchase', evidence, occurredAt: now })
  if (wantsWa) items.push({ channel: 'whatsapp', wordingVersion: WHATSAPP_WORDING_VERSION, capturePoint: 'post_purchase', evidence, occurredAt: now })

  const order = await resolveCheckoutOrder(ref, cleanCheckoutItems(b?.items))
  if (order) {
    const contact = await syncContactFromOrder(order)
    if (contact) {
      for (const i of items) {
        if (i.channel === 'whatsapp' && !contact.phoneE164) continue
        await grantConsent(contact, i.channel, i.capturePoint, i.wordingVersion, { ...i.evidence, orderShortCode: order.orderShortCode }, i.occurredAt)
      }
      return NextResponse.json({ ok: true, needsPhone: wantsWa && !contact.phoneE164 })
    }
  }
  await savePendingConsents(ref, items)
  return NextResponse.json({ ok: true, pending: true })
}
