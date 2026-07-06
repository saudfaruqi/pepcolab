// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { savePendingCheckout } from '@/lib/checkoutSession'

export async function POST(req: NextRequest) {
  try {
    const { lines, country = 'AE', currencyCode = 'AED' } = await req.json()

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'No cart lines provided' }, { status: 400 })
    }

    const ref = randomUUID()
    savePendingCheckout(ref, { lines, country, currencyCode })

    return NextResponse.json({ checkoutRef: ref })
  } catch (err) {
    console.error('[checkout] create pending session failed:', err)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 })
  }
}