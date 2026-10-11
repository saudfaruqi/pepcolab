// src/app/admin/(protected)/affiliates/page.tsx
//
// The affiliate approval queue — the screen that did not exist.
//
// Until this page, applying to the affiliate programme led nowhere: the
// application wrote a `pending` profile and there was no way to action it
// short of running approveAffiliate() by hand against Redis. See the header
// of /api/admin/affiliates/route.ts for why that mattered.
import { listAffiliates, getAffiliateStats, AFFILIATE_COMMISSION_PERCENT, AFFILIATE_MIN_PAYOUT_AED } from '@/lib/affiliateStore'
import AffiliateQueue, { type AffiliateRow } from './AffiliateQueue'

export const dynamic = 'force-dynamic'

export default async function AdminAffiliatesPage() {
  let rows: AffiliateRow[] = []
  let loadError: string | null = null

  try {
    const affiliates = await listAffiliates()
    rows = await Promise.all(
      affiliates.map(async (a) => {
        const stats = await getAffiliateStats(a.code).catch(() => null)
        return {
          code: a.code,
          name: a.name,
          email: a.email,
          audience: a.audience,
          status: a.status,
          commissionPercent: a.commissionPercent,
          createdAt: a.createdAt,
          approvedAt: a.approvedAt ?? null,
          clicks: stats?.clicks ?? 0,
          orders: stats?.orders ?? 0,
          grossCommission: stats?.grossCommission ?? 0,
          // Still inside the 30-day refund hold — earned but not yet payable.
          pendingCommission: stats?.pendingCommission ?? 0,
          // Past the hold and owed to them. This is the number you pay out.
          approvedCommission: stats?.approvedCommission ?? 0,
          currency: stats?.currency ?? 'AED',
        }
      })
    )
    // Pending first — this is an action queue, not a directory. Within a
    // status, newest application first.
    const rank = { pending: 0, active: 1, suspended: 2 } as const
    rows.sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch (err) {
    console.error('[admin/affiliates] Failed to load affiliates:', err)
    loadError = 'Could not load affiliates — check the server logs.'
  }

  return (
    <AffiliateQueue
      rows={rows}
      loadError={loadError}
      defaultCommission={AFFILIATE_COMMISSION_PERCENT}
      minPayout={AFFILIATE_MIN_PAYOUT_AED}
    />
  )
}