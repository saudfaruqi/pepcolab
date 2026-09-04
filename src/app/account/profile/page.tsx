'use client'
// src/app/account/profile/page.tsx
//
// The customer's own record: who we have them as, where we last shipped, what
// they've bought, and how to reach us.
//
// WHY THIS IS READ-MOSTLY, AND WHY THAT IS THE RIGHT CALL
// Everything here originates from an order placed through STRABL — name,
// email and address are captured at checkout on STRABL's side, not ours. If
// this page let a customer edit their address, they'd reasonably expect the
// next order to ship there, and it wouldn't: the next checkout would ask
// STRABL for the address again and ignore whatever was saved here.
//
// A form that silently doesn't do what it appears to do is worse than no
// form. So this page shows what we hold, says plainly where it came from, and
// gives a real route to change it. When STRABL exposes customer prefill (see
// lib/useStrablCheckout.ts), editable fields become honest and belong here.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AccountTabs from '@/components/AccountTabs'
import { useCustomer } from '@/lib/customerContext'
import { Loader2, LogOut, Mail, MessageCircle, Package, MapPin, Star } from 'lucide-react'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

interface Address {
  line1: string; line2: string; city: string; postalCode: string; countryCode: string
}
interface AccountOrder {
  orderShortCode: string
  createdAt: string
  currency: string
  total: number
  shippingAddress: Address | null
  products: { title: string; quantity: number }[]
}

const card: React.CSSProperties = {
  background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18,
  padding: 'clamp(20px,3vw,26px)', marginBottom: 14,
}
const cardTitle: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, letterSpacing: '-.015em', color: INK,
  margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8,
}
const row: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', gap: 16,
  padding: '9px 0', borderTop: `1px solid ${BORDER}`, fontSize: 14,
}
const key: React.CSSProperties = { color: 'rgba(13,13,13,.5)', flexShrink: 0 }
const val: React.CSSProperties = { color: INK, textAlign: 'right', wordBreak: 'break-word' }

