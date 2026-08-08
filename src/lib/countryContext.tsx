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

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<SupportedCountry>('AE')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Only runs client-side, so no server/client mismatch
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