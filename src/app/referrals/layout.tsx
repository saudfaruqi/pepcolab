// app/referrals/layout.tsx — metadata carrier for the client component page.

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refer & Earn',
  description:
    'Share your PepcoLab referral link — friends get 15% off their first order, and you get 20% off yours every time they order.',
  alternates: { canonical: '/referrals' },
  openGraph: {
    title: 'Refer & Earn | PepcoLab',
    description: 'Give 15%, get 20%. Share your PepcoLab referral link with fellow researchers.',
    type: 'website',
  },
}

export default function ReferralsLayout({ children }: { children: React.ReactNode }) {
  return children
}
