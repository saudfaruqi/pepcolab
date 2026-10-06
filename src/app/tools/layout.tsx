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

// COMPLIANCE (Oct 2026 content audit, Critical). This metadata previously
// read "Peptide Reconstitution & Dosage Calculator", with a description
// offering to "work out ... dosage per vial". That is the page title search
// engines showed, the text shared on social, and the single clearest
// human-use signal on the site — on the one page whose whole purpose could
// otherwise be read as laboratory arithmetic.
//
// The tool itself was already fine: it computes concentration (mg/mL) and
// solves V = amount / concentration, which is ordinary dilution maths. Only
// the framing was wrong, so only the framing changed.
//
// Keep this page's copy in terms of CONCENTRATION and VOLUME. Do not
// reintroduce "dosage", "dose", "per vial" or any per-administration
// framing here or in components/ToolWidgets.tsx.
export const metadata: Metadata = {
  title: 'Peptide Concentration Calculator (mg/mL)',
  description:
    'Free peptide concentration calculator: work out solvent volume and the resulting concentration in mg/mL for a lyophilised research peptide, with unit conversions built in.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Peptide Concentration Calculator (mg/mL) | PepcoLab',
    description:
      'Work out solvent volume and the resulting concentration in mg/mL for a lyophilised research peptide.',
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