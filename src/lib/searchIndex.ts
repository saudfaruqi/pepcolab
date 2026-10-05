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
import { COMPARISONS } from '@/lib/comparisons-data'
import { LEGAL_NOTES } from '@/lib/legal-data'
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

// 'comparison' added Oct 2026 — the seven /compare pages were absent from the
// index entirely, so a visitor typing "semax vs selank" into the site's own
// search got nothing while the page existed and was in the sitemap.
export type SearchKind = 'product' | 'certificate' | 'guide' | 'research' | 'comparison' | 'legal'

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

// ─── TOKEN FALLBACK (Oct 2026) ──────────────────────────────────────────────
//
// scoreField above matches the ENTIRE query as one substring, which means any
// natural-language question returns nothing unless the exact phrase appears
// somewhere. "do peptides need to be refrigerated" scored zero across the whole
// site while a guide answered it directly in a section heading.
//
// The fallback below scores at token level instead. It is deliberately a
// FALLBACK and not a replacement: it is only consulted for a record whose
// phrase score came out at zero, so every existing exact-match and prefix-match
// ranking is untouched and the only results that change are ones that were
// previously empty. Products in particular keep their current behaviour
// exactly.

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did',
  'can', 'could', 'should', 'would', 'will', 'i', 'you', 'my', 'me', 'it', 'its',
  'to', 'of', 'in', 'on', 'for', 'and', 'or', 'but', 'if', 'at', 'by', 'with',
  'from', 'as', 'that', 'this', 'these', 'those', 'what', 'how', 'why', 'when',
  'where', 'which', 'who', 'there', 'have', 'has', 'had', 'get', 'got', 'any',
  'about', 'into', 'than', 'then', 'they', 'use', 'used', 'using', 'need', 'needs',
])

/**
 * Query shorthand that will not substring-match the canonical term. Each entry
 * maps a token the visitor types to the forms that should satisfy it.
 *
 * Kept deliberately short and one-directional. These are abbreviations in
 * genuine common use — "bac water" is how the product is universally referred
 * to, and we sell a SKU literally named pharma-grade-bac-water — not a general
 * synonym dictionary, which would start producing surprising matches.
 */
const TOKEN_ALIASES: Record<string, string[]> = {
  bac: ['bacteriostatic'],
  coa: ['certificate', 'analysis'],
  ms: ['mass spectrometry', 'spectrometry'],
  spec: ['spectrometry'],
  lyo: ['lyophilised', 'lyophilized'],
  fake: ['genuine', 'real', 'counterfeit', 'verify'],
  real: ['genuine', 'verify'],
  legal: ['legality', 'lawful', 'compliance'],
  legality: ['legal', 'compliance'],
  fridge: ['refrigerat'],
  refrigerated: ['refrigerat', 'fridge'],
  storage: ['store', 'storing'],
  store: ['storage', 'storing'],
  expiry: ['expire', 'expired', 'shelf life'],
  shelf: ['shelf life', 'expiry'],
  dubai: ['uae', 'emirates'],
  uae: ['dubai', 'emirates'],
  uk: ['united kingdom', 'britain', 'mhra'],
}

