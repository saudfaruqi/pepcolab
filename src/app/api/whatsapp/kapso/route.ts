// src/app/api/whatsapp/kapso/route.ts
//
// PEPCOLAB WHATSAPP ASSISTANT (Nov 2026)
// --------------------------------------
// Customers message the PepcoLab WhatsApp number. Kapso (kapso.ai, an
// official WhatsApp Business API provider) forwards each message here; the
// scripted assistant (lib/whatsappBot.ts — the website chat's written answers
// and live lookups, no AI) answers, and the reply goes back through Kapso.
//
// What it does on WhatsApp
//   - Product questions, prices and stock from the live catalogue.
//   - Takes orders: each product option comes with a link that opens the
//     website cart with that item in it (/cart?add=…). Payment, the research-
//     use confirmation and cash on delivery all stay on the website.
//   - Order status (order code + the email it was placed with), certificates.
//   - Quotes and bulk enquiries become CRM leads and an alert to the owner.
//   - "Talk to a person": the owner is alerted and the assistant goes quiet
//     on that chat for 12 hours so staff can reply from the Kapso inbox.
//   - STOP withdraws WhatsApp marketing consent (CRM suppression); the join
//     message "JOIN PepcoLab updates" records it (wording whatsapp-v1).
//   The same limits as the website chat apply: no GLP products, pens or
//   sprays, and no dosing, use or effects talk (checked both ways).
//
// SETUP (Vercel → Settings → Environment Variables)
//   KAPSO_API_KEY         Kapso project API key (Kapso → API keys)
//   KAPSO_WEBHOOK_SECRET  the secret_key you give the webhook in Kapso
// Webhook in Kapso: URL https://www.pepcolab.com/api/whatsapp/kapso,
// event whatsapp.message.received. Buffering optional (both shapes handled).
//
// Kapso expects a 200 within 10 seconds and retries otherwise, so the reply
// is produced after the response is sent (waitUntil), and each message id is
// processed once.
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { redis } from '@/lib/redis'
import { botReply } from '@/lib/whatsappBot'
import { alertOwner } from '@/lib/ownerAlert'
import { isRateLimited } from '@/lib/rateLimit'
import { upsertContact, grantConsent, withdrawConsent, logInteraction } from '@/lib/crm/store'
import { WHATSAPP_WORDING_VERSION } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const KAPSO_BASE = 'https://api.kapso.ai/meta/whatsapp/v24.0'
const HUMAN_PAUSE_SECONDS = 12 * 60 * 60

const K = {
  seen: (id: string) => `wa:seen:${id}`,
  human: (phone: string) => `wa:human:${phone}`,
}

/* ── Kapso I/O ──────────────────────────────────────────────────────────── */

