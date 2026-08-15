// app/refund-policy/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    'Refund eligibility, cancellation windows, and how refunds are processed for PepcoLab research peptide orders across the UK and UAE.',
  alternates: { canonical: '/refund-policy' },
  openGraph: {
    title: 'Refund & Cancellation Policy | PepcoLab',
    description: 'Refund eligibility, cancellation windows, and how refunds are processed for orders across the UK and UAE.',
    type: 'website',
  },
}

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}