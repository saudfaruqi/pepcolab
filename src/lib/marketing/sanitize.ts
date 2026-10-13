// src/lib/marketing/sanitize.ts
// Normalises a campaign coming from the admin editor before it is stored.
import type { AudienceSegment, AudienceSpec, Campaign, CampaignCta, CampaignOffer } from './types'

const SEGMENTS: AudienceSegment[] = ['buyers', 'non_buyers', 'all_customers', 'lapsed_buyers', 'bought_product', 'newsletter']

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : ''
}

function cta(v: any): CampaignCta | null {
  const label = str(v?.label, 60).trim()
  const url = str(v?.url, 500).trim()
  if (!label || !url) return null
  if (!url.startsWith('/') && !/^https:\/\//i.test(url)) return null
  return { label, url }
}

export function sanitizeAudience(v: any): AudienceSpec {
  const segment: AudienceSegment = SEGMENTS.includes(v?.segment) ? v.segment : 'buyers'
  const out: AudienceSpec = { segment }
  if (segment === 'lapsed_buyers') out.lapsedDays = Math.min(Math.max(Math.round(Number(v?.lapsedDays) || 45), 1), 730)
  if (segment === 'bought_product') out.productQuery = str(v?.productQuery, 60).trim()
  if (Array.isArray(v?.excludeEmails)) {
    out.excludeEmails = Array.from(
      new Set(
        v.excludeEmails
          .map((e: unknown) => str(e, 200).trim().toLowerCase())
          .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      )
    ) as string[]
  }
  return out
}

function offer(v: any): CampaignOffer | null {
  const code = str(v?.code, 40).trim().toUpperCase()
  const percent = Number(v?.percent)
  const expiresAt = str(v?.expiresAt, 40)
  if (!code || !/^[A-Z0-9-]{3,40}$/.test(code)) return null
  if (!Number.isFinite(percent) || percent <= 0 || percent > 90) return null
  if (Number.isNaN(new Date(expiresAt).getTime())) return null
  return { code, percent, expiresAt }
}

/** Editable fields only — id, status, timestamps and stats are server-owned. */
export function sanitizeCampaignInput(v: any): Pick<
  Campaign,
  'name' | 'audience' | 'subject' | 'preheader' | 'eyebrow' | 'heading' | 'body' | 'offer' | 'cta' | 'secondaryCta'
> {
  return {
    name: str(v?.name, 120).trim() || 'Untitled campaign',
    audience: sanitizeAudience(v?.audience),
    subject: str(v?.subject, 150),
    preheader: str(v?.preheader, 200),
    eyebrow: str(v?.eyebrow, 40),
    heading: str(v?.heading, 120),
    body: str(v?.body, 8000),
    offer: offer(v?.offer),
    cta: cta(v?.cta) ?? { label: 'Visit the shop', url: '/products' },
    secondaryCta: cta(v?.secondaryCta),
  }
}
