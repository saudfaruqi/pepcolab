// src/lib/chatLookup.ts
//
// LIVE ANSWERS FOR THE SUPPORT ASSISTANT — September 2026
//
// The widget could previously only recite pre-written FAQs. It could not say
// whether something was in stock, what it cost, whether a lot number was
// genuine, or where an order had got to — which is most of what people
// actually open a chat to ask.
//
// THIS DOES NOT BREAK THE "NO GENERATED TEXT" RULE in lib/chatContent.ts.
// Every sentence below is a fixed template with real values slotted in. No
// model writes anything. The structure is reviewable in this file, and only
// the numbers change between one customer and the next. That distinction is
// the whole reason the assistant can be useful without being able to invent
// a purity figure or a delivery date.
//
// WHAT IT WILL NOT SAY
//  - No claim about what a compound does. Stock, price, format, documentation.
//  - No delivery date presented as a promise. Couriers do not give us
//    tracking on most orders, so the order template states the dispatch date
//    and the usual pattern, and nothing firmer than that.
//
// SECURITY — order lookups mirror app/api/orders/lookup/route.ts exactly:
// an order code alone is never enough. The caller must either be signed in as
// the customer who placed it, or supply the email it was placed with. Misses
// return one generic message so the endpoint cannot be used to test whether
// an order code exists.

import { getProducts } from '@/lib/shopify'
import { getOrderRecord, getOrdersForEmail, type OrderRecord } from '@/lib/orderStore'
import { COA_BATCHES } from '@/app/coaData'
import { isPaymentLinkOnlyProduct } from '@/lib/restrictedCheckout'
// chatContent.ts imports only chatActions.ts, so this does not create a cycle.
import { NO_MATCH_ANSWER, type LookupIntent } from '@/lib/chatContent'
import type { SearchFilters } from '@/lib/chatActions'

export interface LookupAnswer {
  lines: string[]
  links?: { label: string; href: string }[]
  /** FAQ ids the widget offers as follow-up chips. */
  related?: string[]
  /** The widget should ask for the order email and retry. */
  needsEmail?: boolean
  /**
   * Product cards the widget renders with an Add button per variant.
   *
   * Carrying the variant ids here is what lets the assistant put something in
   * the cart — but note that nothing is added by returning a card. The
   * customer still has to click. See the rules at the top of
   * lib/chatActions.ts.
   */
  cards?: ProductCard[]
  /** Units to pre-select on the card's Add button. */
  quantity?: number
}

export interface ProductCardVariant {
  id: string
  title: string
  price: number
  available: boolean
}

export interface ProductCard {
  handle: string
  /** Canonical on-site path, neutral slug. */
  href: string
  title: string
  currency: string
  image?: string
  inStock: boolean
  /**
   * GLP is sold through fixed STRABL payment links and cannot go through the
   * Shopify cart at all (lib/restrictedCheckout.ts). Its card links to the
   * product page instead of offering an Add button — an Add that silently
   * did nothing would be worse than no Add.
   */
  paymentLinkOnly: boolean
  variants: ProductCardVariant[]
}

// Deliberately inlined rather than imported: lib/orderStore.ts in production
// does not export a paid-status helper, and this file must not depend on a
// change that has not shipped yet.
const PAID_STATUSES = new Set(['created', 'updated', 'awaiting_payment_mark', 'processing'])
const isPaid = (r: OrderRecord) => PAID_STATUSES.has(r.status)

const SITE_CURRENCY_FALLBACK = 'AED'

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}

