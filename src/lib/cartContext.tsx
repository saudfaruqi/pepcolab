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
import { trackAddToCart, trackRemoveFromCart, lineToItem } from '@/lib/analytics'
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
import { convertFromAed, currencyFor } from '@/lib/pricing'

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

/**
 * `market` converts Shopify's AED figures into the visitor's display currency.
 * This is one of only TWO conversion points in the app; the other is
 * normaliseProduct() in src/lib/shopify.ts. Shopify's cart is always AED
 * because the payment gateway is single-currency — the checkout and the card
 * charge stay in dirhams no matter what is shown here, which is why
 * chargeNotice() has to appear alongside any converted total.
 *
 * Line prices are converted individually rather than converting the subtotal,
 * so `line.price * quantity` displayed per row still sums to the subtotal
 * shown at the bottom. Converting only the total would leave the rows and the
 * sum visibly disagreeing after rounding.
 */
function applyCart(cart: ShopifyCart, market?: string) {
  const lines = cart.lines.edges.map(({ node }) => {
    const line = mapLine(node)
    return { ...line, price: convertFromAed(line.price, market) }
  })
  const qty = cart.totalQuantity
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  return { lines, total, qty, currencyCode: currencyFor(market) }
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
  restoreItems: (items: { variantId: string; quantity: number }[]) => Promise<number> // Bulk-adds variants (abandoned-cart restore links); returns how many lines actually landed
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
        const { lines, total, qty, currencyCode } = applyCart(updated, country)
        dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
      } catch {
        // Identity update failed — at least show what we fetched
        const { lines, total, qty, currencyCode } = applyCart(cart, country)
        dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
      }
    })
    // Re-run when country resolves (async geo-detection may start as 'AE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, ready])

  // Persist lines & currency to localStorage on every change — including
  // clearing the stored copy when the cart genuinely empties out, so a
  // removed item can't flash back on the next page load's optimistic
  // cache read (see boot effect above).
  useEffect(() => {
    if (state.lines.length > 0) {
      safeSet(CART_LINES_KEY, JSON.stringify(state.lines))
    } else {
      safeRemove(CART_LINES_KEY)
    }
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
      const { lines, total: realTotal, qty: realQty, currencyCode } = applyCart(cart, country)
      dispatch({ type: 'SET_LINES', lines, total: realTotal, qty: realQty, currencyCode })
      safeSet(CART_LINES_KEY, JSON.stringify(lines))
      safeSet(CART_CURRENCY_KEY, currencyCode)

      // ANALYTICS: fire only after Shopify confirms the line landed, never on
      // the optimistic update above — otherwise a failed add still counts as
      // an add_to_cart and the funnel overstates itself at the top.
      trackAddToCart(lineToItem({ variantId, slug, title, variantTitle, price, quantity: 1 }))
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
    // Captured before the filter — once the line is dropped from state there
    // is nothing left to report to analytics.
    const removed = state.lines.find(l => l.id === lineId)
    const next = state.lines.filter(l => l.id !== lineId)
    const { total, qty } = computeTotals(next)
    dispatch({ type: 'SET_LINES', lines: next, total, qty })

    try {
      if (!lineId.startsWith('optimistic-') && state.cartId) {
        const cart = await shopifyRemove(state.cartId, [lineId])
        const { lines, total: rt, qty: rq, currencyCode } = applyCart(cart, country)
        dispatch({ type: 'SET_LINES', lines, total: rt, qty: rq, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
      }
      if (removed) trackRemoveFromCart(lineToItem(removed))
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
        const { lines, total: rt, qty: rq, currencyCode } = applyCart(cart, country)
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

  // ── restoreItems ──────────────────────────────────────────────────────────
  // Bulk-add for abandoned-cart restore links (see /cart's ?restore= param
  // handling). Distinct from addItem because: (a) it needs real quantities,
  // not a fixed +1, and (b) it's fine for the whole batch to fail loudly
  // together rather than doing per-item optimistic updates — this only
  // runs once, right after a fresh page load, so there's no existing cart
  // state to protect the way addItem protects against a bad click mid-browse.

  const restoreItems = useCallback(async (items: { variantId: string; quantity: number }[]): Promise<number> => {
    if (items.length === 0) return 0
    dispatch({ type: 'SET_LOADING', loading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    let restored = 0
    try {
      const cartId = await ensureCart()
      let cart: ShopifyCart | null = null
      for (const item of items) {
        try {
          cart = await shopifyAddToCart(cartId, item.variantId, item.quantity)
          restored++
        } catch (err) {
          // One bad/deleted variant (product since removed or out of
          // stock) shouldn't block the rest of the restore.
          console.error('[Cart] restoreItems: failed to add', item.variantId, err)
        }
      }
      if (cart) {
        const { lines, total, qty, currencyCode } = applyCart(cart, country)
        dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode })
        safeSet(CART_LINES_KEY, JSON.stringify(lines))
        safeSet(CART_CURRENCY_KEY, currencyCode)
        dispatch({ type: 'SET_OPEN', open: true })
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: 'Could not restore your saved cart. Please try again.' })
      console.error('[Cart] restoreItems:', err)
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
    return restored
  }, [ensureCart, country])

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
      restoreItems,
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