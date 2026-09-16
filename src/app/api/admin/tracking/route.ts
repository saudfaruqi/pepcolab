// src/app/api/admin/tracking/route.ts
//
// Mark an order as dispatched — tracking number optional — and optionally
// tell the customer.
//
// NO TRACKING NEEDED
// Most couriers we use don't provide tracking, and ~90% of orders arrive the
// next working day. So dispatch is recorded on its own (shippedAt); a
// tracking number, carrier and link are stored only when you have them.
//
// EMAIL IS OPT-IN PER CALL
// Saving never emails anyone by itself. The admin ticks "Email the customer"
// (body.notifyCustomer === true), which sends the personalised "On its way"
// email (lib/lifecycleEmails.ts) at most once per order. Adding a tracking
// number later never emails the customer twice.
//
// body.clearDispatch === true undoes an accidental "Mark as dispatched"
// (only allowed while the customer hasn't been emailed).
//
// AUTH: the same admin session cookie as the rest of /admin, or a bearer
// CRON_SECRET so it can be called from a script or a fulfilment tool.
//
// CARRIER LINKS: pass trackingUrl if you have the exact link. If you pass a
// known carrier name and no URL, one is built from the table below. Anything
// unrecognised is stored as a plain reference with no link, rather than
// guessing a URL that 404s in front of a customer.
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord, saveOrderRecord, isPaidOrder } from '@/lib/orderStore'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { formatAddressLines } from '@/lib/addressNormalise'
import { sendShippedEmail } from '@/lib/lifecycleEmails'
import { loadCatalogue, buildJourney } from '@/lib/customerJourney'

const CARRIER_URLS: Record<string, (ref: string) => string> = {
  aramex: ref => `https://www.aramex.com/us/en/track/results?ShipmentNumber=${encodeURIComponent(ref)}`,
  dhl: ref => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(ref)}`,
  fedex: ref => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(ref)}`,
  ups: ref => `https://www.ups.com/track?tracknum=${encodeURIComponent(ref)}`,
  emiratespost: ref => `https://www.emiratespost.ae/track?trackingNumber=${encodeURIComponent(ref)}`,
  smsa: ref => `https://www.smsaexpress.com/track?tracking=${encodeURIComponent(ref)}`,
}

function authorised(req: NextRequest): boolean {
  const bearer = req.headers.get('authorization')
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true
  try {
    return verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const orderShortCode = typeof body?.orderShortCode === 'string' ? body.orderShortCode.trim().toUpperCase() : ''
  const trackingNumber = typeof body?.trackingNumber === 'string' ? body.trackingNumber.trim() : ''
  const carrierRaw = typeof body?.carrier === 'string' ? body.carrier.trim() : ''
  let trackingUrl = typeof body?.trackingUrl === 'string' ? body.trackingUrl.trim() : ''
  const notifyCustomer = body?.notifyCustomer === true
  const clearDispatch = body?.clearDispatch === true

  if (!orderShortCode) {
    return NextResponse.json({ success: false, message: 'orderShortCode is required.' }, { status: 400 })
  }

  const order = await getOrderRecord(orderShortCode)
  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
  }

  if (clearDispatch) {
    if (order.shippedEmailSentAt) {
      return NextResponse.json(
        { success: false, message: 'The customer has already been told it shipped, so dispatch can’t be undone.' },
        { status: 409 }
      )
    }
    await saveOrderRecord({
      ...order,
      shippedAt: undefined,
      trackingNumber: undefined,
      trackingUrl: undefined,
      carrier: undefined,
      updatedAt: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, orderShortCode, cleared: true })
  }

  // Build a carrier URL only from a carrier we actually know. A guessed URL
  // that 404s is worse than no link at all — the customer reads it as the
  // parcel being lost rather than the link being wrong.
  const carrierKey = carrierRaw.toLowerCase().replace(/[^a-z]/g, '')
  if (!trackingUrl && trackingNumber && CARRIER_URLS[carrierKey]) {
    trackingUrl = CARRIER_URLS[carrierKey](trackingNumber)
  }
  if (trackingUrl && !/^https:\/\//i.test(trackingUrl)) {
    return NextResponse.json({ success: false, message: 'Tracking link must start with https://' }, { status: 400 })
  }

  // shippedAt is preserved on re-submission: adding a tracking number later
  // shouldn't move the date the parcel actually went out.
  const now = new Date().toISOString()
  const updated = {
    ...order,
    shippedAt: order.shippedAt || now,
    carrier: carrierRaw || order.carrier,
    trackingNumber: trackingNumber || order.trackingNumber,
    trackingUrl: trackingUrl || (trackingNumber ? undefined : order.trackingUrl),
    updatedAt: now,
  }
  await saveOrderRecord(updated)

  let emailed = false
  let emailSkippedReason: string | null = null
  if (notifyCustomer) {
    if (updated.shippedEmailSentAt) {
      emailSkippedReason = 'Customer was already emailed for this order.'
    } else if (!updated.email) {
      emailSkippedReason = 'Order has no email address.'
    } else if (!isPaidOrder(updated)) {
      emailSkippedReason = `Order status is "${updated.status}", so no dispatch email was sent.`
    } else {
      const catalogue = await loadCatalogue(updated.currency)
      await sendShippedEmail(updated, buildJourney(updated, catalogue, 'dispatch'))
      await saveOrderRecord({ ...updated, shippedEmailSentAt: new Date().toISOString() })
      emailed = true
    }
  }

  return NextResponse.json({
    success: true,
    orderShortCode,
    shippedAt: updated.shippedAt,
    trackingNumber: updated.trackingNumber || null,
    trackingUrl: updated.trackingUrl || null,
    linked: Boolean(updated.trackingUrl),
    emailed,
    emailSkippedReason,
  })
}

/** Read back what's on an order — useful when scripting bulk updates. */
export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  const code = req.nextUrl.searchParams.get('orderShortCode')?.trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ success: false, message: 'orderShortCode is required.' }, { status: 400 })
  }
  const order = await getOrderRecord(code)
  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
  }
  // The label block is the point of this endpoint being readable at all:
  // it returns the delivery address already cleaned and line-broken, so
  // booking a courier is a copy-paste rather than a trip into Shopify to
  // untangle STRABL's duplicated address2 by hand.
  return NextResponse.json({
    success: true,
    orderShortCode: order.orderShortCode,
    customerName: order.customerName ?? null,
    phone: order.phone ?? null,
    label: order.shippingAddress
      ? [order.customerName, ...formatAddressLines(order.shippingAddress)].filter(Boolean).join('\n')
      : null,
    shippingAddress: order.shippingAddress ?? null,
    shippedAt: order.shippedAt ?? null,
    carrier: order.carrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    trackingUrl: order.trackingUrl ?? null,
    shippedEmailSentAt: order.shippedEmailSentAt ?? null,
  })
}