function normalise(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

/* -------------------------------------------------------------------------- */
/* PRODUCT                                                                     */
/* -------------------------------------------------------------------------- */

interface CatalogueEntry {
  handle: string
  title: string
  price: number
  currencyCode: string
  inStock: boolean
  format?: string
  image?: string
  tags?: string[]
  variants?: { id?: string; title: string; price: number; availableForSale: boolean }[]
}

/** Shopify handles carry a market suffix; on-site URLs do not. */
function neutralHref(handle: string): string {
  return `/products/${handle.replace(/-uae$/i, '')}`
}

export function toCard(p: CatalogueEntry): ProductCard {
  const variants = (p.variants ?? [])
    .filter(v => v.id)
    .map(v => ({
      id: v.id as string,
      title: v.title && v.title.toLowerCase() !== 'default title' ? v.title : 'Standard',
      price: v.price,
      available: v.availableForSale,
    }))

  return {
    handle: p.handle,
    href: neutralHref(p.handle),
    title: p.title,
    currency: p.currencyCode || SITE_CURRENCY_FALLBACK,
    image: p.image,
    inStock: p.inStock,
    paymentLinkOnly: isPaymentLinkOnlyProduct(p.handle),
    variants,
  }
}

/**
 * Resolves a typed term to one catalogue product. Exact match first, then a
 * containment match, and only then the longest partial — so "bpc" finds
 * BPC-157 but "water" does not silently pick one of three water products.
 */
export function resolveProduct(term: string, catalogue: CatalogueEntry[]): CatalogueEntry | 'ambiguous' | null {
  const key = normalise(term)
  if (key.length < 2) return null

  const exact = catalogue.find(p => normalise(p.title) === key || normalise(p.handle) === key)
  if (exact) return exact

  const partial = catalogue.filter(p => {
    const t = normalise(p.title)
    const h = normalise(p.handle)
    return t.includes(key) || key.includes(t) || h.includes(key)
  })
  if (partial.length === 1) return partial[0]
  if (partial.length > 1) {
    // Prefer a clearly better candidate over asking, but only when one is
    // an obvious lead.
    const sorted = [...partial].sort((a, b) => normalise(b.title).length - normalise(a.title).length)
    const best = sorted.find(p => normalise(p.title).startsWith(key))
    return best ?? 'ambiguous'
  }
  return null
}

function formatSummary(p: CatalogueEntry): string {
  const variants = (p.variants ?? []).filter(v => v.title && v.title.toLowerCase() !== 'default title')
  const names = Array.from(new Set(variants.map(v => v.title)))
  if (names.length === 0) return ''
  if (names.length <= 4) return names.join(', ')
  return `${names.slice(0, 4).join(', ')} and ${names.length - 4} more`
}

function priceSummary(p: CatalogueEntry): string {
  const currency = p.currencyCode || SITE_CURRENCY_FALLBACK
  const sellable = (p.variants ?? []).filter(v => v.availableForSale && v.price > 0)
  const pool = sellable.length ? sellable : (p.variants ?? []).filter(v => v.price > 0)
  const prices = pool.map(v => v.price)
  if (prices.length === 0) return p.price > 0 ? money(p.price, currency) : ''
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  return high > low ? `from ${money(low, currency)}` : money(low, currency)
}

export function answerProduct(term: string, catalogue: CatalogueEntry[]): LookupAnswer {
  const found = resolveProduct(term, catalogue)

  if (found === 'ambiguous') {
    return {
      lines: [
        `There are a few things matching "${term}" — which one did you mean? The full catalogue is the quickest way to narrow it down.`,
      ],
      links: [{ label: 'Browse the catalogue', href: '/products' }],
      related: ['contact-human'],
    }
  }

  if (!found) {
    return {
      lines: [
        `I couldn’t find "${term}" in the catalogue — which may mean we don’t stock it, or that I’ve misread the name.`,
        'Have a look through the catalogue, or a representative can tell you whether it is something we can source.',
      ],
      links: [{ label: 'Browse the catalogue', href: '/products' }],
      related: ['order-bulk', 'contact-human'],
    }
  }

  const href = `/products/${found.handle.replace(/-uae$/i, '')}`
  const price = priceSummary(found)
  const formats = formatSummary(found)

  if (!found.inStock) {
    return {
      lines: [
        `${found.title} is out of stock at the moment.`,
        'Its product page has a notify option — add your email there and you’ll hear the day it is back, before it goes out to anyone else.',
      ],
      links: [{ label: `${found.title} product page`, href }],
      related: ['contact-human'],
    }
  }

  const detail = [formats && `Available as ${formats}`, price && `Priced ${price}`]
    .filter(Boolean)
    .join('. ')

  return {
    lines: [
      `${found.title} is in stock.${detail ? ` ${detail}.` : ''}`,
      'Every batch ships with its own certificate of analysis, matched to the lot number on the vial.',
    ],
    // The card gives an Add button without making them open the page first.
    cards: [toCard(found)],
    links: [{ label: `Open ${found.title}`, href }],
    related: ['coa-what', 'shipping-times', 'order-bundles'],
  }
}

/* -------------------------------------------------------------------------- */
/* SEARCH                                                                      */
/* -------------------------------------------------------------------------- */

const MAX_RESULTS = 6

/**
 * Cheapest sellable variant, restricted to the requested format when there is
 * one. Without that restriction "cheapest pen" ranked PT-141 first on the
 * strength of its 500 vial, which is not a pen.
 */
function lowestPrice(p: CatalogueEntry, format?: string): number {
  let variants = (p.variants ?? []).filter(v => v.price > 0)
  if (format) {
    const want = format.toLowerCase()
    const matching = variants.filter(v => (v.title || '').toLowerCase().includes(want))
    // Fall back to all variants when the format lives on the product type
    // rather than in the variant name (single-format products).
    if (matching.length) variants = matching
  }
  const prices = variants.map(v => v.price)
  return prices.length ? Math.min(...prices) : p.price || Number.POSITIVE_INFINITY
}

export function answerSearch(filters: SearchFilters, catalogue: CatalogueEntry[]): LookupAnswer {
  let results = catalogue.filter(p => p.inStock)

  if (filters.category) {
    const want = filters.category.toLowerCase()
    results = results.filter(p => (p.tags ?? []).some(t => t.toLowerCase() === want))
  }
  if (filters.format) {
    const want = filters.format.toLowerCase()
    results = results.filter(p => {
      const type = (p.format || '').toLowerCase()
      if (type.includes(want)) return true
      return (p.variants ?? []).some(v => (v.title || '').toLowerCase().includes(want))
    })
  }
  if (filters.maxPrice) {
    results = results.filter(p => lowestPrice(p, filters.format) <= filters.maxPrice!)
  }
  if (filters.term) {
    const key = normalise(filters.term)
    if (key.length >= 2) {
      results = results.filter(p => normalise(p.title).includes(key) || normalise(p.handle).includes(key))
    }
  }

  // Two clauses, because they attach to the headline differently: a format or
  // category reads as "in pen", a price cap reads as "up to AED 800". Joining
  // them into one string gave "in stock in up to AED 800".
  const describedIn = [filters.format, filters.category].filter(Boolean).join(' ')
  // "up to", not "under": the filter is inclusive, because someone asking for
  // "under 800" does not want an AED 800 product hidden from them.
  const describedCap = filters.maxPrice
    ? `up to ${money(filters.maxPrice, catalogue[0]?.currencyCode || SITE_CURRENCY_FALLBACK)}`
    : ''
  const qualifier = `${describedIn ? ` in ${describedIn}` : ''}${describedCap ? ` ${describedCap}` : ''}`
  const described = [describedIn, describedCap].filter(Boolean).join(' ')

  if (results.length === 0) {
    return {
      lines: [
        described
          ? `Nothing in stock matches ${described} right now.`
          : 'I couldn\u2019t find anything matching that.',
        'The full catalogue is the quickest way to see what is available, or a representative can tell you what is coming back in.',
      ],
      links: [{ label: 'Browse the catalogue', href: '/products' }],
      related: ['contact-human'],
    }
  }

  results.sort((a, b) => lowestPrice(a, filters.format) - lowestPrice(b, filters.format))
  if (!filters.cheapest) {
    // Default order is alphabetical; cheapest-first is only used when asked.
    results.sort((a, b) => a.title.localeCompare(b.title))
  }

  const shown = results.slice(0, filters.cheapest ? 3 : MAX_RESULTS)
  const more = results.length - shown.length

  const headline = filters.cheapest
    ? `Cheapest first${qualifier} \u2014 ${shown.length} of ${results.length}:`
    : `${results.length} in stock${qualifier}${more > 0 ? `, showing ${shown.length}` : ''}:`

  const lines = [headline]
  if (more > 0) lines.push(`There ${more === 1 ? 'is 1 more' : `are ${more} more`} \u2014 the catalogue shows everything with filters.`)

  return {
    lines,
    cards: shown.map(toCard),
    links: [{ label: 'Browse the full catalogue', href: '/products' }],
    related: ['order-bundles', 'coa-what', 'shipping-times'],
  }
}

/* -------------------------------------------------------------------------- */
/* ADD TO CART                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Resolves what the customer asked to add and hands back a card. It does NOT
 * add anything — the Add button on the card is the confirmation step, and it
 * is the customer who presses it.
 */
export function answerAddToCart(term: string, quantity: number, catalogue: CatalogueEntry[]): LookupAnswer {
  const found = resolveProduct(term, catalogue)

  if (found === 'ambiguous' || !found) {
    const base = answerProduct(term, catalogue)
    // Lower-case the join, but never a standalone "I".
    const first = base.lines[0]
    const joined = /^I\b/.test(first) ? first : `${first.charAt(0).toLowerCase()}${first.slice(1)}`
    return { ...base, lines: [`Before I can add anything \u2014 ${joined}`, ...base.lines.slice(1)] }
  }

  if (!found.inStock) return answerProduct(term, catalogue)

  const card = toCard(found)

  if (card.paymentLinkOnly) {
    return {
      lines: [
        `${found.title} is the one product that doesn\u2019t go through the cart \u2014 it is sold on a fixed payment link, with the quantity built into the link.`,
        'Pick your strength and quantity on its page and the right link opens from there.',
      ],
      links: [{ label: `Open ${found.title}`, href: card.href }],
      related: ['order-payment', 'contact-human'],
    }
  }

  const sellable = card.variants.filter(v => v.available)
  const multi = sellable.length > 1

  return {
    lines: [
      multi
        ? `${found.title} comes in ${sellable.length} options \u2014 pick the one you want and I\u2019ll add it.`
        : `Ready to add ${found.title}${quantity > 1 ? ` \u00d7 ${quantity}` : ''}. Tap to confirm.`,
    ],
    cards: [card],
    quantity,
    related: ['order-bundles', 'shipping-times'],
  }
}

/* -------------------------------------------------------------------------- */
/* REORDER                                                                     */
/* -------------------------------------------------------------------------- */

export async function answerReorder(email: string | null | undefined): Promise<LookupAnswer> {
  const address = (email || '').trim().toLowerCase()
  if (!address) {
    return {
      lines: [
        'I can rebuild your last order \u2014 sign in and I\u2019ll pull it straight up, or tell me the email you ordered with.',
      ],
      links: [{ label: 'Sign in', href: '/account' }],
      needsEmail: true,
      related: ['contact-human'],
    }
  }

  const orders = await getOrdersForEmail(address, 20)
  const last = orders.find(o => isPaid(o) && (o.products ?? []).length > 0)

  if (!last) {
    return {
      lines: [
        'I can\u2019t see a previous order on that address.',
        'If you ordered under a different email, tell me which \u2014 or a representative can find it from your name.',
      ],
      links: [{ label: 'Browse the catalogue', href: '/products' }],
      related: ['contact-human'],
    }
  }

  const rebuildable = (last.products ?? []).filter(p => p.variantId)
  const itemList = (last.products ?? [])
    .map(p => `${p.title}${p.quantity > 1 ? ` \u00d7 ${p.quantity}` : ''}`)
    .join(', ')

  if (rebuildable.length === 0) {
    return {
      lines: [
        `Your last order (${last.orderShortCode}) was ${itemList}.`,
        'That one was placed on a payment link rather than through the cart, so I can\u2019t rebuild it here \u2014 its product page has the strengths and quantities.',
      ],
      links: [{ label: 'Your orders', href: '/account' }],
      related: ['order-payment', 'contact-human'],
    }
  }

  return {
    lines: [
      `Your last order (${last.orderShortCode}) was ${itemList}.`,
      rebuildable.length < (last.products ?? []).length
        ? 'I can put the cart-eligible items back in your basket \u2014 open your orders to do it in one tap.'
        : 'Open your orders and Reorder puts the whole thing back in your basket in one tap.',
    ],
    links: [{ label: 'Reorder from your account', href: '/account' }],
    related: ['order-bundles', 'shipping-times'],
  }
}

/* -------------------------------------------------------------------------- */
/* LOT / CERTIFICATE                                                           */
/* -------------------------------------------------------------------------- */

/** Mirrors CoaBatch in app/coaData.ts — only the fields this file reads. */
interface BatchLike {
  accession?: string
  lot?: string
  code?: string
  product?: string
  purity?: string | number
  reported?: string
  pdfUrl?: string
}

export function answerLot(term: string, batches: BatchLike[]): LookupAnswer {
  const key = normalise(term)
  // A customer may type the accession number, the printed lot, or the short
  // batch code — all three appear on our own documentation.
  const batch = batches.find(b =>
    [b.accession, b.lot, b.code].some(v => v && normalise(String(v)) === key)
  )

  if (!batch) {
    return {
      lines: [
        `I can’t find ${term} in the published certificate library.`,
        'That is worth telling us rather than shrugging off — every lot we ship should be in there. A representative can pull the certificate directly and find out why it is missing.',
      ],
      links: [{ label: 'Search the certificate library', href: '/certificates' }],
      related: ['coa-what', 'contact-human'],
    }
  }

  const bits = [
    batch.product ? `${batch.product}` : null,
    batch.purity ? `${batch.purity}% by HPLC` : null,
    batch.reported ? `reported ${batch.reported}` : null,
  ].filter(Boolean)

  return {
    lines: [
      `Lot ${batch.lot ?? term} is published${bits.length ? ` — ${bits.join(', ')}` : ''}.`,
      'Testing was carried out by Freedom Diagnostics, an independent third-party laboratory.',
    ],
    links: [{ label: 'Open the certificate', href: batch.pdfUrl || '/certificates' }],
    related: ['coa-what', 'coa-purity'],
  }
}

/* -------------------------------------------------------------------------- */
/* ORDER                                                                       */
/* -------------------------------------------------------------------------- */

const ORDER_NOT_FOUND: LookupAnswer = {
  lines: [
    'I couldn’t find an order matching that code and email.',
    'Worth checking the code against your confirmation email — and if it still doesn’t match, a representative can find it from your name or phone number instead.',
  ],
  links: [{ label: 'Order tracking page', href: '/track-order' }],
  related: ['contact-human'],
}

function dayLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso))
  } catch {
    return 'recently'
  }
}

