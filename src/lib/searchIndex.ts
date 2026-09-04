// src/lib/searchIndex.ts
//
// One search across everything the site holds.
//
// THE PROBLEM
// Content is split across four stores — Shopify products, COA batches, guides
// and research articles — each with its own page and its own way in. That
// meant a visitor had to know WHAT KIND of thing they were looking for before
// they could find it: is "BPC-157" a product, a research article, or a lot
// number on a certificate? It is all three, and there was nowhere to type it.
//
// Lot numbers are the sharpest case. Someone holding a vial types the lot
// printed on it. That string appears nowhere except the certificate library,
// which they had to already know existed.
//
// WHY THERE IS NO EXTERNAL SEARCH SERVICE HERE
// The corpus is small — around 37 products plus a few dozen documents — and
// three of the four sources are static TypeScript compiled into the bundle.
// An Algolia or Typesense index would be more infrastructure to keep in sync
// than the search is worth at this size, and a stale index is worse than a
// slower query. Scoring is a straightforward weighted match, run per request.
// Revisit if the catalogue reaches the high hundreds.

import { COA_BATCHES } from '@/app/coaData'
import { GUIDES } from '@/lib/guides-data'
import { ARTICLES } from '@/lib/research-data'
import { toNeutralSlug } from '@/lib/utils'

/**
 * Only the fields search actually reads.
 *
 * Typed structurally rather than importing the full Product shape: the
 * Shopify normaliser's output and the app's own Product type differ in a
 * couple of fields (badge is a widened string on one side), and search has no
 * business caring about either. This also means the indexer can be tested
 * without constructing a whole product.
 */
export interface SearchableProduct {
  name: string
  slug: string
  category?: string
  description?: string
  inStock?: boolean
}

export type SearchKind = 'product' | 'certificate' | 'guide' | 'research'

export interface SearchHit {
  kind: SearchKind
  title: string
  subtitle: string
  href: string
  /** Higher is better. Only used for ordering. */
  score: number
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function norm(s: string): string {
  return (s || '').toLowerCase()
}

/**
 * Weighted scoring.
 *
 * An exact match on an identifier beats a mention buried in body text, which
 * is what makes a lot number or a compound name behave the way someone
 * expects. Prefix matches beat substring matches, so typing "bpc" surfaces
 * BPC-157 rather than an article that happens to mention it.
 */
function scoreField(haystack: string, q: string, weight: number): number {
  const h = norm(haystack)
  if (!h) return 0
  if (h === q) return weight * 4
  if (h.startsWith(q)) return weight * 2.5
  if (h.includes(q)) return weight
  return 0
}

export function searchAll(query: string, products: SearchableProduct[] = []): SearchHit[] {
  const q = norm(query).trim()
  if (q.length < 2) return []

  const hits: SearchHit[] = []

  // ── Products ─────────────────────────────────────────────────────────────
  for (const p of products) {
    const score =
      scoreField(p.name, q, 10) +
      scoreField(p.slug, q, 8) +
      scoreField(p.category || '', q, 3) +
      scoreField(p.description || '', q, 1)
    if (score > 0) {
      hits.push({
        kind: 'product',
        title: p.name,
        subtitle: p.inStock ? (p.category || 'Research compound') : 'Out of stock',
        href: `/products/${toNeutralSlug(p.slug)}`,
        score: score + (p.inStock ? 2 : 0), // available things rank above unavailable
      })
    }
  }

  // ── Certificates ─────────────────────────────────────────────────────────
  // Lot and accession are weighted hardest: someone typing one of those is
  // holding a vial and wants that exact document, not a fuzzy match.
  for (const c of COA_BATCHES) {
    const score =
      scoreField(c.lot, q, 14) +
      scoreField(c.accession, q, 12) +
      scoreField(c.code, q, 10) +
      scoreField(c.product, q, 6) +
      scoreField(c.identity, q, 3)
    if (score > 0) {
      hits.push({
        kind: 'certificate',
        title: `${c.product} — lot ${c.lot}`,
        subtitle: `Certificate of analysis · ${c.purityAvg} · reported ${c.reported}`,
        href: `/certificates?lot=${encodeURIComponent(c.lot)}`,
        score,
      })
    }
  }

  // ── Guides ───────────────────────────────────────────────────────────────
  for (const g of GUIDES) {
    const score =
      scoreField(g.title, q, 9) +
      scoreField(g.category, q, 4) +
      scoreField(g.excerpt, q, 2)
    if (score > 0) {
      hits.push({
        kind: 'guide',
        title: g.title,
        subtitle: `Guide · ${g.readTime}`,
        href: `/guides/${g.id}`,
        score,
      })
    }
  }

  // ── Research ─────────────────────────────────────────────────────────────
  for (const a of ARTICLES) {
    const score =
      scoreField(a.title, q, 9) +
      scoreField(a.tag, q, 4) +
      scoreField(a.excerpt, q, 2)
    if (score > 0) {
      hits.push({
        kind: 'research',
        title: a.title,
        subtitle: `Research · ${a.readTime}`,
        href: `/research/${a.id}`,
        score,
      })
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 30)
}

export const KIND_LABEL: Record<SearchKind, string> = {
  product: 'Product',
  certificate: 'Certificate',
  guide: 'Guide',
  research: 'Research',
}