// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getApprovedReviews } from '@/lib/reviewStore'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || undefined
  const limitParam = Number(req.nextUrl.searchParams.get('limit'))
  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20

  const reviews = await getApprovedReviews(limit, slug)
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