function queryTokens(q: string): string[] {
  return q
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

/**
 * Proportional token match. Returns 0 unless a clear majority of the
 * meaningful query tokens appear, so a single incidental word shared with a
 * long query cannot drag an unrelated record into the results.
 */
function scoreTokens(haystack: string, qTokens: string[], weight: number): number {
  if (qTokens.length === 0) return 0
  const h = norm(haystack)
  if (!h) return 0

  let matched = 0
  for (const t of qTokens) {
    if (h.includes(t) || (TOKEN_ALIASES[t] ?? []).some((a) => h.includes(a))) matched++
  }
  if (matched === 0) return 0

  const ratio = matched / qTokens.length
  // Two-token queries need both; longer queries need two thirds. Without this
  // floor, "legal in uk" would match every page containing the word "uk".
  const floor = qTokens.length <= 2 ? 1 : 0.66
  if (ratio < floor) return 0

  // Scaled below the phrase weights on purpose: a verbatim phrase match should
  // always outrank a scattered token match on the same field.
  return weight * ratio * 0.8
}

/**
 * Words that appear in compound names but identify nothing — a query token
 * matching only these has not named a compound.
 */
const GENERIC_COMPOUND_WORDS = new Set([
  'peptide', 'peptides', 'research', 'class', 'acid', 'analogue', 'analog',
  'receptor', 'agonist', 'blend', 'complex', 'fragment', 'grade',
])

/**
 * True when the query names this specific compound, as opposed to merely
 * sharing a generic word with its description. Checks the compound field and
 * the slug, both stripped of generic vocabulary, and accepts a prefix match so
 * "reta" finds Retatrutide and "semag" finds Semaglutide.
 */
function compoundIsNamed(note: { compound: string; slug: string }, qTokens: string[]): boolean {
  const identifying = `${note.compound} ${note.slug.replace(/-/g, ' ')}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !GENERIC_COMPOUND_WORDS.has(w))

  return qTokens.some((t) =>
    identifying.some((w) => w === t || (t.length >= 3 && (w.startsWith(t) || t.startsWith(w))))
  )
}

export function searchAll(query: string, products: SearchableProduct[] = []): SearchHit[] {
  const q = norm(query).trim()
  if (q.length < 2) return []

  const qt = queryTokens(q)
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
    // FAQ questions are scored (Oct 2026) because they are the only place the
    // site holds the question AS TYPED. A visitor searching "do peptides need
    // to be refrigerated" matched nothing before this — the words appear in no
    // title, category or excerpt — while the guide answered it directly. Weight
    // sits between category and excerpt: a question match is a strong signal,
    // but a title match should still outrank it.
    // Weight 8, just under a title match: a full-query hit on a FAQ question
    // means the visitor typed the question this page answers verbatim.
    const faqScore = (g.faq ?? []).reduce((best, f) => Math.max(best, scoreField(f.q, q, 8)), 0)
    let score =
      scoreField(g.title, q, 9) +
      scoreField(g.category, q, 4) +
      scoreField(g.excerpt, q, 2) +
      faqScore

    // Token fallback only for a guide the phrase scorer missed entirely. The
    // FAQ questions are the highest-value field here because they are the only
    // place the site stores the question as a visitor would type it.
    if (score === 0) {
      score =
        scoreTokens(g.title, qt, 9) +
        (g.faq ?? []).reduce((best, f) => Math.max(best, scoreTokens(f.q, qt, 7)), 0) +
        scoreTokens(g.excerpt, qt, 2)
    }

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

  // ── Legal notes ──────────────────────────────────────────────────────────
  // Added Oct 2026. Ten per-compound legal pages existed, were in the sitemap,
  // and were completely absent from the site's own search — so "is ghk cu legal
  // in uk" returned nothing while /legal/ghk-cu answered it. These are among
  // the highest-intent queries the site receives.
  for (const n of LEGAL_NOTES) {
    const title = `Is ${n.compound} legal? UK & UAE status`
    let score =
      scoreField(n.compound, q, 8) +
      scoreField(title, q, 6) +
      scoreField(n.ukSummary, q, 2) +
      scoreField(n.uaeSummary, q, 2)

    if (score === 0) {
      // The compound must be named SPECIFICALLY for a token match to count.
      //
      // Without this guard, "are peptides legal in dubai" matched every legal
      // note equally (on "legal" plus the dubai->uae alias) and surfaced
      // whichever happened to be first, pushing the UK/UAE overview guides —
      // which actually answer the generic question — below an arbitrary
      // single-compound page.
      //
      // The generic-word filter is the part that matters: one note's compound
      // field reads "GLP-1 Research Peptides (Semaglutide / Tirzepatide /
      // Retatrutide class)", so a bare substring test on the compound name let
      // the word "peptides" satisfy the guard and defeated it entirely.
      if (compoundIsNamed(n, qt)) {
        score =
          scoreTokens(title, qt, 7) +
          scoreTokens(`${n.compound} ${n.slug.replace(/-/g, ' ')} legal legality uk uae`, qt, 6) +
          scoreTokens(n.ukSummary, qt, 2)
      }
    }

    if (score > 0) {
      hits.push({
        kind: 'legal',
        title,
        subtitle: 'Legal status',
        href: `/legal/${n.slug}`,
        score,
      })
    }
  }

  // ── Comparisons ──────────────────────────────────────────────────────────
  for (const c of COMPARISONS) {
    // Both compound names are scored individually as well as via the title, so
    // "selank" alone surfaces the comparison and not only "semax vs selank".
    const faqScore = (c.faq ?? []).reduce((best, f) => Math.max(best, scoreField(f.q, q, 8)), 0)
    let score =
      scoreField(c.title, q, 8) +
      scoreField(c.compoundA, q, 6) +
      scoreField(c.compoundB, q, 6) +
      scoreField(c.metaDescription, q, 2) +
      faqScore

    if (score === 0) {
      score =
        scoreTokens(`${c.compoundA} vs ${c.compoundB}`, qt, 8) +
        (c.faq ?? []).reduce((best, f) => Math.max(best, scoreTokens(f.q, qt, 6)), 0) +
        scoreTokens(c.metaDescription, qt, 2)
    }

    if (score > 0) {
      hits.push({
        kind: 'comparison',
        title: `${c.compoundA} vs ${c.compoundB}`,
        subtitle: 'Comparison',
        href: `/compare/${c.slug}`,
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
  comparison: 'Comparison',
  legal: 'Legal status',
}