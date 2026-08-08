// src/lib/countryContext.tsx
'use client'
import { createContext, useContext, ReactNode } from 'react'

// PepcoLab only sells into the UAE — no geo-detection, no per-visitor
// currency swapping. Every visitor sees the same AE catalogue and AED
// pricing, so cart/checkout currency always matches what's displayed.
const FIXED_COUNTRY = 'AE'
const FIXED_CURRENCY = 'AED'

interface CountryCtx {
  country: string
  currency: string
  setCountry: (c: string) => void
  ready: boolean
}

const CountryContext = createContext<CountryCtx>({
  country: FIXED_COUNTRY,
  currency: FIXED_CURRENCY,
  setCountry: () => {},
  ready: true,
})

export function CountryProvider({ children }: { children: ReactNode }) {
  return (
    <CountryContext.Provider
      value={{
        country: FIXED_COUNTRY,
        currency: FIXED_CURRENCY,
        setCountry: () => {}, // no-op — country is fixed to AE
        ready: true,
      }}
    >
      {children}
    </CountryContext.Provider>
  )
}

export const useCountry = () => useContext(CountryContext)