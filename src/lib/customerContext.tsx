'use client'
// src/lib/customerContext.tsx
//
// Site-wide signed-in state.
//
// WHY THIS EXISTS
// Before it, nothing outside /account knew whether a visitor was signed in.
// The site looked identical to a first-time browser and a customer with nine
// orders, and every form asked for an email address the site already had.
//
// One fetch per page load, shared by every component that needs it. Anything
// that wants "is this person known, and what do we already know about them"
// reads useCustomer() rather than making its own request.
//
// PREFILLING IS THE POINT. Every field a returning customer retypes is a
// field we are asking them to prove something we already stored. Track-order
// lookup, chat handoff, the UK launch list, review forms — all of them can be
// filled in for a signed-in customer, and all of them were asking anyway.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface CustomerState {
  /** Null while the first fetch is in flight — render neutrally until then. */
  signedIn: boolean | null
  email: string | null
  name: string | null
  firstName: string | null
  orderCount: number
  /** Call after sign-out, or after an action that changes order count. */
  refresh: () => void
}

const CustomerContext = createContext<CustomerState>({
  signedIn: null, email: null, name: null, firstName: null, orderCount: 0, refresh: () => {},
})

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<CustomerState, 'refresh'>>({
    signedIn: null, email: null, name: null, firstName: null, orderCount: 0,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/account/me')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        setState({
          signedIn: Boolean(d?.signedIn),
          email: d?.email ?? null,
          name: d?.name ?? null,
          firstName: d?.firstName ?? null,
          orderCount: d?.orderCount ?? 0,
        })
      })
      .catch(() => {
        // Treat a failed check as signed out. Showing an account nav that
        // 401s on click is worse than showing a sign-in link.
        if (!cancelled) setState(s => ({ ...s, signedIn: false }))
      })
    return () => { cancelled = true }
  }, [nonce])

  return (
    <CustomerContext.Provider value={{ ...state, refresh: () => setNonce(n => n + 1) }}>
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => useContext(CustomerContext)