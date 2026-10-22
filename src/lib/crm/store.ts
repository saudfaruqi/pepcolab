// src/lib/crm/store.ts
//
// CRM STORE (Oct 2026 clean-up brief, part B) — on Upstash Redis, by
// decision (the brief's PostgreSQL schema mapped onto keys below).
//
// THE PRINCIPLE: every customer and subscriber lives in OUR database, with a
// provable consent history per channel. WhatsApp, the email provider and ad
// platforms are delivery pipes; if any is banned, the list survives.
//
// KEYS
//   crm:contact:<id>          Contact JSON
//   crm:idx:email:<email>     → id   (lower-cased, trimmed)
//   crm:idx:phone:<e164>      → id
//   crm:contacts              zset of ids, score = updatedAt (ms)
//   crm:consent:<id>          list of ConsentEvent JSON, oldest first
//   crm:supp:email / :phone   sets of SHA-256 hashes (suppression list)
//   crm:interactions:<id>     list of Interaction JSON, newest first
//   crm:tags:<id>             set of tags; crm:tagset = every tag in use
//   crm:audit                 list of audit rows, newest first
//   crm:erasures              list of erasure records, newest first
//
// APPEND-ONLY CONSENT. Postgres would enforce this with a trigger; Redis
// cannot, so it is enforced by this module's surface: the only write to a
// consent list is appendConsentEvent() (RPUSH). There is no update or delete
// function. The single removal path is eraseContact(), which first writes the
// suppression hashes and then deletes the contact with its history, exactly
// as the brief's FK cascade does.
//
// HASHING RULE (everywhere): SHA-256 hex of the lower-cased, trimmed email,
// and SHA-256 hex of the E.164 phone number.
import crypto from 'crypto'
import { redis } from '@/lib/redis'
import type {
  Channel,
  ConsentAction,
  ConsentEvent,
  ConsentEvidence,
  Contact,
  ContactSource,
  CurrentConsent,
  CapturePoint,
  Interaction,
  Market,
} from './types'

const K = {
  contact: (id: string) => `crm:contact:${id}`,
  email: (e: string) => `crm:idx:email:${e}`,
  phone: (p: string) => `crm:idx:phone:${p}`,
  all: 'crm:contacts',
  consent: (id: string) => `crm:consent:${id}`,
  suppEmail: 'crm:supp:email',
  suppPhone: 'crm:supp:phone',
  interactions: (id: string) => `crm:interactions:${id}`,
  tags: (id: string) => `crm:tags:${id}`,
  tagset: 'crm:tagset',
  audit: 'crm:audit',
  erasures: 'crm:erasures',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const E164_RE = /^\+[1-9][0-9]{7,14}$/

// ── Normalisation ───────────────────────────────────────────────────────────

export function normaliseEmail(raw: string | null | undefined): string | undefined {
  const e = (raw || '').trim().toLowerCase()
  return EMAIL_RE.test(e) ? e : undefined
}

/**
 * E.164 from what customers actually type (brief B3): UAE "05x…" → "+9715x…",
 * UK "07…" → "+447…", "00…" → "+…". Returns undefined when the result is
 * not a plausible E.164 number.
 */
export function normalisePhone(raw: string | null | undefined, market?: Market): string | undefined {
  let s = (raw || '').trim()
  if (!s) return undefined
  const plus = s.startsWith('+')
  let d = s.replace(/\D/g, '')
  if (!d) return undefined
  if (!plus) {
    if (d.startsWith('00')) d = d.slice(2)
    else if (/^05\d{8}$/.test(d)) d = `971${d.slice(1)}`
    else if (/^5\d{8}$/.test(d) && market !== 'UK') d = `971${d}`
    else if (/^07\d{9}$/.test(d)) d = `44${d.slice(1)}`
    else if (/^7\d{9}$/.test(d) && market === 'UK') d = `44${d}`
  }
  // "+971 05x…" written with the trunk zero
  if (d.startsWith('9710')) d = `971${d.slice(4)}`
  if (d.startsWith('440')) d = `44${d.slice(3)}`
  s = `+${d}`
  return E164_RE.test(s) ? s : undefined
}

export function marketFrom(countryCode?: string | null, phone?: string): Market {
  const c = (countryCode || '').toUpperCase()
  if (c === 'GB' || c === 'UK') return 'UK'
  if (c === 'AE') return 'UAE'
  if (phone?.startsWith('+44')) return 'UK'
  return 'UAE'
}

export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}
export function hashPhone(e164: string): string {
  return crypto.createHash('sha256').update(e164.trim()).digest('hex')
}

