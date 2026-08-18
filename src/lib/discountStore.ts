// src/lib/discountStore.ts
//
// Simple percentage/fixed discount codes, stored in Redis. No admin UI
// exists for this (no login system in the app), so codes are created via
// a token-protected API route — see app/api/discounts/admin/route.ts.
import { redis } from '@/lib/redis'

export interface DiscountCode {
  code: string // stored/matched uppercase
  type: 'percent' | 'fixed'
  value: number // percent: 0-100, fixed: a flat amount in whatever currency the cart is displaying at checkout time (see KNOWN SIMPLIFICATION note in app/cart/page.tsx — fixed codes don't currency-convert across markets)
  active: boolean
  maxRedemptions: number | null // null = unlimited
  redemptions: number
  minSubtotal: number | null // same currency caveat as `value` above; null = no minimum
  expiresAt: string | null // ISO date, null = no expiry
  createdAt: string
}

const codeKey = (code: string) => `discount:${code.trim().toUpperCase()}`

export async function createDiscountCode(input: {
  code: string
  type: 'percent' | 'fixed'
  value: number
  maxRedemptions?: number | null
  minSubtotal?: number | null
  expiresAt?: string | null
}): Promise<DiscountCode> {
  const discount: DiscountCode = {
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value,
    active: true,
    maxRedemptions: input.maxRedemptions ?? null,
    redemptions: 0,
    minSubtotal: input.minSubtotal ?? null,
    expiresAt: input.expiresAt ?? null,
    createdAt: new Date().toISOString(),
  }
  await redis.set(codeKey(discount.code), discount)
  await redis.sadd('discount:all-codes', discount.code)
  return discount
}

export async function getDiscountCode(code: string): Promise<DiscountCode | null> {
  try {
    const d = await redis.get<DiscountCode>(codeKey(code))
    return d ?? null
  } catch (err) {
    console.error('[discountStore] Failed to read code:', err)
    return null
  }
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  try {
    const codes = (await redis.smembers('discount:all-codes')) as string[]
    if (codes.length === 0) return []
    const discounts = await Promise.all(codes.map((c) => getDiscountCode(c)))
    return discounts.filter((d): d is DiscountCode => d !== null)
  } catch (err) {
    console.error('[discountStore] Failed to list codes:', err)
    return []
  }
}

export async function incrementRedemption(code: string): Promise<void> {
  const discount = await getDiscountCode(code)
  if (!discount) return
  discount.redemptions += 1
  await redis.set(codeKey(discount.code), discount)
}

// Returns { valid, discount, error } — error is a customer-facing message
// when valid is false. Checked at both /api/discounts/validate time (before
// checkout) and again isn't re-checked at webhook time beyond incrementing
// redemptions — see the honesty note in useStrablCheckout.ts about the
// trust model here.
export function checkDiscountEligibility(
  discount: DiscountCode,
  subtotal: number
): { valid: boolean; error?: string } {
  if (!discount.active) return { valid: false, error: 'This code is no longer active.' }
  if (discount.expiresAt && new Date(discount.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: 'This code has expired.' }
  }
  if (discount.maxRedemptions !== null && discount.redemptions >= discount.maxRedemptions) {
    return { valid: false, error: 'This code has reached its usage limit.' }
  }
  if (discount.minSubtotal !== null && subtotal < discount.minSubtotal) {
    return { valid: false, error: `This code requires a minimum order of ${discount.minSubtotal.toFixed(2)}.` }
  }
  return { valid: true }
}