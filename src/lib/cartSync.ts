// src/lib/cartSync.ts
//
// Server-side cart, keyed to the signed-in customer.
//
// THE PROBLEM
// The cart lives in localStorage, which is per-browser. Someone who browses
// on a phone at night and orders from a laptop the next morning starts from
// an empty cart — and for a multi-item research order, rebuilding it is
// enough friction that plenty of people just don't.
//
// WHAT IS STORED
// Only variant IDs and quantities. Not prices, not titles, not images. Those
// are re-resolved from Shopify on restore, so a saved cart can never show a
// stale price or a product that has since changed — the two failure modes
// that make people distrust a cart they didn't fill in themselves.
//
// THE MERGE — the part that has to be right
// -----------------------------------------
// Two devices can each hold a different cart. Whatever we do, one of them is
// a surprise. The rules, in priority order:
//
//   1. NEVER SILENTLY DELETE. A union is used, never a replacement. If the
//      phone has A and B and the laptop has B and C, the result is A, B, C.
//      Losing something a customer deliberately added is far worse than
//      showing them one item they'd forgotten about — the first breaks trust
//      in the cart, the second is a mild "oh, right".
//   2. HIGHEST QUANTITY WINS per variant, not the sum. If both devices have
//      2 of something, they almost certainly mean 2, not 4. Summing is how
//      people end up buying double and blaming you for it.
//   3. STALE SAVED CARTS EXPIRE. A saved cart older than 30 days is
//      discarded rather than merged. Resurrecting a month-old cart into
//      today's session is startling, and the intent behind it is long gone.
//
// Rule 2 is the one worth defending: a union that sums quantities looks
// mathematically sensible and is wrong about what people mean.

import { redis } from '@/lib/redis'

const KEY_PREFIX = 'cart:customer:'
const TTL_SECONDS = 60 * 60 * 24 * 60   // 60 days — well past the merge window
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30 // 30 days: older carts aren't merged
const MAX_LINES = 50

export interface SavedCartLine {
  variantId: string
  quantity: number
}

export interface SavedCart {
  lines: SavedCartLine[]
  updatedAt: string
}

function key(email: string): string {
  return `${KEY_PREFIX}${email.trim().toLowerCase()}`
}

function sanitise(lines: unknown): SavedCartLine[] {
  if (!Array.isArray(lines)) return []
  const out: SavedCartLine[] = []
  for (const raw of lines) {
    const variantId = typeof raw?.variantId === 'string' ? raw.variantId.trim() : ''
    const quantity = Number(raw?.quantity)
    if (!variantId) continue
    if (!Number.isFinite(quantity) || quantity < 1) continue
    // Clamp rather than reject: a corrupted quantity shouldn't drop the line.
    out.push({ variantId, quantity: Math.min(Math.floor(quantity), 99) })
    if (out.length >= MAX_LINES) break
  }
  return out
}

export async function getSavedCart(email: string): Promise<SavedCart | null> {
  try {
    const raw = await redis.get<SavedCart>(key(email))
    if (!raw) return null
    const lines = sanitise(raw.lines)
    if (lines.length === 0) return null
    return { lines, updatedAt: raw.updatedAt }
  } catch (err) {
    console.error('[cartSync] Failed to read saved cart:', err)
    return null
  }
}

export async function saveCart(email: string, lines: SavedCartLine[]): Promise<boolean> {
  try {
    const clean = sanitise(lines)
    if (clean.length === 0) {
      // An emptied cart is a real state — clear it rather than leaving a
      // stale one to be merged back in on the next device.
      await redis.del(key(email))
      return true
    }
    await redis.set(
      key(email),
      { lines: clean, updatedAt: new Date().toISOString() } satisfies SavedCart,
      { ex: TTL_SECONDS }
    )
    return true
  } catch (err) {
    console.error('[cartSync] Failed to save cart:', err)
    return false
  }
}

export async function clearSavedCart(email: string): Promise<void> {
  try {
    await redis.del(key(email))
  } catch (err) {
    console.error('[cartSync] Failed to clear saved cart:', err)
  }
}

/**
 * Merge a saved cart into the cart currently in the browser.
 *
 * Returns the merged line set plus what changed, so the UI can tell the
 * customer what happened instead of silently rearranging their cart. A cart
 * that changes without explanation is one people re-check item by item, which
 * costs more trust than it saves effort.
 */
export function mergeCarts(
  local: SavedCartLine[],
  saved: SavedCart | null
): { lines: SavedCartLine[]; addedFromSaved: number; skippedStale: boolean } {
  const localClean = sanitise(local)

  if (!saved) return { lines: localClean, addedFromSaved: 0, skippedStale: false }

  // Rule 3: don't resurrect an old cart into today's session.
  const age = Date.now() - new Date(saved.updatedAt).getTime()
  if (!Number.isFinite(age) || age > MAX_AGE_MS) {
    return { lines: localClean, addedFromSaved: 0, skippedStale: true }
  }

  const byVariant = new Map<string, number>()
  for (const line of localClean) byVariant.set(line.variantId, line.quantity)

  let addedFromSaved = 0
  for (const line of saved.lines) {
    const existing = byVariant.get(line.variantId)
    if (existing === undefined) {
      // Rule 1: union, never replacement.
      byVariant.set(line.variantId, line.quantity)
      addedFromSaved++
    } else if (line.quantity > existing) {
      // Rule 2: highest wins, never the sum.
      byVariant.set(line.variantId, line.quantity)
    }
  }

  return {
    lines: [...byVariant.entries()].map(([variantId, quantity]) => ({ variantId, quantity })),
    addedFromSaved,
    skippedStale: false,
  }
}