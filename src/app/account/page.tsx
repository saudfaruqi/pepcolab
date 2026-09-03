'use client'
// src/app/account/page.tsx
//
// CUSTOMER ACCOUNT — order history and one-tap reorder.
//
// WHY THIS PAGE IS THE HIGHEST-VALUE THING ON THE SITE
// Research compounds are a consumable. The same buyer reorders every few
// weeks for years, or they drift to whoever makes it easiest. Before this
// page existed, a returning customer had to remember which compound, which
// format and which strength they bought, find each one in the catalogue, and
// rebuild the cart by hand. Every competitor who offers one tap wins that
// comparison without the customer consciously making it.
//
// REORDER IMPLEMENTATION
// Uses cartContext.restoreItems() — the same bulk-add already built for
// abandoned-cart restore links, so there is no second code path to keep
// correct. It returns how many lines actually landed, which matters: a
// compound may have been discontinued or gone out of stock since the
// original order, and telling the customer "3 of 4 items added" is far
// better than silently giving them a short cart they discover at checkout.
//
// Orders placed through a Payment Link have no variantId (see OrderRecord),
// so those lines genuinely cannot be rebuilt. Reorder is disabled for those
// with a reason shown, rather than offering a button that quietly does
// nothing.

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { useCart } from '@/lib/cartContext'
import { Loader2, Package, RotateCw, ExternalLink, LogOut, FileText } from 'lucide-react'

interface AccountOrder {
  orderShortCode: string
  status: string
  createdAt: string
  shippedAt: string | null
  carrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  currency: string
  total: number
  products: {
    title: string
    price: number
    quantity: number
    variantOptions: string[]
    variantId: string | null
  }[]
}

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

/** Customer-facing status wording. The internal states are implementation
 *  detail and several of them ("updated", "awaiting_payment_mark") would
 *  alarm or confuse someone reading their own order list.
 *
 *  "Shipped" appears only when a tracking number has actually been recorded
 *  against the order. It is never inferred from elapsed time — an order that
 *  claims to have shipped when nothing knows whether it has is the kind of
 *  detail that costs a customer's trust exactly once. No tracking logged
 *  means the order reads as Confirmed, which remains true either way. */
function statusLabel(o: AccountOrder): { label: string; color: string; tint: string } {
  if (o.trackingNumber) return { label: 'Shipped', color: '#0A7B45', tint: 'rgba(10,123,69,.1)' }
  switch (o.status) {
    case 'created':
    case 'updated':
    case 'processing':
      return { label: 'Confirmed', color: '#0A7B45', tint: 'rgba(10,123,69,.1)' }
    case 'refunded':
      return { label: 'Refunded', color: '#4A4A4A', tint: 'rgba(13,13,13,.06)' }
    case 'failed':
    case 'chargeback':
      return { label: 'Payment issue', color: '#B91C1C', tint: 'rgba(185,28,28,.08)' }
    case 'abandoned':
      return { label: 'Not completed', color: '#4A4A4A', tint: 'rgba(13,13,13,.06)' }
    default:
      return { label: 'Received', color: '#8A6A1E', tint: 'rgba(200,153,42,.12)' }
  }
}

