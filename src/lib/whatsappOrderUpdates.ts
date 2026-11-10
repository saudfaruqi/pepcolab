// src/lib/whatsappOrderUpdates.ts
//
// ORDER UPDATES ON WHATSAPP (Nov 2026)
// ------------------------------------
// Two messages, sent from the PepcoLab WhatsApp number through Kapso:
//   - "order confirmed" when a paid (or cash-on-delivery) order is created
//   - "on its way" when the admin marks the order dispatched with "notify the
//     customer" ticked (the same tick that sends the dispatch email)
// Each carries a "Track order" button to /track-order?code=<order code>.
//
// WHO GETS THEM
// WhatsApp only allows a business to message someone first when they have
// agreed to hear from it there. So an update goes only to a phone number that
//   - has messaged the PepcoLab WhatsApp number itself (most WhatsApp-led
//     orders), or
//   - ticked the WhatsApp box at checkout / on the success page (CRM consent),
// and never to a number that sent STOP. Everyone else gets email only, as
// before. No product names are ever included — order code and status only.
//
// TEMPLATES
// Messages a business sends first must use a template Meta has approved.
// ensureOrderTemplates() submits the two below for approval if they are not
// already there; it runs by itself once a day when WhatsApp messages arrive,
// and on demand from GET /api/admin/whatsapp-templates. Until Meta approves
// them (usually minutes, sometimes a day), sends fail quietly and the
// customer still gets the email.
//
// ENV
//   KAPSO_API_KEY                 required
//   KAPSO_PHONE_NUMBER_ID         recommended (else learnt from the first inbound message)
//   WHATSAPP_ORDER_UPDATES=off    switches the whole feature off
import { redis } from '@/lib/redis'
import { sendTemplate, listTemplates, createTemplate, type TemplateDefinition, type TemplateStatus } from '@/lib/kapso'
import { normalisePhone, findContactIdByPhone, getCurrentConsent, isPhoneSuppressed } from '@/lib/crm/store'
import type { OrderRecord } from '@/lib/orderStore'

const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com').replace(/\/$/, '')
const LANGUAGE = 'en'
const CONTACT_TTL = 400 * 24 * 60 * 60

export const ORDER_TEMPLATES = {
  confirmed: 'pepcolab_order_confirmed',
  shipped: 'pepcolab_order_shipped',
} as const

const TRACK_BUTTON = {
  type: 'BUTTONS',
  buttons: [
    {
      type: 'URL',
      text: 'Track order',
      url: `${SITE_URL}/track-order?code={{1}}`,
      example: [`${SITE_URL}/track-order?code=SOR-ABC123`],
    },
  ],
}

const DEFINITIONS: TemplateDefinition[] = [
  {
    name: ORDER_TEMPLATES.confirmed,
    language: LANGUAGE,
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, thank you for your PepcoLab order {{2}}. We have received it and are getting it ready, and we will message you here when it is on its way.',
        example: { body_text: [['Sarah', 'SOR-ABC123']] },
      },
      TRACK_BUTTON,
    ],
  },
  {
    name: ORDER_TEMPLATES.shipped,
    language: LANGUAGE,
    category: 'UTILITY',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your PepcoLab order {{2}} is on its way. {{3}} Reply here if you have any questions about your delivery.',
        example: { body_text: [['Sarah', 'SOR-ABC123', 'Tracking number 1234567890 (Aramex).']] },
      },
      TRACK_BUTTON,
    ],
  },
]

const K = {
  contact: (digits: string) => `wa:contact:${digits}`,
  sent: (code: string, kind: string) => `wa:ou:${code}:${kind}`,
  ensured: 'wa:tpl:ensured',
}

function enabled(): boolean {
  return Boolean(process.env.KAPSO_API_KEY) && process.env.WHATSAPP_ORDER_UPDATES !== 'off'
}

/** Called for every inbound WhatsApp message: this number has messaged us. */
export async function markWhatsAppContact(phoneDigits: string): Promise<void> {
  const digits = phoneDigits.replace(/\D/g, '')
  if (digits) await redis.set(K.contact(digits), '1', { ex: CONTACT_TTL })
}

