// src/lib/chatActions.ts
//
// COMMERCE INTENTS FOR THE SUPPORT ASSISTANT — September 2026
//
// Detects the things a visitor wants the assistant to DO rather than answer:
// search the catalogue, add something to the cart, show the cart, reorder.
//
// PURE AND CLIENT-SAFE. No imports, no network, no catalogue knowledge — it
// only reads the sentence and reports what was asked for. Resolving a term to
// a real product happens server-side (lib/chatLookup.ts), so this file never
// goes stale when the catalogue changes.
//
// TWO RULES THAT MATTER
//
// 1. NOTHING IS EVER ADDED SILENTLY. Detecting "add BPC-157 to cart" produces
//    an intent, not a mutation. The widget answers with a product card and an
//    Add button; the customer's click is the confirmation. An assistant that
//    can put things in a basket from a typed sentence, with no visible
//    confirmation step, is how people end up buying the wrong strength.
//
// 2. THE ASSISTANT NEVER CHECKS OUT. It can fill a cart and open it. Paying
//    is the customer's action on the checkout page, every time.

export type ActionKind = 'add-to-cart' | 'search' | 'view-cart' | 'reorder'

export interface SearchFilters {
  /** Body-system tag as used on the site: recovery, metabolic, cognitive… */
  category?: string
  /** pen | vial | nasal spray | powder */
  format?: string
  /** Upper price bound in the displayed currency. */
  maxPrice?: number
  /** Sort cheapest first — "cheapest pen", "most affordable". */
  cheapest?: boolean
  /** Free-text remainder, if any. */
  term?: string
}

export interface ActionRequest {
  kind: ActionKind
  /** Product term for add-to-cart. */
  query?: string
  /** How many units to add. Capped; see MAX_ADD_QTY. */
  quantity?: number
  filters?: SearchFilters
}

/**
 * A chat message should never be able to load up a basket. Anything above
 * this is treated as a typo and clamped, and the widget says so.
 */
export const MAX_ADD_QTY = 5

const CATEGORIES: Record<string, string> = {
  recovery: 'recovery',
  repair: 'recovery',
  metabolic: 'metabolic',
  metabolism: 'metabolic',
  cognitive: 'cognitive',
  nootropic: 'cognitive',
  nootropics: 'cognitive',
  hormonal: 'hormonal',
  hormone: 'hormonal',
  hormones: 'hormonal',
  'anti-ageing': 'anti-ageing',
  'anti ageing': 'anti-ageing',
  'anti-aging': 'anti-ageing',
  'anti aging': 'anti-ageing',
  longevity: 'anti-ageing',
  immune: 'immune',
  immunity: 'immune',
  accessory: 'accessories',
  accessories: 'accessories',
  solvent: 'accessories',
  solvents: 'accessories',
}

const FORMATS: Record<string, string> = {
  pen: 'pen',
  pens: 'pen',
  vial: 'vial',
  vials: 'vial',
  'nasal spray': 'nasal spray',
  'nasal sprays': 'nasal spray',
  spray: 'nasal spray',
  sprays: 'nasal spray',
  powder: 'powder',
  powders: 'powder',
}

/**
 * Adding covers three shapes:
 *   "add BPC-157 to my cart"  — verb, product, destination
 *   "buy BPC-157"             — a buy verb anywhere
 *   "add BPC-157"             — a bare imperative at the start
 *
 * The third was missing, and it is what people actually type. Only "add" is
 * allowed to lead, deliberately: "get" and "order" would swallow "get my
 * order status" and "order tracking", which belong to the lookup matcher.
 */
