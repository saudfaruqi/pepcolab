// src/app/api/discounts/admin/route.ts
//
// Token-protected, same pattern as /api/newsletter/export. Set
// DISCOUNT_ADMIN_TOKEN in Vercel to a long random string first.
//
// Usage (from a terminal, or any HTTP client):
//   curl -X POST https://www.pepcolab.com/api/discounts/admin \
//     -H "Authorization: Bearer YOUR_TOKEN" \
//     -H "Content-Type: application/json" \
//     -d '{"code":"WELCOME10","type":"percent","value":10,"maxRedemptions":100}'
import { NextRequest, NextResponse } from 'next/server'
import { createDiscountCode, listDiscountCodes } from '@/lib/discountStore'

function checkAuth(req: NextRequest): boolean {
  const token = process.env.DISCOUNT_ADMIN_TOKEN
  if (!token) return false
  const header = req.headers.get('authorization')
  return header === `Bearer ${token}`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const codes = await listDiscountCodes()
  return NextResponse.json({ codes })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const code = String(body.code || '').trim()
  const type = body.type === 'fixed' ? 'fixed' : 'percent'
  const value = Number(body.value)

  if (!code || !/^[A-Za-z0-9_-]{3,20}$/.test(code)) {
    return NextResponse.json({ error: 'Code must be 3-20 letters/numbers.' }, { status: 400 })
  }
  if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) {
    return NextResponse.json({ error: 'Invalid discount value.' }, { status: 400 })
  }

  const discount = await createDiscountCode({
    code,
    type,
    value,
    maxRedemptions: body.maxRedemptions != null ? Number(body.maxRedemptions) : null,
    minSubtotal: body.minSubtotal != null ? Number(body.minSubtotal) : null,
    expiresAt: body.expiresAt || null,
  })

  return NextResponse.json({ discount })
}