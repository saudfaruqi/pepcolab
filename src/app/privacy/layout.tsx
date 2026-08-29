// app/privacy/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How PepcoLab collects, uses and protects customer data, including order, payment and delivery information, for UAE customers.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Privacy Policy | PepcoLab',
    description: 'How PepcoLab collects, uses and protects customer data.',
    type: 'website',
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
