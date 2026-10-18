'use client'
// src/components/MetaPixel.tsx
//
// Loads the Meta Pixel ONLY when (a) NEXT_PUBLIC_META_PIXEL_ID is set and
// (b) the visitor accepted marketing cookies (lib/consent.ts). Sends a
// PageView on load and on each client-side navigation. Never runs on /admin.
// Lead events are fired from the /learn form (lib/metaPixel.ts).
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CONSENT_EVENT, hasMarketingConsent } from '@/lib/consent'
import { META_PIXEL_ID } from '@/lib/metaPixel'

function loadPixel(id: string) {
  const w = window as any
  if (w.fbq) return
  /* Meta's standard base code, unminified. */
  const n: any = function (...args: unknown[]) {
    n.callMethod ? n.callMethod(...args) : n.queue.push(args)
  }
  w.fbq = n
  if (!w._fbq) w._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)
  w.fbq('init', id)
}

export default function MetaPixel() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    const check = () => setEnabled(Boolean(META_PIXEL_ID) && hasMarketingConsent())
    check()
    window.addEventListener(CONSENT_EVENT, check)
    return () => window.removeEventListener(CONSENT_EVENT, check)
  }, [])

  useEffect(() => {
    if (!enabled || !pathname || pathname.startsWith('/admin')) return
    loadPixel(META_PIXEL_ID)
    if (lastTracked.current === pathname) return
    lastTracked.current = pathname
    ;(window as any).fbq('track', 'PageView')
  }, [enabled, pathname])

  return null
}
