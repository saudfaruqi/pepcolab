// src/app/api/cron/crm-nightly/route.ts
//
// Nightly CRM job (brief B3, B7):
//   1. Every order record → contacts, with order figures refreshed.
//   2. Every /learn lead → contacts (+ email-v1 consent where opted in).
//   3. WhatsApp STOP check: confirms that no number whose latest WhatsApp
//      consent is "withdrawn" (or that is suppressed) is in the broadcast
//      list. The list is built live from consent, so this is a guard that
//      alerts if that ever stops being true.
// An audit row records the counts. Safe to run by hand:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://www.pepcolab.com/api/cron/crm-nightly
import { NextRequest, NextResponse } from 'next/server'
import { syncAllOrders, importLeads } from '@/lib/crm/sync'
import { audit, marketablePhones, getCurrentConsent, isPhoneSuppressed } from '@/lib/crm/store'
import { sendMailSafe } from '@/lib/mailer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await syncAllOrders()
  const leads = await importLeads()

  const broadcast = await marketablePhones()
  const leaks: string[] = []
  for (const c of broadcast) {
    const cur = await getCurrentConsent(c.id)
    if (cur.whatsapp?.action !== 'granted' || (c.phoneE164 && (await isPhoneSuppressed(c.phoneE164)))) leaks.push(c.id)
  }
  if (leaks.length) {
    await sendMailSafe({
      to: process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com',
      subject: `CRM: ${leaks.length} opted-out WhatsApp number(s) found in the broadcast list`,
      text: `The nightly check found contacts in the WhatsApp broadcast list whose latest consent is not "granted":\n${leaks.join('\n')}\n\nRebuild the broadcast lists from a fresh export before the next broadcast.`,
    })
  }

  const summary = { orders, leads, whatsappBroadcast: broadcast.length, stopLeaks: leaks.length }
  await audit({ user: 'system', role: 'system', action: 'crm.nightly', detail: JSON.stringify(summary) })
  return NextResponse.json(summary)
}
