// src/lib/reviewStore.ts
//
// Every review here is tied to a real, verified order — submission requires
// knowing both the order short code and its email (same ownership check as
// /track-order), and the order must actually be a completed purchase
// (status 'created' or 'updated'), not a failed/abandoned attempt. This is
// deliberately the opposite of the previous hardcoded REVIEWS arrays in
// data.ts/HomePageContent.tsx, which had fabricated quotes attached to
// invented names, credentials, and even real institutions — a genuine
// DMCC Act 2024 fake-reviews problem, not just a copy problem.
//
// New reviews start 'pending' and need manual approval (via the emailed
// approve/reject links from the submit route) before they're publicly
// visible — a basic spam/abuse gate given there's no admin login system.
import { randomUUID } from 'crypto'
import { redis } from '@/lib/redis'

export interface Review {
  id: string
  orderShortCode: string | null // null for unverified (no order on file) reviews
  productTitle: string
  productSlug: string | null // lets the product page fetch only its own reviews
  authorName: string
  rating: number // 1-5
  text: string
  verified: boolean // true only when tied to a real, matching order — see submit/route.ts
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const reviewKey = (id: string) => `review:${id}`
const PENDING_SET = 'reviews:pending' // sorted set, score = submitted-at
const APPROVED_SET = 'reviews:approved' // sorted set, score = approved-at

export async function createReview(
  input: Pick<
    Review,
    'orderShortCode' | 'productTitle' | 'productSlug' | 'authorName' | 'rating' | 'text' | 'verified'
  >
): Promise<Review> {
  const review: Review = {
    ...input,
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  await redis.set(reviewKey(review.id), review)
  await redis.zadd(PENDING_SET, { score: Date.now(), member: review.id })
  return review
}

export async function getReview(id: string): Promise<Review | null> {
  try {
    const review = await redis.get<Review>(reviewKey(id))
    return review ?? null
  } catch (err) {
    console.error('[reviewStore] Failed to read review:', err)
    return null
  }
}

export async function approveReview(id: string): Promise<void> {
  const review = await getReview(id)
  if (!review) return
  review.status = 'approved'
  await redis.set(reviewKey(id), review)
  await redis.zrem(PENDING_SET, id)
  await redis.zadd(APPROVED_SET, { score: Date.now(), member: id })
}

export async function rejectReview(id: string): Promise<void> {
  const review = await getReview(id)
  if (!review) return
  review.status = 'rejected'
  await redis.set(reviewKey(id), review)
  await redis.zrem(PENDING_SET, id)
}

export async function getApprovedReviews(limit = 20, productSlug?: string): Promise<Review[]> {
  try {
    // Most recently approved first. When filtering by product we pull a
    // larger window before slicing, since the set isn't per-product indexed
    // and review volume per product is expected to stay small.
    const pullCount = productSlug ? Math.max(limit * 10, 200) : limit
    const ids = (await redis.zrange(APPROVED_SET, 0, pullCount - 1, { rev: true })) as string[]
    if (ids.length === 0) return []
    const reviews = await Promise.all(ids.map((id) => getReview(id)))
    let result = reviews.filter((r): r is Review => r !== null)
    if (productSlug) {
      result = result.filter((r) => r.productSlug === productSlug)
    }
    return result.slice(0, limit)
  } catch (err) {
    console.error('[reviewStore] Failed to list approved reviews:', err)
    return []
  }
}