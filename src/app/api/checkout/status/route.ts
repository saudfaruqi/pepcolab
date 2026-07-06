// app/api/checkout/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCheckoutStatus } from '@/lib/checkoutStatus'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 })
  return NextResponse.json(getCheckoutStatus(ref))
}