function digitsFor(record: Pick<OrderRecord, 'phone' | 'currency'>): string | null {
  const market = (record.currency || '').toUpperCase() === 'GBP' ? 'UK' : 'UAE'
  const e164 = normalisePhone(record.phone, market)
  return e164 ? e164.slice(1) : null
}

async function mayMessage(digits: string): Promise<boolean> {
  const e164 = `+${digits}`
  if (await isPhoneSuppressed(e164)) return false
  if (await redis.get(K.contact(digits))) return true
  const contactId = await findContactIdByPhone(e164)
  if (!contactId) return false
  const consent = await getCurrentConsent(contactId)
  return consent.whatsapp?.action === 'granted'
}

function firstNameOf(full?: string): string {
  const first = (full || '').trim().split(/\s+/)[0] ?? ''
  const clean = first.replace(/[^\p{L}'-]/gu, '')
  return clean.length >= 2 ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'there'
}

async function send(record: OrderRecord, kind: keyof typeof ORDER_TEMPLATES, params: string[]): Promise<boolean> {
  if (!enabled() || !record.orderShortCode) return false
  const digits = digitsFor(record)
  if (!digits) return false
  if (!(await mayMessage(digits))) return false

  // At most once per order and kind, however often the webhook retries.
  const first = await redis.set(K.sent(record.orderShortCode, kind), new Date().toISOString(), { nx: true, ex: 60 * 24 * 60 * 60 })
  if (!first) return false

  try {
    await sendTemplate(digits, ORDER_TEMPLATES[kind], LANGUAGE, params, record.orderShortCode)
    return true
  } catch (err) {
    console.error(`[whatsappOrderUpdates] ${kind} for ${record.orderShortCode} not sent:`, err)
    // Free the slot so a later retry of the same event can try again, and
    // make sure the templates are on their way to approval.
    await redis.del(K.sent(record.orderShortCode, kind))
    await ensureOrderTemplates({ force: true }).catch((e) => console.error('[whatsappOrderUpdates] template check failed:', e))
    return false
  }
}

/** "Order confirmed". Never throws. */
export async function notifyOrderConfirmedWhatsApp(record: OrderRecord): Promise<boolean> {
  try {
    return await send(record, 'confirmed', [firstNameOf(record.customerName), record.orderShortCode])
  } catch (err) {
    console.error('[whatsappOrderUpdates] confirmed failed:', err)
    return false
  }
}

/** "On its way", with the tracking number when there is one. Never throws. */
export async function notifyOrderShippedWhatsApp(record: OrderRecord): Promise<boolean> {
  try {
    const tracking = record.trackingNumber
      ? `Tracking number ${record.trackingNumber}${record.carrier ? ` (${record.carrier})` : ''}.`
      : 'The courier will contact you before delivery.'
    return await send(record, 'shipped', [firstNameOf(record.customerName), record.orderShortCode, tracking])
  } catch (err) {
    console.error('[whatsappOrderUpdates] shipped failed:', err)
    return false
  }
}

/**
 * Makes sure both templates exist (submitting any that are missing for Meta
 * approval) and returns their status. Without `force` it does the check at
 * most once a day.
 */
export async function ensureOrderTemplates(opts: { force?: boolean } = {}): Promise<TemplateStatus[] | null> {
  if (!enabled()) return null
  if (!opts.force) {
    const fresh = await redis.set(K.ensured, '1', { nx: true, ex: 24 * 60 * 60 })
    if (!fresh) return null
  }
  const statuses = await listTemplates(DEFINITIONS.map((d) => d.name))
  for (const def of DEFINITIONS) {
    const st = statuses.find((s) => s.name === def.name)
    if (st?.status !== 'MISSING') continue
    const created = await createTemplate(def)
    st.status = created.ok ? created.status || 'PENDING' : `CREATE FAILED: ${created.error}`
    console.log(`[whatsappOrderUpdates] template ${def.name}: ${st.status}`)
  }
  return statuses
}