export function answerOrder(record: OrderRecord): LookupAnswer {
  const code = record.orderShortCode

  if (record.status === 'abandoned') {
    return {
      lines: [
        `Order ${code} was started but never completed, so nothing was charged and nothing is on its way.`,
        'If the payment failed and you still want it, the quickest route is to place it again — or tell me and I’ll get a person to sort it with you.',
      ],
      links: [{ label: 'Browse the catalogue', href: '/products' }],
      related: ['order-payment', 'contact-human'],
    }
  }

  if (record.status === 'failed') {
    return {
      lines: [
        `The payment on ${code} didn’t go through, so the order hasn’t been placed and you haven’t been charged.`,
        'That is usually the card issuer rather than anything you did. Trying a different card normally clears it, or a person can take the order directly.',
      ],
      related: ['order-payment', 'contact-human'],
    }
  }

  if (record.status === 'refunded') {
    return {
      lines: [
        `Order ${code} has been refunded. Refunds go back to the original card through STRABL, and banks typically take another 5–10 business days to post it.`,
      ],
      links: [{ label: 'Refund policy', href: '/refund-policy' }],
      related: ['order-refund', 'contact-human'],
    }
  }

  if (!isPaid(record)) {
    return {
      lines: [
        `I can see ${code}, but I’d rather a person confirmed its status than have me guess from a half-finished record.`,
      ],
      related: ['contact-human'],
    }
  }

  // Paid and on its way.
  if (record.shippedAt) {
    const lines = [
      `${code} was dispatched on ${dayLabel(record.shippedAt)}, cold-chain packed.`,
    ]
    if (record.trackingNumber) {
      lines.push(
        `The courier reference is ${record.trackingNumber}${record.carrier ? ` with ${record.carrier}` : ''}.`
      )
    } else {
      lines.push(
        'That courier didn’t issue a tracking reference, which is normal for most of our UAE consignments. Roughly nine in ten orders arrive the next working day after dispatch.'
      )
    }
    lines.push('If it hasn’t reached you when it should have, say so and we’ll chase the courier directly.')
    return {
      lines,
      links: record.trackingUrl
        ? [{ label: 'Track with the courier', href: record.trackingUrl }]
        : [{ label: 'Your orders', href: '/account' }],
      related: ['shipping-tracking', 'order-damaged', 'contact-human'],
    }
  }

  return {
    lines: [
      `${code} is confirmed and being packed. It hasn’t left us yet.`,
      'Orders are dispatched within one business day of payment clearing, and we email you the moment yours goes out.',
    ],
    links: [{ label: 'Your orders', href: '/account' }],
    related: ['shipping-times', 'shipping-tracking'],
  }
}

