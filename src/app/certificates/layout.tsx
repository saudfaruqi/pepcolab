// app/certificates/layout.tsx
//
// /certificates is a client component, so it can't export `metadata`
// directly — Next.js only reads that export from Server Components.
// This layout wraps it purely to carry the metadata.
//
// Previously unset, so the page inherited the homepage's title/description
// verbatim and competed with the homepage itself in search. This is the
// COA archive the site's positioning rests on, so it gets its own targeted
// tag rather than the brand default.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Certificate of Analysis Lookup — Verify Your Batch',
  description:
    'Look up the published Certificate of Analysis for any PepcoLab peptide batch by product and lot number. Independent COA verification for every research compound shipped to the UAE.',
  alternates: { canonical: '/certificates' },
  openGraph: {
    title: 'Certificate of Analysis Lookup — Verify Your Batch | PepcoLab',
    description:
      'Look up the published Certificate of Analysis for any PepcoLab peptide batch by product and lot number.',
    type: 'website',
  },
}

export default function CertificatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
