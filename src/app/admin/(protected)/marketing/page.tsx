// src/app/admin/(protected)/marketing/page.tsx
//
// Campaign list, "new campaign" from a template, and the global exclusion
// list. Each campaign opens in /admin/marketing/[id].
import { listCampaigns, listExcluded } from '@/lib/marketing/store'
import { getDiscountCode } from '@/lib/discountStore'
import { CAMPAIGN_TEMPLATES } from '@/lib/marketing/templates'
import MarketingHome, { type CampaignRow } from './MarketingHome'

export const dynamic = 'force-dynamic'

export default async function MarketingPage() {
  let rows: CampaignRow[] = []
  let excluded: string[] = []
  let loadError = ''
  try {
    const [campaigns, ex] = await Promise.all([listCampaigns(), listExcluded()])
    excluded = ex
    rows = await Promise.all(
      campaigns.map(async (c) => {
        const code = c.offer?.code ? await getDiscountCode(c.offer.code) : null
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          segment: c.audience.segment,
          subject: c.subject,
          code: c.offer?.code ?? null,
          redemptions: code?.redemptions ?? null,
          sent: c.stats?.sent ?? 0,
          failed: c.stats?.failed ?? 0,
          recipients: c.stats?.recipients ?? 0,
          updatedAt: c.updatedAt,
          sentAt: c.sentAt ?? null,
        }
      })
    )
  } catch (err) {
    console.error('[admin/marketing] load failed:', err)
    loadError = 'Could not load campaigns from storage. Check the Redis connection.'
  }

  const templates = CAMPAIGN_TEMPLATES.map((t) => ({ key: t.key, name: t.name, description: t.description }))
  return <MarketingHome rows={rows} excluded={excluded} templates={templates} loadError={loadError} />
}
