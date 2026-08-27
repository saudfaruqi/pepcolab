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
import { randomBytes, randomUUID } from 'crypto'
import { unstable_cache, revalidateTag } from 'next/cache'
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
  // Per-review, single-use moderation credential — see api/reviews/moderate.
  // Deliberately NOT the same value as the admin-facing REVIEW_MODERATION_TOKEN
  // env var: that env var gates whether moderation emails get sent at all,
  // this is the actual per-click authorization, scoped to exactly one review
  // and dead the moment its status leaves 'pending' (approved/rejected).
  // That means a leaked/forwarded/logged moderation link only ever exposes
  // one review, once — not standing access to moderate anything forever.
  moderationToken: string
  moderationTokenExpiresAt: number // epoch ms
}

const reviewKey = (id: string) => `review:${id}`
const PENDING_SET = 'reviews:pending' // sorted set, score = submitted-at
const APPROVED_SET = 'reviews:approved' // sorted set, score = approved-at
const REVIEWS_CACHE_TAG = 'reviews:approved:cache' // next/cache tag, see getApprovedReviews below

const MODERATION_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

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
    moderationToken: randomBytes(24).toString('hex'),
    moderationTokenExpiresAt: Date.now() + MODERATION_TOKEN_TTL_MS,
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

/**
 * Validates a moderation link before acting on it. Returns the review only
 * if: the token matches exactly, it hasn't expired, AND the review is still
 * 'pending' — that last check is what makes the token effectively
 * single-use, since approve/reject moves status away from 'pending' and any
 * replay of the same link (forwarded, re-clicked, scraped from a log) is
 * rejected without needing a separate "used" flag.
 */
export async function verifyModerationAccess(id: string, token: string): Promise<Review | null> {
  if (!id || !token) return null
  const review = await getReview(id)
  if (!review) return null
  if (review.status !== 'pending') return null
  if (Date.now() > review.moderationTokenExpiresAt) return null
  // Constant-time-ish comparison isn't critical here (token is 24 random
  // bytes, not a low-entropy PIN), but a plain === is fine at this length.
  if (review.moderationToken !== token) return null
  return review
}

export async function approveReview(id: string): Promise<void> {
  const review = await getReview(id)
  if (!review) return
  review.status = 'approved'
  await redis.set(reviewKey(id), review)
  await redis.zrem(PENDING_SET, id)
  await redis.zadd(APPROVED_SET, { score: Date.now(), member: id })
  // Without this, a newly-approved review wouldn't show up on the product
  // page until getApprovedReviewsCached's own 60s window happened to elapse.
  revalidateTag(REVIEWS_CACHE_TAG)
}

export async function rejectReview(id: string): Promise<void> {
  const review = await getReview(id)
  if (!review) return
  review.status = 'rejected'
  await redis.set(reviewKey(id), review)
  await redis.zrem(PENDING_SET, id)
}

/**
 * Why this is wrapped in unstable_cache
 * --------------------------------------
 * @upstash/redis makes its REST calls via `fetch(..., { cache: 'no-store' })`
 * internally, with no way to override that per call. Calling it directly
 * from a statically-generated/ISR route — like /products/[slug], which sets
 * `revalidate = 60` — trips Next's DYNAMIC_SERVER_USAGE bailout during
 * `next build` (and on every background ISR regen after). That error was
 * being swallowed by the try/catch below, so the build "succeeded" but every
 * product page baked in an empty reviews array permanently: ProductReviews
 * skips its own client-side fetch whenever it's handed a non-null
 * initialReviews prop, even an empty one, so reviews never appeared without
 * a hard refresh path that bypassed the static HTML.
 *
 * unstable_cache runs its callback inside Next's own cache scope, decoupled
 * from whichever page happened to call it — so a no-store fetch inside it no
 * longer counts as dynamic usage against that page's render. Results are
 * cached for 60s (matching the page's own `revalidate`) and invalidated
 * immediately on approval via revalidateTag, instead of waiting out the
 * window.
 */
const getApprovedReviewsCached = unstable_cache(
  async (limit: number, productSlug?: string): Promise<Review[]> => {
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
  },
  ['reviews:approved'],
  { revalidate: 60, tags: [REVIEWS_CACHE_TAG] }
)

export async function getApprovedReviews(limit = 20, productSlug?: string): Promise<Review[]> {
  return getApprovedReviewsCached(limit, productSlug)
}