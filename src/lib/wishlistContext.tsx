// src/lib/wishlistContext.tsx
'use client'
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────
//
// Wishlist items are a lightweight snapshot of a product, not a live
// Shopify reference — unlike the cart, there's no gid/checkout line behind
// this, so we just store what's needed to render a card and re-add to the
// cart later. Re-reading the slug against getProductByHandle() at render
// time (see app/wishlist/page.tsx) is what keeps price/stock fresh; the
// snapshot here is only the instant fallback so the list still renders
// something on the very first paint / offline.

export interface WishlistItem {
  slug: string
  name: string
  mg: string
  price: number
  oldPrice?: number
  currencyCode?: string
  image?: string
  imageAlt?: string
  category?: string
  purity?: number
  inStock: boolean
  variantId?: string
  addedAt: number
}

interface WishlistState {
  items: WishlistItem[]
  hydrated: boolean
}

type Action =
  | { type: 'HYDRATE'; items: WishlistItem[] }
  | { type: 'ADD'; item: WishlistItem }
  | { type: 'REMOVE'; slug: string }
  | { type: 'CLEAR' }

function reducer(state: WishlistState, action: Action): WishlistState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items, hydrated: true }
    case 'ADD':
      if (state.items.some((i) => i.slug === action.item.slug)) return state
      return { ...state, items: [action.item, ...state.items] }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.slug !== action.slug) }
    case 'CLEAR':
      return { ...state, items: [] }
    default:
      return state
  }
}

const WISHLIST_KEY = 'pepcolab_wishlist'

function safeGet(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
function safeSet(items: WishlistItem[]) {
  try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(items)) } catch {}
}

// ─── Context shape ─────────────────────────────────────────────────────────

interface WishlistCtx {
  items: WishlistItem[]
  hydrated: boolean
  count: number
  isSaved: (slug: string) => boolean
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => void
  add: (item: Omit<WishlistItem, 'addedAt'>) => void
  remove: (slug: string) => void
  clear: () => void
}

const WishlistContext = createContext<WishlistCtx | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false })

  // Hydrate from localStorage on mount only — this is a client-only
  // concept (no server sync), so there's nothing to reconcile against.
  useEffect(() => {
    dispatch({ type: 'HYDRATE', items: safeGet() })
  }, [])

  // Persist on every change, but only once hydrated — otherwise the very
  // first render (empty state, before HYDRATE fires) would overwrite
  // whatever was already saved from a previous visit.
  useEffect(() => {
    if (state.hydrated) safeSet(state.items)
  }, [state.items, state.hydrated])

  const isSaved = useCallback(
    (slug: string) => state.items.some((i) => i.slug === slug),
    [state.items]
  )

  const add = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    dispatch({ type: 'ADD', item: { ...item, addedAt: Date.now() } })
  }, [])

  const remove = useCallback((slug: string) => {
    dispatch({ type: 'REMOVE', slug })
  }, [])

  const toggle = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
    if (state.items.some((i) => i.slug === item.slug)) {
      dispatch({ type: 'REMOVE', slug: item.slug })
    } else {
      dispatch({ type: 'ADD', item: { ...item, addedAt: Date.now() } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items])

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        hydrated: state.hydrated,
        count: state.items.length,
        isSaved,
        toggle,
        add,
        remove,
        clear: () => dispatch({ type: 'CLEAR' }),
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}