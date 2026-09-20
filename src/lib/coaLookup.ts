// src/lib/coaLookup.ts
//
// BATCH VERIFICATION — resolving what someone typed off a vial to a
// published certificate.
//
// WHY THIS IS THE WEDGE
//
// Competitor audit, September 2026. Of nine UK research-peptide suppliers,
// five advertise "COA verified" or "HPLC-verified" in their title tag or
// meta description while routing every actual certificate request to an
// email form. Two publish downloadable PDFs but only for the current batch.
// One keeps a manual accordion of batch links. NOT ONE lets a person type a
// lot number into a field and get back that lot's certificate.
//
// In the UAE the picture is only slightly better: of the reachable
// competitors, one (NOVA Labs) has a searchable batch table, one publishes a
// flat list of seven batches, and one prints a batch number and a purity
// figure on the product page while withholding the document itself.
//
// So "we test every batch" is worth nothing as a claim — everybody says it.
// What almost nobody does is let a stranger CHECK one. That is the whole
// point of this file.
//
// WHAT IT DELIBERATELY DOES NOT DO
//
// There is no fuzzy matching and no nearest-neighbour guess. A lot number is
// an identifier, not a search term: returning "did you mean PAL-TES5-2605-01?"
// for something a customer read off a label is how you hand someone the wrong
// certificate for the vial in their hand. Either the identifier resolves
// exactly, once normalised, or it does not resolve and we say so.

import { COA_BATCHES, type CoaBatch } from '@/app/coaData'

/**
 * Strips everything that varies between how a number is printed on a label
 * and how someone types it: case, spaces, hyphens, underscores, slashes.
 *
 * "PAL-TES5-2605-01", "pal tes5 2605 01" and "PALTES5260501" are the same
 * identifier. "PAL-TES5-2605-02" is not.
 */
export function normaliseLot(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * The URL-safe form of a lot number, used as the permalink segment.
 * Lowercase with hyphens preserved, which keeps /verify/pal-tes5-2605-01
 * readable rather than an opaque run of characters.
 */
export function lotSlug(lot: string): string {
  return (lot || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Finds the batch matching an identifier.
 *
 * Three things are printed where a customer can read them, and people type
 * whichever one they find first, so all three resolve:
 *   - the lot number on the vial label   (PAL-TES5-2605-01)
 *   - the cap code                        (TES5)
 *   - the laboratory accession number     (2606090460)
 *
 * Lot and accession are unique per batch. A cap code is NOT — it identifies
 * a product and strength, so several production runs share one. When a cap
 * code matches more than one batch we return null from here and let
 * findBatchesByCode handle it, rather than silently serving whichever run
 * happened to be first in the array.
 */
export function findBatch(identifier: string): CoaBatch | null {
  const key = normaliseLot(identifier)
  if (key.length < 3) return null

  const byLot = COA_BATCHES.find(b => normaliseLot(b.lot) === key)
  if (byLot) return byLot

  const byAccession = COA_BATCHES.find(b => normaliseLot(b.accession) === key)
  if (byAccession) return byAccession

  const byCode = COA_BATCHES.filter(b => normaliseLot(b.code) === key)
  if (byCode.length === 1) return byCode[0]

  return null
}

/**
 * Every batch sharing a cap code. Used when a code identifies a product
 * rather than a single run, so the page can show all of them and let the
 * customer pick the one matching their label.
 */
export function findBatchesByCode(identifier: string): CoaBatch[] {
  const key = normaliseLot(identifier)
  if (key.length < 2) return []
  return COA_BATCHES.filter(b => normaliseLot(b.code) === key)
}

/** Every batch, newest report first. */
export function allBatches(): CoaBatch[] {
  return [...COA_BATCHES].sort((a, b) => (a.reported < b.reported ? 1 : -1))
}

/**
 * Distinct compound names across all published certificates, for the
 * coverage statement on the lookup page.
 *
 * The product field carries the strength ("Tesamorelin 5mg", "GLP 30mg
 * (GLP3)"), so the strength and any parenthetical are trimmed off to get the
 * compound itself. Two batches of the same compound at different strengths
 * are one entry here.
 */
export function coveredCompounds(): string[] {
  const names = COA_BATCHES.map(b =>
    b.product
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\s*\d+(?:\.\d+)?\s*m[cg]g?\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
}

/**
 * The permalink for a batch. Kept here so the route, the product page, the
 * order email and the chat assistant all construct it identically.
 */
export function verifyHref(batch: CoaBatch): string {
  return `/verify/${lotSlug(batch.lot)}`
}