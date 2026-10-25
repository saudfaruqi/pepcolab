// src/lib/countryContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { canCheckoutIn, currencyFor } from './pricing'

const COUNTRY_KEY = 'pepcolab_country'

// Two live markets: AE and GB. A visitor's country decides the display
// currency (AED or GBP); both can buy. Currency and selling rules live in
// lib/pricing.ts and are read from there, so they cannot drift apart.
const SUPPORTED_COUNTRIES = ['AE', 'GB'] as const
type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number]

const COUNTRY_CURRENCY: Record<SupportedCountry, string> = {
  AE: currencyFor('AE'),
  GB: currencyFor('GB'),
}

/** Markets that can currently complete a purchase. */
const CHECKOUT_ENABLED: Record<SupportedCountry, boolean> = {
  AE: canCheckoutIn('AE'),
  GB: canCheckoutIn('GB'),
}

function normaliseCountry(input: string | null | undefined): SupportedCountry {
  return SUPPORTED_COUNTRIES.includes(input as SupportedCountry)
    ? (input as SupportedCountry)
    : 'AE'
}

// Reads the `pepcolab_country` cookie set by src/middleware.ts.
//
// NOTE (Sep 2026): this fallback was load-bearing for longer than intended,
// because middleware.ts was sitting at src/lib/middleware.ts and never ran —
// so this cookie never existed and every first-time visitor paid for the
// /api/country round-trip at the bottom of the chain. With middleware at the
// correct path the cookie is present from the first request onward.
function readCountryCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)pepcolab_country=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

interface CountryCtx {
  country: SupportedCountry
  currency: string
  /** False for markets we cannot yet fulfil — drives MarketGuard and the cart. */
  canCheckout: boolean
  setCountry: (c: string) => void
  ready: boolean
}

const CountryContext = createContext<CountryCtx>({
  country: 'AE',
  currency: 'AED',
  canCheckout: true,
  setCountry: () => {},
  ready: false,
})

export function CountryProvider({
  children,
  initialCountry,
}: {
  children: ReactNode
  /**
   * Optional country resolved server-side. RootLayout deliberately does NOT
   * supply this: reading cookies() anywhere in the layout chain forces every
   * route beneath it to render dynamically, which defeats the static
   * rendering that keeps the homepage on the edge cache. The prop remains
   * for any route that opts into dynamic rendering for its own reasons.
   *
   * Default path is the client-side chain in the effect below:
   * localStorage (an explicit prior choice) -> the `pepcolab_country` cookie
   * via document.cookie (synchronous, no network) -> /api/country.
   */
  initialCountry?: string
}) {
  const resolvedInitial = normaliseCountry(initialCountry)
  const [country, setCountryState] = useState<SupportedCountry>(resolvedInitial)
  const [ready, setReady] = useState<boolean>(
    Boolean(initialCountry && SUPPORTED_COUNTRIES.includes(initialCountry as SupportedCountry))
  )

  useEffect(() => {
    if (ready) {
      const stored = localStorage.getItem(COUNTRY_KEY)
      if (stored && stored !== country && SUPPORTED_COUNTRIES.includes(stored as SupportedCountry)) {
        setCountryState(stored as SupportedCountry)
      }
      return
    }

    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored && SUPPORTED_COUNTRIES.includes(stored as SupportedCountry)) {
      setCountryState(stored as SupportedCountry)
      setReady(true)
      return
    }

    const cookieCountry = readCountryCookie()
    if (cookieCountry && SUPPORTED_COUNTRIES.includes(cookieCountry as SupportedCountry)) {
      setCountryState(cookieCountry as SupportedCountry)
      localStorage.setItem(COUNTRY_KEY, cookieCountry)
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
      canCheckout: CHECKOUT_ENABLED[country],
      setCountry,
      ready,
    }}>
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => useContext(CountryContext)