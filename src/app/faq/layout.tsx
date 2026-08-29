// app/faq/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about ordering, shipping, storage, batch testing and Certificates of Analysis for PepcoLab research peptides in the UK and UAE.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Frequently Asked Questions | PepcoLab',
    description:
      'Answers to common questions about ordering, shipping, storage, batch testing and Certificates of Analysis.',
    type: 'website',
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
