// src/app/reviews/page.tsx
//
// Public reviews page. Every approved review in one place, with verified
// purchases labelled as such and everything else labelled honestly.
//
// WHY A DEDICATED PAGE
// Reviews were only ever visible scattered across individual product pages,
// which means the cumulative weight of them was invisible — and for a
// supplier whose customers are choosing between claims they cannot check,
// that weight is the argument. It is also the page to point at from an email,
// a directory listing, or an Instagram bio.
//
// THE LABELLING IS THE POINT. Anyone can leave a review here (see
// /reviews/write), so the badge is what carries the information: "verified
// purchase" means an order code and matching email actually checked out
// against a completed order. Unverified reviews are shown, not hidden —
// suppressing them would be its own kind of dishonesty — but they are never
// dressed up as something they aren't.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { listApprovedReviewsRaw } from '@/lib/reviewStore'
import { Star, BadgeCheck } from 'lucide-react'

const INK = '#0D0D0D'
const PAPER = '#F7F5F1'
const BORDER = 'rgba(13,13,13,.08)'

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description:
    'What researchers say about PepcoLab — documentation, packaging, cold chain and service. Verified purchases are labelled as such.',
  alternates: { canonical: '/reviews' },
}

// RENDERED DYNAMICALLY, DELIBERATELY (fixed Sep 2026)
// ---------------------------------------------------
// This page originally set `revalidate = 600` and read through
// getApprovedReviews(), which goes via unstable_cache. Both were wrong here,
// for the reason documented at length in lib/reviewStore.ts:
//
// @upstash/redis issues its REST calls with `cache: 'no-store'` and offers no
// way to override that. On Next 14.2.5, unstable_cache does not fully
// insulate that from the calling route, so a statically-generated page that
// reads reviews trips DYNAMIC_SERVER_USAGE during `next build` — the read
// fails, and the page bakes an EMPTY reviews list into its HTML. Which is
// exactly what happened: the page shipped saying "nothing published yet"
// while approved reviews sat in Redis.
//
// An empty state that is wrong is worse than a slow page. So:
//   - force-dynamic, so the list is read per request rather than at build;
//   - listApprovedReviewsRaw(), which reads Redis directly and skips
//     unstable_cache entirely.
//
// The cost is a Redis round-trip per view, which for this page is nothing.
export const dynamic = 'force-dynamic'

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5`} style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} aria-hidden="true"
              fill={i <= n ? '#C8992A' : 'none'}
              color={i <= n ? '#C8992A' : 'rgba(13,13,13,.2)'} />
      ))}
    </span>
  )
}

export default async function ReviewsPage() {
  // Distinguish "no reviews" from "couldn't read reviews". Collapsing the two
  // is what produced a confident, false empty state — see the note above.
  let reviews: Awaited<ReturnType<typeof listApprovedReviewsRaw>> = []
  let loadFailed = false
  try {
    reviews = await listApprovedReviewsRaw(200)
  } catch (err) {
    console.error('[reviews] Failed to load approved reviews:', err)
    loadFailed = true
  }

  const verifiedCount = reviews.filter(r => r.verified).length
  const average = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return (
    <>
      <Nav />
      <main style={{ background: PAPER, minHeight: '70vh', padding: 'clamp(32px,5vw,56px) 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(28px,4.5vw,42px)', fontWeight: 700, letterSpacing: '-.035em', color: INK, margin: '0 0 10px' }}>
            Reviews
          </h1>

          {loadFailed ? (
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 26px' }}>
              Reviews couldn&apos;t be loaded just now. Please refresh in a moment &mdash; this is
              a temporary problem at our end, not an empty page.
            </p>
          ) : reviews.length > 0 ? (
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 26px' }}>
              {average.toFixed(1)} out of 5 across {reviews.length} published{' '}
              {reviews.length === 1 ? 'review' : 'reviews'}
              {verifiedCount > 0 && <>, {verifiedCount} from verified purchases</>}.
            </p>
          ) : (
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(13,13,13,.6)', margin: '0 0 26px' }}>
              Nothing published yet. We&apos;d rather show an empty page than fill it in
              ourselves &mdash; if you&apos;ve dealt with us, yours would be the first.
            </p>
          )}

          <Link href="/reviews/write" style={{
            display: 'inline-flex', alignItems: 'center', minHeight: 46, padding: '0 22px',
            marginBottom: 32, borderRadius: 999, background: INK, color: '#fff',
            fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
          }}>
            Write a review
          </Link>

          <div style={{ display: 'grid', gap: 12 }}>
            {reviews.map(r => (
              <article key={r.id} style={{
                background: '#fff', border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: 'clamp(18px,3vw,24px)',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Stars n={r.rating} />
                  {r.verified ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 11.5, fontWeight: 700, color: '#0A7B45',
                      background: 'rgba(10,123,69,.09)', padding: '4px 10px', borderRadius: 999,
                    }}>
                      <BadgeCheck size={13} aria-hidden="true" /> Verified purchase
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11.5, fontWeight: 600, color: 'rgba(13,13,13,.45)',
                      border: `1px solid ${BORDER}`, padding: '4px 10px', borderRadius: 999,
                    }}>
                      Unverified
                    </span>
                  )}
                  <span style={{ fontSize: 12.5, color: 'rgba(13,13,13,.4)', marginLeft: 'auto' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {r.productTitle && r.productTitle !== 'PepcoLab' && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 6 }}>
                    {r.productSlug
                      ? <Link href={`/products/${r.productSlug}`} style={{ color: INK }}>{r.productTitle}</Link>
                      : r.productTitle}
                  </div>
                )}

                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: INK, margin: '0 0 10px', whiteSpace: 'pre-line' }}>
                  {r.text}
                </p>
                <div style={{ fontSize: 13, color: 'rgba(13,13,13,.5)' }}>{r.authorName}</div>
              </article>
            ))}
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'rgba(13,13,13,.4)', marginTop: 30 }}>
            Every review is read by a person before publication and nothing is edited. We
            don&apos;t offer discounts or anything else in exchange for one. &ldquo;Verified
            purchase&rdquo; means an order number and matching email were checked against a
            completed order; reviews without that are published and labelled unverified.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}