function newId(): string {
  return crypto.randomUUID()
}

// ── Contacts ────────────────────────────────────────────────────────────────

export async function getContact(id: string): Promise<Contact | null> {
  if (!id) return null
  return (await redis.get<Contact>(K.contact(id))) ?? null
}

export async function findContactIdByEmail(email: string): Promise<string | null> {
  const e = normaliseEmail(email)
  if (!e) return null
  return (await redis.get<string>(K.email(e))) ?? null
}

export async function findContactIdByPhone(phone: string): Promise<string | null> {
  const p = normalisePhone(phone)
  if (!p) return null
  return (await redis.get<string>(K.phone(p))) ?? null
}

export async function findContactByEmail(email: string): Promise<Contact | null> {
  const id = await findContactIdByEmail(email)
  return id ? getContact(id) : null
}

async function saveContact(c: Contact): Promise<void> {
  await redis.set(K.contact(c.id), c)
  await redis.zadd(K.all, { score: new Date(c.updatedAt).getTime() || Date.now(), member: c.id })
}

export interface ContactInput {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  countryCode?: string | null
  market?: Market
  source: ContactSource
  shopifyCustomerId?: string | null
}

/**
 * Finds or creates the contact for this person. De-duplication (brief B3):
 * match first on lower-cased email, then on E.164 phone. Fields already set
 * are not overwritten by blanks; missing ones are filled in. Index keys are
 * claimed with SET NX, so two simultaneous writers never create two contacts.
 */
export async function upsertContact(input: ContactInput): Promise<Contact | null> {
  const email = normaliseEmail(input.email)
  const market0 = input.market ?? marketFrom(input.countryCode, undefined)
  const phone = normalisePhone(input.phone, market0)
  if (!email && !phone) return null

  let id = (email && (await redis.get<string>(K.email(email)))) || (phone && (await redis.get<string>(K.phone(phone)))) || null
  let existing = id ? await getContact(id) : null
  const now = new Date().toISOString()

  if (!existing) {
    const candidate = newId()
    // Claim the indexes first; if another writer won, use theirs.
    if (email) {
      const ok = await redis.set(K.email(email), candidate, { nx: true })
      if (!ok) {
        id = await redis.get<string>(K.email(email))
        existing = id ? await getContact(id) : null
      }
    }
    if (!existing && phone) {
      const ok = await redis.set(K.phone(phone), candidate, { nx: true })
      if (!ok) {
        const other = await redis.get<string>(K.phone(phone))
        if (other && other !== candidate) {
          id = other
          existing = await getContact(other)
          // The email index we just claimed should point at the same person.
          if (email && existing) await redis.set(K.email(email), other)
        }
      }
    }
    if (!existing) {
      const c: Contact = {
        id: candidate,
        email,
        phoneE164: phone,
        firstName: clean(input.firstName),
        lastName: clean(input.lastName),
        market: input.market ?? marketFrom(input.countryCode, phone),
        source: input.source,
        shopifyCustomerId: clean(input.shopifyCustomerId),
        orderCount: 0,
        lifetimeValueAed: 0,
        createdAt: now,
        updatedAt: now,
      }
      await saveContact(c)
      return c
    }
  }

  const c: Contact = {
    ...existing!,
    email: existing!.email || email,
    phoneE164: existing!.phoneE164 || phone,
    firstName: existing!.firstName || clean(input.firstName),
    lastName: existing!.lastName || clean(input.lastName),
    shopifyCustomerId: existing!.shopifyCustomerId || clean(input.shopifyCustomerId),
    updatedAt: now,
  }
  if (email && !existing!.email) await redis.set(K.email(email), c.id)
  if (phone && !existing!.phoneE164) await redis.set(K.phone(phone), c.id, { nx: true })
  await saveContact(c)
  return c
}

