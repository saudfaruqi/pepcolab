// src/lib/metaPixel.ts
//
// Browser half of Meta tracking. The Pixel itself is loaded by
// components/MetaPixel.tsx, only after marketing consent, only when
// NEXT_PUBLIC_META_PIXEL_ID is set. These helpers are safe to call anywhere:
// with no consent or no Pixel they do nothing.
//
// WHAT IS SENT, AND WHAT IS DELIBERATELY NOT
// PageView and Lead only. No ViewContent, AddToCart or Purchase: Meta
// classifies this site's data as health and wellness and blocks those for
// optimisation anyway, and sending product-level events about research
// compounds is the part of a data source that gets it restricted. The ads
// plan optimises for Lead.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

type Fbq = (...args: unknown[]) => void

function fbq(): Fbq | null {
  if (typeof window === 'undefined') return null
  const f = (window as unknown as { fbq?: Fbq }).fbq
  return typeof f === 'function' ? f : null
}

/** Random id shared by the browser and server copies of an event so Meta de-duplicates them. */
export function newEventId(prefix = 'ev'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${rand}`
}

export function trackMetaLead(eventId: string, params: { content_name?: string } = {}): void {
  fbq()?.('track', 'Lead', params, { eventID: eventId })
}

/** The _fbp / _fbc cookies the Pixel sets — passed to the server for matching. */
export function readMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {}
  const out: { fbp?: string; fbc?: string } = {}
  for (const part of document.cookie.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === '_fbp') out.fbp = decodeURIComponent(v.join('='))
    if (k === '_fbc') out.fbc = decodeURIComponent(v.join('='))
  }
  return out
}
