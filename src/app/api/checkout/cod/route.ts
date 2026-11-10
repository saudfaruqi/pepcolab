// src/app/api/checkout/cod/route.ts
//
// CASH ON DELIVERY (Nov 2026).
//
// Online payments go through STRABL, a third-party checkout. COD cannot be
// taken there — Shopify's "Cash on Delivery (COD)" is a manual payment method
// that exists only inside Shopify's own checkout. So the cart page has a
// second, separate button for COD which lands here: this route stamps the
// customer's Shopify cart with the checkout attributes the order webhook
// needs, then hands back the cart's `checkoutUrl` for the browser to follow.
//
// Shopify checkout then does what STRABL cannot for this case: collects the
// shipping address and presents COD, creating the order with payment pending.
// The order is ingested by app/api/webhook/shopify/route.ts.
//
// The attestation and consent are recorded here too (same storage the STRABL
// path uses via /api/checkout/attest), keyed by the checkout reference. The
// cart attributes carry the reference through Shopify so the webhook can pick
// them up again.
import { deliversTo, DELIVERY_NOTICE } from '@/lib/pricing'
import { NextRequest, NextResponse } from 'next/server'
import { cartAttributesUpdate, type CartAttribute } from '@/lib/shopify'
import { getClientIp, isRateLimited } from '@/lib/rateLimit'
import { saveAttestation, isCheckoutRef, cleanAttestedAt } from '@/lib/attestation'
import { savePendingConsents, type PendingConsent } from '@/lib/crm/pending'
import { EMAIL_WORDING_VERSION, WHATSAPP_WORDING_VERSION } from '@/lib/crm/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (isRateLimited('checkout-cod', getClientIp(req), 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  // UAE ONLY (Nov 2026): no checkout from a connection outside the delivery
  // countries (lib/pricing.ts → DELIVERY_COUNTRIES).
  const ipCountry = req.headers.get('x-vercel-ip-country')
  if (!deliversTo(ipCountry)) {
    return NextResponse.json(
      { error: `${DELIVERY_NOTICE} We can’t take orders from your location right now. If you are in the UAE and using a VPN, switch it off and try again.` },
      { status: 403 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const cartId = typeof body?.cartId === 'string' ? body.cartId.trim() : ''
  const ref = body?.ref
  const attestedAt = cleanAttestedAt(body?.attestedAt)

  if (!cartId.startsWith('gid://shopify/Cart/')) {
    return NextResponse.json({ error: 'Invalid cart.' }, { status: 400 })
  }
  if (!isCheckoutRef(ref)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  try {
    // Attestation is optional now that the cart no longer collects it. When a
    // caller still supplies one, record it before the handoff so a webhook
    // failure cannot lose it. The reference also travels in the cart
    // attributes below.
    if (attestedAt) await saveAttestation(ref, attestedAt)
    const ip = getClientIp(req)
    const evidence = {
      ip: ip && ip !== 'unknown' ? ip : undefined,
      userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || undefined,
      pageUrl: typeof body?.pageUrl === 'string' ? body.pageUrl.slice(0, 500) : undefined,
    }
    const now = new Date().toISOString()
    const pending: PendingConsent[] = []
    if (body?.consents?.email === true) {
      pending.push({ channel: 'email', wordingVersion: EMAIL_WORDING_VERSION, capturePoint: 'checkout', evidence, occurredAt: now })
    }
    if (body?.consents?.whatsapp === true) {
      pending.push({ channel: 'whatsapp', wordingVersion: WHATSAPP_WORDING_VERSION, capturePoint: 'checkout', evidence, occurredAt: now })
    }
    await savePendingConsents(ref, pending)

    const attributes: CartAttribute[] = [
      { key: 'checkout_channel', value: 'cod' },
      { key: 'checkout_ref', value: ref },
      { key: 'consent_email', value: String(body?.consents?.email === true) },
      { key: 'consent_whatsapp', value: String(body?.consents?.whatsapp === true) },
    ]
    if (attestedAt) attributes.push({ key: 'research_attested_at', value: attestedAt })

    const cart = await cartAttributesUpdate(cartId, attributes)
    return NextResponse.json({ checkoutUrl: cart.checkoutUrl })
  } catch (err: any) {
    console.error('[checkout/cod] failed:', err)
    return NextResponse.json(
      { error: err?.message || 'Could not start cash on delivery checkout.' },
      { status: 502 }
    )
  }
}
