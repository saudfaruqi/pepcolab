// src/app/api/discounts/validate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDiscountCode, checkDiscountEligibility } from '@/lib/discountStore'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const code = String(body.code || '').trim()
  const subtotal = Number(body.subtotal)

  if (!code) {
    return NextResponse.json({ error: 'Enter a discount code.' }, { status: 400 })
  }

  const discount = await getDiscountCode(code)
  if (!discount) {
    return NextResponse.json({ error: 'That code isn\u2019t valid.' }, { status: 404 })
  }

  const { valid, error } = checkDiscountEligibility(discount, subtotal)
  if (!valid) {
    return NextResponse.json({ error }, { status: 400 })
  }

  const discountAmount =
    discount.type === 'percent' ? (subtotal * discount.value) / 100 : Math.min(discount.value, subtotal)

  return NextResponse.json({
    valid: true,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    discountAmount: Math.round(discountAmount * 100) / 100,
  })
}