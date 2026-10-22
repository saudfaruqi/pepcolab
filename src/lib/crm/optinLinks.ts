// src/lib/crm/optinLinks.ts
//
// Asking existing customers to opt in (brief B5). The ICO treats a
// standalone "would you like to hear from us?" email as marketing in itself,
// so the request lives ONLY at the bottom of transactional emails (order
// confirmation, dispatch, delivered) and on the order-confirmed page, and
// only for contacts with no current email consent.
//
// Email link: a signed, single-use URL (HMAC of contact id + channel +
// 30-day expiry + nonce). It opens /preferences/confirm, which shows the
// exact wording and records consent when the customer presses Confirm —
// a page, not a bare GET, so mail scanners that pre-open links cannot
// opt anyone in.
// WhatsApp link: the C4 join link. Consent is recorded when the customer's
// "JOIN PepcoLab updates" message arrives (staff record it in the admin),
// not when they click.
import crypto from 'crypto'
import { redis } from '@/lib/redis'
import { findContactByEmail, getCurrentConsent } from './store'
import { CONSENT_WORDING, EMAIL_WORDING_VERSION } from './types'
import { whatsAppJoinLink, isWhatsAppConfigured } from '@/lib/whatsapp'

const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com').replace(/\/$/, '')
const TTL_MS = 30 * 24 * 60 * 60 * 1000

function secret(): string {
  const s = process.env.CRM_LINK_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.NEWSLETTER_UNSUB_SECRET
  if (!s) throw new Error('CRM_LINK_SECRET is not configured')
  return s
}

interface Payload {
  c: string // contact id
  ch: 'email'
  exp: number
  n: string // nonce
}

export function signOptInToken(contactId: string): string {
  const p: Payload = { c: contactId, ch: 'email', exp: Date.now() + TTL_MS, n: crypto.randomBytes(9).toString('base64url') }
  const enc = Buffer.from(JSON.stringify(p)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(enc).digest('base64url')
  return `${enc}.${sig}`
}

export function verifyOptInToken(token: string): Payload | null {
  try {
    const [enc, sig] = (token || '').split('.')
    if (!enc || !sig) return null
    const expected = crypto.createHmac('sha256', secret()).update(enc).digest('base64url')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const p = JSON.parse(Buffer.from(enc, 'base64url').toString('utf8')) as Payload
    if (p.ch !== 'email' || typeof p.exp !== 'number' || Date.now() > p.exp || !p.c || !p.n) return null
    return p
  } catch {
    return null
  }
}

/** Marks a token used. Returns false if it had already been used. */
export async function consumeOptInToken(p: Payload): Promise<boolean> {
  const ok = await redis.set(`crm:optin-used:${p.n}`, '1', { nx: true, ex: Math.ceil(TTL_MS / 1000) + 86400 })
  return Boolean(ok)
}

export interface OptInBlock {
  html: string
  text: string
}

/**
 * The opt-in block for the bottom of a transactional email, or null when
 * this customer already has current email consent (and WhatsApp consent or
 * no WhatsApp number configured). Never throws: a failure just omits it.
 */
export async function optInBlockFor(email: string): Promise<OptInBlock | null> {
  try {
    const contact = await findContactByEmail(email)
    if (!contact) return null
    const cur = await getCurrentConsent(contact.id)
    const needsEmail = cur.email?.action !== 'granted'
    const needsWa = cur.whatsapp?.action !== 'granted' && isWhatsAppConfigured()
    if (!needsEmail && !needsWa) return null

    const links: { label: string; url: string }[] = []
    if (needsEmail) links.push({ label: 'Yes, email me updates', url: `${SITE_URL}/preferences/confirm?t=${encodeURIComponent(signOptInToken(contact.id))}` })
    if (needsWa) links.push({ label: 'Yes, WhatsApp me updates', url: whatsAppJoinLink() })

    const html = `<div style="margin:22px 0 0; padding:16px 18px; border-left:3px solid #C8992A; background:#FAF7F0; border-radius:4px; font-size:12.5px; line-height:1.65; color:rgba(13,13,13,.65); text-align:left;">
      <strong style="color:#0D0D0D;">Want batch and certificate updates?</strong> We email when a new lot is tested and its certificate goes live, at most once a week.
      ${links.map((l) => `<a href="${l.url}" style="color:#0D0D0D; font-weight:700; text-decoration:underline;">${l.label}</a>`).join(' &middot; ')}
    </div>`
    const text =
      `Want batch and certificate updates? We email when a new lot is tested and its certificate goes live, at most once a week.\n` +
      links.map((l) => `${l.label}: ${l.url}`).join('\n')
    return { html, text }
  } catch (err) {
    console.error('[crm/optinLinks] could not build opt-in block:', err)
    return null
  }
}

export const EMAIL_OPT_IN_WORDING = CONSENT_WORDING[EMAIL_WORDING_VERSION]
