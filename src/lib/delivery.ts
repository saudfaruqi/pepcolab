// src/lib/delivery.ts
'use client'
//
// WHERE WE DELIVER — browser side (Nov 2026)
// ------------------------------------------
// PepcoLab delivers within the UAE only (lib/pricing.ts → DELIVERY_COUNTRIES).
// Before 10 Nov 2026 a visitor from anywhere else was simply treated as a UAE
// visitor and could pay — a customer in Jeddah did (SOR-D3MXTP) and had to be
// refunded. Ordering is now refused, before payment, when either
//   - the visitor's connection is outside a delivery country (the
//     `pepcolab_ip_country` cookie set by middleware.ts from Vercel's geo
//     data), or
//   - the visitor told the age/location gate they are somewhere else.
// The server repeats the location check for cash on delivery
// (app/api/checkout/cod); STRABL card payments open in the browser, so for
// those the address checks after payment (Orcaflo bridge) are the backstop.
import { useEffect, useState } from 'react'
import { deliversTo, DELIVERY_NOTICE } from '@/lib/pricing'

export { DELIVERY_NOTICE }

const IP_COOKIE = 'pepcolab_ip_country'
const GATE_KEY = 'pepcolab_gate_v1'

export function readIpCountry(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)pepcolab_ip_country=([A-Za-z]{2})(?:;|$)/)
  return m ? m[1].toUpperCase() : null
}

/** The market chosen on the age/location gate ('XX' for "Somewhere else"). */
function readGateMarket(): string | null {
  try {
    const raw = window.localStorage.getItem(GATE_KEY)
    if (!raw) return null
    const market = JSON.parse(raw)?.market
    if (market === 'OTHER') return 'XX'
    return typeof market === 'string' ? market : null
  } catch {
    return null
  }
}

/** False when this visitor must not be able to order. */
export function canDeliverHere(): boolean {
  if (typeof window === 'undefined') return true
  if (!deliversTo(readIpCountry())) return false
  return deliversTo(readGateMarket())
}

/** The message to show when ordering is refused. */
export function deliveryRefusal(): string {
  const ip = readIpCountry()
  const vpnHint = ip && !deliversTo(ip) ? ' If you are in the UAE and using a VPN, switch it off and refresh the page.' : ''
  return `${DELIVERY_NOTICE} We can\u2019t take orders from your location right now.${vpnHint}`
}

/** null until checked in the browser, then whether ordering is allowed. */
export function useCanDeliver(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    const check = () => setOk(canDeliverHere())
    check()
    // The gate writes its choice to localStorage; re-check when it closes.
    window.addEventListener('storage', check)
    window.addEventListener('focus', check)
    const t = setInterval(check, 3000)
    return () => {
      window.removeEventListener('storage', check)
      window.removeEventListener('focus', check)
      clearInterval(t)
    }
  }, [])
  return ok
}
