// src/components/MarketGuard.tsx
'use client'

/**
 * DUAL MARKET (Sep 2026)
 * ----------------------
 * Wraps the buy area of a product page. Between August and now this was an
 * inert pass-through, because the site had collapsed to a single market.
 *
 * It is a real guard again, with one important difference from the original
 * version it replaces: it does NOT hide the product. A UK visitor gets the
 * whole page — title, description, COA data, purity, schema, related
 * content — and only the purchase control is swapped for a launch-list
 * capture. Hiding UK-visible content would defeat the reason for ranking in
 * the UK before fulfilment exists.
 *
 * The email lands in the existing notify store (POST /api/notify) keyed by
 * the product slug, so the admin dashboard shows exactly which compounds UK
 * researchers are asking for. That is the single most useful thing to know
 * when deciding what to hold in a UK opening order.
 */

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useCountry } from '@/lib/countryContext'
import { isInMarket } from '@/lib/pricing'
import { trackUkWaitlist } from '@/lib/analytics'
import { useCustomer } from '@/lib/customerContext'

interface Props {
  tags: string[]
  children: React.ReactNode
  /** Product slug, used to key UK interest per compound. */
  productSlug?: string
  /** Product name, used in the admin alert email. */
  productName?: string
}

export default function MarketGuard({
  tags,
  children,
  productSlug,
  productName,
}: Props) {
  const { country, ready } = useCountry()
  const [email, setEmail] = useState('')
  const { email: customerEmail } = useCustomer()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  // AUTOFILL: prefill for a signed-in customer.
  useEffect(() => {
    if (customerEmail && !email) setEmail(customerEmail)
  }, [customerEmail, email])

  // Until the country resolves, render the buy area. Showing the purchase
  // control and then replacing it is a better failure mode than hiding it
  // from a UAE customer for a few hundred milliseconds on every product page.
  if (!ready) return <>{children}</>

  if (isInMarket(tags, country)) return <>{children}</>

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'loading' || status === 'done') return
    setStatus('loading')
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          // Prefixed so UK launch interest is distinguishable from genuine
          // back-in-stock requests in the notify store and admin dashboard.
          productSlug: `uk-launch:${productSlug || 'general'}`,
          productName: `UK launch interest — ${productName || 'catalogue'}`,
        }),
      })
      if (!res.ok) throw new Error('failed')
      trackUkWaitlist('product_guard', productSlug)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        border: '1px solid rgba(0,0,0,.1)',
        borderRadius: 16,
        padding: 24,
        background: '#FAFAF8',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: 'rgba(0,0,0,.45)',
          marginBottom: 10,
        }}
      >
        United Kingdom
      </div>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: '#101010',
          margin: '0 0 6px',
          fontWeight: 600,
        }}
      >
        Not yet dispatching to the UK.
      </p>

      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.7,
          color: 'rgba(0,0,0,.6)',
          margin: '0 0 18px',
        }}
      >
        PepcoLab currently ships from the UAE only. UK supply is in
        preparation — add your email and we will tell you the day this
        compound is available for UK dispatch, with GBP pricing and UK
        delivery times. No other email, and nothing until then.
      </p>

      {status === 'done' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: '#3B6D11',
            background: '#EAF3DE',
            border: '0.5px solid #D3E8BE',
            borderRadius: 12,
            padding: '13px 18px',
          }}
        >
          <CheckCircle size={16} />
          You are on the UK list. We will be in touch at launch.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address for the UK launch list"
            style={{
              flex: 1,
              minWidth: 180,
              height: 46,
              padding: '0 14px',
              border: '1px solid #DDE3F0',
              borderRadius: 12,
              background: '#fff',
              fontSize: 14,
              color: '#101010',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              height: 46,
              padding: '0 22px',
              borderRadius: 12,
              border: 'none',
              background: '#101010',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
            Join the UK list
          </button>
        </form>
      )}

      {status === 'error' && (
        <p style={{ fontSize: 12.5, color: '#B3261E', margin: '8px 0 0' }}>
          Something went wrong. Please try again, or email hello@pepcolab.com.
        </p>
      )}

      <p style={{ fontSize: 12, color: 'rgba(0,0,0,.45)', margin: '14px 0 0', lineHeight: 1.6 }}>
        <Link href="/uk" style={{ color: '#101010', textDecoration: 'underline' }}>
          More on the UK launch
        </Link>{' '}
        — what we ship, how it is tested, and what changes at UK release.
      </p>
    </div>
  )
}