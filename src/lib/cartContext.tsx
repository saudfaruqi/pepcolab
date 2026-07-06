


// src/lib/cartContext.tsx
'use client'
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import {
  createCart as shopifyCreateCart,
  addToCart as shopifyAddToCart,
  removeFromCart as shopifyRemove,
  updateCartLine as shopifyUpdateLine,
  getCart as shopifyGetCart,
  updateCartBuyerIdentity,
  type ShopifyCart,
  type ShopifyCartLine,
} from '@/lib/shopify'
import { useCountry } from '@/lib/countryContext'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CartLine {
  id: string
  quantity: number
  variantId: string
  title: string
  variantTitle: string
  price: number
  image?: string
  slug: string
}

interface CartState {
  cartId: string | null
  lines: CartLine[]
  totalQuantity: number
  subtotal: number
  currencyCode: string
  open: boolean
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'SET_CART_ID'; cartId: string }
  | { type: 'SET_LINES'; lines: CartLine[]; total: number; qty: number; currencyCode?: string }
  | { type: 'SET_OPEN'; open: boolean }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_CART' }

const init: CartState = {
  cartId: null,
  lines: [],
  totalQuantity: 0,
  subtotal: 0,
  currencyCode: 'AED',
  open: false,
  loading: false,
  error: null,
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'SET_CART_ID':
      return { ...state, cartId: action.cartId }
    case 'SET_LINES':
      return {
        ...state,
        lines: action.lines,
        subtotal: action.total,
        totalQuantity: action.qty,
        currencyCode: action.currencyCode ?? state.currencyCode,
      }
    case 'SET_OPEN':
      return { ...state, open: action.open }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_CART':
      return { ...init, currencyCode: state.currencyCode }
    default:
      return state
  }
}

// ─── Local-storage helpers ─────────────────────────────────────────────────

const CART_ID_KEY = 'pepcolab_cart_id'
const CART_LINES_KEY = 'pepcolab_cart_lines'
const CART_CURRENCY_KEY = 'pepcolab_cart_currency'

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}
function safeRemove(key: string) {
  try { localStorage.removeItem(key) } catch {}
}
function clearCartStorage() {
  safeRemove(CART_ID_KEY)
  safeRemove(CART_LINES_KEY)
  safeRemove(CART_CURRENCY_KEY)
}

// ─── Shopify → internal mappers ────────────────────────────────────────────

function mapLine(node: ShopifyCartLine): CartLine {
  return {
    id: node.id,
    quantity: node.quantity,
    variantId: node.merchandise.id,
    title: node.merchandise.product?.title ?? '',
    variantTitle: node.merchandise.title,
    price: parseFloat(node.merchandise.price?.amount ?? '0'),
    image: node.merchandise.image?.url,
    slug: node.merchandise.product?.handle ?? '',
  }
}

function applyCart(cart: ShopifyCart) {
  const lines = cart.lines.edges.map(({ node }) => mapLine(node))
  const money = cart.cost.subtotalAmount ?? cart.cost.totalAmount
  const total = parseFloat(money.amount)
  const qty = cart.totalQuantity
  const currencyCode = money.currencyCode ?? 'AED'
  return { lines, total, qty, currencyCode }
}

function computeTotals(lines: CartLine[]) {
  return {
    total: lines.reduce((s, l) => s + l.price * l.quantity, 0),
    qty: lines.reduce((s, l) => s + l.quantity, 0),
  }
}

// ─── Context shape ─────────────────────────────────────────────────────────

interface CartCtx extends CartState {
  addItem: (variantId: string, title: string, variantTitle: string, price: number, slug: string, image?: string) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  updateQty: (lineId: string, qty: number) => Promise<void>
  openCart: () => void
  closeCart: () => void
  checkout: () => Promise<void> // Now just navigates to checkout page
  clearError: () => void
  getCartLines: () => CartLine[] // Helper to get lines for checkout
}

const CartContext = createContext<CartCtx | null>(null)

