// src/app/reviews/write/layout.tsx
//
// NEW (Oct 2026). /reviews/write is a client component, so it cannot export
// metadata itself — same arrangement as app/tools/layout.tsx.
//
// It exists only to set noindex. The page is a submission form: there is
// nothing on it to rank for, and Search Console was reporting it under
// "Discovered — currently not indexed" alongside pages that do matter, each
// one a request on a small crawl budget. It has also been removed from
// sitemap.ts. "follow" is kept so its links still count.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Write a Review',
  robots: { index: false, follow: true },
}

export default function ReviewWriteLayout({ children }: { children: React.ReactNode }) {
  return children
}