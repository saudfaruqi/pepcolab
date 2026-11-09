// src/lib/emailLog.ts
//
// A record of every email the site sends.
//
// WHY
// Until now, mail was fire-and-forget. A failed send logged to the server
// console and vanished; a successful one left no trace at all. So there was
// no way to answer the questions that actually come up: did the customer get
// their order confirmation, did the reorder cron send anything last night,
// why hasn't this person had their sign-in link, is SMTP even working.
//
// Instrumented at the MAILER rather than at each caller, so every email is
// captured — including ones added later — without anyone having to remember
// to log it.
//
// WHAT IS AND ISN'T STORED
// Recipient, subject, outcome, timestamp, and a short text preview. NOT the
// full body. Two reasons: bodies are large and this log is capped, and some
// of them carry a sign-in link that grants access to an account. Storing
// those in a second place, readable from an admin screen, would turn a
// convenience into a way to take over an account. The preview is truncated
// and sign-in links are stripped before it is written.

import { redis } from '@/lib/redis'

const LOG_KEY = 'email:log'
const MAX_ENTRIES = 500          // trimmed on write — a debugging aid, not an archive
const TTL_SECONDS = 60 * 60 * 24 * 60

export interface EmailLogEntry {
  id: string
  to: string
  subject: string
  status: 'sent' | 'failed'
  error?: string
  preview: string
  sentAt: string
}

/** Never let a token in a preview become a way into someone's account. */
function scrub(text: string): string {
  return (text || '')
    .replace(/https?:\/\/\S*token=\S+/gi, '[sign-in link removed]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

export async function recordEmail(entry: {
  to: string
  subject: string
  status: 'sent' | 'failed'
  error?: string
  text?: string
}): Promise<void> {
  try {
    const now = Date.now()
    const record: EmailLogEntry = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      to: entry.to,
      subject: entry.subject,
      status: entry.status,
      error: entry.error ? String(entry.error).slice(0, 300) : undefined,
      preview: scrub(entry.text || ''),
      sentAt: new Date(now).toISOString(),
    }
    await redis.zadd(LOG_KEY, { score: now, member: JSON.stringify(record) })
    // Keep the newest MAX_ENTRIES. zremrangebyrank with a negative range
    // removes everything except the last N by score.
    await redis.zremrangebyrank(LOG_KEY, 0, -(MAX_ENTRIES + 1))
    await redis.expire(LOG_KEY, TTL_SECONDS)
  } catch (err) {
    // Logging a send must never be able to break sending one.
    console.error('[emailLog] Failed to record email:', err)
  }
}

export async function listEmailLog(limit = 200): Promise<EmailLogEntry[]> {
  try {
    const raw = (await redis.zrange(LOG_KEY, 0, limit - 1, { rev: true })) as unknown[]
    if (!raw?.length) return []
    return raw
      .map(item => {
        // Upstash may return an already-parsed object or the raw string
        // depending on content — handle both rather than assuming.
        if (typeof item === 'string') {
          try { return JSON.parse(item) as EmailLogEntry } catch { return null }
        }
        return item as EmailLogEntry
      })
      .filter((e): e is EmailLogEntry => Boolean(e?.sentAt))
  } catch (err) {
    console.error('[emailLog] Failed to read email log:', err)
    return []
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   FAILED-SEND OUTBOX (Nov 2026)

   The log above deliberately keeps only a short preview, because full bodies
   can contain account sign-in links. That makes a failed send impossible to
   retry. This outbox stores the FULL payload, but ONLY when a send fails, in
   a separate key with a short TTL, and an admin-only "Resend" action reads it.

   Bounds:
     - only failures, never successful mail
     - 7-day TTL
     - capped at MAX_OUTBOX entries
   ────────────────────────────────────────────────────────────────────────── */

const OUTBOX_KEY = (id: string) => `email:outbox:${id}`
const OUTBOX_INDEX_KEY = 'email:outbox-index'
const OUTBOX_TTL_SECONDS = 60 * 60 * 24 * 7
const MAX_OUTBOX = 200

export interface FailedEmailEntry {
  id: string
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
  headers?: Record<string, string>
  stream: 'transactional' | 'marketing'
  error?: string
  failedAt: string
}

/** Store a failed send so it can be retried from admin. Best-effort. */
export async function saveFailedEmail(entry: {
  id?: string
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
  headers?: Record<string, string>
  stream: 'transactional' | 'marketing'
  error?: string
}): Promise<string> {
  const id = entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  try {
    const record: FailedEmailEntry = {
      id,
      to: entry.to,
      subject: entry.subject,
      text: entry.text,
      html: entry.html,
      replyTo: entry.replyTo,
      headers: entry.headers,
      stream: entry.stream,
      error: entry.error ? String(entry.error).slice(0, 300) : undefined,
      failedAt: new Date().toISOString(),
    }
    await redis.set(OUTBOX_KEY(id), record, { ex: OUTBOX_TTL_SECONDS })
    await redis.zadd(OUTBOX_INDEX_KEY, { score: Date.now(), member: id })
    await redis.zremrangebyrank(OUTBOX_INDEX_KEY, 0, -(MAX_OUTBOX + 1))
    await redis.expire(OUTBOX_INDEX_KEY, OUTBOX_TTL_SECONDS)
  } catch (err) {
    console.error('[emailLog] Failed to save outbox entry:', err)
  }
  return id
}

export async function getFailedEmail(id: string): Promise<FailedEmailEntry | null> {
  try {
    return (await redis.get<FailedEmailEntry>(OUTBOX_KEY(id))) ?? null
  } catch (err) {
    console.error('[emailLog] Failed to read outbox entry:', err)
    return null
  }
}

export async function deleteFailedEmail(id: string): Promise<void> {
  try {
    await redis.del(OUTBOX_KEY(id))
    await redis.zrem(OUTBOX_INDEX_KEY, id)
  } catch (err) {
    console.error('[emailLog] Failed to delete outbox entry:', err)
  }
}

export async function listFailedEmails(limit = 100): Promise<FailedEmailEntry[]> {
  try {
    const ids = (await redis.zrange(OUTBOX_INDEX_KEY, 0, limit - 1, { rev: true })) as string[]
    if (!ids?.length) return []
    const entries = await Promise.all(ids.map(id => getFailedEmail(id)))
    return entries.filter((e): e is FailedEmailEntry => Boolean(e?.id))
  } catch (err) {
    console.error('[emailLog] Failed to list outbox:', err)
    return []
  }
}