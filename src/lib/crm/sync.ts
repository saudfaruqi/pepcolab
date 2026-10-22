// src/lib/crm/sync.ts
//
// Getting contacts INTO the CRM (brief B3) and keeping their order figures
// current. No list is ever bought, imported from a third party, or scraped:
// every contact comes from a PepcoLab order, form or inbound message.
//
//   Source                     Consent written on import
//   Orders (cart + links)      none — an order is not marketing consent
//   STRABL payer CSV           none
//   Footer newsletter list     granted, wording "footer-legacy", capture
//                              footer_form, at the original sign-up time
//   /learn leads (opted in)    granted, "email-v1", capture learn_form, with
//                              the evidence stored at sign-up
//   Inbox CSV                  none; only people with an order are imported
import { redis } from '@/lib/redis'
import { listAllOrders, getOrdersForEmail, getOrderRecord, isPaidOrder, type OrderRecord } from '@/lib/orderStore'
import { listSubscribers } from '@/lib/newsletterStore'
import { listLeads, getLead } from '@/lib/leadStore'
import {
  upsertContact,
  updateContactFields,
  getConsentHistory,
  grantConsent,
  normaliseEmail,
  marketFrom,
  eraseContact,
  getContact,
  type ContactInput,
} from './store'
import { takePendingConsents } from './pending'
import type { Contact, ContactSource } from './types'

function splitName(full?: string): { firstName?: string; lastName?: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length || parts[0] === '—') return {}
  const tidy = (s: string) => (s === s.toUpperCase() || s === s.toLowerCase() ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s)
  return { firstName: tidy(parts[0]), lastName: parts.length > 1 ? parts.slice(1).map(tidy).join(' ') : undefined }
}

function orderSource(order: OrderRecord): ContactSource {
  if (!isPaidOrder(order) && order.status !== 'refunded' && order.status !== 'chargeback') return 'checkout'
  return order.products?.some((p) => p.variantId) ? 'shopify_order' : 'strabl_link'
}

/** Order count, lifetime value (AED), first/last order and latest research attestation. */
export async function refreshOrderStats(contact: Contact): Promise<Contact> {
  if (!contact.email) return contact
  const orders = (await getOrdersForEmail(contact.email, 500)).filter(isPaidOrder)
  const times = orders.map((o) => o.createdAt).filter(Boolean).sort()
  const attested = orders.map((o) => o.researchAttestedAt).filter(Boolean).sort() as string[]
  const ltv = Math.round(orders.reduce((s, o) => s + (Number(o.total) || 0), 0) * 100) / 100
  return (
    (await updateContactFields(contact.id, {
      orderCount: orders.length,
      lifetimeValueAed: ltv,
      firstOrderAt: times[0],
      lastOrderAt: times[times.length - 1],
      researchAttestedAt: attested[attested.length - 1] ?? contact.researchAttestedAt,
    })) ?? contact
  )
}

/**
 * Called by the STRABL webhook every time an order record is saved, and by
 * the nightly sync. Creates/updates the contact, refreshes order figures,
 * and writes any consent ticked at checkout or on the order-confirmed page
 * before the order existed.
 */
export async function syncContactFromOrder(order: OrderRecord): Promise<Contact | null> {
  if (!order.email && !order.phone) return null
  const input: ContactInput = {
    email: order.email,
    phone: order.phone,
    ...splitName(order.customerName),
    countryCode: order.shippingAddress?.countryCode,
    source: orderSource(order),
  }
  let contact = await upsertContact(input)
  if (!contact) return null
  // A contact first seen at an abandoned checkout who later paid keeps its
  // original source; the order figures show the purchase.
  contact = await refreshOrderStats(contact)

  if (order.checkoutRef) {
    const pending = await takePendingConsents(order.checkoutRef)
    for (const p of pending) {
      await grantConsent(contact, p.channel, p.capturePoint, p.wordingVersion, { ...p.evidence, orderShortCode: order.orderShortCode }, p.occurredAt)
    }
  }
  return contact
}

export interface SyncResult {
  scanned: number
  contacts: number
}

