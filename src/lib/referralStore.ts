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
// Atomic counterparts to profile.referralCount / .rewardCodesIssued — see
// the fix note on recordReferralRedemption below for why these can't just
// live as fields on the profile object.
const referralCountKey = (code: string) => `referral:count:${code.trim().toUpperCase()}`
const rewardCodesKey = (code: string) => `referral:rewards:${code.trim().toUpperCase()}`

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

// BUG FIX: previously used for reward codes too (`THANKS-${base}-${randomSuffix()}`)
// with NO uniqueness check, unlike referral codes above which retry against
// getDiscountCode. A 3-digit suffix is only 900 possibilities, so a
// referrer who sends a few friends your way has a real chance of colliding
// with one of their own earlier reward codes. Since createDiscountCode
// just does a plain redis.set on that code, a collision would silently
// overwrite the earlier reward code's record — including resetting its
// redemption count to 0, which could reopen a reward the referrer's friend
// had already used. Now retries like generateUniqueCode does.
async function generateUniqueRewardCode(base: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `THANKS-${base}-${randomSuffix()}`
    const existing = await getDiscountCode(candidate)
    if (!existing) return candidate
  }
  return `THANKS-${base}-${Date.now().toString().slice(-6)}`
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
    if (!profile) return null
    // Live values from the atomic counter/list, not the possibly-stale
    // fields baked into the profile blob — see the fix note on
    // recordReferralRedemption below.
    const [count, rewards] = await Promise.all([
      redis.get<number>(referralCountKey(code)),
      redis.lrange<string>(rewardCodesKey(code), 0, -1),
    ])
    return {
      ...profile,
      referralCount: count ?? profile.referralCount,
      rewardCodesIssued: rewards.length > 0 ? rewards : profile.rewardCodesIssued,
    }
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

  const rewardCode = await generateUniqueRewardCode(profile.code.replace('REF-', ''))
  const expiresAt = new Date(Date.now() + REWARD_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await createDiscountCode({
    code: rewardCode,
    type: 'percent',
    value: REFERRER_REWARD_PERCENT,
    maxRedemptions: 1,
    expiresAt,
  })

  // BUG FIX: previously mutated the in-memory `profile` object
  // (referralCount += 1, rewardCodesIssued.push(...)) and wrote the whole
  // thing back with one redis.set — a read-modify-write race. Two friends
  // of the same referrer completing checkout close together (plausible —
  // this runs from the order webhook, and STRABL retries can overlap)
  // could both read the same starting profile and each write their own
  // "+1" on top of it, permanently losing the other's referral count and
  // reward-code record. INCR and RPUSH are both atomic server-side, so
  // concurrent redemptions can no longer stomp on each other.
  const [newCount] = await Promise.all([
    redis.incr(referralCountKey(profile.code)),
    redis.rpush(rewardCodesKey(profile.code), rewardCode),
  ])

  return {
    profile: { ...profile, referralCount: newCount, rewardCodesIssued: [...profile.rewardCodesIssued, rewardCode] },
    rewardCode,
  }
}
