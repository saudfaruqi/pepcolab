// src/components/ReferralWidget.tsx
'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { Copy, Check, Loader2, Gift } from 'lucide-react'
import { whatsAppReferralShareLink, isWhatsAppConfigured } from '@/lib/whatsapp'

interface ReferralResult {
  code: string
  referralUrl: string
  friendDiscountPercent: number
  rewardPercent: number
}

const STORAGE_KEY = 'pepcolab_referral'

export default function ReferralWidget() {
  const searchParams = useSearchParams()
  const incomingRef = searchParams?.get('ref')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReferralResult | null>(null)
  const [copied, setCopied] = useState(false)

  // If someone arrives via a friend's link, remember it locally so the
  // cart/checkout page can offer to pre-fill it as a discount code — this
  // widget itself is for the REFERRER (generating their own code), so we
  // just persist the incoming code here rather than acting on it directly.
  useEffect(() => {
    if (incomingRef) {
      try {
        localStorage.setItem(STORAGE_KEY, incomingRef.toUpperCase())
      } catch {
        // localStorage can throw in private/incognito contexts — non-critical, safe to ignore
      }
    }
  }, [incomingRef])

  // Restore a previously-generated code from this browser so returning
  // visitors see their card again instead of an empty form.
  useEffect(() => {
    try {
      const cached = localStorage.getItem('pepcolab_my_referral')
      if (cached) setResult(JSON.parse(cached))
    } catch {
      // ignore
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }
      setResult(data)
      try {
        localStorage.setItem('pepcolab_my_referral', JSON.stringify(data))
      } catch {
        // ignore
      }
    } catch {
      setError('Connection issue — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard?.writeText(result.referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (result) {
    return (
      <div className="border border-neutral-200 rounded-3xl p-8 md:p-10 bg-white">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF2FF] flex items-center justify-center mb-5">
          <Gift size={20} color="#1A56DB" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-950 mb-2">Your referral code is ready</h3>
        <p className="text-neutral-600 mb-6">
          Share it — friends get <strong>{result.friendDiscountPercent}% off</strong> their first order, and you get{' '}
          <strong>{result.rewardPercent}% off</strong> yours, every time.
        </p>

        <div className="flex items-center gap-2 bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl px-5 py-4 mb-4">
          <span className="font-mono text-lg font-extrabold tracking-wide text-neutral-950 flex-1">{result.code}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        <p className="text-xs text-neutral-500 break-all mb-6">{result.referralUrl}</p>

        {isWhatsAppConfigured() && (
          <a
            href={whatsAppReferralShareLink(result.referralUrl, result.friendDiscountPercent)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full text-sm font-bold py-3.5 rounded-full text-white"
            style={{ background: '#25D366' }}
          >
            Share on WhatsApp
          </a>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-neutral-200 rounded-3xl p-8 md:p-10 bg-white">
      <div className="w-12 h-12 rounded-2xl bg-[#EBF2FF] flex items-center justify-center mb-5">
        <Gift size={20} color="#1A56DB" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-950 mb-2">Get your referral link</h3>
      <p className="text-neutral-600 mb-6">Takes 10 seconds — we'll email your code too.</p>

      <div className="space-y-3 mb-4">
        <input
          type="text"
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-sm px-4 py-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#1A56DB] bg-neutral-50"
        />
        <input
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full text-sm px-4 py-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#1A56DB] bg-neutral-50"
        />
      </div>

      {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 w-full text-sm font-bold py-3.5 rounded-full text-white bg-neutral-950 hover:bg-neutral-800 transition-colors disabled:opacity-60"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? 'Generating…' : 'Get my referral link'}
      </button>
    </form>
  )
}
