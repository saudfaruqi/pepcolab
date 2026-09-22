// src/lib/affiliateStore.ts
//
// AFFILIATE PROGRAMME — commission on revenue, for people who send us
// customers they don't personally know.
//
// THIS IS THE ONLY PARTNER PROGRAMME. The old "give 15%, get 20%" customer
// referral scheme (lib/referralStore.ts, components/ReferralWidget.tsx,
// /referrals, lib/referralEmails.ts) was retired in September 2026 and every
// one of those files is deleted. If you are here looking for referral logic,
// there is none — this replaced it outright.
//
// Why it was replaced: the referral scheme paid in discount codes off the
// referrer's OWN next order, so it was worth nothing to anyone promoting us
// who had no intention of buying again. Competitor audit, September 2026:
// four of seven suppliers run a real affiliate programme (UAE Peptide
// Research has a dedicated portal, NOVA Labs uses tracked links, UKPeptides
// and MY PEPTIDES both have one). In a market where almost nobody has real
// social reach, the affiliates ARE the distribution.
//
// So: an affiliate gets a code, their audience gets a discount for using it,
// and the affiliate earns a percentage of what those orders are worth, paid
// in money rather than credit.
//
// TWO CORRECTNESS RULES, both learned from bugs that had to be fixed in the
// retired referral store — do not undo either of them:
//
// 1. NEVER READ-MODIFY-WRITE A TOTAL. Two orders completing close together
//    would each read the same starting figure and write their own increment
//    over the other. Every running total here is an atomic INCR/INCRBY or an
//    append to a list.
//
// 2. SALES ARE IDEMPOTENT PER ORDER. This is called from the payment
//    webhook, and STRABL retries. A retry that paid commission twice would
//    be real money out of the door, so the first write for an order code
//    claims a lock with SET NX and every later call for that order is a
//    no-op.

import { redis } from '@/lib/redis'
import { createDiscountCode, getDiscountCode } from '@/lib/discountStore'

/* ── Programme terms — change these in one place ───────────────────────── */

/** Percentage of the order subtotal paid to the affiliate. */
export const AFFILIATE_COMMISSION_PERCENT = 10
/** Percentage discount the affiliate's audience gets for using their code. */
export const AFFILIATE_AUDIENCE_DISCOUNT_PERCENT = 10
/** Commission is held for this long before it can be paid, to cover refunds. */
export const AFFILIATE_HOLD_DAYS = 30
/** Minimum approved balance before a payout is issued, in AED. */
export const AFFILIATE_MIN_PAYOUT_AED = 200

export type AffiliateStatus = 'pending' | 'active' | 'suspended'
export type SaleStatus = 'pending' | 'approved' | 'paid' | 'reversed'

export interface AffiliateProfile {
  code: string
  name: string
  email: string
  /** Where they will promote us — free text from the application form. */
  audience: string
  status: AffiliateStatus
  /** Per-affiliate override of the default rate, for negotiated deals. */
  commissionPercent: number
  createdAt: string
  approvedAt?: string
}

export interface AffiliateSale {
  orderCode: string
  currency: string
  subtotal: number
  commission: number
  status: SaleStatus
  createdAt: string
}

export interface AffiliateStats {
  clicks: number
  orders: number
  /** Commission earned across every non-reversed sale. */
  grossCommission: number
  /** Earned but still inside the refund hold window. */
  pendingCommission: number
  /** Past the hold window and payable. */
  approvedCommission: number
  paidCommission: number
  currency: string
}

/* ── Keys ──────────────────────────────────────────────────────────────── */

const norm = (code: string) => code.trim().toUpperCase()
const profileKey = (code: string) => `affiliate:${norm(code)}`
const emailIndexKey = (email: string) => `affiliate:by-email:${email.trim().toLowerCase()}`
const clicksKey = (code: string) => `affiliate:clicks:${norm(code)}`
const salesKey = (code: string) => `affiliate:sales:${norm(code)}`
const orderLockKey = (orderCode: string) => `affiliate:order:${orderCode.trim().toUpperCase()}`
const rosterKey = () => 'affiliate:roster'

/* ── Code generation ───────────────────────────────────────────────────── */

function slugifyName(name: string): string {
  const cleaned = name
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 8)
  return cleaned || 'PARTNER'
}

function randomSuffix(): string {
  return Math.floor(100 + Math.random() * 900).toString()
}

/**
 * Retries against the discount store so a new affiliate can never be handed
 * a code that already belongs to someone else — createDiscountCode is a
 * plain set, so a collision would silently overwrite the earlier record.
 */
async function generateUniqueCode(name: string): Promise<string> {
  const base = slugifyName(name)
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `PL-${base}${randomSuffix()}`
    const existing = await getDiscountCode(candidate)
    if (!existing) return candidate
  }
  return `PL-${base}${Date.now().toString().slice(-6)}`
}

/* ── Applying ──────────────────────────────────────────────────────────── */

