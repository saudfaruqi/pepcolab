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
import { getOrderRecord, type OrderRecord } from '@/lib/orderStore'
import { COA_BATCHES } from '@/app/coaData'
import type { LookupIntent } from '@/lib/chatContent'

export interface LookupAnswer {
  lines: string[]
  links?: { label: string; href: string }[]
  /** FAQ ids the widget offers as follow-up chips. */
  related?: string[]
  /** The widget should ask for the order email and retry. */
  needsEmail?: boolean
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
  variants?: { title: string; price: number; availableForSale: boolean }[]
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
    links: [{ label: `Open ${found.title}`, href }],
    related: ['coa-what', 'shipping-times', 'order-bundles'],
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
export async function resolveLookup(
  intent: LookupIntent,
  query: string,
  opts: { sessionEmail?: string | null; providedEmail?: string | null } = {}
): Promise<LookupAnswer> {
  if (intent === 'product') {
    const catalogue = (await getProducts(100, 'AE')) as unknown as CatalogueEntry[]
    return answerProduct(query, catalogue)
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