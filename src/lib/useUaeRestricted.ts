// src/lib/useUaeRestricted.ts
'use client'
//
// React hook for lib/uaeRestrictions.ts. False on the first render (so the
// client matches the server HTML), then the real answer once the visitor's
// country has resolved.
import { useEffect, useState } from 'react'
import { useCountry } from './countryContext'
import { uaeRestrictedOnClient } from './uaeRestrictions'

export function useUaeRestricted(): boolean {
  const { country, ready } = useCountry()
  const [restricted, setRestricted] = useState(false)
  useEffect(() => {
    if (ready) setRestricted(uaeRestrictedOnClient())
  }, [country, ready])
  return restricted
}
