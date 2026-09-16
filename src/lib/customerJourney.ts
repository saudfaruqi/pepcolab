// src/lib/customerJourney.ts
//
// PERSONALISATION FOR POST-PURCHASE EMAILS — September 2026
//
// Works out, from an order record, what the customer actually bought:
//   - which catalogue products (matched by title against live Shopify data)
//   - which formats (pen / vial / nasal spray / powder / supply)
//   - which research areas (the product's category tag)
//   - whether a vial buyer is missing bacteriostatic water
//   - related products from the same research areas, in stock, not already bought
//
// Plus UAE working-day maths for delivery expectations and email timing,
// because couriers don't provide tracking and ~90% of orders arrive the next
// working day.
//
// Server-only: it calls the Storefront API through lib/shopify.ts.

import { getProducts } from '@/lib/shopify'
import { productHref } from '@/lib/utils'
import type { OrderRecord } from '@/lib/orderStore'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'

export type ProductFormat = 'pen' | 'vial' | 'nasal' | 'powder' | 'supply'

export interface CatalogueItem {
  handle: string
  title: string
  price: number
  currencyCode: string
  image?: string
  category: string
  categorySlug: string
  format: string
  tags: string[]
  inStock: boolean
}

export interface SuggestedProduct {
  title: string
  url: string
  price: number
  currency: string
  image?: string
  category: string
}

export interface OrderJourney {
  formats: Set<ProductFormat>
  categories: string[]              // display labels, e.g. "Recovery"
  purchasedTitles: string[]
  needsBacWater: boolean            // bought vials, didn't buy bacteriostatic water
  bacWater: SuggestedProduct | null
  related: SuggestedProduct[]       // up to 3
}

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                   */
/* -------------------------------------------------------------------------- */

const NON_CATEGORY_TAGS = new Set(['uae', 'uk', 'popular', 'new', 'sale', 'bestseller'])
const SUPPLY_RE = /\b(bac(teriostatic)?\s*water|acetic\s*acid|sterile\s*water|syringe|swab)\b/i
const BAC_WATER_RE = /\bbac(teriostatic)?\s*water\b/i

function normTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function categoryOf(tags: string[]): { label: string; slug: string } {
  const tag = tags.find((t) => !NON_CATEGORY_TAGS.has(t.toLowerCase())) || ''
  const slug = tag.toLowerCase().replace(/\s+/g, '-')
  const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return { label, slug }
}

/**
 * Loads the catalogue once per cron run / request. Pass the returned promise
 * around instead of calling repeatedly. Returns [] if Shopify is unreachable,
 * so emails still send — just without product suggestions.
 */
export async function loadCatalogue(currency = 'AED'): Promise<CatalogueItem[]> {
  const market = currency.toUpperCase() === 'GBP' ? 'GB' : 'AE'
  try {
    const products = await getProducts(100, market)
    return products.map((p: any) => {
      const tags: string[] = p.tags ?? []
      const cat = categoryOf(tags)
      return {
        handle: p.handle,
        title: p.title,
        price: Number(p.price) || 0,
        currencyCode: p.currencyCode || currency,
        image: p.image || undefined,
        category: cat.label,
        categorySlug: cat.slug,
        format: String(p.format || ''),
        tags,
        inStock: Boolean(p.inStock),
      }
    })
  } catch (err) {
    console.error('[customerJourney] Could not load catalogue — sending without suggestions:', err)
    return []
  }
}

function matchCatalogue(title: string, catalogue: CatalogueItem[]): CatalogueItem | null {
  const key = normTitle(title)
  if (!key) return null
  const exact = catalogue.find((c) => normTitle(c.title) === key)
  if (exact) return exact
  // Payment-link titles carry strength/format ("GLP 10mg Pen"), so fall back to
  // the longest catalogue title contained in the order line.
  const contained = catalogue
    .filter((c) => normTitle(c.title).length >= 3 && key.startsWith(normTitle(c.title)))
    .sort((a, b) => normTitle(b.title).length - normTitle(a.title).length)
  return contained[0] ?? null
}

