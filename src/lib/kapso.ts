// src/lib/kapso.ts
//
// KAPSO (WhatsApp Business API) CLIENT — Nov 2026
// ------------------------------------------------
// Everything PepcoLab sends on WhatsApp goes through here: assistant replies
// (app/api/whatsapp/kapso), and order updates (lib/whatsappOrderUpdates.ts).
//
// Message shapes are WhatsApp's own: plain text, reply buttons (max 3), a
// list (max 10 rows), a single link button ("cta_url", optionally with a
// product photo on top) and an image. WhatsApp rejects anything over its
// length limits, so every field is trimmed to fit here, and if an
// interactive message is still refused the same content goes out as plain
// text — the customer always gets an answer.
//
// ENV
//   KAPSO_API_KEY           Kapso project API key
//   KAPSO_PHONE_NUMBER_ID   the PepcoLab number's Meta phone number id
//                           (falls back to the id on the inbound webhook)
import { redis } from '@/lib/redis'

const BASE = 'https://api.kapso.ai/meta/whatsapp/v24.0'
const PLATFORM = 'https://api.kapso.ai/platform/v1'
const TIMEOUT_MS = 9000

export type OutMessage =
  | { kind: 'text'; text: string }
  | { kind: 'buttons'; body: string; header?: string; footer?: string; buttons: { id: string; title: string }[] }
  | { kind: 'list'; body: string; button: string; footer?: string; rows: { id: string; title: string; description?: string }[] }
  | { kind: 'cta'; body: string; buttonText: string; url: string; imageUrl?: string; footer?: string }
  | { kind: 'image'; url: string; caption?: string }

function apiKey(): string {
  const key = process.env.KAPSO_API_KEY
  if (!key) throw new Error('KAPSO_API_KEY is not set')
  return key
}

const PNID_KEY = 'kapso:phone_number_id'

/**
 * Our number's Meta phone number id: KAPSO_PHONE_NUMBER_ID, or the id the
 * last inbound webhook arrived on (remembered by rememberPhoneNumberId).
 */
export async function resolvePhoneNumberId(): Promise<string> {
  return process.env.KAPSO_PHONE_NUMBER_ID || (await redis.get<string>(PNID_KEY)) || ''
}

export async function rememberPhoneNumberId(id: string): Promise<void> {
  if (id && !process.env.KAPSO_PHONE_NUMBER_ID) await redis.set(PNID_KEY, id)
}

async function call(url: string, init: { method?: string; body?: unknown } = {}): Promise<{ ok: boolean; status: number; json: any; text: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: init.method || 'GET',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey() },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
      cache: 'no-store',
    })
    const text = await res.text().catch(() => '')
    let json: any = null
    try { json = text ? JSON.parse(text) : null } catch { /* not JSON */ }
    return { ok: res.ok, status: res.status, json, text }
  } finally {
    clearTimeout(timer)
  }
}

/* ── limits ─────────────────────────────────────────────────────────────── */

/** Cuts on a character boundary that is safe for emoji, adding an ellipsis. */
export function fit(text: string, max: number): string {
  const chars = Array.from((text || '').trim())
  if (chars.length <= max) return chars.join('')
  return chars.slice(0, Math.max(1, max - 1)).join('').trimEnd() + '…'
}

const LIMIT = {
  text: 4096,
  body: 1024,
  header: 60,
  footer: 60,
  replyTitle: 20,
  buttonId: 256,
  listButton: 20,
  rowTitle: 24,
  rowDescription: 72,
  rowId: 200,
  ctaText: 20,
  caption: 1024,
}

/* ── plain-text rendering (fallback and history) ────────────────────────── */

export function toPlainText(m: OutMessage): string {
  switch (m.kind) {
    case 'text':
      return m.text
    case 'buttons':
      return [m.header ? `*${m.header}*` : '', m.body, m.footer || ''].filter(Boolean).join('\n\n')
    case 'list':
      return [m.body, m.rows.map((r, i) => `${i + 1}. ${r.description && r.description.length > r.title.length ? r.description : r.title}`).join('\n'), 'Reply with a number.'].join('\n\n')
    case 'cta':
      return [m.body, `${m.buttonText}: ${m.url}`, m.footer || ''].filter(Boolean).join('\n\n')
    case 'image':
      return m.caption || ''
  }
}

