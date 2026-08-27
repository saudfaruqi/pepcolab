// src/app/api/strabl/route.ts
//
// RETIRED (Aug 2026 fix). This was the pre-fix STRABL webhook handler,
// superseded by app/api/webhook/strabl/route.ts — see that file's header
// comment for why it moved (STRABL's dashboard points at
// /api/webhook/strabl, and the payload-shape destructuring here never
// matched STRABL's real schema). This file was left behind after the
// move, still fully wired to createShopifyOrder/markShopifyOrderPaid with
// the WRONG payload shape. If anything (an old STRABL config, a stale
// webhook secret, a forgotten integration) is still POSTing here, it
// would silently run outdated order-sync logic side-by-side with the
// real handler — worth explicitly closing off rather than leaving live.
//
// Deleting the route entirely would just 404 with no explanation, which
// looks identical to a typo'd URL. Returning 410 Gone with a pointer to
// the real endpoint makes a misconfigured sender's failure mode obvious
// in logs instead of a mystery. Safe to delete this file outright once
// you've confirmed STRABL's dashboard webhook URL is set to
// /api/webhook/strabl and nothing else references this path.
import { NextResponse } from 'next/server'

export async function POST() {
  console.warn('[webhook:strabl-legacy] Received a request on the retired /api/strabl endpoint — update the sender to /api/webhook/strabl')
  return NextResponse.json(
    { error: 'This endpoint has moved to /api/webhook/strabl' },
    { status: 410 }
  )
}