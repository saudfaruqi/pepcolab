// src/lib/addressNormalise.ts
//
// Cleans the shipping address STRABL sends before it is stored or displayed.
//
// WHY THIS IS NEEDED — a real payload received from STRABL:
//
//   address1:   "Al Waleed Paradise JLT Cluster R"
//   address2:   "Cluster R  - Jumeirah Lakes Towers pin_code 95959
//                Al Waleed Paradise JLT Cluster R Jumeirah Lakes Towers
//                Cluster R - Dubai"
//   city:       "Dubai"
//   postalCode: ""
//   phone:      ""
//
// Three separate problems in one record:
//
//   1. address2 REPEATS address1 verbatim, and repeats "Jumeirah Lakes
//      Towers" and "Cluster R" more than once. Printed on a label as-is it
//      reads as noise, and a courier reading noise misroutes parcels.
//   2. THE POSTCODE IS INSIDE address2 as "pin_code 95959" while the
//      postalCode field is empty. The data is there; it is just in the wrong
//      field, so every downstream consumer sees a blank postcode.
//   3. The city is duplicated into address2 as a trailing "- Dubai".
//
// This is not a one-off. It is how that integration formats addresses, so
// every order carries it. Normalising once, on write, means the account page,
// the track-order page, any label you print and anything you build later all
// see the same clean record — instead of each one re-implementing a guess.
//
// DESIGN RULE: this only ever REMOVES redundancy and MOVES a postcode into
// its own field. It never invents, reformats or "corrects" an address —
// a wrong-but-faithful address can be queried with the customer; a
// confidently rewritten one cannot.

export interface RawAddress {
  address1?: string
  address2?: string
  city?: string
  postalCode?: string
  countryCode?: string
}

export interface CleanAddress {
  line1: string
  line2: string
  city: string
  postalCode: string
  countryCode: string
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Strip separator debris left behind after removing a duplicated fragment. */
const tidy = (s: string) =>
  squash(s)
    .replace(/\s*[-–,]\s*(?=[-–,])/g, ' ')     // runs of separators
    .replace(/^[\s\-–,]+|[\s\-–,]+$/g, '')     // leading/trailing separators
    .replace(/\s+,/g, ',')

/**
 * Remove every occurrence of `needle` from `haystack`, case-insensitively,
 * on word boundaries. Used to delete fragments that are already carried by
 * another field.
 */
function removePhrase(haystack: string, needle: string): string {
  const n = squash(needle)
  if (n.length < 4) return haystack // too short to remove safely
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return haystack.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), ' ')
}

/**
 * Collapse a phrase repeated inside one string down to a single occurrence.
 * Handles "Cluster R ... Cluster R ... Cluster R" without knowing in advance
 * what the repeated phrase is.
 */
function collapseRepeats(input: string): string {
  const words = squash(input).split(' ')
  const out: string[] = []
  for (let i = 0; i < words.length; i++) {
    // Look back for the longest run already emitted that matches what starts here.
    let skipped = false
    for (let len = Math.min(6, words.length - i); len >= 2; len--) {
      const candidate = words.slice(i, i + len).join(' ').toLowerCase()
      if (out.join(' ').toLowerCase().includes(candidate)) {
        i += len - 1
        skipped = true
        break
      }
    }
    if (!skipped) out.push(words[i])
  }
  return out.join(' ')
}

/** Pull a postcode out of free text when the dedicated field is empty. */
function extractPostcode(text: string): { postcode: string; rest: string } {
  // STRABL emits "pin_code 95959" inline. Also handles "pincode"/"pin code".
  const labelled = text.match(/\bpin[_\s-]?code\s*[:\-]?\s*([A-Z0-9][A-Z0-9\s-]{2,9}?)\b/i)
  if (labelled) {
    return {
      postcode: squash(labelled[1]),
      rest: text.replace(labelled[0], ' '),
    }
  }
  return { postcode: '', rest: text }
}

export function normaliseAddress(raw: RawAddress): CleanAddress {
  const line1 = squash(raw.address1 || '')
  const city = squash(raw.city || '')
  let postalCode = squash(raw.postalCode || '')

  let line2 = squash(raw.address2 || '')

  // 1. Rescue a postcode hiding in address2.
  if (!postalCode) {
    const found = extractPostcode(line2)
    if (found.postcode) {
      postalCode = found.postcode
      line2 = found.rest
    }
  } else {
    line2 = extractPostcode(line2).rest
  }

  // 2. Drop anything address2 duplicates from the fields that already hold it.
  if (line1) line2 = removePhrase(line2, line1)
  if (city) line2 = removePhrase(line2, city)
  if (postalCode) line2 = removePhrase(line2, postalCode)

  // 3. Collapse phrases repeated within address2 itself.
  line2 = collapseRepeats(tidy(line2))

  // If line2 has been reduced to nothing meaningful, drop it rather than
  // shipping a label with a line of punctuation on it.
  if (line2.replace(/[^a-z0-9]/gi, '').length < 3) line2 = ''

  return {
    line1,
    line2: tidy(line2),
    city,
    postalCode,
    countryCode: squash(raw.countryCode || '').toUpperCase(),
  }
}

/** Single-line form, for admin lists and search. */
export function formatAddressOneLine(a: CleanAddress): string {
  return [a.line1, a.line2, a.city, a.postalCode, a.countryCode].filter(Boolean).join(', ')
}

/** Label form, one field per line — what you'd paste into a courier form. */
export function formatAddressLines(a: CleanAddress): string[] {
  return [a.line1, a.line2, [a.city, a.postalCode].filter(Boolean).join(' '), a.countryCode]
    .map(squash)
    .filter(Boolean)
}