/* -------------------------------------------------------------------------- */
/* ENTRY POINT                                                                 */
/* -------------------------------------------------------------------------- */

export const ORDER_NEEDS_EMAIL: LookupAnswer = {
  lines: [
    'I can look that up — what email was the order placed with? I ask because an order code on its own isn’t proof it’s yours, and order details shouldn’t be readable by anyone who guesses a code.',
  ],
  needsEmail: true,
  related: ['contact-human'],
}

/**
 * Resolves one lookup. `sessionEmail` is the signed-in customer, if any;
 * `providedEmail` is what they typed when asked. Either satisfies an order
 * lookup — nothing else does.
 */
export type ResolvableIntent = LookupIntent | 'search' | 'add-to-cart' | 'reorder'

/**
 * The reply when a speculative product lookup finds nothing. Word for word
 * the widget's own no-match copy, so a failed guess is invisible to the
 * customer — they simply get the honest "I don't know, here is a person".
 */
const GUESS_MISSED: LookupAnswer = {
  lines: [...NO_MATCH_ANSWER],
  related: ['contact-human'],
}

export async function resolveLookup(
  intent: ResolvableIntent,
  query: string,
  opts: {
    sessionEmail?: string | null
    providedEmail?: string | null
    filters?: SearchFilters
    quantity?: number
  } = {}
): Promise<LookupAnswer> {
  if (intent === 'product' || intent === 'product-guess' || intent === 'search' || intent === 'add-to-cart') {
    const catalogue = (await getProducts(100, 'AE')) as unknown as CatalogueEntry[]
    if (intent === 'search') return answerSearch(opts.filters ?? {}, catalogue)
    if (intent === 'add-to-cart') return answerAddToCart(query, opts.quantity ?? 1, catalogue)
    // A guess only speaks up when it actually found something. A miss must
    // not tell the customer we don't stock "why is shipping slow" — it hands
    // back the ordinary no-answer reply, exactly as if nothing had matched.
    if (intent === 'product-guess' && !resolveProduct(query, catalogue)) return GUESS_MISSED
    return answerProduct(query, catalogue)
  }

  if (intent === 'reorder') {
    return answerReorder(opts.providedEmail || opts.sessionEmail)
  }

  if (intent === 'lot') {
    return answerLot(query, COA_BATCHES as unknown as BatchLike[])
  }

  // intent === 'order'
  const email = (opts.providedEmail || opts.sessionEmail || '').trim().toLowerCase()
  if (!email) return ORDER_NEEDS_EMAIL

  const record = await getOrderRecord(query)
  // One generic miss for "no such order" and "wrong email" alike, so this
  // cannot be used to discover which codes exist.
  if (!record || (record.email || '').trim().toLowerCase() !== email) return ORDER_NOT_FOUND

  return answerOrder(record)
}