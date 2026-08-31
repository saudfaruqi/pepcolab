// src/lib/referralStore.ts
//
// "Give 15%, get 20%" referral program, layered on top of the existing
// discountStore rather than replacing it — a referral code IS a regular
// discount code (so /api/discounts/validate and checkout work with zero
// changes), plus a ReferralProfile record here that remembers who owns it
// and what they've earned. Same "no login system" constraint as
// discountStore.ts: profiles are looked up by email, not an account.
import { redis } from '@/lib/redis'
import { createDiscountCode, getDiscountCode } from '@/lib/discountStore'

// ── Program terms — change these in one place ──────────────────────────
export const FRIEND_DISCOUNT_PERCENT = 15 // % off the referred friend's first order
export const REFERRER_REWARD_PERCENT = 20 // % off the referrer's next order, per successful referral
export const REWARD_CODE_EXPIRY_DAYS = 90

export interface ReferralProfile {
  code: string // the shareable discount code, e.g. "REF-SARAH482"
  ownerName: string
  ownerEmail: string
  createdAt: string
  referralCount: number // successful redemptions (orders placed with this code)
  rewardCodesIssued: string[] // one-time reward codes generated for the owner
}

const profileKey = (code: string) => `referral:${code.trim().toUpperCase()}`
const emailIndexKey = (email: string) => `referral:by-email:${email.trim().toLowerCase()}`

function slugifyName(name: string): string {
  const cleaned = name
    .trim()
    .split(/\s+/)[0] // first name only — shorter, more shareable code
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 8)
  return cleaned || 'FRIEND'
}

function randomSuffix(): string {
  return Math.floor(100 + Math.random() * 900).toString() // 3 digits
}

async function generateUniqueCode(name: string): Promise<string> {
  const base = slugifyName(name)
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `REF-${base}${randomSuffix()}`
    const existing = await getDiscountCode(candidate)
    if (!existing) return candidate
  }
  // Extremely unlikely fallback if the loop above never finds a free slot.
  return `REF-${base}${Date.now().toString().slice(-6)}`
}

/**
 * Idempotent: calling this again with the same email returns the visitor's
 * existing code instead of minting a second one, so refreshing the
 * referrals page or resubmitting the form doesn't fragment their referral
 * history across multiple codes.
 */
export async function getOrCreateReferral(name: string, email: string): Promise<ReferralProfile> {
  const existingCode = await redis.get<string>(emailIndexKey(email))
  if (existingCode) {
    const existing = await redis.get<ReferralProfile>(profileKey(existingCode))
    if (existing) return existing
  }

  const code = await generateUniqueCode(name)

  // The actual usable discount code — unlimited redemptions (it's a
  // standing share link, not a one-time coupon), no minimum, no expiry.
  // If this program ever needs a cap, add maxRedemptions here.
  await createDiscountCode({
    code,
    type: 'percent',
    value: FRIEND_DISCOUNT_PERCENT,
  })

  const profile: ReferralProfile = {
    code,
    ownerName: name.trim(),
    ownerEmail: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    referralCount: 0,
    rewardCodesIssued: [],
  }

  await redis.set(profileKey(code), profile)
  await redis.set(emailIndexKey(email), code)
  return profile
}

export async function getReferralByCode(code: string): Promise<ReferralProfile | null> {
  try {
    const profile = await redis.get<ReferralProfile>(profileKey(code))
    return profile ?? null
  } catch (err) {
    console.error('[referralStore] Failed to read profile:', err)
    return null
  }
}

/**
 * Called from the order webhook when an order completes using a discount
 * code. Returns null if the code isn't a referral code (i.e. a normal
 * promo/discount code — the caller should just skip referral logic in that
 * case). On a real referral redemption, mints a fresh one-time reward code
 * for the referrer and records it against their profile.
 */
export async function recordReferralRedemption(code: string): Promise<{
  profile: ReferralProfile
  rewardCode: string
} | null> {
  const profile = await getReferralByCode(code)
  if (!profile) return null

  profile.referralCount += 1

  const rewardCode = `THANKS-${profile.code.replace('REF-', '')}-${randomSuffix()}`
  const expiresAt = new Date(Date.now() + REWARD_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await createDiscountCode({
    code: rewardCode,
    type: 'percent',
    value: REFERRER_REWARD_PERCENT,
    maxRedemptions: 1,
    expiresAt,
  })

  profile.rewardCodesIssued.push(rewardCode)
  await redis.set(profileKey(profile.code), profile)

  return { profile, rewardCode }
}
