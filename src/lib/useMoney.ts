// src/lib/useMoney.ts
'use client'
//
// Price formatting that follows the visitor's market. Product data rendered
// on the server is in AED (static pages cannot know the visitor's country);
// this converts an AED figure to pounds for UK visitors once the country has
// resolved. Before that, the first client render matches the server HTML
// exactly, so hydration never mismatches.
//
// Figures already in the display currency (cart lines, products fetched
// client-side with the visitor's country) carry a non-AED code and pass
// through unchanged, so nothing is converted twice.
import { useCallback } from 'react'
import { useCountry } from './countryContext'
import { convertFromAed, currencyFor } from './pricing'
import { formatPrice } from './utils'

export function useMoney() {
  const { country, ready } = useCountry()
  const market = ready ? country : 'AE'
  return useCallback(
    (amount: number, currencyCode: string = 'AED'): string => {
      if (currencyCode === 'AED' && currencyFor(market) !== 'AED') {
        return formatPrice(convertFromAed(amount, market), currencyFor(market))
      }
      return formatPrice(amount, currencyCode)
    },
    [market]
  )
}