export default function AccountPage() {
  const router = useRouter()
  const { restoreItems, openCart } = useCart()

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [reordering, setReordering] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/account/orders')
      .then(async res => {
        if (res.status === 401) { router.replace('/account/login'); return null }
        return res.json()
      })
      .then(data => {
        if (cancelled || !data) return
        setEmail(data.email || '')
        setOrders(data.orders || [])
      })
      .catch(() => { if (!cancelled) setNotice('Could not load your orders. Please refresh.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [router])

  const reorder = useCallback(async (order: AccountOrder) => {
    const items = order.products
      .filter(p => p.variantId)
      .map(p => ({ variantId: p.variantId as string, quantity: p.quantity }))

    if (items.length === 0) {
      setNotice('This order can\u2019t be rebuilt automatically. Browse the catalogue, or message us and we\u2019ll set it up.')
      return
    }

    setReordering(order.orderShortCode)
    setNotice('')
    try {
      const added = await restoreItems(items)
      if (added === 0) {
        setNotice('None of those items are currently available. Message us and we\u2019ll find the closest match.')
      } else if (added < items.length) {
        // Partial restores are the common real-world case and the one most
        // likely to cause a bad surprise at checkout if left unsaid.
        setNotice(`Added ${added} of ${items.length} items \u2014 the rest are currently unavailable.`)
        openCart()
      } else {
        openCart()
      }
    } catch {
      setNotice('Something went wrong rebuilding that order. Please try again.')
    } finally {
      setReordering(null)
    }
  }, [restoreItems, openCart])

  const signOut = async () => {
    await fetch('/api/account/logout', { method: 'POST' })
    router.replace('/account/login')
  }

  return (
    <>
      <Nav />
      <main style={{ background: PAPER, minHeight: '70vh', padding: 'clamp(32px,5vw,56px) 20px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 700, letterSpacing: '-.03em', color: INK, margin: '0 0 6px' }}>
                Your orders
              </h1>
              {email && <p style={{ fontSize: 13.5, color: 'rgba(13,13,13,.5)', margin: 0 }}>{email}</p>}
            </div>
            <button onClick={signOut}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, minHeight: 40, padding: '0 14px',
                      borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
                      fontSize: 13, fontWeight: 600, color: 'rgba(13,13,13,.6)', cursor: 'pointer', flexShrink: 0,
                    }}>
              <LogOut size={14} aria-hidden="true" /> Sign out
            </button>
          </div>

          {notice && (
            <div role="status" style={{
              background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
              padding: '13px 16px', fontSize: 13.5, color: INK, marginBottom: 18,
            }}>
              {notice}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'rgba(13,13,13,.5)' }}>
              <Loader2 size={17} className="animate-spin" aria-hidden="true" /> Loading your orders…
            </div>
          ) : orders.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 36, textAlign: 'center' }}>
              <Package size={24} style={{ color: 'rgba(13,13,13,.3)', marginBottom: 12 }} aria-hidden="true" />
              <p style={{ fontSize: 15, color: INK, fontWeight: 600, margin: '0 0 6px' }}>No orders yet</p>
              <p style={{ fontSize: 13.5, color: 'rgba(13,13,13,.55)', margin: '0 0 20px' }}>
                Once you order, everything shows up here — including the certificate for each batch you receive.
              </p>
              <Link href="/products" style={{
                display: 'inline-block', background: INK, color: '#fff', padding: '13px 24px',
                borderRadius: 999, textDecoration: 'none', fontSize: 13.5, fontWeight: 700,
              }}>
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {orders.map(order => {
                const s = statusLabel(order)
                const canReorder = order.products.some(p => p.variantId)
                return (
                  <div key={order.orderShortCode}
                       style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: 'clamp(18px,3vw,24px)' }}>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                        color: s.color, background: s.tint, padding: '6px 13px', borderRadius: 999,
                      }}>{s.label}</span>
                      <span style={{ fontFamily: "'SF Mono',Consolas,monospace", fontSize: 12, color: 'rgba(13,13,13,.45)' }}>
                        {order.orderShortCode}
                      </span>
                      <span style={{ fontSize: 12.5, color: 'rgba(13,13,13,.45)', marginLeft: 'auto' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: 7, marginBottom: 16 }}>
                      {order.products.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5 }}>
                          <span style={{ color: INK }}>
                            {p.title}
                            {p.variantOptions?.length > 0 && (
                              <span style={{ color: 'rgba(13,13,13,.45)' }}> · {p.variantOptions.join(', ')}</span>
                            )}
                            {p.quantity > 1 && <span style={{ color: 'rgba(13,13,13,.45)' }}> × {p.quantity}</span>}
                          </span>
                          <span style={{ color: 'rgba(13,13,13,.55)', whiteSpace: 'nowrap' }}>
                            {order.currency} {(p.price * p.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 8, marginTop: 3, fontSize: 13.5, fontWeight: 700, color: INK }}>
                        <span>Total</span>
                        <span>{order.currency} {order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div style={{
                        background: PAPER, border: `1px solid ${BORDER}`, borderRadius: 12,
                        padding: '12px 14px', marginBottom: 14,
                      }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.4)', marginBottom: 5 }}>
                          {order.carrier ? `Tracking · ${order.carrier}` : 'Tracking'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: "'SF Mono',Consolas,monospace", fontSize: 13, fontWeight: 700, color: INK }}>
                            {order.trackingNumber}
                          </span>
                          {order.trackingUrl && (
                            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                               style={{ fontSize: 12.5, fontWeight: 600, color: INK, textDecoration: 'underline' }}>
                              Track with carrier
                            </a>
                          )}
                        </div>
                        {order.shippedAt && (
                          <div style={{ fontSize: 11.5, color: 'rgba(13,13,13,.45)', marginTop: 5 }}>
                            Shipped {new Date(order.shippedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        onClick={() => reorder(order)}
                        disabled={!canReorder || reordering === order.orderShortCode}
                        title={canReorder ? undefined : 'This order was placed through a payment link and can\u2019t be rebuilt automatically'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 20px',
                          borderRadius: 999, border: 'none',
                          background: canReorder ? INK : 'rgba(13,13,13,.12)',
                          color: canReorder ? '#fff' : 'rgba(13,13,13,.4)',
                          fontSize: 13.5, fontWeight: 700,
                          cursor: canReorder && reordering !== order.orderShortCode ? 'pointer' : 'not-allowed',
                        }}>
                        {reordering === order.orderShortCode
                          ? <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                          : <RotateCw size={15} aria-hidden="true" />}
                        Reorder
                      </button>

                      <Link href="/certificates"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7, minHeight: 44, padding: '0 18px',
                              borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
                              fontSize: 13.5, fontWeight: 600, color: INK, textDecoration: 'none',
                            }}>
                        <FileText size={15} aria-hidden="true" /> Batch certificates
                      </Link>

                      <Link href={`/track-order?code=${encodeURIComponent(order.orderShortCode)}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7, minHeight: 44, padding: '0 18px',
                              borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
                              fontSize: 13.5, fontWeight: 600, color: INK, textDecoration: 'none',
                            }}>
                        <ExternalLink size={14} aria-hidden="true" /> Order details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}