function verifySignature(raw: string, header: string | null): boolean {
  const secret = process.env.KAPSO_WEBHOOK_SECRET
  if (!secret || !header) return false
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(header.trim())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

async function sendText(phoneNumberId: string, to: string, body: string): Promise<void> {
  const key = process.env.KAPSO_API_KEY
  if (!key) throw new Error('KAPSO_API_KEY is not set')
  // WhatsApp text messages are limited to 4096 characters.
  const chunks = body.match(/[\s\S]{1,3900}(?=\s|$)|[\s\S]{1,3900}/g) ?? [body]
  for (const chunk of chunks) {
    const res = await fetch(`${KAPSO_BASE}/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: chunk.trim(), preview_url: true },
      }),
    })
    if (!res.ok) throw new Error(`Kapso send failed ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)
  }
}

/* ── inbound shape ──────────────────────────────────────────────────────── */

interface InboundEvent {
  message?: {
    id?: string
    from?: string
    type?: string
    text?: { body?: string }
    interactive?: { type?: string; button_reply?: { id?: string; title?: string }; list_reply?: { id?: string; title?: string } }
    button?: { text?: string }
    kapso?: { direction?: string; content?: string }
  }
  conversation?: { id?: string; phone_number?: string; phone_number_id?: string; contact_name?: string }
  phone_number_id?: string
}

function textOf(m: NonNullable<InboundEvent['message']>): string {
  return (
    m.text?.body ||
    m.interactive?.button_reply?.title ||
    m.interactive?.list_reply?.title ||
    m.button?.text ||
    (m.type === 'text' ? m.kapso?.content : '') ||
    ''
  ).trim()
}

/* ── one message ────────────────────────────────────────────────────────── */

function marketForPhone(phone: string): 'AE' | 'GB' {
  return phone.startsWith('44') ? 'GB' : 'AE'
}

async function handleMessage(ev: InboundEvent): Promise<void> {
  const m = ev.message
  if (!m) return
  if (m.kapso?.direction && m.kapso.direction !== 'inbound') return

  const phone = String(m.from || ev.conversation?.phone_number || '').replace(/\D/g, '')
  const phoneNumberId = String(ev.phone_number_id || ev.conversation?.phone_number_id || '')
  if (!phone || !phoneNumberId) {
    console.warn('[whatsapp/kapso] message without sender or phone_number_id', m.id)
    return
  }

  // Each WhatsApp message is answered once, however many times Kapso delivers it.
  if (m.id) {
    const first = await redis.set(K.seen(m.id), '1', { nx: true, ex: 7 * 24 * 60 * 60 })
    if (!first) return
  }

  const name = ev.conversation?.contact_name || ''
  const text = textOf(m)

  // CRM: every sender is a contact (source WhatsApp inbound). No marketing
  // consent is implied by messaging us.
  let contact = null
  try {
    const [firstName, ...rest] = name.split(/\s+/).filter(Boolean)
    contact = await upsertContact({
      phone: `+${phone}`,
      firstName: firstName || null,
      lastName: rest.join(' ') || null,
      market: marketForPhone(phone) === 'GB' ? 'UK' : 'UAE',
      source: 'whatsapp_inbound',
    })
    if (contact && text) {
      await logInteraction({
        contactId: contact.id, channel: 'whatsapp', direction: 'inbound', kind: 'service',
        summary: text.slice(0, 500), staffUser: 'whatsapp-assistant',
      })
    }
  } catch (err) {
    console.error('[whatsapp/kapso] CRM write failed:', err)
  }

  if (!text) {
    await sendText(phoneNumberId, phone, 'Thanks — I can read text messages only. Please type your question, or write "person" to reach the team.')
    return
  }

  // Consent keywords (brief C4/C5).
  if (/^\s*(stop|unsubscribe|opt[\s-]?out)\s*$/i.test(text)) {
    if (contact) await withdrawConsent(contact, 'whatsapp', 'whatsapp_stop', { note: `WhatsApp "${text}"` }).catch((e) => console.error(e))
    await sendText(phoneNumberId, phone, 'Done — you won’t receive PepcoLab updates on WhatsApp. You can still message us here about an order at any time.')
    return
  }
  if (/^\s*join pepcolab updates\s*$/i.test(text)) {
    if (contact) await grantConsent(contact, 'whatsapp', 'whatsapp_join', WHATSAPP_WORDING_VERSION, { note: 'WhatsApp join message' }).catch((e) => console.error(e))
    await sendText(phoneNumberId, phone, 'You’re subscribed to PepcoLab updates on WhatsApp: new batches, certificate releases and restocks. Reply STOP at any time to stop.')
    return
  }

  // A person has taken this chat: stay quiet so staff can reply from Kapso.
  if (await redis.get(K.human(phone))) return

  if (isRateLimited('whatsapp', phone, 20, 10 * 60 * 1000)) return

  let reply: string
  try {
    const answer = await botReply(phone, name, text.slice(0, 1500))
    reply = answer.text
    if (answer.handoff) await redis.set(K.human(phone), '1', { ex: HUMAN_PAUSE_SECONDS })
  } catch (err) {
    console.error('[whatsapp/kapso] reply failed:', err)
    reply = 'Sorry — something went wrong on our side. A member of the PepcoLab team will reply here shortly.'
    await alertOwner({
      title: `⚠️ WhatsApp assistant failed — +${phone}`,
      body: `The assistant could not answer this message, so please reply from the Kapso inbox.\n\nCustomer: ${name || '(no name)'} +${phone}\nMessage: ${text}`,
    })
  }

  await sendText(phoneNumberId, phone, reply)
}

/* ── webhook ────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!process.env.KAPSO_WEBHOOK_SECRET) {
    console.error('[whatsapp/kapso] KAPSO_WEBHOOK_SECRET is not set — refusing unsigned webhooks')
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (!verifySignature(raw, req.headers.get('x-webhook-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const eventType = req.headers.get('x-webhook-event') || ''
  let body: { batch?: boolean; type?: string; data?: InboundEvent[] } & InboundEvent
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const type = eventType || body.type || ''
  if (type && type !== 'whatsapp.message.received') return NextResponse.json({ ok: true, ignored: type })

  const events: InboundEvent[] = body.batch || req.headers.get('x-webhook-batch') === 'true'
    ? (Array.isArray(body.data) ? body.data : [])
    : [body]

  // Messages from one sender are answered in order; different senders in
  // parallel.
  const bySender = new Map<string, InboundEvent[]>()
  for (const ev of events) {
    const key = String(ev.message?.from || ev.conversation?.phone_number || ev.conversation?.id || 'unknown')
    bySender.set(key, [...(bySender.get(key) ?? []), ev])
  }
  waitUntil(
    Promise.all(
      Array.from(bySender.values()).map(async (list) => {
        for (const ev of list) {
          try {
            await handleMessage(ev)
          } catch (err) {
            console.error('[whatsapp/kapso] handling failed:', err)
          }
        }
      })
    )
  )
  return NextResponse.json({ ok: true })
}
