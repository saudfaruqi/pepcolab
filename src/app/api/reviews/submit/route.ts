// src/app/api/reviews/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOrderRecord } from '@/lib/orderStore'
import { createReview } from '@/lib/reviewStore'
import { sendMailSafe } from '@/lib/mailer'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const ADMIN_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'
// Gates whether moderation is wired up at all (whether to send the email).
// The actual per-click authorization is a single-use token minted per
// review in reviewStore.createReview() — see verifyModerationAccess().
const MODERATION_ENABLED = Boolean(process.env.REVIEW_MODERATION_TOKEN)
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'

const MAX_SUBMISSIONS = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Turns "Ahmed Farouqi" into "Ahmed F." — enough to feel personal without
// publishing a customer's full name.
function toDisplayName(fullName: string | undefined): string {
  if (!fullName) return 'Verified Customer'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited('review-submit', ip, MAX_SUBMISSIONS, WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many reviews submitted. Please try again later.' },
      { status: 429 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const orderCode = String(body.orderCode || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const productTitle = String(body.productTitle || '').trim()
  const productSlug = String(body.productSlug || '').trim() || null
  const nameInput = String(body.name || '').trim()
  const rating = Number(body.rating)
  const text = String(body.text || '').trim()

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 })
  }
  if (text.length < 10 || text.length > 2000) {
    return NextResponse.json({ error: 'Review should be between 10 and 2000 characters.' }, { status: 400 })
  }
  if (!productTitle) {
    return NextResponse.json({ error: 'Product is required.' }, { status: 400 })
  }

  // Reviews no longer require a matching order. If an order code + email are
  // supplied AND they check out (same ownership proof as /track-order,
  // completed-purchase statuses only), the review is marked verified and
  // gets the customer's real name off the order. Otherwise it's accepted as
  // an unverified review — every site gets these regardless of what's
  // enforced at signup, so we label them honestly (verified: false) rather
  // than pretend they're order-backed. Never silently upgrade a review to
  // "verified" without an order actually matching — that's the exact
  // DMCC Act 2024 misrepresentation the old hardcoded-reviews approach ran
  // into (see reviewStore.ts).
  let verified = false
  let authorName = nameInput || 'Anonymous'
  let orderShortCode: string | null = null

  if (orderCode && email) {
    const order = await getOrderRecord(orderCode)
    if (order && order.email === email && (order.status === 'created' || order.status === 'updated')) {
      verified = true
      orderShortCode = orderCode
      authorName = toDisplayName(order.customerName)
    }
    // If an order code/email were given but didn't check out, we don't hard
    // fail — we just fall through as an unverified review rather than
    // blocking someone who mistyped their order number from leaving
    // feedback at all.
  }

  if (!nameInput && !verified) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const review = await createReview({
    orderShortCode,
    productTitle,
    productSlug,
    authorName,
    rating,
    text,
    verified,
  })

  if (MODERATION_ENABLED) {
    const approveUrl = `${SITE_URL}/api/reviews/moderate?id=${review.id}&token=${review.moderationToken}&action=approve`
    const rejectUrl = `${SITE_URL}/api/reviews/moderate?id=${review.id}&token=${review.moderationToken}&action=reject`
    await sendMailSafe({
      to: ADMIN_EMAIL,
      subject: `📝 New ${verified ? 'verified' : 'unverified'} review pending approval — ${rating}★${orderShortCode ? ` (${orderShortCode})` : ''}`,
      text: `New review submitted.

Verified purchase: ${verified ? 'YES' : 'NO — no matching order on file'}
${orderShortCode ? `Order: ${orderShortCode}\n` : ''}Product: ${review.productTitle}
Rating: ${rating}/5
Name shown publicly: ${review.authorName}

"${text}"

Review this (opens a confirmation page — nothing is actioned until you click a button there):
Approve: ${approveUrl}
Reject: ${rejectUrl}

This link is single-use and expires in 14 days.`,
    })
  } else {
    console.warn('[reviews] REVIEW_MODERATION_TOKEN not set — moderation email not sent, review stuck pending until you add it and re-approve manually via Redis')
  }

  return NextResponse.json({ success: true })
}