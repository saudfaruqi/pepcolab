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
  getCartCheckoutUrl,
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
    default:
      return state
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const CART_ID_KEY       = 'pepcolab_cart_id'
const CART_LINES_KEY    = 'pepcolab_cart_lines'
const CART_CURRENCY_KEY = 'pepcolab_cart_currency'

function safeLocalGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeLocalSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch {}
}
function safeLocalRemove(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

function mapShopifyLine(node: ShopifyCartLine): CartLine {
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

function computeTotals(lines: CartLine[]) {
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const qty   = lines.reduce((s, l) => s + l.quantity, 0)
  return { total, qty }
}

function applyCart(cart: ShopifyCart): {
  lines: CartLine[]
  total: number
  qty: number
  currencyCode: string
} {
  const lines         = cart.lines.edges.map(({ node }) => mapShopifyLine(node))
  const subtotalMoney = cart.cost.subtotalAmount ?? cart.cost.totalAmount
  const total         = parseFloat(subtotalMoney.amount)
  const qty           = cart.totalQuantity
  const currencyCode  = subtotalMoney.currencyCode ?? cart.cost.totalAmount.currencyCode ?? 'AED'
  return { lines, total, qty, currencyCode }
}

// ─── Context ───────────────────────────────────────────────────────────────

interface CartCtx extends CartState {
  addItem: (
    variantId: string,
    title: string,
    variantTitle: string,
    price: number,
    slug: string,
    image?: string
  ) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  updateQty: (lineId: string, qty: number) => Promise<void>
  openCart: () => void
  closeCart: () => void
  checkout: () => Promise<void>
  clearError: () => void
}

const CartContext = createContext<CartCtx | null>(null)

// ─── Provider ──────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, init)

  // Must be called at the top level of the component, not inside effects
  const { country, ready } = useCountry()

  // Initialise from localStorage and rehydrate from Shopify on mount.
  // Also updates cart buyer identity so Shopify returns the correct currency.
  useEffect(() => {
    const storedId       = safeLocalGet(CART_ID_KEY)
    const storedLines    = safeLocalGet(CART_LINES_KEY)
    const storedCurrency = safeLocalGet(CART_CURRENCY_KEY)

    // Fast first paint from cache
    if (storedLines) {
      try {
        const lines: CartLine[] = JSON.parse(storedLines)
        const { total, qty } = computeTotals(lines)
        dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode: storedCurrency ?? undefined })
      } catch {}
    }

    if (storedId) {
      dispatch({ type: 'SET_CART_ID', cartId: storedId })

      // Rehydrate — also update buyer identity so the currency flips to the
      // detected country (e.g. AED → GBP when the visitor is in the UK).
      shopifyGetCart(storedId).then(async cart => {
        if (cart) {
          // Re-apply country context in case it changed since cart was created
          try {
            const updated = await updateCartBuyerIdentity(storedId, country)
            const { lines, total, qty, currencyCode } = applyCart(updated)
            dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode })
            safeLocalSet(CART_LINES_KEY, JSON.stringify(lines))
            safeLocalSet(CART_CURRENCY_KEY, currencyCode)
          } catch {
            // Identity update failed — at least apply what we already fetched
            const { lines, total, qty, currencyCode } = applyCart(cart)
            dispatch({ type: 'SET_LINES', lines, total, qty, currencyCode })
            safeLocalSet(CART_LINES_KEY, JSON.stringify(lines))
            safeLocalSet(CART_CURRENCY_KEY, currencyCode)
          }
        } else {
          // Cart expired / invalid — clear everything
          safeLocalRemove(CART_ID_KEY)
          safeLocalRemove(CART_LINES_KEY)
          safeLocalRemove(CART_CURRENCY_KEY)
          dispatch({ type: 'SET_CART_ID', cartId: '' })
          dispatch({ type: 'SET_LINES', lines: [], total: 0, qty: 0 })
        }
      })
    }
  // Re-run when country resolves (async detection means it may start as 'AE')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, ready])

  // Persist lines to localStorage whenever they change
  useEffect(() => {
    if (state.lines.length > 0) {
      safeLocalSet(CART_LINES_KEY, JSON.stringify(state.lines))
    }
  }, [state.lines])

  // Persist currency whenever it changes
  useEffect(() => {
    if (state.currencyCode) {
      safeLocalSet(CART_CURRENCY_KEY, state.currencyCode)
    }
  }, [state.currencyCode])

  // Ensure a cart exists and return its ID.
  // Creates a new cart with the buyer's country so pricing is correct from the start.
  const ensureCart = useCallback(async (): Promise<string> => {
    if (state.cartId) return state.cartId

    const stored = safeLocalGet(CART_ID_KEY)
    if (stored) {
      dispatch({ type: 'SET_CART_ID', cartId: stored })
      return stored
    }

    const id = await shopifyCreateCart(country)
    safeLocalSet(CART_ID_KEY, id)
    dispatch({ type: 'SET_CART_ID', cartId: id })
    return id
  }, [state.cartId, country])

  // ── addItem ──────────────────────────────────────────────────────────────

  const addItem = useCallback(
    async (
      variantId: string,
      title: string,
      variantTitle: string,
      price: number,
      slug: string,
      image?: string
    ) => {
      dispatch({ type: 'SET_LOADING', loading: true })
      dispatch({ type: 'SET_ERROR', error: null })

      // Optimistic update
      const existing = state.lines.find(l => l.variantId === variantId)
      const optimisticLines: CartLine[] = existing
        ? state.lines.map(l =>
            l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l
          )
        : [
            ...state.lines,
            {
              id: `optimistic-${Date.now()}`,
              quantity: 1,
              variantId,
              title,
              variantTitle,
              price,
              slug,
              image,
            },
          ]
      const { total, qty } = computeTotals(optimisticLines)
      dispatch({ type: 'SET_LINES', lines: optimisticLines, total, qty })
      dispatch({ type: 'SET_OPEN', open: true })

      try {
        const cartId = await ensureCart()
        const cart   = await shopifyAddToCart(cartId, variantId, 1)
        const { lines, total: realTotal, qty: realQty, currencyCode } = applyCart(cart)
        dispatch({ type: 'SET_LINES', lines, total: realTotal, qty: realQty, currencyCode })
        safeLocalSet(CART_LINES_KEY, JSON.stringify(lines))
        safeLocalSet(CART_CURRENCY_KEY, currencyCode)
      } catch (err) {
        // Roll back optimistic update
        const { total: prevTotal, qty: prevQty } = computeTotals(state.lines)
        dispatch({ type: 'SET_LINES', lines: state.lines, total: prevTotal, qty: prevQty })
        dispatch({ type: 'SET_ERROR', error: 'Could not add item. Please try again.' })
        console.error('[Cart] addItem error:', err)
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false })
      }
    },
    [ensureCart, state.lines]
  )

  // ── removeItem ───────────────────────────────────────────────────────────

  const removeItem = useCallback(
    async (lineId: string) => {
      dispatch({ type: 'SET_LOADING', loading: true })
      dispatch({ type: 'SET_ERROR', error: null })

      const prevLines = state.lines
      const newLines  = state.lines.filter(l => l.id !== lineId)
      const { total, qty } = computeTotals(newLines)
      dispatch({ type: 'SET_LINES', lines: newLines, total, qty })

      try {
        if (!lineId.startsWith('optimistic-') && state.cartId) {
          const cart = await shopifyRemove(state.cartId, [lineId])
          const { lines, total: realTotal, qty: realQty, currencyCode } = applyCart(cart)
          dispatch({ type: 'SET_LINES', lines, total: realTotal, qty: realQty, currencyCode })
          safeLocalSet(CART_LINES_KEY, JSON.stringify(lines))
          safeLocalSet(CART_CURRENCY_KEY, currencyCode)
        }
      } catch (err) {
        const { total: prevTotal, qty: prevQty } = computeTotals(prevLines)
        dispatch({ type: 'SET_LINES', lines: prevLines, total: prevTotal, qty: prevQty })
        dispatch({ type: 'SET_ERROR', error: 'Could not remove item. Please try again.' })
        console.error('[Cart] removeItem error:', err)
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false })
      }
    },
    [state.cartId, state.lines]
  )

  // ── updateQty ────────────────────────────────────────────────────────────

  const updateQty = useCallback(
    async (lineId: string, qty: number) => {
      if (qty < 1) return removeItem(lineId)

      dispatch({ type: 'SET_LOADING', loading: true })
      dispatch({ type: 'SET_ERROR', error: null })

      const prevLines = state.lines
      const newLines  = state.lines.map(l => (l.id === lineId ? { ...l, quantity: qty } : l))
      const { total, qty: totalQty } = computeTotals(newLines)
      dispatch({ type: 'SET_LINES', lines: newLines, total, qty: totalQty })

      try {
        if (!lineId.startsWith('optimistic-') && state.cartId) {
          const cart = await shopifyUpdateLine(state.cartId, lineId, qty)
          const { lines, total: realTotal, qty: realQty, currencyCode } = applyCart(cart)
          dispatch({ type: 'SET_LINES', lines, total: realTotal, qty: realQty, currencyCode })
          safeLocalSet(CART_LINES_KEY, JSON.stringify(lines))
          safeLocalSet(CART_CURRENCY_KEY, currencyCode)
        }
      } catch (err) {
        const { total: prevTotal, qty: prevQty } = computeTotals(prevLines)
        dispatch({ type: 'SET_LINES', lines: prevLines, total: prevTotal, qty: prevQty })
        dispatch({ type: 'SET_ERROR', error: 'Could not update quantity.' })
        console.error('[Cart] updateQty error:', err)
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false })
      }
    },
    [removeItem, state.cartId, state.lines]
  )

  // ── checkout ─────────────────────────────────────────────────────────────

  const checkout = useCallback(async () => {
    if (!state.cartId || state.lines.length === 0) return
    dispatch({ type: 'SET_LOADING', loading: true })
    try {
      const url = await getCartCheckoutUrl(state.cartId)
      window.location.href = url
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: 'Could not start checkout. Please try again.' })
      console.error('[Cart] checkout error:', err)
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false })
    }
  }, [state.cartId, state.lines])

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQty,
        openCart:   () => dispatch({ type: 'SET_OPEN', open: true }),
        closeCart:  () => dispatch({ type: 'SET_OPEN', open: false }),
        checkout,
        clearError: () => dispatch({ type: 'SET_ERROR', error: null }),
      }}
    >
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