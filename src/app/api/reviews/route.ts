// src/app/api/reviews/route.ts
import { NextResponse } from 'next/server'
import { getApprovedReviews } from '@/lib/reviewStore'

export async function GET() {
  const reviews = await getApprovedReviews(20)
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      productTitle: r.productTitle,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt,
    })),
  })
}