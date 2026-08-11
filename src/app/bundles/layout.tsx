// app/bundles/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Research Peptide Bundles & Stacks',
  description:
    'Pre-matched peptide bundles curated for common research protocols, including KLOW, GLOW and Wolverine Stack combinations. Save up to 15% versus buying individually.',
  alternates: { canonical: '/bundles' },
  openGraph: {
    title: 'Research Peptide Bundles & Stacks | PepcoLab',
    description:
      'Pre-matched peptide bundles curated for common research protocols. Save up to 15% versus buying individually.',
    type: 'website',
  },
}

export default function BundlesLayout({ children }: { children: React.ReactNode }) {
  return children
}
