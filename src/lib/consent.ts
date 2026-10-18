// src/lib/consent.ts
//
// COOKIE CONSENT (Oct 2026)
//
// Until this existed, Google Analytics loaded for every visitor with no
// choice offered, and the privacy policy only said cookies "may" be used.
// UK PECR (and the UAE PDPL's consent rules for tracking) require a real,
// prior choice for anything that is not strictly necessary — and the Meta
// Pixel, which the ads plan needs, is the clearest case of all.
//
// Two optional categories:
//   analytics — Google Analytics. Before consent GA still loads in Consent
//               Mode with storage DENIED: no cookies, cookieless pings only.
//   marketing — Meta Pixel (and the Conversions API on the server). Not
//               loaded at all until accepted.
//
// The choice is stored in localStorage (no cookie needed to remember "no
// cookies"), versioned so a policy change can ask again.

export const CONSENT_STORAGE_KEY = 'pepcolab_consent'
export const CONSENT_VERSION = 1
export const CONSENT_EVENT = 'pepcolab:consent'

export interface ConsentState {
  v: number
  analytics: boolean
  marketing: boolean
  ts: number
}

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (!parsed || parsed.v !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function hasMarketingConsent(): boolean {
  return Boolean(readConsent()?.marketing)
}

export function saveConsent(analytics: boolean, marketing: boolean): ConsentState {
  const state: ConsentState = { v: CONSENT_VERSION, analytics, marketing, ts: Date.now() }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode: the choice applies to this page view only.
  }
  try {
    ;(window as any).gtag?.('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage: marketing ? 'granted' : 'denied',
      ad_user_data: marketing ? 'granted' : 'denied',
      ad_personalization: marketing ? 'granted' : 'denied',
    })
  } catch {
    // gtag not loaded yet; the inline default reads storage on next load.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }))
  return state
}

/**
 * Inline script for <head>, run before gtag config: sets Consent Mode
 * defaults from any stored choice, denied otherwise.
 */
export const CONSENT_DEFAULT_SCRIPT = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  var __c = null;
  try { __c = JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}') || 'null'); } catch (e) {}
  var __ok = __c && __c.v === ${CONSENT_VERSION};
  gtag('consent', 'default', {
    analytics_storage: __ok && __c.analytics ? 'granted' : 'denied',
    ad_storage: __ok && __c.marketing ? 'granted' : 'denied',
    ad_user_data: __ok && __c.marketing ? 'granted' : 'denied',
    ad_personalization: __ok && __c.marketing ? 'granted' : 'denied',
    wait_for_update: 500
  });
`
