// src/app/api/chat/lookup/route.ts
//
// Live lookups for the support assistant — stock and price, batch
// certificates, and order status.
//
// The widget detects the intent client-side (lib/chatContent.ts, detectLookup)
// and posts it here. Resolution happens server-side because the catalogue,
// the certificate library and the order store all change independently of a
// deploy, and because order records must never be readable from the browser
// without an identity check.
//
// NOTHING HERE GENERATES TEXT. It returns one of the fixed templates in
// lib/chatLookup.ts with real values slotted in.
//
// ORDER LOOKUPS MIRROR app/api/orders/lookup/route.ts: the caller is either
// signed in as the customer who placed the order, or supplies the email it
// was placed with. A code on its own gets nothing, and a miss returns the
// same generic message whether the order does not exist or the email is
// wrong — so this cannot be used to discover which order codes are real.
import { NextRequest, NextResponse } from 'next/server'
import { resolveLookup } from '@/lib/chatLookup'
import { verifySessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/customerAuth'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Product and certificate lookups are cheap and public; order lookups are
// the ones worth rationing, so they get their own tighter bucket.
const GENERAL_MAX = 40
const ORDER_MAX = 10
const WINDOW_MS = 10 * 60 * 1000

const VALID_INTENTS = new Set(['product', 'lot', 'order'])

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const payload = body as { intent?: unknown; query?: unknown; email?: unknown }
  const intent = String(payload.intent ?? '')
  const query = String(payload.query ?? '').trim().slice(0, 120)
  const providedEmail = payload.email ? String(payload.email).trim().toLowerCase().slice(0, 254) : null

  if (!VALID_INTENTS.has(intent) || !query) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const bucket = intent === 'order' ? 'chat-lookup-order' : 'chat-lookup'
  const max = intent === 'order' ? ORDER_MAX : GENERAL_MAX
  if (isRateLimited(bucket, ip, max, WINDOW_MS)) {
    return NextResponse.json(
      {
        answer: {
          lines: [
            'That’s a lot of lookups in a short window, so I’ve paused them for a few minutes.',
            'A representative can carry on helping you straight away — nothing is lost.',
          ],
          related: ['contact-human'],
        },
      },
      { status: 429 }
    )
  }

  let sessionEmail: string | null = null
  try {
    sessionEmail = verifySessionToken(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value) ?? null
  } catch {
    sessionEmail = null
  }

  try {
    const answer = await resolveLookup(intent as 'product' | 'lot' | 'order', query, {
      sessionEmail,
      providedEmail,
    })
    return NextResponse.json({ answer })
  } catch (err) {
    // A failed lookup must never take the widget down with it — the customer
    // gets an honest "couldn't reach our records" and a route to a person.
    console.error('[chat/lookup] Failed:', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}