/* ── payloads ───────────────────────────────────────────────────────────── */

function base(to: string) {
  return { messaging_product: 'whatsapp', recipient_type: 'individual', to }
}

function textPayloads(to: string, text: string): object[] {
  const chunks = text.match(/[\s\S]{1,3900}(?=\s|$)|[\s\S]{1,3900}/g) ?? [text]
  return chunks
    .map((c) => c.trim())
    .filter(Boolean)
    .map((body) => ({ ...base(to), type: 'text', text: { body: fit(body, LIMIT.text), preview_url: false } }))
}

function payloadFor(to: string, m: OutMessage): object[] {
  switch (m.kind) {
    case 'text':
      return textPayloads(to, m.text)
    case 'image':
      return [{ ...base(to), type: 'image', image: { link: m.url, ...(m.caption ? { caption: fit(m.caption, LIMIT.caption) } : {}) } }]
    case 'buttons':
      return [{
        ...base(to),
        type: 'interactive',
        interactive: {
          type: 'button',
          ...(m.header ? { header: { type: 'text', text: fit(m.header, LIMIT.header) } } : {}),
          body: { text: fit(m.body, LIMIT.body) },
          ...(m.footer ? { footer: { text: fit(m.footer, LIMIT.footer) } } : {}),
          action: {
            buttons: m.buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id.slice(0, LIMIT.buttonId), title: fit(b.title, LIMIT.replyTitle) } })),
          },
        },
      }]
    case 'list':
      return [{
        ...base(to),
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: fit(m.body, LIMIT.body) },
          ...(m.footer ? { footer: { text: fit(m.footer, LIMIT.footer) } } : {}),
          action: {
            button: fit(m.button, LIMIT.listButton),
            sections: [{
              rows: m.rows.slice(0, 10).map((r) => ({
                id: r.id.slice(0, LIMIT.rowId),
                title: fit(r.title, LIMIT.rowTitle),
                ...(r.description ? { description: fit(r.description, LIMIT.rowDescription) } : {}),
              })),
            }],
          },
        },
      }]
    case 'cta':
      return [{
        ...base(to),
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          ...(m.imageUrl ? { header: { type: 'image', image: { link: m.imageUrl } } } : {}),
          body: { text: fit(m.body, LIMIT.body) },
          ...(m.footer ? { footer: { text: fit(m.footer, LIMIT.footer) } } : {}),
          action: { name: 'cta_url', parameters: { display_text: fit(m.buttonText, LIMIT.ctaText), url: m.url } },
        },
      }]
  }
}

/* ── sending ────────────────────────────────────────────────────────────── */

/**
 * Sends one message. An interactive message WhatsApp refuses is re-sent as
 * plain text (and a product card whose photo fails is re-sent without it).
 */
export async function sendMessage(phoneNumberId: string, to: string, m: OutMessage): Promise<void> {
  const url = `${BASE}/${encodeURIComponent(phoneNumberId)}/messages`
  for (const payload of payloadFor(to, m)) {
    const res = await call(url, { method: 'POST', body: payload })
    if (res.ok) continue
    console.error(`[kapso] send ${m.kind} failed ${res.status}: ${res.text.slice(0, 300)}`)
    if (m.kind === 'text') throw new Error(`Kapso send failed ${res.status}`)
    if (m.kind === 'cta' && m.imageUrl) {
      await sendMessage(phoneNumberId, to, { ...m, imageUrl: undefined })
      return
    }
    if (m.kind === 'image') return // a missing photo is not worth a text
    await sendMessage(phoneNumberId, to, { kind: 'text', text: toPlainText(m) })
    return
  }
}

export async function sendMessages(phoneNumberId: string, to: string, messages: OutMessage[]): Promise<void> {
  for (const m of messages) await sendMessage(phoneNumberId, to, m)
}

/** Blue ticks plus "typing…" until the reply arrives (or ~25s). Never throws. */
export async function markReadTyping(phoneNumberId: string, messageId: string): Promise<void> {
  try {
    const res = await call(`${BASE}/${encodeURIComponent(phoneNumberId)}/messages`, {
      method: 'POST',
      body: { messaging_product: 'whatsapp', status: 'read', message_id: messageId, typing_indicator: { type: 'text' } },
    })
    if (!res.ok) console.warn(`[kapso] typing indicator ${res.status}: ${res.text.slice(0, 200)}`)
  } catch (err) {
    console.warn('[kapso] typing indicator failed:', err)
  }
}

