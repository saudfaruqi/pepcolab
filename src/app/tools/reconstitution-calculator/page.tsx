// app/tools/reconstitution-calculator/page.tsx
//
// NEW ROUTE. Previously the reconstitution calculator only existed as one
// of four tools bundled into /tools, which itself had no metadata until
// this audit — so "peptide reconstitution calculator", one of the
// highest-intent non-branded terms in the category, had nothing on the
// site that could rank for it. This gives the calculator its own URL,
// title, meta description, and supporting copy, and links back to /tools
// for the other three calculators.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { ReconstitutionCalculator } from '@/components/ToolWidgets'
import { ChevronRight, ArrowRight } from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'Peptide Reconstitution Calculator',
  description:
    'Free peptide reconstitution calculator. Enter vial mass and target concentration to get the required diluent volume in mL and µL, with the underlying formula shown.',
  alternates: {
    canonical: '/tools/reconstitution-calculator',
    languages: {
      'en-GB': '/tools/reconstitution-calculator',
      'en-AE': '/tools/reconstitution-calculator',
      'x-default': '/tools/reconstitution-calculator',
    },
  },
  openGraph: {
    title: 'Peptide Reconstitution Calculator | PepcoLab',
    description:
      'Enter vial mass and target concentration to get the required diluent volume in mL and µL, with the underlying formula shown.',
    url: `${SITE_URL}/tools/reconstitution-calculator`,
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Peptide Reconstitution Calculator',
  applicationCategory: 'CalculatorApplication',
  operatingSystem: 'Any (web-based)',
  url: `${SITE_URL}/tools/reconstitution-calculator`,
  description:
    'Calculates required diluent volume for a lyophilised peptide vial given vial mass and target concentration.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
}

// GEO/SEO FIX (growth-playbook §04 dev checklist: "Structured data... HowTo
// (reconstitution)"). This didn't exist anywhere on the site — the calculator
// had a WebApplication entry but nothing describing the underlying process,
// which is exactly the kind of extractable, step-based content GEO answer
// engines lift directly (see §05, "Answer-first content structure").
const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Reconstitute a Lyophilised Peptide',
  description:
    'The general process for reconstituting a lyophilised peptide vial with diluent to a target concentration for laboratory research use.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Confirm the vial mass and target concentration',
      text: 'Check the vial label or Certificate of Analysis for the peptide mass in mg, and decide the target concentration in mg/mL for the research protocol.',
    },
    {
      '@type': 'HowToStep',
      name: 'Calculate the required diluent volume',
      text: 'Diluent volume (mL) = vial mass (mg) ÷ target concentration (mg/mL). The calculator above performs this automatically.',
    },
    {
      '@type': 'HowToStep',
      name: 'Bring diluent and vial to room temperature',
      text: 'Cold diluent added directly to a cold lyophilised vial increases the risk of incomplete or uneven dissolution.',
    },
    {
      '@type': 'HowToStep',
      name: 'Add diluent slowly, down the vial wall',
      text: 'Insert the needle at an angle and let the diluent run down the inside wall of the vial rather than injecting it directly onto the lyophilised powder, to avoid disrupting the peptide structure.',
    },
    {
      '@type': 'HowToStep',
      name: 'Swirl gently — do not shake',
      text: 'Gently swirl the vial to dissolve the powder. Shaking introduces excess agitation that can denature the peptide.',
    },
    {
      '@type': 'HowToStep',
      name: 'Store reconstituted peptide appropriately',
      text: 'Refrigerate the reconstituted vial and use within the compound-specific discard window — see our storage guide.',
    },
  ],
}

export default function ReconstitutionCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <Nav />

      <main className="min-h-screen bg-zinc-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16 lg:px-12">
            <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6">
              <Link href="/tools" className="hover:text-zinc-900">Tools</Link>
              <ChevronRight size={12} />
              <span className="text-zinc-900">Reconstitution Calculator</span>
            </nav>

            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Laboratory Tools
            </span>

            <h1 className="mt-4 text-4xl lg:text-6xl font-serif">
              Peptide Reconstitution Calculator
            </h1>

            <p className="mt-6 text-lg text-zinc-600 leading-relaxed max-w-2xl">
              Work out the diluent volume needed to reach a target concentration for a
              lyophilised peptide vial. Enter the vial mass and your desired concentration
              below.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12 lg:px-12">
          <ReconstitutionCalculator standalone />

          <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-zinc-900 mb-3">How the calculation works</h2>
            <p className="text-sm text-zinc-600 leading-relaxed mb-3">
              Required volume (mL) = (peptide mass in the vial, in mg × 1000) ÷ target concentration
              (mcg/mL). For example, a 5 mg vial reconstituted to a target of 1000 mcg/mL needs 5 mL
              of diluent.
            </p>
            <p className="text-sm text-zinc-600 leading-relaxed">
              This calculator assumes the vial mass entered is the nominal peptide mass on the
              label. Net peptide content — the share of that mass that is actually peptide rather
              than counter-ions or residual moisture — can differ from the nominal figure; see our{' '}
              <Link href="/guides/net-peptide-content" className="underline underline-offset-2 hover:text-zinc-900">
                guide to net peptide content
              </Link>{' '}
              for how to adjust for it. For technique — solvent choice, sterile handling, and
              storage after mixing — see our{' '}
              <Link href="/guides/peptide-reconstitution" className="underline underline-offset-2 hover:text-zinc-900">
                full reconstitution guide
              </Link>
              .
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              See all research calculators
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
