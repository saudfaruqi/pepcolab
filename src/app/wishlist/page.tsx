// src/app/wishlist/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useWishlist, type WishlistItem } from '@/lib/wishlistContext'
import { useCart } from '@/lib/cartContext'
import { useCountry } from '@/lib/countryContext'
import { getProductByHandle } from '@/lib/shopify'
import { formatPrice, productHref } from '@/lib/utils'
import { isWhatsAppConfigured, whatsAppWishlistLink } from '@/lib/whatsapp'
import { Heart, ShoppingCart, Trash2, ArrowRight, MessageCircle, CheckCircle } from 'lucide-react'

export default function WishlistPage() {
  const { items, hydrated, remove, clear } = useWishlist()
  const { addItem } = useCart()
  const { country } = useCountry()

  // Wishlist items are stored as a snapshot (see wishlistContext.tsx) so the
  // list still renders instantly from localStorage. Once mounted, silently
  // refresh each item's live price/stock the same way ProductActions does
  // for AE→GB — a stale "in stock" badge on a saved item is worse than the
  // brief flash of updated data.
  const [live, setLive] = useState<Record<string, Partial<WishlistItem>>>({})
  const [movedSlug, setMovedSlug] = useState<string | null>(null)
  const [movingAll, setMovingAll] = useState(false)
  const [movedAll, setMovedAll] = useState(false)

  useEffect(() => {
    if (!hydrated || items.length === 0) return
    let cancelled = false
    Promise.all(
      items.map((item) =>
        getProductByHandle(item.slug, country)
          .then((fresh: any) => {
            if (!fresh) return null
            return [item.slug, {
              price: fresh.price,
              oldPrice: fresh.oldPrice,
              currencyCode: fresh.currencyCode,
              inStock: fresh.inStock,
              image: fresh.image ?? item.image,
              variantId: fresh.variantId ?? item.variantId,
            }] as const
          })
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return
      const next: Record<string, Partial<WishlistItem>> = {}
      for (const r of results) if (r) next[r[0]] = r[1]
      setLive(next)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, country, items.length])

  function resolved(item: WishlistItem): WishlistItem {
    return { ...item, ...live[item.slug] }
  }

  async function moveToCart(item: WishlistItem) {
    const r = resolved(item)
    await addItem(
      r.variantId ?? `gid://shopify/ProductVariant/${r.slug}`,
      r.name,
      r.mg,
      r.price,
      r.slug,
      r.image
    )
    remove(item.slug)
    setMovedSlug(item.slug)
    setTimeout(() => setMovedSlug(null), 1800)
  }

  async function moveAllToCart() {
    setMovingAll(true)
    for (const item of items) {
      const r = resolved(item)
      if (r.inStock === false) continue
      try {
        await addItem(
          r.variantId ?? `gid://shopify/ProductVariant/${r.slug}`,
          r.name,
          r.mg,
          r.price,
          r.slug,
          r.image
        )
      } catch {
        // Skip failures individually rather than aborting the whole batch —
        // one bad variant shouldn't block the rest of the list from moving.
      }
    }
    clear()
    setMovingAll(false)
    setMovedAll(true)
  }

  const resolvedItems = items.map(resolved)
  const whatsAppHref = whatsAppWishlistLink(resolvedItems)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Nav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">
              Saved Compounds
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Wishlist</h1>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={moveAllToCart}
                disabled={movingAll}
                className="h-10 px-4 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
              >
                {movingAll ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShoppingCart size={14} />
                )}
                Move all to cart
              </button>
              <button
                onClick={clear}
                className="h-10 px-4 rounded-full border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Clear wishlist
              </button>
            </div>
          )}
        </div>

        {movedAll && (
          <div className="bg-green-50 border border-green-200/60 rounded-xl px-5 py-3 mb-6 flex items-center gap-2.5 text-sm text-green-700 font-medium">
            <CheckCircle size={15} />
            Added available items to your cart.
          </div>
        )}

        {!hydrated ? null : items.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-100 py-20 px-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-pink-50/80 border border-pink-100/50 flex items-center justify-center mb-5">
              <Heart size={32} className="text-pink-400/60" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 max-w-[300px] leading-relaxed mb-6">
              Tap the heart on any product to save it here for later.
            </p>
            <Link
              href="/products"
              className="bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              Browse catalogue
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Saved items */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {resolvedItems.map((item) => (
                <div
                  key={item.slug}
                  className="bg-white rounded-xl p-4 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow flex gap-4"
                >
                  <Link
                    href={productHref(item.slug)}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-blue-50/50 border border-blue-100/30 flex items-center justify-center flex-shrink-0 overflow-hidden"
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="96px" className="object-contain p-2" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-blue-100/30" />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-1">
                        {item.category || 'Research Compound'}
                      </div>
                      <Link href={productHref(item.slug)} className="font-semibold text-gray-900 text-sm sm:text-base leading-tight hover:underline">
                        {item.name}
                      </Link>
                      <div className="text-xs text-gray-400">{item.mg}</div>
                      {item.inStock === false && (
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                          Out of stock
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 flex-shrink-0">
                      <div className="text-right">
                        {item.oldPrice && (
                          <div className="text-[11px] text-gray-300 line-through">
                            {formatPrice(item.oldPrice, item.currencyCode ?? 'AED')}
                          </div>
                        )}
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {formatPrice(item.price, item.currencyCode ?? 'AED')}
                        </span>
                      </div>

                      <button
                        onClick={() => moveToCart(item)}
                        disabled={item.inStock === false || movedSlug === item.slug}
                        aria-label={`Move ${item.name} to cart`}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                          movedSlug === item.slug
                            ? 'bg-green-600 text-white'
                            : item.inStock === false
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {movedSlug === item.slug ? <CheckCircle size={14} /> : <ShoppingCart size={14} />}
                      </button>

                      <button
                        onClick={() => remove(item.slug)}
                        aria-label={`Remove ${item.name} from wishlist`}
                        className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mt-2"
              >
                ← Continue shopping
              </Link>
            </div>

            {/* Side panel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Saved Items
              </h2>
              <div className="flex justify-between text-sm text-gray-600 mb-5">
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                <span>
                  {formatPrice(
                    resolvedItems.reduce((sum, i) => sum + i.price, 0),
                    resolvedItems[0]?.currencyCode ?? 'AED'
                  )}
                </span>
              </div>

              <button
                onClick={moveAllToCart}
                disabled={movingAll}
                className="w-full h-12 rounded-xl bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-gray-800 transition-all disabled:opacity-60"
              >
                {movingAll ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShoppingCart size={14} />
                )}
                Move all to cart
              </button>

              {isWhatsAppConfigured() && (
                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 mt-2.5 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ borderColor: '#C7ECD3', color: '#128C4A', background: '#F0FDF4', textDecoration: 'none' }}
                >
                  <MessageCircle size={15} />
                  Ask about these on WhatsApp
                </a>
              )}

              <p className="text-center text-[11px] text-gray-400 mt-4 leading-relaxed">
                Saved to this browser only. Sign in isn't required, but clearing
                your browser data will clear this list too.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}