/* ── templates (business-initiated messages, e.g. order updates) ────────── */

/** The WhatsApp Business Account behind our number, cached for a day. */
export async function businessAccountId(): Promise<string | null> {
  if (process.env.KAPSO_BUSINESS_ACCOUNT_ID) return process.env.KAPSO_BUSINESS_ACCOUNT_ID
  const phoneNumberId = await resolvePhoneNumberId()
  if (!phoneNumberId) return null
  const cacheKey = `kapso:waba:${phoneNumberId}`
  const cached = await redis.get<string>(cacheKey)
  if (cached) return cached
  const res = await call(`${PLATFORM}/whatsapp/phone_numbers?phone_number_id=${encodeURIComponent(phoneNumberId)}`)
  const waba = res.ok ? (res.json?.data?.[0]?.business_account_id as string | null) : null
  if (!res.ok) console.error(`[kapso] phone number lookup ${res.status}: ${res.text.slice(0, 200)}`)
  if (waba) await redis.set(cacheKey, waba, { ex: 24 * 60 * 60 })
  return waba ?? null
}

export interface TemplateDefinition {
  name: string
  language: string
  category: 'UTILITY' | 'MARKETING'
  components: object[]
}

export interface TemplateStatus {
  name: string
  status: string
  rejectedReason?: string
}

export async function listTemplates(names: string[]): Promise<TemplateStatus[]> {
  const waba = await businessAccountId()
  if (!waba) throw new Error('Could not find the WhatsApp Business Account for KAPSO_PHONE_NUMBER_ID')
  const out: TemplateStatus[] = []
  for (const name of names) {
    const res = await call(`${BASE}/${encodeURIComponent(waba)}/message_templates?name=${encodeURIComponent(name)}`)
    const row = (res.json?.data ?? []).find((t: any) => t?.name === name)
    out.push(row ? { name, status: String(row.status || 'UNKNOWN'), rejectedReason: row.rejected_reason || undefined } : { name, status: 'MISSING' })
  }
  return out
}

export async function createTemplate(def: TemplateDefinition): Promise<{ ok: boolean; status?: string; error?: string }> {
  const waba = await businessAccountId()
  if (!waba) return { ok: false, error: 'Could not find the WhatsApp Business Account for KAPSO_PHONE_NUMBER_ID' }
  const res = await call(`${BASE}/${encodeURIComponent(waba)}/message_templates`, {
    method: 'POST',
    body: { ...def, parameter_format: 'POSITIONAL' },
  })
  if (res.ok) return { ok: true, status: res.json?.status }
  return { ok: false, error: res.json?.error?.message || res.text.slice(0, 300) }
}

/** Sends an approved template. Throws with WhatsApp's error on failure. */
export async function sendTemplate(
  to: string,
  name: string,
  language: string,
  bodyParams: string[],
  urlButtonSuffix?: string
): Promise<void> {
  const phoneNumberId = await resolvePhoneNumberId()
  if (!phoneNumberId) throw new Error('KAPSO_PHONE_NUMBER_ID is not set and no WhatsApp message has arrived yet')
  const components: object[] = [
    { type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text: cleanParam(text) })) },
  ]
  if (urlButtonSuffix) {
    components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: urlButtonSuffix }] })
  }
  const res = await call(`${BASE}/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: 'POST',
    body: { ...base(to), type: 'template', template: { name, language: { code: language }, components } },
  })
  if (!res.ok) {
    const err = new Error(`template ${name} failed ${res.status}: ${res.json?.error?.message || res.text.slice(0, 300)}`) as Error & { code?: number }
    err.code = res.json?.error?.code
    throw err
  }
}

/** Template parameters may not contain new lines, tabs or 4+ spaces in a row. */
function cleanParam(text: string): string {
  return fit(String(text || '').replace(/[\n\t\r]+/g, ' ').replace(/ {4,}/g, '   ').trim() || '-', 1000)
}
