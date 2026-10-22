// src/lib/crm/query.ts
//
// Contact list with the brief's B6 filters: search by name, email, phone or
// order number; market; has email consent; has WhatsApp consent; ordered in
// the last 90 days; lapsed 90–180 days; never ordered; tag. Used by the
// Contacts page and the CSV export, so both always agree.
import { getOrderRecord } from '@/lib/orderStore'
import {
  listContacts,
  getConsentHistory,
  currentFromHistory,
  isEmailSuppressed,
  isPhoneSuppressed,
  tagsFor,
} from './store'
import type { Channel, Contact, CurrentConsent } from './types'

export interface ContactFilters {
  q?: string
  market?: 'UAE' | 'UK'
  email?: 'yes' | 'no'
  whatsapp?: 'yes' | 'no'
  activity?: 'recent90' | 'lapsed' | 'never'
  tag?: string
}

export interface ContactRow extends Contact {
  consent: Partial<Record<Channel, CurrentConsent>>
  emailMarketable: boolean
  whatsappMarketable: boolean
  tags: string[]
}

const DAY = 24 * 60 * 60 * 1000

export function parseFilters(sp: Record<string, string | string[] | undefined>): ContactFilters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) || undefined
  const f: ContactFilters = {}
  const q = one('q')?.trim()
  if (q) f.q = q.slice(0, 100)
  if (one('market') === 'UAE' || one('market') === 'UK') f.market = one('market') as 'UAE' | 'UK'
  if (one('email') === 'yes' || one('email') === 'no') f.email = one('email') as 'yes' | 'no'
  if (one('whatsapp') === 'yes' || one('whatsapp') === 'no') f.whatsapp = one('whatsapp') as 'yes' | 'no'
  if (['recent90', 'lapsed', 'never'].includes(one('activity') || '')) f.activity = one('activity') as ContactFilters['activity']
  if (one('tag')) f.tag = one('tag')!.toLowerCase()
  return f
}

export async function queryContacts(f: ContactFilters): Promise<ContactRow[]> {
  let contacts = await listContacts()
  const now = Date.now()

  if (f.market) contacts = contacts.filter((c) => c.market === f.market)
  if (f.activity) {
    contacts = contacts.filter((c) => {
      const last = c.lastOrderAt ? new Date(c.lastOrderAt).getTime() : 0
      if (f.activity === 'never') return !c.orderCount
      if (!last) return false
      const age = now - last
      if (f.activity === 'recent90') return age <= 90 * DAY
      return age > 90 * DAY && age <= 180 * DAY
    })
  }
  if (f.q) {
    const q = f.q.toLowerCase()
    const digits = q.replace(/\D/g, '')
    let byOrderEmail: string | undefined
    if (/^[a-z0-9-]{5,}$/i.test(f.q)) {
      const order = await getOrderRecord(f.q.toUpperCase().replace(/^#/, ''))
      byOrderEmail = order?.email?.toLowerCase()
    }
    contacts = contacts.filter((c) => {
      const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase()
      return (
        name.includes(q) ||
        (c.email || '').includes(q) ||
        (digits.length >= 5 && (c.phoneE164 || '').replace(/\D/g, '').includes(digits)) ||
        (byOrderEmail && c.email === byOrderEmail)
      )
    })
  }

  const tags = await tagsFor(contacts.map((c) => c.id))
  const rows: ContactRow[] = []
  for (const c of contacts) {
    const t = tags[c.id] || []
    if (f.tag && !t.includes(f.tag)) continue
    const consent = currentFromHistory(await getConsentHistory(c.id))
    const emailMarketable =
      consent.email?.action === 'granted' && Boolean(c.email) && !(await isEmailSuppressed(c.email!))
    const whatsappMarketable =
      consent.whatsapp?.action === 'granted' && Boolean(c.phoneE164) && !(await isPhoneSuppressed(c.phoneE164!))
    if (f.email === 'yes' && !emailMarketable) continue
    if (f.email === 'no' && emailMarketable) continue
    if (f.whatsapp === 'yes' && !whatsappMarketable) continue
    if (f.whatsapp === 'no' && whatsappMarketable) continue
    rows.push({ ...c, consent, emailMarketable, whatsappMarketable, tags: t })
  }
  return rows
}

function csvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function contactsToCsv(rows: ContactRow[]): string {
  const header = [
    'id', 'first_name', 'last_name', 'email', 'phone_e164', 'market', 'source', 'order_count', 'lifetime_value_aed',
    'first_order_at', 'last_order_at', 'research_attested_at', 'email_consent', 'email_consent_at', 'whatsapp_consent',
    'whatsapp_consent_at', 'email_marketable', 'whatsapp_marketable', 'tags', 'created_at',
  ]
  const lines = rows.map((r) =>
    [
      r.id, r.firstName, r.lastName, r.email, r.phoneE164, r.market, r.source, r.orderCount, r.lifetimeValueAed,
      r.firstOrderAt, r.lastOrderAt, r.researchAttestedAt, r.consent.email?.action, r.consent.email?.occurredAt,
      r.consent.whatsapp?.action, r.consent.whatsapp?.occurredAt, r.emailMarketable, r.whatsappMarketable,
      r.tags.join(' '), r.createdAt,
    ].map(csvCell).join(',')
  )
  return [header.join(','), ...lines].join('\n')
}
