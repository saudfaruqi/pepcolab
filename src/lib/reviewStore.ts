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
 * Why this is wrapped in unstable_cache — and why it still isn't enough
 * ------------------------------------------------------------------------
 * @upstash/redis makes its REST calls via `fetch(..., { cache: 'no-store' })`
 * internally, with no way to override that per call. Calling it from a
 * statically-generated/ISR route — like /products/[slug], which sets
 * `revalidate = 60` — trips Next's DYNAMIC_SERVER_USAGE bailout during
 * `next build` (and on every background ISR regen after).
 *
 * unstable_cache is supposed to run its callback inside Next's own cache
 * scope, decoupled from whichever page called it, so a no-store fetch
 * inside it shouldn't count as dynamic usage against that page's render.
 * In practice, on this app's Next 14.2.5, it doesn't fully insulate it —
 * `next build`'s own output (see the "[reviewStore] Failed to list approved
 * reviews" lines during `Generating static pages`) shows the
 * DYNAMIC_SERVER_USAGE error still firing for every product page's
 * generateStaticParams pass. This is a known rough edge in that Next
 * version, not something fixable from inside this file — the real fix is a
 * Next upgrade, which is a bigger, separate change.
 *
 * What IS fixed here: this function now returns `null` (not `[]`) when the
 * underlying fetch fails, instead of swallowing the failure into a result
 * that's indistinguishable from "genuinely zero approved reviews." That
 * distinction is what lets callers avoid baking in a false empty state —
 * see the getApprovedReviews() catch and app/products/[slug]/page.tsx's use
 * of it, which now passes `initialReviews={undefined}` (triggering
 * ProductReviews' own client-side fetch against /api/reviews — a Route
 * Handler, not a static/ISR page, so it isn't subject to this same
 * DYNAMIC_SERVER_USAGE bailout) instead of `initialReviews={[]}` on
 * failure. A real reviews section still needs at least one successful
 * build/regen to appear in the server-rendered HTML (and therefore in
 * Googlebot's view and the AggregateRating/Review JSON-LD) — this doesn't
 * fix that, only stops it from being permanently and silently wrong for
 * human visitors in the browser.
 */
const getApprovedReviewsCached = unstable_cache(
  async (limit: number, productSlug?: string): Promise<Review[]> => {
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
  },
  ['reviews:approved'],
  { revalidate: 60, tags: [REVIEWS_CACHE_TAG] }
)

// Returns null on failure (see comment above) rather than [] — callers
// must treat null as "unknown, try again client-side," not "confirmed
// zero." getApprovedReviewsCached itself no longer catches internally so
// this is the one place the error is logged and converted.
export async function getApprovedReviews(limit = 20, productSlug?: string): Promise<Review[] | null> {
  try {
    return await getApprovedReviewsCached(limit, productSlug)
  } catch (err) {
    console.error('[reviewStore] Failed to list approved reviews:', err)
    return null
  }
}

/**
 * Every review awaiting moderation, newest first.
 *
 * ADDED Sep 2026, for the admin moderation screen.
 *
 * Until now the ONLY way to approve a review was the per-review link in the
 * "new review pending" email — and that email is only sent when
 * REVIEW_MODERATION_TOKEN is set. With it unset, reviews accumulated in the
 * pending set with no route to approve them and no way to even see that they
 * existed. A queue you cannot open is not a queue.
 *
 * The admin screen reads this and actions reviews through the admin session,
 * so moderation no longer depends on an email arriving at all. The emailed
 * links still work — they are just no longer the only door.
 */
export async function listPendingReviews(limit = 100): Promise<Review[]> {
  try {
    const ids = (await redis.zrange(PENDING_SET, 0, limit - 1, { rev: true })) as string[]
    if (!ids?.length) return []
    const reviews = await Promise.all(ids.map((id) => getReview(id)))
    return reviews.filter((r): r is Review => Boolean(r) && r!.status === 'pending')
  } catch (err) {
    console.error('[reviewStore] Failed to list pending reviews:', err)
    return []
  }
}


/**
 * Permanently remove a review.
 *
 * ADDED Sep 2026. Rejecting a review only flips its status — the record stays,
 * which is right for an ordinary "we're not publishing this" decision because
 * it leaves an audit trail. Deletion is for the cases where keeping the record
 * is itself the problem: a review containing someone's personal details, a
 * submission a customer has asked you to erase, obvious spam you don't want
 * accumulating, or content that shouldn't sit in your database at all.
 *
 * Removes the review from both index sets as well as the record itself, so a
 * deleted review cannot resurface in a listing through a stale index entry.
 * Revalidates the public cache so an approved-then-deleted review disappears
 * from the site immediately rather than at the next natural expiry.
 */
export async function deleteReview(id: string): Promise<boolean> {
  try {
    const review = await getReview(id)
    if (!review) return false
    await redis.del(reviewKey(id))
    await redis.zrem(PENDING_SET, id)
    await redis.zrem(APPROVED_SET, id)
    if (review.status === 'approved') revalidateTag(REVIEWS_CACHE_TAG)
    return true
  } catch (err) {
    console.error('[reviewStore] Failed to delete review:', err)
    return false
  }
}

/**
 * Approved reviews, for the admin screen — so published reviews can be
 * reviewed and removed after the fact, not only moderated on arrival.
 * Reads the store directly rather than the public cached path, because an
 * admin looking at the queue needs current state, not a cached snapshot.
 */
export async function listApprovedReviewsRaw(limit = 200): Promise<Review[]> {
  try {
    const ids = (await redis.zrange(APPROVED_SET, 0, limit - 1, { rev: true })) as string[]
    if (!ids?.length) return []
    const reviews = await Promise.all(ids.map((id) => getReview(id)))
    return reviews.filter((r): r is Review => Boolean(r) && r!.status === 'approved')
  } catch (err) {
    console.error('[reviewStore] Failed to list approved reviews for admin:', err)
    return []
  }
}