/**
 * Applications are idempotent by email: re-submitting the form returns the
 * existing profile rather than minting a second code, so someone who applies
 * twice does not end up splitting their earnings across two identities.
 *
 * An applicant starts as 'pending' and their discount code is NOT created
 * yet. Handing out a live discount code to anyone who fills in a form would
 * let a stranger mint themselves 10% off in one step, and would put our
 * name in the hands of people we have not looked at. The code is created on
 * approval — see approveAffiliate.
 */
export async function applyForAffiliate(
  name: string,
  email: string,
  audience: string
): Promise<AffiliateProfile> {
  const existingCode = await redis.get<string>(emailIndexKey(email))
  if (existingCode) {
    const existing = await redis.get<AffiliateProfile>(profileKey(existingCode))
    if (existing) return existing
  }

  const code = await generateUniqueCode(name)

  const profile: AffiliateProfile = {
    code,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    audience: audience.trim().slice(0, 500),
    status: 'pending',
    commissionPercent: AFFILIATE_COMMISSION_PERCENT,
    createdAt: new Date().toISOString(),
  }

  await Promise.all([
    redis.set(profileKey(code), profile),
    redis.set(emailIndexKey(email), code),
    redis.rpush(rosterKey(), code),
  ])

  return profile
}

/* ── Reading ───────────────────────────────────────────────────────────── */

export async function getAffiliateByCode(code: string): Promise<AffiliateProfile | null> {
  try {
    return (await redis.get<AffiliateProfile>(profileKey(code))) ?? null
  } catch (err) {
    console.error('[affiliateStore] Failed to read profile:', err)
    return null
  }
}

export async function getAffiliateByEmail(email: string): Promise<AffiliateProfile | null> {
  try {
    const code = await redis.get<string>(emailIndexKey(email))
    if (!code) return null
    return await getAffiliateByCode(code)
  } catch (err) {
    console.error('[affiliateStore] Failed to read profile by email:', err)
    return null
  }
}

export async function listAffiliates(): Promise<AffiliateProfile[]> {
  try {
    const codes = await redis.lrange<string>(rosterKey(), 0, -1)
    if (codes.length === 0) return []
    const profiles = await Promise.all(codes.map(c => getAffiliateByCode(c)))
    return profiles.filter((p): p is AffiliateProfile => p !== null)
  } catch (err) {
    console.error('[affiliateStore] Failed to list affiliates:', err)
    return []
  }
}

/* ── Approval ──────────────────────────────────────────────────────────── */

/**
 * Approving is what creates the live discount code. Unlimited redemptions —
 * it is a standing share link, not a coupon — with no minimum and no expiry.
 */
export async function approveAffiliate(code: string): Promise<AffiliateProfile | null> {
  const profile = await getAffiliateByCode(code)
  if (!profile) return null
  if (profile.status === 'active') return profile

  const existingDiscount = await getDiscountCode(profile.code)
  if (!existingDiscount) {
    await createDiscountCode({
      code: profile.code,
      type: 'percent',
      value: AFFILIATE_AUDIENCE_DISCOUNT_PERCENT,
    })
  }

  const updated: AffiliateProfile = {
    ...profile,
    status: 'active',
    approvedAt: new Date().toISOString(),
  }
  await redis.set(profileKey(profile.code), updated)
  return updated
}

/**
 * Suspending leaves the discount code live on purpose. Killing it would
 * break every link the affiliate has already published, stranding customers
 * mid-purchase on a code that suddenly errors. Suspension stops commission
 * accruing; removing the code is a separate, deliberate act.
 */
export async function suspendAffiliate(code: string): Promise<AffiliateProfile | null> {
  const profile = await getAffiliateByCode(code)
  if (!profile) return null
  const updated: AffiliateProfile = { ...profile, status: 'suspended' }
  await redis.set(profileKey(profile.code), updated)
  return updated
}

/* ── Tracking ──────────────────────────────────────────────────────────── */

/**
 * A click on an affiliate link. Atomic, unauthenticated and cheap — this is
 * a vanity counter for the affiliate's own dashboard, never an input to
 * anything that pays out, so inflating it gains nobody anything.
 */
export async function recordAffiliateClick(code: string): Promise<void> {
  try {
    const profile = await getAffiliateByCode(code)
    if (!profile) return
    await redis.incr(clicksKey(profile.code))
  } catch (err) {
    console.error('[affiliateStore] Failed to record click:', err)
  }
}

/**
 * Called from the payment webhook when an order completes on an affiliate
 * code. Returns null when the code is not an affiliate code, so the caller
 * can carry on without treating it as an error.
 *
 * IDEMPOTENT PER ORDER. The SET NX below is the whole safety mechanism: the
 * first call for an order claims the lock and records the sale, and every
 * retry after that returns null having changed nothing. Without it, STRABL
 * delivering the same webhook twice would pay commission twice.
 */
