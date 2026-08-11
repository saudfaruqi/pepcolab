// app/terms/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms and conditions governing orders, use of research materials, shipping and liability for purchases made through PepcoLab.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Terms & Conditions | PepcoLab',
    description: 'Terms and conditions governing orders, use of research materials, shipping and liability.',
    type: 'website',
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
