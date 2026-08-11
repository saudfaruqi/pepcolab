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
   * Country resolved server-side by middleware (from the `pepcolab_country`
   * cookie, which middleware sets from `x-vercel-ip-country`/geo on every
   * request — see middleware.ts). When present, this lets the provider
   * start in its final state on the very first render instead of always
   * beginning at `country: 'AE', ready: false` and waiting on a client-side
   * `/api/country` round-trip.
   *
   * This is what actually unblocks server-rendering the homepage: previously
   * nothing consumed the homepage/store's product data could safely render
   * on the server, because `ready` was guaranteed false until an effect ran
   * in the browser — so the whole page tree was pushed behind
   * `dynamic(..., { ssr: false })`. With a known-good initial value, the
   * product fetch in HomePageContent.tsx can now run server-side too.
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

    // Fallback path — only reached if middleware's cookie wasn't present for
    // some reason (e.g. an environment where middleware.ts isn't running).
    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored && SUPPORTED_COUNTRIES.includes(stored as SupportedCountry)) {
      setCountryState(stored as SupportedCountry)
      setReady(true)
      return
    }

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