export async function recordAffiliateSale(
  code: string,
  orderCode: string,
  subtotal: number,
  currency: string
): Promise<AffiliateSale | null> {
  const profile = await getAffiliateByCode(code)
  if (!profile) return null

  // Suspended affiliates keep their links working but stop earning.
  if (profile.status !== 'active') return null

  if (!Number.isFinite(subtotal) || subtotal <= 0) return null

  try {
    const claimed = await redis.set(orderLockKey(orderCode), profile.code, { nx: true })
    if (claimed !== 'OK') return null
  } catch (err) {
    // If the lock cannot be taken, do NOT record the sale. Failing to pay a
    // commission is recoverable by hand; paying it twice is not.
    console.error('[affiliateStore] Could not claim order lock, skipping:', err)
    return null
  }

  const commission = Math.round(subtotal * (profile.commissionPercent / 100) * 100) / 100

  const sale: AffiliateSale = {
    orderCode: orderCode.trim().toUpperCase(),
    currency,
    subtotal,
    commission,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  await redis.rpush(salesKey(profile.code), JSON.stringify(sale))
  return sale
}

/**
 * Reverses a recorded sale — a refund, a chargeback, a cancelled order.
 * Rewrites that one entry in place rather than deleting it, so the ledger
 * stays a complete history of what happened rather than only what paid.
 */
export async function reverseAffiliateSale(orderCode: string): Promise<boolean> {
  try {
    const code = await redis.get<string>(orderLockKey(orderCode))
    if (!code) return false
    return await setSaleStatus(code, orderCode, 'reversed')
  } catch (err) {
    console.error('[affiliateStore] Failed to reverse sale:', err)
    return false
  }
}

/** Moves one sale to a new status. Used by the hold sweep and by payouts. */
export async function setSaleStatus(
  code: string,
  orderCode: string,
  status: SaleStatus
): Promise<boolean> {
  try {
    const raw = await redis.lrange<string>(salesKey(code), 0, -1)
    const target = orderCode.trim().toUpperCase()
    for (let i = 0; i < raw.length; i++) {
      const sale = parseSale(raw[i])
      if (!sale || sale.orderCode !== target) continue
      const updated: AffiliateSale = { ...sale, status }
      await redis.lset(salesKey(code), i, JSON.stringify(updated))
      return true
    }
    return false
  } catch (err) {
    console.error('[affiliateStore] Failed to set sale status:', err)
    return false
  }
}

/**
 * Upstash returns list members already parsed when they are JSON, and as
 * strings otherwise, depending on how they were written. Handling both
 * keeps this working either way rather than throwing on one of them.
 */
function parseSale(entry: unknown): AffiliateSale | null {
  if (!entry) return null
  if (typeof entry === 'object') return entry as AffiliateSale
  try {
    return JSON.parse(String(entry)) as AffiliateSale
  } catch {
    return null
  }
}

export async function getAffiliateSales(code: string): Promise<AffiliateSale[]> {
  try {
    const raw = await redis.lrange<string>(salesKey(code), 0, -1)
    return raw.map(parseSale).filter((s): s is AffiliateSale => s !== null)
  } catch (err) {
    console.error('[affiliateStore] Failed to read sales:', err)
    return []
  }
}

/**
 * Everything the affiliate's dashboard shows. Reversed sales are excluded
 * from every total — a refunded order earned nothing.
 */
export async function getAffiliateStats(code: string): Promise<AffiliateStats> {
  const [clicks, sales] = await Promise.all([
    redis.get<number>(clicksKey(code)).catch(() => 0),
    getAffiliateSales(code),
  ])

  const live = sales.filter(s => s.status !== 'reversed')
  const sum = (list: AffiliateSale[]) =>
    Math.round(list.reduce((t, s) => t + s.commission, 0) * 100) / 100

  return {
    clicks: clicks ?? 0,
    orders: live.length,
    grossCommission: sum(live),
    pendingCommission: sum(live.filter(s => s.status === 'pending')),
    approvedCommission: sum(live.filter(s => s.status === 'approved')),
    paidCommission: sum(live.filter(s => s.status === 'paid')),
    currency: live[0]?.currency || 'AED',
  }
}

/**
 * Moves sales past the refund hold window from pending to approved. Run from
 * the existing customer-care cron rather than on read, so the transition
 * happens once and is visible in the ledger rather than being recomputed
 * differently by every caller.
 */
export async function sweepAffiliateHolds(): Promise<number> {
  const cutoff = Date.now() - AFFILIATE_HOLD_DAYS * 24 * 60 * 60 * 1000
  let promoted = 0

  const affiliates = await listAffiliates()
  for (const affiliate of affiliates) {
    const sales = await getAffiliateSales(affiliate.code)
    for (const sale of sales) {
      if (sale.status !== 'pending') continue
      if (new Date(sale.createdAt).getTime() > cutoff) continue
      const ok = await setSaleStatus(affiliate.code, sale.orderCode, 'approved')
      if (ok) promoted++
    }
  }

  return promoted
}