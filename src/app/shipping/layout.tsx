// app/shipping/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping & Delivery Information',
  description:
    'Dispatch times, tracked delivery, cold-chain packaging and international shipping policy for PepcoLab research peptide orders across the UK and UAE.',
  alternates: { canonical: '/shipping' },
  openGraph: {
    title: 'Shipping & Delivery Information | PepcoLab',
    description: 'Dispatch times, tracked delivery and cold-chain packaging for orders across the UK and UAE.',
    type: 'website',
  },
}

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children
}