const ADD_RE = /\b(add|put|chuck|stick)\b[^]*?\b(to|in|into)\b\s*(my\s+)?(cart|basket|bag|order)\b|\b(add to cart|buy)\b|^\s*(?:please\s+)?add\b/i
const VIEW_CART_RE = /\b(what'?s in my|show( me)? my|view|see|check|open)\s+(cart|basket|bag)\b|\bmy (cart|basket)\b|\bcart total\b/i
const REORDER_RE = /\b(reorder|re-order|order again|same as (last time|before)|repeat (my )?(last )?order|buy again)\b/i
const SEARCH_RE =
  /\b(show|list|browse|find|search|what('s| is| are| do you)?)\b[^]*?\b(have|stock|sell|got|available|products?|compounds?|peptides?|range|catalogue|catalog)\b|\b(cheapest|most affordable|lowest priced?)\b|\bunder\s*\d+/i

/**
 * A leading quantity: "2 semax", "3 x vials".
 *
 * The number must start a word AND be followed by whitespace before the
 * product name. An earlier version allowed the number to butt straight up
 * against the next character, which happily ate the "15" out of "BPC-157"
 * and searched for "bpc- 7".
 */
const QTY_RE = /(?:^|\s)(\d{1,2})\s*(?:x|×)?\s+(?=[a-z])/i

/** Words that carry no product meaning once an instruction is stripped out. */
const NOISE = new Set([
  'add', 'put', 'chuck', 'stick', 'buy', 'to', 'in', 'into', 'my', 'the', 'a', 'an',
  'cart', 'basket', 'bag', 'order', 'please', 'can', 'you', 'i', 'want', 'need',
  'some', 'one', 'of', 'for', 'me', 'and', 'get', 'would', 'like', 'pls', 'plz',
  'show', 'list', 'browse', 'find', 'search', 'what', 'whats', 'have', 'stock',
  'sell', 'got', 'available', 'products', 'product', 'compounds', 'compound',
  'peptides', 'peptide', 'range', 'catalogue', 'catalog', 'do', 'does', 'is', 'are',
  'all', 'any', 'your', 'us', 'it', 'this', 'that', 'them', 'there',
  'anything', 'something', 'stuff', 'options', 'option', 'things',
])

function stripNoise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[?!.,]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !NOISE.has(w))
    .join(' ')
    .trim()
}

function findCategory(q: string): string | undefined {
  for (const [term, canonical] of Object.entries(CATEGORIES)) {
    if (new RegExp(`\\b${term.replace(/[-\s]/g, '[-\\s]')}\\b`, 'i').test(q)) return canonical
  }
  return undefined
}

function findFormat(q: string): string | undefined {
  // Longest first, so "nasal spray" wins over "spray".
  const terms = Object.keys(FORMATS).sort((a, b) => b.length - a.length)
  for (const term of terms) {
    if (new RegExp(`\\b${term.replace(/\s/g, '\\s')}\\b`, 'i').test(q)) return FORMATS[term]
  }
  return undefined
}

/**
 * Reads one message for a commerce instruction. Returns null for anything
 * else, which is the common case — an ordinary question falls straight
 * through to the FAQ matcher.
 */
export function detectAction(input: string): ActionRequest | null {
  const raw = (input || '').trim()
  if (!raw) return null

  if (REORDER_RE.test(raw)) return { kind: 'reorder' }

  // Adding is checked BEFORE viewing: "add 2 semax to my basket" contains
  // "my basket" and would otherwise be read as a request to see the cart.
  if (ADD_RE.test(raw)) {
    const qtyMatch = raw.match(QTY_RE)
    const quantity = qtyMatch ? Math.min(Math.max(parseInt(qtyMatch[1], 10), 1), MAX_ADD_QTY) : 1
    const query = stripNoise(raw.replace(QTY_RE, ' '))
    // "add" or "add to cart" on its own names no product. That is still an
    // add intent — the widget answers it by asking what to add, which is a
    // conversation, rather than the dead end it used to be. An empty query is
    // never sent to the server; see ChatWidget.runAction.
    return { kind: 'add-to-cart', query, quantity }
  }

  if (VIEW_CART_RE.test(raw)) return { kind: 'view-cart' }

  const category = findCategory(raw)
  const format = findFormat(raw)

  // "list all pens" and "show me recovery" name what they want without ever
  // saying "stock" or "have", so a browse verb plus a category or format is
  // enough on its own.
  const browsing = /\b(show|list|browse|find|search)\b/i.test(raw) && Boolean(category || format)

  if (SEARCH_RE.test(raw) || browsing) {
    const priceMatch = raw.match(/\bunder\s*(?:aed\s*)?(\d{2,6})\b/i)
    const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : undefined
    const cheapest = /\b(cheapest|most affordable|lowest priced?)\b/i.test(raw)

    // A search with no handle on it at all ("what do you have?") is still a
    // search — the catalogue listing is a perfectly good answer.
    const term = stripNoise(
      raw.replace(/\bunder\s*(?:aed\s*)?\d{2,6}\b/gi, ' ')
         .replace(/\b(cheapest|most affordable|lowest priced?)\b/gi, ' ')
    )
    const cleanedTerm = term
      .split(/\s+/)
      .filter(w => !CATEGORIES[w] && !FORMATS[w])
      .join(' ')
      .trim()

    return {
      kind: 'search',
      filters: {
        category,
        format,
        maxPrice,
        cheapest: cheapest || undefined,
        term: cleanedTerm || undefined,
      },
    }
  }

  return null
}