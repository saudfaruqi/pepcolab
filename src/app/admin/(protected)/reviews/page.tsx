// src/app/admin/(protected)/reviews/page.tsx
//
// Moderation queue.
//
// Reviews submitted through /reviews/write and /track-order arrive as
// 'pending' and are invisible on the site until approved. Previously the only
// way to approve one was the link in the "new review pending" email — which is
// only sent when REVIEW_MODERATION_TOKEN is set. Unset, reviews piled up with
// no way to see or action them.
//
// This screen reads the pending set directly and moderates through the admin
// session, so it works regardless of email configuration. The emailed links
// still function; they are no longer the only route.
import { listPendingReviews } from '@/lib/reviewStore'
import ReviewQueue, { type PendingReview } from './ReviewQueue'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  let reviews: PendingReview[] = []
  let loadError: string | null = null

  try {
    reviews = (await listPendingReviews()).map(r => ({
      id: r.id,
      productTitle: r.productTitle,
      productSlug: r.productSlug,
      authorName: r.authorName,
      rating: r.rating,
      text: r.text,
      verified: r.verified,
      orderShortCode: r.orderShortCode,
      createdAt: r.createdAt,
    }))
  } catch (err) {
    console.error('[admin/reviews] Failed to load pending reviews:', err)
    loadError = 'Could not load reviews — check the server logs.'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Reviews</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          {reviews.length} awaiting moderation. Approved reviews appear on the product page and
          on /reviews immediately.
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-[13px] leading-relaxed text-amber-900">
          <strong>Reject anything describing effects or outcomes</strong>, however positive. A
          product page carrying user-reported results would undo the research-use-only position
          the whole catalogue is written to hold. Reviews about documentation, packaging,
          delivery and service are what you want here.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>
      ) : (
        <ReviewQueue reviews={reviews} />
      )}
    </div>
  )
}