export default function ProfilePage() {
  const router = useRouter()
  const { email, name, firstName } = useCustomer()

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<AccountOrder[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/account/orders')
      .then(async res => {
        if (res.status === 401) { router.replace('/account/login'); return null }
        return res.json()
      })
      .then(d => { if (!cancelled && d) setOrders(d.orders || []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [router])

  const signOut = async () => {
    await fetch('/api/account/logout', { method: 'POST' })
    router.replace('/')
  }

  // Most recent order that actually carried an address — an order can be
  // missing one if it predates address storage, so take the newest that has it
  // rather than assuming the newest order does.
  const lastAddress = orders.find(o => o.shippingAddress)?.shippingAddress ?? null
  const totalSpend = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const currency = orders[0]?.currency || 'AED'
  const firstOrder = orders.length ? orders[orders.length - 1] : null

  // Compounds ordered more than once — the most genuinely useful thing this
  // page can tell someone, because it is what they will reorder.
  const counts = new Map<string, number>()
  for (const o of orders) {
    for (const p of o.products || []) {
      counts.set(p.title, (counts.get(p.title) || 0) + (p.quantity || 1))
    }
  }
  const repeats = [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <>
      <Nav />
      <main style={{ background: PAPER, minHeight: '70vh', padding: 'clamp(32px,5vw,56px) 20px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 700, letterSpacing: '-.03em', color: INK, margin: '0 0 6px' }}>
            {firstName ? `Hello, ${firstName}` : 'Your profile'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(13,13,13,.5)', margin: '0 0 24px' }}>
            What we hold on file, and how to change it.
          </p>

          <AccountTabs />

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 40, color: 'rgba(13,13,13,.5)' }}>
              <Loader2 size={17} className="animate-spin" aria-hidden="true" /> Loading your profile…
            </div>
          ) : (
            <>
              <div style={card}>
                <h2 style={cardTitle}>Your details</h2>
                <div style={{ ...row, borderTop: 'none', paddingTop: 0 }}>
                  <span style={key}>Name</span>
                  <span style={val}>{name || <em style={{ color: 'rgba(13,13,13,.35)' }}>not on file</em>}</span>
                </div>
                <div style={row}><span style={key}>Email</span><span style={val}>{email}</span></div>
                {firstOrder && (
                  <div style={row}>
                    <span style={key}>Customer since</span>
                    <span style={val}>
                      {new Date(firstOrder.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(13,13,13,.45)', margin: '14px 0 0' }}>
                  These come from your most recent order. To change them, use the details on
                  your next checkout, or message us and we&apos;ll update it.
                </p>
              </div>

              <div style={card}>
                <h2 style={cardTitle}><MapPin size={16} aria-hidden="true" /> Last delivery address</h2>
                {lastAddress ? (
                  <address style={{ fontStyle: 'normal', fontSize: 14, lineHeight: 1.75, color: INK }}>
                    {[lastAddress.line1, lastAddress.line2].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
                    <div>{[lastAddress.city, lastAddress.postalCode].filter(Boolean).join(' ')}</div>
                    <div style={{ color: 'rgba(13,13,13,.5)' }}>{lastAddress.countryCode}</div>
                  </address>
                ) : (
                  <p style={{ fontSize: 14, color: 'rgba(13,13,13,.5)', margin: 0 }}>
                    No address on file yet — it&apos;s saved from your first order.
                  </p>
                )}
                <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(13,13,13,.45)', margin: '14px 0 0' }}>
                  Shipping to somewhere new? Enter the new address at checkout &mdash; it&apos;s
                  collected there each time, so nothing here needs changing first.
                </p>
              </div>

              <div style={card}>
                <h2 style={cardTitle}><Package size={16} aria-hidden="true" /> Ordering summary</h2>
                <div style={{ ...row, borderTop: 'none', paddingTop: 0 }}>
                  <span style={key}>Orders placed</span><span style={val}>{orders.length}</span>
                </div>
                <div style={row}>
                  <span style={key}>Total</span>
                  <span style={val}>{currency} {totalSpend.toFixed(2)}</span>
                </div>
                {repeats.length > 0 && (
                  <div style={{ ...row, display: 'block' }}>
                    <div style={{ ...key, marginBottom: 8 }}>Ordered more than once</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {repeats.map(([title, n]) => (
                        <span key={title} style={{
                          fontSize: 12.5, fontWeight: 600, color: INK,
                          border: `1px solid ${BORDER}`, borderRadius: 999, padding: '6px 12px',
                        }}>
                          {title} × {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <Link href="/account" style={{
                  display: 'inline-flex', alignItems: 'center', minHeight: 42, padding: '0 18px',
                  marginTop: 16, borderRadius: 999, background: INK, color: '#fff',
                  fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
                }}>
                  View orders &amp; reorder
                </Link>
              </div>

              <div style={card}>
                <h2 style={cardTitle}><Star size={16} aria-hidden="true" /> Share your experience</h2>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 14px' }}>
                  A review from someone who has actually received an order is worth more than
                  anything we can say about ourselves. You can post under your name, your
                  initials, or anonymously.
                </p>
                <Link href="/reviews/write" style={{
                  display: 'inline-flex', alignItems: 'center', minHeight: 42, padding: '0 18px',
                  borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
                  color: INK, fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                }}>
                  Write a review
                </Link>
              </div>

              <div style={card}>
                <h2 style={cardTitle}>Need something changed?</h2>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 14px' }}>
                  Name, email, address, or removing your data entirely &mdash; a person handles
                  all of it, usually the same day.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <a href="mailto:hello@pepcolab.com" style={{
                    display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, padding: '0 16px',
                    borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
                    color: INK, fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <Mail size={15} aria-hidden="true" /> hello@pepcolab.com
                  </a>
                  <Link href="/contact" style={{
                    display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, padding: '0 16px',
                    borderRadius: 999, border: `1px solid ${BORDER}`, background: '#fff',
                    color: INK, fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <MessageCircle size={15} aria-hidden="true" /> Contact form
                  </Link>
                </div>
              </div>

              <button onClick={signOut} style={{
                display: 'flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 18px',
                borderRadius: 999, border: `1px solid ${BORDER}`, background: 'transparent',
                fontSize: 13.5, fontWeight: 600, color: 'rgba(13,13,13,.6)', cursor: 'pointer',
              }}>
                <LogOut size={15} aria-hidden="true" /> Sign out
              </button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}