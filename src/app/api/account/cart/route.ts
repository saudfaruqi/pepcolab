// src/app/api/account/cart/route.ts
//
// Read, save and clear the signed-in customer's server-side cart.
//
// The email always comes from the signed session cookie, never from the
// request body — so there is no way to read or overwrite someone else's cart,
// because the caller never names whose cart it is.
//
// GET returns the saved cart AND the merge of it with whatever the caller
// sends as its local state, so the client makes one round trip rather than
// fetching then merging then saving.
import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/customerAuth'
import { getSavedCart, saveCart, clearSavedCart, mergeCarts, type SavedCartLine } from '@/lib/cartSync'

function emailFrom(req: NextRequest): string | null {
  return verifySessionToken(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value)
}

export async function GET(req: NextRequest) {
  const email = emailFrom(req)
  // Signed out is a normal state, not an error — see /api/account/me.
  if (!email) return NextResponse.json({ signedIn: false, cart: null })

  const cart = await getSavedCart(email)
  return NextResponse.json({ signedIn: true, cart })
}

export async function POST(req: NextRequest) {
  const email = emailFrom(req)
  if (!email) return NextResponse.json({ signedIn: false }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = body?.action

  if (action === 'clear') {
    await clearSavedCart(email)
    return NextResponse.json({ success: true })
  }

  const local: SavedCartLine[] = Array.isArray(body?.lines) ? body.lines : []

  if (action === 'merge') {
    // One round trip: read the saved cart, merge, persist the result, and
    // hand back both the merged lines and what changed.
    const saved = await getSavedCart(email)
    const merged = mergeCarts(local, saved)
    await saveCart(email, merged.lines)
    return NextResponse.json({ success: true, ...merged })
  }

  // Default: plain save of the current cart state.
  const ok = await saveCart(email, local)
  return NextResponse.json({ success: ok })
}