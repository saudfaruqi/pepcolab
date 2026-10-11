// src/app/api/admin/affiliates/route.ts
//
// Approve, suspend, or inspect an affiliate from the admin screen.
//
// WHY THIS EXISTS
// lib/affiliateStore.ts has shipped approveAffiliate() since September and
// NOTHING EVER CALLED IT. The comment in /api/affiliate/route.ts says
// "approveAffiliate is called from the admin surface only" — but no such
// surface was ever built. The practical effect: anyone who applied sat in
// `pending` forever, their discount code never activated, and they could
// never earn a commission. The programme was live, linked from the footer and
// listed in the sitemap, and was structurally incapable of onboarding anyone.
//
// That matters commercially: the Oct 2026 competitor audit found the nearest
// competitor's affiliate scheme to be their primary acquisition channel.
// Recruiting into a programme that cannot approve people is worse than not
// recruiting at all, because it burns warm contacts.
//
// Authenticates with the admin session cookie, exactly like
// /api/admin/reviews — same door, same guard.
import { NextRequest, NextResponse } from 'next/server'
import {
  listAffiliates,
  approveAffiliate,
  suspendAffiliate,
  getAffiliateStats,
  getAffiliateByCode,
} from '@/lib/affiliateStore'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

function authorised(req: NextRequest): boolean {
  try {
    return verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const affiliates = await listAffiliates()
    // Stats are a per-affiliate read, so this is one round trip each. The list
    // is small by nature (people you personally recruited); if it ever grows
    // past a few hundred, paginate rather than dropping the numbers —
    // earnings are the whole reason to open this screen.
    const withStats = await Promise.all(
      affiliates.map(async (a) => ({
        ...a,
        stats: await getAffiliateStats(a.code).catch(() => null),
      }))
    )
    return NextResponse.json({ success: true, affiliates: withStats })
  } catch (err) {
    console.error('[admin/affiliates] list failed:', err)
    return NextResponse.json({ success: false, message: 'Could not load affiliates.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  const action = ['approve', 'suspend'].includes(body?.action)
    ? (body.action as 'approve' | 'suspend')
    : null

  if (!code || !action) {
    return NextResponse.json({ success: false, message: 'code and action are required.' }, { status: 400 })
  }

  const existing = await getAffiliateByCode(code)
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Affiliate not found.' }, { status: 404 })
  }

  try {
    // Approving is the consequential one: it mints a live, unlimited discount
    // code in this person's name. approveAffiliate is idempotent, so a second
    // click on an already-active affiliate must not create a second code.
    const profile =
      action === 'approve' ? await approveAffiliate(code) : await suspendAffiliate(code)

    if (!profile) {
      return NextResponse.json({ success: false, message: 'Action failed.' }, { status: 500 })
    }
    return NextResponse.json({ success: true, affiliate: profile })
  } catch (err) {
    console.error(`[admin/affiliates] ${action} failed for ${code}:`, err)
    return NextResponse.json({ success: false, message: `Could not ${action} this affiliate.` }, { status: 500 })
  }
}