function formatOf(line: OrderRecord['products'][number], item: CatalogueItem | null): ProductFormat | null {
  const text = `${line.title} ${(line.variantOptions ?? []).join(' ')}`
  if (SUPPLY_RE.test(text)) return 'supply'
  if (/\bpen\b/i.test(text)) return 'pen'
  if (/\bvial\b/i.test(text)) return 'vial'
  if (/\b(nasal|spray)\b/i.test(text)) return 'nasal'
  if (/\bpowder\b/i.test(text)) return 'powder'
  const type = (item?.format || '').toLowerCase()
  if (type.includes('supply') || type.includes('accessor')) return 'supply'
  if (type.includes('pen')) return 'pen'
  if (type.includes('vial')) return 'vial'
  if (type.includes('nasal') || type.includes('spray')) return 'nasal'
  if (type.includes('powder')) return 'powder'
  return null
}

function toSuggestion(item: CatalogueItem, campaign: string): SuggestedProduct {
  const url = `${SITE_URL}${productHref(item.handle)}?utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`
  return {
    title: item.title,
    url,
    price: item.price,
    currency: item.currencyCode,
    image: item.image,
    category: item.category,
  }
}

/**
 * Everything the lifecycle emails need to personalise one order.
 * `campaign` tags product links so you can see in analytics which email sold.
 */
export function buildJourney(order: OrderRecord, catalogue: CatalogueItem[], campaign: string): OrderJourney {
  const formats = new Set<ProductFormat>()
  const matched: CatalogueItem[] = []

  for (const line of order.products ?? []) {
    const item = matchCatalogue(line.title, catalogue)
    if (item && !matched.includes(item)) matched.push(item)
    const f = formatOf(line, item)
    if (f) formats.add(f)
  }

  const purchasedHandles = new Set(matched.map((m) => m.handle))
  const boughtBacWater = (order.products ?? []).some((p) => BAC_WATER_RE.test(p.title))
  const bacWaterItem = catalogue.find((c) => BAC_WATER_RE.test(c.title) && c.inStock) || null

  const categorySlugs = Array.from(
    new Set(matched.filter((m) => !SUPPLY_RE.test(m.title)).map((m) => m.categorySlug).filter(Boolean))
  )
  const categories = Array.from(
    new Set(matched.filter((m) => !SUPPLY_RE.test(m.title)).map((m) => m.category).filter(Boolean))
  )

  // Same research area first, then anything popular, never supplies or
  // something already bought. Stable order so the same customer doesn't see a
  // random shuffle between emails.
  const candidates = catalogue.filter(
    (c) => c.inStock && !purchasedHandles.has(c.handle) && !SUPPLY_RE.test(c.title) && c.categorySlug !== 'accessories'
  )
  const sameArea = candidates.filter((c) => categorySlugs.includes(c.categorySlug))
  const popular = candidates.filter(
    (c) => !categorySlugs.includes(c.categorySlug) && c.tags.some((t) => t.toLowerCase() === 'popular')
  )
  const related = [...sameArea, ...popular].slice(0, 3).map((c) => toSuggestion(c, campaign))

  const needsBacWater = formats.has('vial') && !boughtBacWater

  return {
    formats,
    categories,
    purchasedTitles: (order.products ?? []).map((p) => p.title),
    needsBacWater,
    bacWater: needsBacWater && bacWaterItem ? toSuggestion(bacWaterItem, campaign) : null,
    related,
  }
}

/* -------------------------------------------------------------------------- */
/* UAE working days (Mon–Fri; weekend Sat–Sun)                                  */
/* -------------------------------------------------------------------------- */

const DUBAI_TZ = 'Asia/Dubai'
const DAY_MS = 24 * 60 * 60 * 1000

function dubaiWeekday(date: Date): number {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: DUBAI_TZ, weekday: 'short' }).format(date)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}

function isWorkingDay(date: Date): boolean {
  const d = dubaiWeekday(date)
  return d >= 1 && d <= 5
}

/** The date `n` UAE working days after `from` (public holidays not included). */
export function addWorkingDays(from: Date, n: number): Date {
  let cursor = new Date(from.getTime())
  let added = 0
  while (added < n) {
    cursor = new Date(cursor.getTime() + DAY_MS)
    if (isWorkingDay(cursor)) added++
  }
  return cursor
}

/** Whole UAE working days elapsed since `from`, up to `now`. */
export function workingDaysSince(from: Date, now: Date = new Date()): number {
  let count = 0
  let cursor = new Date(from.getTime())
  while (cursor.getTime() + DAY_MS <= now.getTime()) {
    cursor = new Date(cursor.getTime() + DAY_MS)
    if (isWorkingDay(cursor)) count++
  }
  return count
}

/** e.g. "Thursday 18 September", in UAE time. */
export function formatDubaiDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DUBAI_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}