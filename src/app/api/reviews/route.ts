// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getApprovedReviews } from '@/lib/reviewStore'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || undefined
  const limitParam = Number(req.nextUrl.searchParams.get('limit'))
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20

  // getApprovedReviews() now returns null on a genuine fetch failure
  // rather than [] — this is a Route Handler (always dynamic, not subject
  // to the static/ISR DYNAMIC_SERVER_USAGE issue documented in
  // reviewStore.ts), so a null here means Redis itself is unreachable, not
  // the build-time bailout. Respond with an empty list either way; the
  // null case just isn't worth a 500 for a reviews widget.
  const reviews = (await getApprovedReviews(limit, slug)) ?? []
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      productTitle: r.productTitle,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      verified: r.verified,
      createdAt: r.createdAt,
    })),
  })
}