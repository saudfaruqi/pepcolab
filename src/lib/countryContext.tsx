// src/lib/countryContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const COUNTRY_KEY = 'pepcolab_country'

// PepcoLab only operates in these two markets. Any visitor detected as
// something else (or where detection fails) falls back to AE, the
// primary market — never a third currency we don't actually support.
const SUPPORTED_COUNTRIES = ['AE', 'GB'] as const
type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number]

const COUNTRY_CURRENCY: Record<SupportedCountry, string> = {
  AE: 'AED',
  GB: 'GBP',
}

function normaliseCountry(input: string | null | undefined): SupportedCountry {
  return SUPPORTED_COUNTRIES.includes(input as SupportedCountry)
    ? (input as SupportedCountry)
    : 'AE'
}

// FIX (Aug 2026): reads the SAME `pepcolab_country` cookie middleware.ts
// already sets on every request — it's just no longer read server-side in
// layout.tsx (see that file's comment for why: cookies() there forced the
// whole app to render dynamically). middleware.ts's cookie is not
// httpOnly, so `document.cookie` can read it here, synchronously, with no
// network round-trip. This is what keeps the fallback path below fast for
// the common case (anyone middleware has already geo-tagged) instead of
// always waiting on `/api/country`.
function readCountryCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)pepcolab_country=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

interface CountryCtx {
  country: SupportedCountry
  currency: string
  setCountry: (c: string) => void
  ready: boolean
}

const CountryContext = createContext<CountryCtx>({
  country: 'AE',
  currency: 'AED',
  setCountry: () => {},
  ready: false,
})

export function CountryProvider({
  children,
  initialCountry,
}: {
  children: ReactNode
  /**
   * Optional country resolved server-side, if a caller has one available
   * (e.g. a route that's already dynamic for other reasons and can safely
   * call cookies() itself). When present, this lets the provider start in
   * its final state on the very first render instead of waiting on the
   * client-side fallback chain below.
   *
   * FIX (Aug 2026): RootLayout (app/layout.tsx) used to always supply this
   * from cookies() — removed there because reading cookies() anywhere in
   * the layout chain forces the ENTIRE app to render dynamically, which
   * was silently defeating page.tsx's static-rendering fix. This prop
   * still exists for any route that wants to opt into dynamic rendering
   * deliberately and pass a real value, but nothing currently does. The
   * default path is the client-side fallback in the effect below:
   * localStorage (explicit prior choice) → the `pepcolab_country` cookie
   * via document.cookie (fast, no network, still set by middleware.ts on
   * every request) → `/api/country` as a last resort.
   */
  initialCountry?: string
}) {
  const resolvedInitial = normaliseCountry(initialCountry)
  const [country, setCountryState] = useState<SupportedCountry>(resolvedInitial)
  // If the server already resolved a supported country, we're ready
  // immediately — no flash, no waiting on an effect.
  const [ready, setReady] = useState<boolean>(
    Boolean(initialCountry && SUPPORTED_COUNTRIES.includes(initialCountry as SupportedCountry))
  )

  useEffect(() => {
    // Already resolved server-side — still check localStorage in case the
    // visitor explicitly picked a different market on a previous visit
    // (setCountry below), but don't block on a network round-trip.
    if (ready) {
      const stored = localStorage.getItem(COUNTRY_KEY)
      if (stored && stored !== country && SUPPORTED_COUNTRIES.includes(stored as SupportedCountry)) {
        setCountryState(stored as SupportedCountry)
      }
      return
    }

    // Fallback path — reached whenever no initialCountry was supplied
    // server-side (the normal case now — see the prop doc above).
    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored && SUPPORTED_COUNTRIES.includes(stored as SupportedCountry)) {
      setCountryState(stored as SupportedCountry)
      setReady(true)
      return
    }

    // No explicit prior choice — try middleware's geo-detected cookie
    // before falling all the way back to a network round-trip. This is
    // the fast path for anyone who's hit the site before (or even just
    // this session): synchronous, no request, resolves in the same tick.
    const cookieCountry = readCountryCookie()
    if (cookieCountry && SUPPORTED_COUNTRIES.includes(cookieCountry as SupportedCountry)) {
      setCountryState(cookieCountry as SupportedCountry)
      localStorage.setItem(COUNTRY_KEY, cookieCountry)
      setReady(true)
      return
    }

    // Last resort — no cookie either (e.g. middleware didn't run, or this
    // is genuinely the visitor's first-ever request before it could set
    // one). Only this path pays for a network round-trip.
    fetch('/api/country')
      .then(r => r.json())
      .then(({ country: detected }) => {
        const resolved = normaliseCountry(detected)
        setCountryState(resolved)
        localStorage.setItem(COUNTRY_KEY, resolved)
      })
      .catch(() => {
        // Detection failed — fall back to AE, don't leave it unset
        setCountryState('AE')
        localStorage.setItem(COUNTRY_KEY, 'AE')
      })
      .finally(() => setReady(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setCountry = (c: string) => {
    const resolved = normaliseCountry(c)
    setCountryState(resolved)
    localStorage.setItem(COUNTRY_KEY, resolved)
  }

  return (
    <CountryContext.Provider value={{
      country,
      currency: COUNTRY_CURRENCY[country],
      setCountry,
      ready,
    }}>
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => useContext(CountryContext)