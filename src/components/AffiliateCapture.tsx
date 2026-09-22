'use client'

// src/components/AffiliateCapture.tsx
//
// Catches ?ref=CODE on any page, remembers it, and counts the click.
//
// This replaces components/ReferralWidget.tsx, deleted with the referral
// programme. Its removal left affiliate links doing nothing at all: the cart
// was still reading a localStorage key that nothing wrote any more, so a
// visitor arriving on /?ref=PL-SARAH482 reached checkout with an empty
// discount box and the affiliate earned nothing.
//
// THREE DELIBERATE CHOICES
//
// 1. IT READS window.location, NOT useSearchParams. useSearchParams opts the
//    whole subtree out of static rendering unless it is wrapped in Suspense,
//    and this component is mounted in the root layout — that would have cost
//    every page on the site its static render to read one query parameter.
//
// 2. THE CODE IS STORED, NOT APPLIED. It pre-fills the cart's discount box;
//    the customer still presses Apply. Silently attaching a discount nobody
//    asked for is how a stale link overwrites a better code someone already
//    typed.
//
// 3. FIRST TOUCH WINS, and there is no expiry. If a visitor already has a
//    code stored, a later link does not replace it. Attribution disputes in
//    affiliate programmes are almost always last-touch hijacking — someone
//    dropping their code on a visitor another affiliate already sent. Since
//    commission here follows the code used at checkout rather than a cookie,
//    the stored value is only a convenience, and the customer can always
//    type a different one.

import { useEffect } from 'react'

const STORAGE_KEY = 'pepcolab_ref'
/** Marks a code as already counted, so a click isn't logged per navigation. */
const COUNTED_KEY = 'pepcolab_ref_counted'

export default function AffiliateCapture() {
  useEffect(() => {
    let code: string | null = null
    try {
      code = new URLSearchParams(window.location.search).get('ref')
    } catch {
      return
    }
    if (!code) return

    // Codes are minted as PL-NAME123 and matched case-insensitively
    // server-side; normalising here keeps the stored value tidy.
    const clean = code.trim().toUpperCase().slice(0, 40)
    if (!/^[A-Z0-9-]{3,40}$/.test(clean)) return

    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, clean)
      }
      // Count the click once per browser per code. The counter is a vanity
      // figure on the affiliate's own dashboard and never feeds a payout,
      // so this only needs to stop honest inflation from navigation, not
      // resist someone determined to pad it.
      const counted = sessionStorage.getItem(COUNTED_KEY)
      if (counted === clean) return
      sessionStorage.setItem(COUNTED_KEY, clean)
    } catch {
      // Private mode or blocked storage — still worth counting the click.
    }

    // Fire and forget. A failed count must never surface to the visitor.
    fetch(`/api/affiliate?ref=${encodeURIComponent(clean)}`, {
      method: 'GET',
      cache: 'no-store',
      keepalive: true,
    }).catch(() => {})
  }, [])

  return null
}