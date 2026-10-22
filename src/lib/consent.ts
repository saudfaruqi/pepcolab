// src/lib/consent.ts
//
// COOKIE CONSENT
//
// One optional category: analytics (Google Analytics). Before consent GA runs
// in Consent Mode with storage DENIED — no cookies, cookieless pings only.
// There is no marketing / advertising category: the Meta Pixel and
// Conversions API were removed in the Oct 2026 clean-up (brief A11) and no
// advertising tag is loaded on the site. Ad storage is always denied.
//
// The choice is stored in localStorage (no cookie needed to remember "no
// cookies"), versioned so a policy change asks again. Version 2 = the
// analytics-only banner; anyone who answered the version-1 banner (which
// listed Meta) is asked again.

export const CONSENT_STORAGE_KEY = 'pepcolab_consent'
export const CONSENT_VERSION = 2
export const CONSENT_EVENT = 'pepcolab:consent'

export interface ConsentState {
  v: number
  analytics: boolean
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

export function saveConsent(analytics: boolean): ConsentState {
  const state: ConsentState = { v: CONSENT_VERSION, analytics, ts: Date.now() }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode: the choice applies to this page view only.
  }
  try {
    ;(window as any).gtag?.('consent', 'update', { analytics_storage: analytics ? 'granted' : 'denied' })
  } catch {
    // gtag not loaded yet; the inline default reads storage on next load.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }))
  return state
}

/**
 * Inline script for <head>, run before gtag config: sets Consent Mode
 * defaults from any stored choice, denied otherwise. Advertising storage is
 * always denied — the site carries no advertising tags.
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
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });
`
