// lib/countryContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const COUNTRY_KEY = 'pepcolab_country'

const COUNTRY_CURRENCY: Record<string, string> = {
  AE: 'AED', GB: 'GBP', US: 'USD',
  DE: 'EUR', FR: 'EUR', AU: 'AUD', CA: 'CAD',
}

interface CountryCtx {
  country: string
  currency: string
  setCountry: (c: string) => void
  ready: boolean  // ← add this so consumers know detection is complete
}

const CountryContext = createContext<CountryCtx>({
  country: 'AE',
  currency: 'AED',
  setCountry: () => {},
  ready: false,
})

export function CountryProvider({ children }: { children: ReactNode }) {
  // Start with null so server and client initial render both agree
  const [country, setCountryState] = useState<string>('AE')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Only runs client-side, so no server/client mismatch
    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored && COUNTRY_CURRENCY[stored]) {
      setCountryState(stored)
      setReady(true)
      return
    }

    fetch('/api/country')
      .then(r => r.json())
      .then(({ country: detected }) => {
        if (detected && COUNTRY_CURRENCY[detected]) {
          setCountryState(detected)
          localStorage.setItem(COUNTRY_KEY, detected)
        }
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  const setCountry = (c: string) => {
    setCountryState(c)
    localStorage.setItem(COUNTRY_KEY, c)
  }

  return (
    <CountryContext.Provider value={{
      country,
      currency: COUNTRY_CURRENCY[country] ?? 'AED',
      setCountry,
      ready,
    }}>
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => useContext(CountryContext)