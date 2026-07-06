// src/lib/checkoutSession.ts
// TEMPORARY in-memory store — same caveat as processedIds in the webhook:
// resets on redeploy and won't work across multiple server instances.
// Swap for Redis/DB before going to production.

export interface PendingCheckoutLine {
  variantId: string
  quantity: number
  price: number
  title: string
  variantTitle?: string
  image?: string
  slug: string
}

interface PendingCheckout {
  lines: PendingCheckoutLine[]
  country: string
  currencyCode: string
  createdAt: number
}

const store = new Map<string, PendingCheckout>()
const TTL_MS = 1000 * 60 * 60 // 1 hour — abandoned checkouts just expire, no Shopify cleanup needed

export function savePendingCheckout(ref: string, data: Omit<PendingCheckout, 'createdAt'>) {
  store.set(ref, { ...data, createdAt: Date.now() })
}

export function getPendingCheckout(ref: string): PendingCheckout | null {
  const entry = store.get(ref)
  if (!entry) return null
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(ref)
    return null
  }
  return entry
}

export function deletePendingCheckout(ref: string) {
  store.delete(ref)
}