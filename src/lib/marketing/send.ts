// src/lib/marketing/send.ts
//
// Sends a campaign in small batches. The admin page calls sendBatch()
// repeatedly until nothing is left, so no single request runs long enough
// to hit the serverless time limit, and a closed tab or failed request can
// simply be resumed — every recipient's outcome is recorded as it happens
// and nobody is ever sent the same campaign twice.
//
// Per recipient, in this order:
//   1. On the global exclusion list (test/internal addresses)  → skipped
//   2. Unsubscribed (lib/emailPreferences — the same opt-out list every
//      reminder email already respects; fails closed)            → skipped
//   3. Sent another campaign within the frequency cap           → skipped
//   4. Otherwise rendered for them and sent.
import { sendMail } from '@/lib/mailer'
import { isMarketingSuppressed } from '@/lib/emailPreferences'
import { marketingBlockFor, recordMarketingSend } from '@/lib/marketingGate'
import { resolveAudience } from './audience'
import { renderCampaign, sampleRecipient } from './render'
import {
  getCampaign,
  saveCampaign,
  getSnapshot,
  saveSnapshot,
  getResults,
  recordResult,
  acquireSendLock,
  releaseSendLock,
  markMarketingSent,
  lastMarketingSentAt,
  listExcluded,
  clearResults,
} from './store'
import type { Campaign, CampaignStats, RecipientResult } from './types'

/** Default frequency cap: no one gets two campaigns within this many hours. */
export const DEFAULT_MIN_GAP_HOURS = 72

export function computeStats(total: number, results: Map<string, RecipientResult>): CampaignStats {
  const stats: CampaignStats = {
    recipients: total,
    sent: 0,
    failed: 0,
    skippedUnsubscribed: 0,
    skippedRecentlyMailed: 0,
    skippedExcluded: 0,
  }
  for (const r of results.values()) {
    if (r.status === 'sent') stats.sent++
    else if (r.status === 'failed') stats.failed++
    else if (r.status === 'skipped_unsubscribed') stats.skippedUnsubscribed++
    else if (r.status === 'skipped_recent') stats.skippedRecentlyMailed++
    else if (r.status === 'skipped_excluded') stats.skippedExcluded++
  }
  return stats
}

export function validateForSend(c: Campaign): string | null {
  if (!c.subject.trim()) return 'Add a subject line.'
  if (!c.heading.trim()) return 'Add a heading.'
  if (!c.body.trim()) return 'Add the email body.'
  if (!c.cta?.label?.trim() || !c.cta?.url?.trim()) return 'Add the button text and link.'
  if (c.offer?.code && new Date(c.offer.expiresAt).getTime() < Date.now()) {
    return `The code ${c.offer.code} has already expired. Create a new one before sending.`
  }
  if (/\/(certificates|verify)\b/i.test(`${c.body} ${c.cta.url} ${c.secondaryCta?.url || ''}`)) {
    return 'Certificate / verify page links are not allowed in marketing emails.'
  }
  return null
}

export async function sendTest(campaign: Campaign, to: string): Promise<void> {
  const snapshot = await getSnapshot(campaign.id)
  // Use a real recipient's details when we have them, so merge fields and
  // "last product" render as they will for actual customers.
  const base = snapshot?.[0] ?? (await resolveAudience(campaign.audience))[0] ?? sampleRecipient(to)
  const rendered = renderCampaign(campaign, { ...base, email: to })
  await sendMail({
    to,
    subject: `[TEST] ${rendered.subject}`,
    html: rendered.html,
    text: rendered.text,
    headers: rendered.headers,
  })
}

export interface BatchResult {
  processed: number
  remaining: number
  stats: CampaignStats
  done: boolean
  busy?: boolean
}