function clean(v: string | null | undefined): string | undefined {
  const s = (v || '').trim()
  return s && s !== '—' ? s.slice(0, 120) : undefined
}

/** Admin edits to identity fields (never consent). */
export async function updateContactFields(
  id: string,
  patch: Partial<Pick<Contact, 'firstName' | 'lastName' | 'market' | 'orderCount' | 'lifetimeValueAed' | 'firstOrderAt' | 'lastOrderAt' | 'researchAttestedAt' | 'shopifyCustomerId'>>
): Promise<Contact | null> {
  const c = await getContact(id)
  if (!c) return null
  const next = { ...c, ...patch, updatedAt: new Date().toISOString() }
  await saveContact(next)
  return next
}

export async function listContactIds(): Promise<string[]> {
  return ((await redis.zrange(K.all, 0, -1, { rev: true })) as string[]) || []
}

export async function getContacts(ids: string[]): Promise<Contact[]> {
  const out: Contact[] = []
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200)
    if (!chunk.length) continue
    const rows = (await redis.mget<Contact[]>(...chunk.map(K.contact))) as (Contact | null)[]
    for (const r of rows) if (r) out.push(r)
  }
  return out
}

export async function listContacts(): Promise<Contact[]> {
  return getContacts(await listContactIds())
}

// ── Consent ─────────────────────────────────────────────────────────────────

export interface ConsentInput {
  channel: Channel
  action: ConsentAction
  wordingVersion: string
  capturePoint: CapturePoint
  evidence?: ConsentEvidence
  occurredAt?: string
}

/** The ONLY write to consent history (append-only, see header). */
export async function appendConsentEvent(contactId: string, input: ConsentInput): Promise<ConsentEvent> {
  const ev: ConsentEvent = {
    id: newId(),
    contactId,
    channel: input.channel,
    action: input.action,
    wordingVersion: input.wordingVersion,
    capturePoint: input.capturePoint,
    evidence: input.evidence ?? {},
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  }
  await redis.rpush(K.consent(contactId), JSON.stringify(ev))
  return ev
}

export async function getConsentHistory(contactId: string): Promise<ConsentEvent[]> {
  const raw = ((await redis.lrange(K.consent(contactId), 0, -1)) as unknown[]) || []
  return raw
    .map((r) => (typeof r === 'string' ? (JSON.parse(r) as ConsentEvent) : (r as ConsentEvent)))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
}

/** Latest event per channel (the brief's crm_consent_current view). */
export function currentFromHistory(history: ConsentEvent[]): Partial<Record<Channel, CurrentConsent>> {
  const out: Partial<Record<Channel, CurrentConsent>> = {}
  for (const e of history) {
    const prev = out[e.channel]
    if (!prev || e.occurredAt >= prev.occurredAt) {
      out[e.channel] = {
        channel: e.channel,
        action: e.action,
        wordingVersion: e.wordingVersion,
        capturePoint: e.capturePoint,
        occurredAt: e.occurredAt,
      }
    }
  }
  return out
}

export async function getCurrentConsent(contactId: string): Promise<Partial<Record<Channel, CurrentConsent>>> {
  return currentFromHistory(await getConsentHistory(contactId))
}

// ── Suppression ─────────────────────────────────────────────────────────────

export async function suppress(contact: { email?: string; phoneE164?: string }, reason: 'unsubscribed' | 'stop' | 'erasure' | 'complaint', channels: Channel[] = ['email', 'whatsapp']): Promise<void> {
  const at = new Date().toISOString()
  if (channels.includes('email') && contact.email) {
    await redis.sadd(K.suppEmail, hashEmail(contact.email))
  }
  if (channels.includes('whatsapp') && contact.phoneE164) {
    await redis.sadd(K.suppPhone, hashPhone(contact.phoneE164))
  }
  await redis.lpush('crm:supp:log', JSON.stringify({ reason, channels, at }))
  await redis.ltrim('crm:supp:log', 0, 9999)
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const e = normaliseEmail(email)
  if (!e) return true
  return Boolean(await redis.sismember(K.suppEmail, hashEmail(e)))
}

