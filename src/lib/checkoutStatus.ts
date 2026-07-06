// src/lib/checkoutStatus.ts
// Same in-memory caveat as checkoutSession.ts — swap for Redis/DB before prod.

interface CheckoutStatus {
  status: 'pending' | 'complete' | 'failed'
  shopifyOrderId?: string
  updatedAt: number
}

const statusStore = new Map<string, CheckoutStatus>()
const TTL_MS = 1000 * 60 * 30

export function markCheckoutComplete(ref: string, shopifyOrderId: string) {
  statusStore.set(ref, { status: 'complete', shopifyOrderId, updatedAt: Date.now() })
}

export function markCheckoutFailed(ref: string) {
  statusStore.set(ref, { status: 'failed', updatedAt: Date.now() })
}

export function getCheckoutStatus(ref: string): CheckoutStatus {
  const entry = statusStore.get(ref)
  if (!entry || Date.now() - entry.updatedAt > TTL_MS) {
    return { status: 'pending', updatedAt: Date.now() }
  }
  return entry
}