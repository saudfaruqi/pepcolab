// src/lib/recentlyViewedContext.tsx
'use client'
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
  ReactNode,
} from 'react'

export interface RecentlyViewedItem {
  slug: string
  name: string
  mg: string
  price: number
  oldPrice?: number
  currencyCode?: string
  image?: string
  imageAlt?: string
  category?: string
  viewedAt: number
}

const STORAGE_KEY = 'pepcolab_recently_viewed'
const MAX_ITEMS = 12

function safeGet(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
function safeSet(items: RecentlyViewedItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

interface Ctx {
  items: RecentlyViewedItem[]
  hydrated: boolean
  record: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void
  clear: () => void
}

const RecentlyViewedContext = createContext<Ctx | null>(null)

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(safeGet())
    setHydrated(true)
  }, [])

  const record = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    setItems((prev) => {
      // Move-to-front on repeat views rather than duplicating, and cap the
      // list so it stays a "recent" rail and not an ever-growing history.
      const withoutThis = prev.filter((i) => i.slug !== item.slug)
      const next = [{ ...item, viewedAt: Date.now() }, ...withoutThis].slice(0, MAX_ITEMS)
      safeSet(next)
      return next
    })
  }, [])

  return (
    <RecentlyViewedContext.Provider
      value={{ items, hydrated, record, clear: () => { setItems([]); safeSet([]) } }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  )
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext)
  if (!ctx) throw new Error('useRecentlyViewed must be used inside <RecentlyViewedProvider>')
  return ctx
}

/**
 * Fire-and-forget PDP hook — call once per product page with the current
 * product's data. Guards against StrictMode/re-render double-firing with a
 * ref rather than putting `record` in the dependency array (record's
 * identity is stable via useCallback, but slug-keyed re-entry is what
 * actually matters here).
 */
export function useRecordRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'> | null) {
  const { record } = useRecentlyViewed()
  const lastSlug = useRef<string | null>(null)

  useEffect(() => {
    if (!item || lastSlug.current === item.slug) return
    lastSlug.current = item.slug
    record(item)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.slug])
}