// src/app/api/admin/abandoned/route.ts
//
// Send a recovery email for one abandoned checkout, on demand.
//
// The cron handles the scheduled sends. This is the manual override for when
// you want to reach someone now — a high-value cart, or a customer you've
// just spoken to — without waiting for the next scheduled run.
//
// Two guards that matter:
//   1. A cart with no captured products cannot be emailed. The template
//      renders the items and the total, so sending one would produce an email
//      showing an empty basket worth nothing. That is worse than no email.
//   2. Records the send against recoveryEmailStage, so the cron won't
//      duplicate what you sent by hand.
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord, saveOrderRecord } from '@/lib/orderStore'
import { sendAbandonedCartEmail } from '@/lib/orderEmails'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  let authorised = false
  try {
    authorised = verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch { authorised = false }
  if (!authorised) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const orderShortCode = typeof body?.orderShortCode === 'string' ? body.orderShortCode.trim().toUpperCase() : ''
  if (!orderShortCode) {
    return NextResponse.json({ success: false, message: 'orderShortCode is required.' }, { status: 400 })
  }

  const order = await getOrderRecord(orderShortCode)
  if (!order) {
    return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 })
  }
  if (!order.email) {
    return NextResponse.json({ success: false, message: 'No email captured on this checkout.' }, { status: 400 })
  }
  if (!order.products?.length) {
    return NextResponse.json(
      {
        success: false,
        message: 'No items were captured on this checkout, so a recovery email would show an empty cart. Contact them directly instead.',
      },
      { status: 400 }
    )
  }

  // Stage 2 wording for a second send, so a manual follow-up doesn't repeat
  // the first email verbatim.
  const stage: 1 | 2 = (order.recoveryEmailStage ?? 0) >= 1 ? 2 : 1

  await sendAbandonedCartEmail({
    to: order.email,
    orderShortCode: order.orderShortCode,
    products: order.products,
    total: order.total,
    currency: order.currency,
    stage,
  })

  await saveOrderRecord({
    ...order,
    recoveryEmailStage: stage,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, stage })
}