export async function sendBatch(
  id: string,
  opts: { batchSize?: number; minGapHours?: number } = {}
): Promise<BatchResult> {
  const batchSize = Math.min(Math.max(opts.batchSize ?? 15, 1), 40)
  const minGapMs = Math.max(0, opts.minGapHours ?? DEFAULT_MIN_GAP_HOURS) * 60 * 60 * 1000

  const campaign = await getCampaign(id)
  if (!campaign) throw new Error('Campaign not found.')
  const problem = validateForSend(campaign)
  if (problem && campaign.status === 'draft') throw new Error(problem)

  if (!(await acquireSendLock(id))) {
    const snapshot = (await getSnapshot(id)) || []
    const results = await getResults(id)
    return { processed: 0, remaining: snapshot.length - results.size, stats: computeStats(snapshot.length, results), done: false, busy: true }
  }

  try {
    // Freeze the audience on the first batch.
    let snapshot = await getSnapshot(id)
    if (!snapshot) {
      snapshot = await resolveAudience(campaign.audience)
      await saveSnapshot(id, snapshot)
    }
    if (campaign.status !== 'sending') {
      campaign.status = 'sending'
      campaign.sendStartedAt = campaign.sendStartedAt || new Date().toISOString()
      campaign.updatedAt = new Date().toISOString()
      await saveCampaign(campaign)
    }

    const results = await getResults(id)
    const excluded = new Set(await listExcluded())
    const pending = snapshot.filter((r) => !results.has(r.email))

    let processed = 0
    for (const recipient of pending.slice(0, batchSize)) {
      const at = new Date().toISOString()
      let blockReason: Awaited<ReturnType<typeof marketingBlockFor>> = null
      let result: RecipientResult
      if (excluded.has(recipient.email)) {
        result = { email: recipient.email, status: 'skipped_excluded', at }
      } else if (await isMarketingSuppressed(recipient.email)) {
        result = { email: recipient.email, status: 'skipped_unsubscribed', at }
      } else if ((blockReason = await marketingBlockFor(recipient.email)) === 'no_consent') {
        result = { email: recipient.email, status: 'skipped_unsubscribed', detail: 'no current email opt-in', at }
      } else if (blockReason === 'cadence') {
        result = { email: recipient.email, status: 'skipped_recent', detail: '2 marketing emails already this week', at }
      } else {
        const last = minGapMs > 0 ? await lastMarketingSentAt(recipient.email) : null
        if (last && Date.now() - last < minGapMs) {
          result = {
            email: recipient.email,
            status: 'skipped_recent',
            detail: `last campaign ${new Date(last).toISOString()}`,
            at,
          }
        } else {
          try {
            const rendered = renderCampaign(campaign, recipient)
            await sendMail({
              stream: 'marketing',
              to: recipient.email,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
              headers: rendered.headers,
            })
            await markMarketingSent(recipient.email)
            await recordMarketingSend(recipient.email)
            result = { email: recipient.email, status: 'sent', at }
          } catch (err) {
            result = {
              email: recipient.email,
              status: 'failed',
              detail: (err instanceof Error ? err.message : String(err)).slice(0, 200),
              at,
            }
          }
        }
      }
      await recordResult(id, result)
      results.set(recipient.email, result)
      processed++
    }

    const remaining = snapshot.filter((r) => !results.has(r.email)).length
    const stats = computeStats(snapshot.length, results)
    const done = remaining === 0

    const fresh = (await getCampaign(id)) || campaign
    fresh.stats = stats
    fresh.updatedAt = new Date().toISOString()
    if (done) {
      fresh.status = 'sent'
      fresh.sentAt = fresh.sentAt || new Date().toISOString()
    }
    await saveCampaign(fresh)

    return { processed, remaining, stats, done }
  } finally {
    await releaseSendLock(id)
  }
}

/**
 * Puts failed recipients back in the queue (clears their result) and
 * re-opens the campaign, so the next sendBatch() tries them again.
 * Skipped recipients are left alone — they were skipped for a reason.
 */
export async function requeueFailed(id: string): Promise<number> {
  const campaign = await getCampaign(id)
  if (!campaign) throw new Error('Campaign not found.')
  const results = await getResults(id)
  const failed = [...results.values()].filter((r) => r.status === 'failed').map((r) => r.email)
  if (failed.length) {
    await clearResults(id, failed)
    campaign.status = 'sending'
    campaign.updatedAt = new Date().toISOString()
    await saveCampaign(campaign)
  }
  return failed.length
}
