// src/app/api/reviews/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord } from '@/lib/orderStore'
import { createReview } from '@/lib/reviewStore'
import { sendMailSafe } from '@/lib/mailer'

const ADMIN_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'
const MODERATION_TOKEN = process.env.REVIEW_MODERATION_TOKEN
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'

// Turns "Ahmed Farouqi" into "Ahmed F." — enough to feel personal without
// publishing a customer's full name.
function toDisplayName(fullName: string | undefined): string {
  if (!fullName) return 'Verified Customer'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const orderCode = String(body.orderCode || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const productTitle = String(body.productTitle || '').trim()
  const rating = Number(body.rating)
  const text = String(body.text || '').trim()

  if (!orderCode || !email) {
    return NextResponse.json({ error: 'Order number and email are required.' }, { status: 400 })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 })
  }
  if (text.length < 10 || text.length > 2000) {
    return NextResponse.json({ error: 'Review should be between 10 and 2000 characters.' }, { status: 400 })
  }

  // Same ownership proof as /track-order (order code + matching email),
  // plus the order must actually be a completed purchase — not a failed or
  // abandoned attempt. This is the whole point: every review that reaches
  // moderation is tied to a real, verifiable order, not a free-text form
  // anyone can fill in.
  const order = await getOrderRecord(orderCode)
  if (!order || order.email !== email || (order.status !== 'created' && order.status !== 'updated')) {
    return NextResponse.json(
      { error: "We couldn't verify a completed order matching that order number and email." },
      { status: 404 }
    )
  }

  const review = await createReview({
    orderShortCode: orderCode,
    productTitle: productTitle || order.products[0]?.title || 'Product',
    authorName: toDisplayName(order.customerName),
    rating,
    text,
  })

  if (MODERATION_TOKEN) {
    const approveUrl = `${SITE_URL}/api/reviews/moderate?id=${review.id}&token=${MODERATION_TOKEN}&action=approve`
    const rejectUrl = `${SITE_URL}/api/reviews/moderate?id=${review.id}&token=${MODERATION_TOKEN}&action=reject`
    await sendMailSafe({
      to: ADMIN_EMAIL,
      subject: `📝 New review pending approval — ${rating}★ (${orderCode})`,
      text: `New review submitted, tied to a verified order.

Order: ${orderCode}
Product: ${review.productTitle}
Rating: ${rating}/5
Name shown publicly: ${review.authorName}

"${text}"

Approve (goes live immediately): ${approveUrl}
Reject: ${rejectUrl}`,
    })
  } else {
    console.warn('[reviews] REVIEW_MODERATION_TOKEN not set — moderation email not sent, review stuck pending until you add it and re-approve manually via Redis')
  }

  return NextResponse.json({ success: true })
}