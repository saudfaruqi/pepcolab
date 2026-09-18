// src/app/reviews/write/layout.tsx
//
// NOINDEX for the review submission form (Sep 2026).
//
// page.tsx is a client component, so it cannot export `metadata` itself —
// this layout exists only to carry the robots directive.
//
// WHY: the page is a form. It has no content a searcher could ever want to
// land on, but it sat in the sitemap at priority 0.4 competing for crawl
// budget on a domain where Search Console reports 8 pages as "Discovered —
// currently not indexed" with no crawl attempted. Keeping a form out of the
// index is ordinary hygiene; it is not, on its own, the fix for that crawl
// rationing (see the note in app/sitemap.ts).
//
// The page stays fully reachable — product pages and the review-request
// email link to it. Only indexing is turned off.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function WriteReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}