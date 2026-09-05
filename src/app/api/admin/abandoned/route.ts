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
import { getOrderRecord, saveOrderRecord, getOrdersForEmail } from '@/lib/orderStore'
import { sendAbandonedCartEmail } from '@/lib/orderEmails'
import { sendCheckoutHelpEmail } from '@/lib/accountEmails'
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
  // ── THE GUARD THAT MATTERS ───────────────────────────────────────────────
  //
  // STRABL writes an abandoned record when checkout OPENS, under its own
  // AC-* code. When the same person then completes an order, that order gets
  // a different code — so nothing ever supersedes the abandoned record and it
  // sits on the list forever. Two people on the current list did go on to
  // order successfully.
  //
  // Emailing "did something go wrong at checkout?" to a customer whose order
  // you already shipped is worse than sending nothing: it tells them you
  // don't know what you sold them. Checked at send time rather than trusted
  // to the list being clean, because this is the one mistake in this feature
  // that cannot be taken back.
  const history = await getOrdersForEmail(order.email, 50)
  const completed = history.filter(
    o => o.status !== 'abandoned' && o.status !== 'failed' && (o.products?.length ?? 0) > 0
  )
  if (completed.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `This customer went on to place ${completed.length} real order${completed.length === 1 ? '' : 's'} (${completed[0].orderShortCode}). The abandoned record was never cleared. Don't send — they already bought.`,
      },
      { status: 409 }
    )
  }

  const stage: 1 | 2 = (order.recoveryEmailStage ?? 0) >= 1 ? 2 : 1

  if (!order.products?.length) {
    // No cart was captured, so the normal recovery template — which renders
    // the items and the total — would show an empty basket. This one asks
    // what went wrong instead, which is the only honest thing available and,
    // at this volume, the more useful question anyway.
    await sendCheckoutHelpEmail({
      to: order.email,
      customerName: order.customerName,
      attempts: typeof body?.attempts === 'number' ? body.attempts : 1,
    })
  } else {
    await sendAbandonedCartEmail({
      to: order.email,
      orderShortCode: order.orderShortCode,
      products: order.products,
      total: order.total,
      currency: order.currency,
      stage,
    })
  }

  await saveOrderRecord({
    ...order,
    recoveryEmailStage: stage,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, stage })
}