export async function isPhoneSuppressed(e164: string): Promise<boolean> {
  return Boolean(await redis.sismember(K.suppPhone, hashPhone(e164)))
}

/** The brief's crm_marketable view, for one contact and channel. */
export async function isMarketable(contact: Contact, channel: Channel, current?: Partial<Record<Channel, CurrentConsent>>): Promise<boolean> {
  const cur = current ?? (await getCurrentConsent(contact.id))
  if (cur[channel]?.action !== 'granted') return false
  if (channel === 'email') return Boolean(contact.email) && !(await isEmailSuppressed(contact.email!))
  return Boolean(contact.phoneE164) && !(await isPhoneSuppressed(contact.phoneE164!))
}

/** True when this address may receive marketing email right now. Fails closed. */
export async function isEmailMarketable(email: string): Promise<boolean> {
  try {
    const c = await findContactByEmail(email)
    return c ? await isMarketable(c, 'email') : false
  } catch (err) {
    console.error('[crm] marketable check failed — treating as not marketable:', err)
    return false
  }
}

// ── Grant / withdraw helpers used by every capture point ────────────────────

export async function grantConsent(
  contact: Contact,
  channel: Channel,
  capturePoint: CapturePoint,
  wordingVersion: string,
  evidence: ConsentEvidence = {},
  occurredAt?: string
): Promise<ConsentEvent | null> {
  // A suppressed address/number cannot be re-opted in by an automatic path;
  // only an explicit request recorded by staff can lift it.
  if (capturePoint !== 'admin_on_request') {
    if (channel === 'email' && contact.email && (await isEmailSuppressed(contact.email))) return null
    if (channel === 'whatsapp' && contact.phoneE164 && (await isPhoneSuppressed(contact.phoneE164))) return null
  }
  if (capturePoint === 'admin_on_request') {
    if (channel === 'email' && contact.email) {
      await redis.srem(K.suppEmail, hashEmail(contact.email))
      // The older opt-out list (lib/emailPreferences.ts) is lifted too.
      await redis.zrem('email:suppressed', contact.email)
    }
    if (channel === 'whatsapp' && contact.phoneE164) await redis.srem(K.suppPhone, hashPhone(contact.phoneE164))
  }
  return appendConsentEvent(contact.id, { channel, action: 'granted', wordingVersion, capturePoint, evidence, occurredAt })
}

export async function withdrawConsent(
  contact: Contact,
  channel: Channel,
  capturePoint: CapturePoint,
  evidence: ConsentEvidence = {}
): Promise<ConsentEvent> {
  const cur = await getCurrentConsent(contact.id)
  const ev = await appendConsentEvent(contact.id, {
    channel,
    action: 'withdrawn',
    wordingVersion: cur[channel]?.wordingVersion ?? (channel === 'email' ? 'email-v1' : 'whatsapp-v1'),
    capturePoint,
    evidence,
  })
  await suppress(contact, channel === 'email' ? 'unsubscribed' : 'stop', [channel])
  return ev
}

/**
 * Unsubscribe by email address from any path (one-click links, the
 * /unsubscribe page, newsletter opt-out). Writes a withdrawn event for a
 * known contact, and the suppression hash either way.
 */
export async function withdrawEmailByAddress(email: string, capturePoint: CapturePoint = 'email_unsubscribe', evidence: ConsentEvidence = {}): Promise<void> {
  const e = normaliseEmail(email)
  if (!e) return
  const c = await findContactByEmail(e)
  if (c) await withdrawConsent(c, 'email', capturePoint, evidence)
  else await suppress({ email: e }, 'unsubscribed', ['email'])
}

// ── Interactions, tags ──────────────────────────────────────────────────────

