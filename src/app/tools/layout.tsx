// app/tools/layout.tsx
//
// /tools is a client component; metadata lives here instead.
//
// Holds the reconstitution calculator, one of the highest-intent
// non-branded terms in the category, and previously invisible to search
// because the page inherited the homepage title/description. This gets
// it a real title until the tool is split out to its own
// /tools/reconstitution-calculator URL (tracked separately).

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Peptide Reconstitution & Dosage Calculator',
  description:
    'Free peptide reconstitution calculator: work out bacteriostatic water volume, concentration and dosage per vial for any research peptide, with unit conversions built in.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Peptide Reconstitution & Dosage Calculator | PepcoLab',
    description:
      'Free peptide reconstitution calculator: work out bacteriostatic water volume, concentration and dosage per vial.',
    type: 'website',
  },
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
