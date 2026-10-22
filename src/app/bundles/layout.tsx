// app/bundles/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Research Compound Sets',
  description:
    'Pre-matched pairs of research compounds, supplied together at 10% below individual pricing. Batch COA published for every vial. For in-vitro research use only.',
  alternates: { canonical: '/bundles' },
  openGraph: {
    title: 'Research Compound Sets | PepcoLab',
    description:
      'Pre-matched pairs of research compounds, supplied together at 10% below individual pricing. Batch COA published for every vial. For in-vitro research use only.',
    type: 'website',
  },
}

export default function BundlesLayout({ children }: { children: React.ReactNode }) {
  return children
}