// ─── Provider ──────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, init)
  const { country, ready } = useCountry()

  // ── Boot: hydrate from localStorage → revalidate with Shopify ────────────

  useEffect(() => {
    const storedId = safeGet(CART_ID_KEY)
    const storedLines = safeGet(CART_LINES_KEY)
    const storedCurrency = safeGet(CART_CURRENCY_KEY)

    // Optimistic first-paint from cache
    if (storedLines) {
      try {
        const lines: CartLine[] = JSON.parse(storedLines)
        const { total, qty } = computeTotals(lines)
        dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode: storedCurrency ?? undefined })
      } catch {}
    }

    if (!storedId) return
    dispatch({ type: 'SET_CART_ID', cartId: storedId })

    shopifyGetCart(storedId).then(async cart => {
      if (!cart) {
        // Cart expired — wipe everything
        clearCartStorage()
        dispatch({ type: 'CLEAR_CART' })
        return
      }

      // Update buyer identity so Shopify returns the right currency
      try {
        const updated = await updateCartBuyerIdentity(storedId, country)
        const { lines, total, qty, currencyCode } = applyCart(updated)
        dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
      } catch {
        // Identity update failed — at least show what we fetched
        const { lines, total, qty, currencyCode } = applyCart(cart)
        dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
      }
    })
    // Re-run when country resolves (async geo-detection may start as 'AE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, ready])

  // Persist lines & currency to localStorage on every change
  useEffect(() => {
    if (state.lines.length > 0) safeSet(CART_LINES_KEY, JSON.stringify(state.lines))
  }, [state.lines])

  useEffect(() => {
    if (state.currencyCode) safeSet(CART_CURRENCY_KEY, state.currencyCode)
  }, [state.currencyCode])

  // ── ensureCart ────────────────────────────────────────────────────────────
  // Returns an existing cart id or creates a new one with the buyer's country

  const ensureCart = useCallback(async (): Promise<string> => {
    if (state.cartId) return state.cartId
    const stored = safeGet(CART_ID_KEY)
    if (stored) {
      dispatch({ type: 'SET_CART_ID', cartId: stored })
      return stored
    }
    const id = await shopifyCreateCart(country)
    safeSet(CART_ID_KEY, id)
    dispatch({ type: 'SET_CART_ID', cartId: id })
    return id
  }, [state.cartId, country])

  // ── addItem ───────────────────────────────────────────────────────────────

  const addItem = useCallback(async (
    variantId: string,
    title: string,
    variantTitle: string,
    price: number,
    slug: string,
    image?: string,
  ) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    // Optimistic update
    const existing = state.lines.find(l => l.variantId === variantId)
    const optimistic: CartLine[] = existing
      ? state.lines.map(l => l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l)
      : [...state.lines, { id: `optimistic-${Date.now()}`, quantity: 1, variantId, title, variantTitle, price, slug, image }]
    const { total, qty } = computeTotals(optimistic)
    dispatch({ type: 'SET_LINES', lines: optimistic, total, qty })
    dispatch({ type: 'SET_OPEN', open: true })

    try {
      const cartId = await ensureCart()
      const cart = await shopifyAddToCart(cartId, variantId, 1)
      const { lines, total: realTotal, qty: realQty, currencyCode } = applyCart(cart)
      dispatch({ type: 'SET_LINES', lines, total: realTotal, qty: realQty, currencyCode })
      safeSet(CART_LINES_KEY, JSON.stringify(lines))
      safeSet(CART_CURRENCY_KEY, currencyCode)
    } catch (err) {
      // Roll back
      const { total: t, qty: q } = computeTotals(state.lines)
      dispatch({ type: 'SET_LINES', lines: state.lines, total: t, qty: q })
      dispatch({ type: 'SET_ERROR', error: 'Could not add item. Please try again.' })
      console.error('[Cart] addItem:', err)
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }, [ensureCart, state.lines])

  // ── removeItem ────────────────────────────────────────────────────────────

  const removeItem = useCallback(async (lineId: string) => {
    dispatch({ type: 'SET_LOADING', loading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    const prev = state.lines
    const next = state.lines.filter(l => l.id !== lineId)
    const { total, qty } = computeTotals(next)
    dispatch({ type: 'SET_LINES', lines: next, total, qty })

    try {
      if (!lineId.startsWith('optimistic-') && state.cartId) {
        const cart = await shopifyRemove(state.cartId, [lineId])
        const { lines, total: rt, qty: rq, currencyCode } = applyCart(cart)
        dispatch({ type: 'SET_LINES', lines, total: rt, qty: rq, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
      }
    } catch (err) {
      const { total: t, qty: q } = computeTotals(prev)
      dispatch({ type: 'SET_LINES', lines: prev, total: t, qty: q })
      dispatch({ type: 'SET_ERROR', error: 'Could not remove item. Please try again.' })
      console.error('[Cart] removeItem:', err)
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }, [state.cartId, state.lines])

  // ── updateQty ─────────────────────────────────────────────────────────────

  const updateQty = useCallback(async (lineId: string, qty: number) => {
    if (qty < 1) return removeItem(lineId)

    dispatch({ type: 'SET_LOADING', loading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    const prev = state.lines
    const next = state.lines.map(l => l.id === lineId ? { ...l, quantity: qty } : l)
    const { total, qty: tq } = computeTotals(next)
    dispatch({ type: 'SET_LINES', lines: next, total, qty: tq })

    try {
      if (!lineId.startsWith('optimistic-') && state.cartId) {
        const cart = await shopifyUpdateLine(state.cartId, lineId, qty)
        const { lines, total: rt, qty: rq, currencyCode } = applyCart(cart)
        dispatch({ type: 'SET_LINES', lines, total: rt, qty: rq, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
      }
    } catch (err) {
      const { total: t, qty: q } = computeTotals(prev)
      dispatch({ type: 'SET_LINES', lines: prev, total: t, qty: q })
      dispatch({ type: 'SET_ERROR', error: 'Could not update quantity.' })
      console.error('[Cart] updateQty:', err)
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }, [removeItem, state.cartId, state.lines])

  // ── checkout ──────────────────────────────────────────────────────────────
  // Simply navigate to the checkout page. The order will be created there
  // after the customer provides their information.

  const checkout = useCallback(async () => {
    if (state.lines.length === 0) {
      dispatch({ type: 'SET_ERROR', error: 'Your cart is empty.' })
      return
    }

    // Save cart lines to session storage for the checkout page
    try {
      sessionStorage.setItem('checkout_cart_lines', JSON.stringify(state.lines))
      sessionStorage.setItem('checkout_currency', state.currencyCode)
    } catch (e) {
      // Ignore storage errors
    }

    // Navigate to checkout page
    window.location.href = '/checkout'
  }, [state.lines, state.currencyCode])

  // ── Helper to get cart lines ─────────────────────────────────────────────

  const getCartLines = useCallback(() => state.lines, [state.lines])

  return (
    <CartContext.Provider value={{
      ...state,
      addItem,
      removeItem,
      updateQty,
      openCart: () => dispatch({ type: 'SET_OPEN', open: true }),
      closeCart: () => dispatch({ type: 'SET_OPEN', open: false }),
      checkout,
      clearError: () => dispatch({ type: 'SET_ERROR', error: null }),
      getCartLines,
    }}>
      {children}
    </CartContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}