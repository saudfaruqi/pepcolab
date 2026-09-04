// src/app/api/admin/reviews/route.ts
//
// Approve or reject a review from the admin screen.
//
// WHY THIS EXISTS ALONGSIDE /api/reviews/moderate
// That route authenticates with a per-review, single-use token minted at
// submission and delivered by email. It is the right design for a link in an
// inbox. But it has a hard dependency: if REVIEW_MODERATION_TOKEN is unset,
// no email is sent, so no token ever reaches a human and the review sits
// pending forever with no way to action it.
//
// This route authenticates with the admin session instead. Same operations,
// different door — so moderation works whether or not email is configured,
// and a backlog of already-pending reviews can be cleared.
import { NextRequest, NextResponse } from 'next/server'
import { approveReview, rejectReview, getReview } from '@/lib/reviewStore'
import { verifySessionToken as verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  let authorised = false
  try {
    authorised = verifyAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch {
    authorised = false
  }
  if (!authorised) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  const action = body?.action === 'approve' ? 'approve' : body?.action === 'reject' ? 'reject' : null

  if (!id || !action) {
    return NextResponse.json({ success: false, message: 'id and action are required.' }, { status: 400 })
  }

  const review = await getReview(id)
  if (!review) {
    return NextResponse.json({ success: false, message: 'Review not found.' }, { status: 404 })
  }
  if (review.status !== 'pending') {
    // Idempotent rather than an error: two clicks, or a click after the
    // emailed link was already used, should not read as a failure.
    return NextResponse.json({ success: true, alreadyActioned: true, status: review.status })
  }

  if (action === 'approve') await approveReview(id)
  else await rejectReview(id)

  return NextResponse.json({ success: true, status: action === 'approve' ? 'approved' : 'rejected' })
}