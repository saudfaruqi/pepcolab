// app/contact/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with PepcoLab for order support, batch and Certificate of Analysis queries, or general questions about our research peptide catalogue in the UK and UAE.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Us | PepcoLab',
    description: 'Get in touch with PepcoLab for order support, batch queries, or general questions.',
    type: 'website',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
