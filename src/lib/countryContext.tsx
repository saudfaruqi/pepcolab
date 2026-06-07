// lib/countryContext.tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const COUNTRY_KEY = 'pepcolab_country'

interface CountryCtx {
  country: string      // ISO 3166-1 alpha-2, e.g. "GB"
  currency: string     // ISO 4217, e.g. "GBP"  
  setCountry: (c: string) => void
}

const CountryContext = createContext<CountryCtx>({
  country: 'AE',
  currency: 'AED',
  setCountry: () => {},
})

// Map country → currency for the markets you support in Shopify
const COUNTRY_CURRENCY: Record<string, string> = {
  AE: 'AED',
  GB: 'GBP',
  US: 'USD',
  DE: 'EUR',
  FR: 'EUR',
  AU: 'AUD',
  CA: 'CAD',
  // add more as you enable markets in Shopify admin
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState('AE')

  useEffect(() => {
    // 1. Check localStorage first (returning visitor or manual override)
    const stored = localStorage.getItem(COUNTRY_KEY)
    if (stored && COUNTRY_CURRENCY[stored]) {
      setCountryState(stored)
      return
    }

    // 2. Detect via Shopify's own localization query — most accurate
    fetch('/api/country')
      .then(r => r.json())
      .then(({ country: detected }) => {
        if (detected && COUNTRY_CURRENCY[detected]) {
          setCountryState(detected)
          localStorage.setItem(COUNTRY_KEY, detected)
        }
      })
      .catch(() => {/* stay on default AE */})
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
    }}>
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => useContext(CountryContext)