/** Every order record → contacts (nightly, and the admin "Sync orders" button). */
export async function syncAllOrders(): Promise<SyncResult> {
  const { orders } = await listAllOrders(10000, 0)
  const seen = new Set<string>()
  let contacts = 0
  // Newest first, so each email is synced once from its latest order.
  for (const o of orders) {
    const key = (o.email || o.phone || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    if (await syncContactFromOrder(o)) contacts++
  }
  return { scanned: orders.length, contacts }
}

/** Footer newsletter sign-ups → contacts with granted "footer-legacy" consent. */
export async function importNewsletter(): Promise<{ imported: number; consentWritten: number }> {
  const subs = await listSubscribers()
  let imported = 0
  let consentWritten = 0
  for (const s of subs) {
    const contact = await upsertContact({ email: s.email, source: 'newsletter' })
    if (!contact) continue
    imported++
    const history = await getConsentHistory(contact.id)
    if (history.some((e) => e.channel === 'email')) continue
    const ev = await grantConsent(contact, 'email', 'footer_form', 'footer-legacy', { note: 'Imported from the footer newsletter list' }, new Date(s.subscribedAt || Date.now()).toISOString())
    if (ev) consentWritten++
  }
  return { imported, consentWritten }
}

/** /learn leads who ticked the opt-in → contacts with granted email-v1 consent. */
export async function syncLead(email: string): Promise<Contact | null> {
  const lead = await getLead(email)
  if (!lead) return null
  const contact = await upsertContact({ email: lead.email, firstName: lead.firstName, source: 'learn_form' })
  if (!contact) return null
  if (lead.emailOptIn && lead.optIn) {
    const history = await getConsentHistory(contact.id)
    const already = history.some((e) => e.channel === 'email' && e.capturePoint === 'learn_form' && e.occurredAt === lead.optIn!.at)
    if (!already) {
      await grantConsent(
        contact,
        'email',
        'learn_form',
        lead.optIn.wording || 'email-v1',
        { ip: lead.optIn.ip, userAgent: lead.optIn.userAgent, pageUrl: lead.optIn.pageUrl },
        lead.optIn.at
      )
    }
  }
  return contact
}

export async function importLeads(): Promise<{ imported: number }> {
  const leads = await listLeads(10000)
  let imported = 0
  for (const l of leads) if (await syncLead(l.email)) imported++
  return { imported }
}

// ── CSV imports ─────────────────────────────────────────────────────────────

/** RFC 4180 CSV → rows of strings. Handles quotes, escaped quotes and CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const s = text.replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((c) => c.trim())) rows.push(row)
      row = []
    } else field += ch
  }
  row.push(field)
  if (row.some((c) => c.trim())) rows.push(row)
  return rows
}

function headerIndex(header: string[], ...names: RegExp[]): number {
  return header.findIndex((h) => names.some((re) => re.test(h.trim().toLowerCase())))
}

export interface CsvImportResult {
  rows: number
  imported: number
  skipped: number
  reasons: Record<string, number>
}

/** STRABL dashboard payer export → contacts, source strabl_link, no consent. */
export async function importStrablCsv(text: string): Promise<CsvImportResult> {
  const rows = parseCsv(text)
  const result: CsvImportResult = { rows: Math.max(0, rows.length - 1), imported: 0, skipped: 0, reasons: {} }
  if (rows.length < 2) return result
  const h = rows[0]
  const iEmail = headerIndex(h, /e-?mail/)
  const iPhone = headerIndex(h, /phone|mobile|tel/)
  const iName = headerIndex(h, /^(customer |payer )?name$|full ?name|customer/)
  const iFirst = headerIndex(h, /first/)
  const iLast = headerIndex(h, /last|surname/)
  const iCountry = headerIndex(h, /country/)
  for (const r of rows.slice(1)) {
    const name = iName >= 0 ? splitName(r[iName]) : {}
    const contact = await upsertContact({
      email: iEmail >= 0 ? r[iEmail] : undefined,
      phone: iPhone >= 0 ? r[iPhone] : undefined,
      firstName: iFirst >= 0 ? r[iFirst] : name.firstName,
      lastName: iLast >= 0 ? r[iLast] : name.lastName,
      countryCode: iCountry >= 0 ? countryCodeOf(r[iCountry]) : undefined,
      source: 'strabl_link',
    })
    if (contact) {
      result.imported++
      if (contact.email) await refreshOrderStats(contact)
    } else bump(result, 'no valid email or phone')
  }
  return result
}

/**
 * Inbox export (people who emailed about orders) → contacts, source
 * email_inbox, no consent. Only rows that match a PepcoLab order by email or
 * order number are imported.
 */
export async function importInboxCsv(text: string): Promise<CsvImportResult> {
  const rows = parseCsv(text)
  const result: CsvImportResult = { rows: Math.max(0, rows.length - 1), imported: 0, skipped: 0, reasons: {} }
  if (rows.length < 2) return result
  const h = rows[0]
  const iEmail = headerIndex(h, /e-?mail|from/)
  const iOrder = headerIndex(h, /order/)
  const iName = headerIndex(h, /name/)
  for (const r of rows.slice(1)) {
    const email = normaliseEmail(iEmail >= 0 ? r[iEmail]?.replace(/^.*<([^>]+)>.*$/, '$1') : undefined)
    const code = (iOrder >= 0 ? r[iOrder] : '').replace(/^#/, '').trim().toUpperCase()
    let order: OrderRecord | null = null
    if (code) order = await getOrderRecord(code)
    if (!order && email) order = (await getOrdersForEmail(email, 1))[0] ?? null
    if (!order) { bump(result, 'no matching order'); continue }
    const contact = await upsertContact({
      email: email || order.email,
      phone: order.phone,
      ...(iName >= 0 ? splitName(r[iName]) : splitName(order.customerName)),
      countryCode: order.shippingAddress?.countryCode,
      source: 'email_inbox',
    })
    if (contact) { result.imported++; await refreshOrderStats(contact) } else bump(result, 'no valid email or phone')
  }
  return result
}

function bump(r: CsvImportResult, reason: string) {
  r.skipped++
  r.reasons[reason] = (r.reasons[reason] || 0) + 1
}

function countryCodeOf(v?: string): string | undefined {
  const s = (v || '').trim().toLowerCase()
  if (!s) return undefined
  if (s === 'ae' || s.includes('emirates') || s === 'uae') return 'AE'
  if (s === 'gb' || s === 'uk' || s.includes('kingdom') || s.includes('england')) return 'GB'
  return s.length === 2 ? s.toUpperCase() : undefined
}

// ── Erasure with the non-CRM copies ────────────────────────────────────────

/**
 * Brief B7 erasure: suppression hashes, then the contact and its history,
 * plus the newsletter entry and /learn lead for the same address. Order
 * records are kept for tax (they carry no marketing data).
 */
export async function eraseContactEverywhere(id: string, staffUser: string, requestedAt?: string): Promise<boolean> {
  const c = await getContact(id)
  if (!c) return false
  if (c.email) {
    await redis.zrem('newsletter:subscribers', c.email)
    await redis.del(`lead:${c.email}`)
    await redis.zrem('leads:all', c.email)
    await redis.zrem('leads:nurture', c.email)
  }
  return eraseContact(id, staffUser, requestedAt)
}

export { marketFrom }