export async function logInteraction(input: Omit<Interaction, 'id' | 'occurredAt'> & { occurredAt?: string }): Promise<Interaction> {
  const row: Interaction = { ...input, id: newId(), occurredAt: input.occurredAt ?? new Date().toISOString() }
  await redis.lpush(K.interactions(input.contactId), JSON.stringify(row))
  await redis.ltrim(K.interactions(input.contactId), 0, 999)
  return row
}

export async function getInteractions(contactId: string): Promise<Interaction[]> {
  const raw = ((await redis.lrange(K.interactions(contactId), 0, 199)) as unknown[]) || []
  return raw.map((r) => (typeof r === 'string' ? (JSON.parse(r) as Interaction) : (r as Interaction)))
}

export async function getTags(contactId: string): Promise<string[]> {
  return (((await redis.smembers(K.tags(contactId))) as string[]) || []).sort()
}

export async function addTag(contactId: string, tag: string): Promise<void> {
  const t = tag.trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').slice(0, 40)
  if (!t) return
  await redis.sadd(K.tags(contactId), t)
  await redis.sadd(K.tagset, t)
}

export async function removeTag(contactId: string, tag: string): Promise<void> {
  await redis.srem(K.tags(contactId), tag)
}

export async function allTags(): Promise<string[]> {
  return (((await redis.smembers(K.tagset)) as string[]) || []).sort()
}

export async function tagsFor(ids: string[]): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {}
  for (const id of ids) out[id] = ((await redis.smembers(K.tags(id))) as string[]) || []
  return out
}

// ── Audit ───────────────────────────────────────────────────────────────────

export interface AuditRow {
  at: string
  user: string
  role: string
  action: string
  detail?: string
}

export async function audit(row: Omit<AuditRow, 'at'>): Promise<void> {
  await redis.lpush(K.audit, JSON.stringify({ ...row, at: new Date().toISOString() }))
  await redis.ltrim(K.audit, 0, 4999)
}

export async function listAudit(limit = 200): Promise<AuditRow[]> {
  const raw = ((await redis.lrange(K.audit, 0, limit - 1)) as unknown[]) || []
  return raw.map((r) => (typeof r === 'string' ? JSON.parse(r) : r) as AuditRow)
}

// ── Erasure (brief B7) ──────────────────────────────────────────────────────

export interface ErasureRecord {
  contactId: string
  requestedAt: string
  completedAt: string
  staffUser: string
}

/**
 * Writes the suppression hashes for email and phone, then deletes the
 * contact, its consent history, interactions and tags. Order records are
 * kept (tax), and hold no marketing data. Logs request and completion.
 */
export async function eraseContact(id: string, staffUser: string, requestedAt?: string): Promise<boolean> {
  const c = await getContact(id)
  if (!c) return false
  await suppress(c, 'erasure')
  if (c.email) {
    const owner = await redis.get<string>(K.email(c.email))
    if (owner === id) await redis.del(K.email(c.email))
  }
  if (c.phoneE164) {
    const owner = await redis.get<string>(K.phone(c.phoneE164))
    if (owner === id) await redis.del(K.phone(c.phoneE164))
  }
  await redis.del(K.contact(id), K.consent(id), K.interactions(id), K.tags(id))
  await redis.zrem(K.all, id)
  const rec: ErasureRecord = { contactId: id, requestedAt: requestedAt || new Date().toISOString(), completedAt: new Date().toISOString(), staffUser }
  await redis.lpush(K.erasures, JSON.stringify(rec))
  return true
}

/** Every email address that may receive marketing now (brief crm_marketable, channel = email). */
export async function marketableEmails(): Promise<Map<string, Contact>> {
  const out = new Map<string, Contact>()
  const contacts = (await listContacts()).filter((c) => c.email)
  for (const c of contacts) {
    if (await isMarketable(c, 'email')) out.set(c.email!, c)
  }
  return out
}

/** Every phone that may receive WhatsApp updates now (brief crm_marketable, channel = whatsapp). */
export async function marketablePhones(): Promise<Contact[]> {
  const out: Contact[] = []
  const contacts = (await listContacts()).filter((c) => c.phoneE164)
  for (const c of contacts) {
    if (await isMarketable(c, 'whatsapp')) out.push(c)
  }
  return out
}
