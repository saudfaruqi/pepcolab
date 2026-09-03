// src/app/api/admin/tracking/route.ts
//
// Attach a tracking number to an order. Sends NO email.
//
// WHY THIS SENDS NOTHING
// An earlier version of this endpoint fired a dispatch email. That was
// removed deliberately: an automatic email fires from a state that has to be
// maintained perfectly forever, and if a parcel goes out without being
// logged, the customer gets silence at exactly the moment they expect
// contact. Tracking degrades gracefully instead — an order with no tracking
// simply shows as "Confirmed", which is true, and the customer can still
// look it up or ask.
//
// So this endpoint does one thing: records where the parcel is, so the
// customer can see it on /track-order and in their account. Telling them it
// has shipped stays a human decision.
//
// AUTH: the same admin session cookie as the rest of /admin, or a bearer
// CRON_SECRET so it can be called from a script or a fulfilment tool.
//
// CARRIER LINKS: pass trackingUrl if you have the exact link. If you pass a
// known carrier name and no URL, one is built from the table below. Anything
// unrecognised is stored as a plain reference with no link, rather than
// guessing a URL that 404s in front of a customer.
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord, saveOrderRecord } from '@/lib/orderStore'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

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

  if (!orderShortCode || !trackingNumber) {
    return NextResponse.json(
      { success: false, message: 'orderShortCode and trackingNumber are required.' },
      { status: 400 }
    )
  }

  const order = await getOrderRecord(orderShortCode)
  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
  }

  // Build a carrier URL only from a carrier we actually know. A guessed URL
  // that 404s is worse than no link at all — the customer reads it as the
  // parcel being lost rather than the link being wrong.
  const carrierKey = carrierRaw.toLowerCase().replace(/[^a-z]/g, '')
  if (!trackingUrl && CARRIER_URLS[carrierKey]) {
    trackingUrl = CARRIER_URLS[carrierKey](trackingNumber)
  }

  await saveOrderRecord({
    ...order,
    // Preserved on re-submission: correcting a typo in a tracking number
    // shouldn't reset the date the parcel actually went out.
    shippedAt: order.shippedAt || new Date().toISOString(),
    carrier: carrierRaw || order.carrier,
    trackingNumber,
    trackingUrl: trackingUrl || undefined,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    orderShortCode,
    trackingNumber,
    trackingUrl: trackingUrl || null,
    linked: Boolean(trackingUrl),
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
  return NextResponse.json({
    success: true,
    orderShortCode: order.orderShortCode,
    shippedAt: order.shippedAt ?? null,
    carrier: order.carrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    trackingUrl: order.trackingUrl ?? null,
  })
}