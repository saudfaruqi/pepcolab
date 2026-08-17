// src/app/api/reviews/moderate/route.ts
//
// Clicked from the "New review pending approval" email — approve/reject
// links are pre-built with the token, so this is genuinely one click, not
// a login flow. Returns a small HTML confirmation page since a human opens
// this directly in a browser from their email client.
import { NextRequest, NextResponse } from 'next/server'
import { approveReview, rejectReview, getReview } from '@/lib/reviewStore'

function htmlResponse(message: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>` +
    `<body style="font-family: -apple-system, sans-serif; padding: 60px 24px; text-align: center; color: #0D0D0D;">` +
    `<h2 style="font-size: 20px;">${message}</h2></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req: NextRequest) {
  const configuredToken = process.env.REVIEW_MODERATION_TOKEN
  const token = req.nextUrl.searchParams.get('token')
  const id = req.nextUrl.searchParams.get('id')
  const action = req.nextUrl.searchParams.get('action')

  if (!configuredToken || token !== configuredToken) {
    return htmlResponse('Unauthorized.', 401)
  }
  if (!id) return htmlResponse('Missing review id.', 400)

  const review = await getReview(id)
  if (!review) return htmlResponse('Review not found — it may have already been moderated.', 404)

  if (action === 'approve') {
    await approveReview(id)
    return htmlResponse(`✅ Approved. The review by ${review.authorName} is now live on the site.`)
  }
  if (action === 'reject') {
    await rejectReview(id)
    return htmlResponse(`🚫 Rejected. The review by ${review.authorName} will not be shown.`)
  }
  return htmlResponse('Unknown action — use the links from the notification email.', 400)
}