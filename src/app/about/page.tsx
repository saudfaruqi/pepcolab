// src/app/about/page.tsx
//
// FIX: previously 'use client' with no hooks in use anywhere in the file —
// there was no reason for it to be a client component at all. Removing the
// directive alone makes this a Server Component with zero other changes
// needed to the JSX. Content below has also been substantially expanded
// per the request for a "very detailed" About page, and real registration
// details (Companies House number, legal name) are now stated on-page
// instead of only living inside the JSON-LD in layout.tsx.

import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import {
  ShieldCheck,
  FlaskConical,
  FileCheck,
  Microscope,
  ArrowRight,
  CheckCircle2,
  Snowflake,
  FileText,
  Building2,
} from 'lucide-react'

const SITE_URL = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'About PepcoLab — Research-Grade Peptide Supplier, UK & UAE',
  description:
    'PepcoLab is a UK-registered research peptide and laboratory compound supplier serving the UK and UAE, built around published batch documentation and independent third-party testing.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About PepcoLab',
    description:
      'A UK-registered research peptide supplier built around published batch documentation and independent third-party testing, serving the UK and UAE.',
    url: `${SITE_URL}/about`,
    type: 'website',
  },
}

const STATS = [
  { value: '78+', label: 'Verified Compounds' },
  { value: '100%', label: 'Batch COA Coverage' },
  { value: '2', label: 'Markets Served — UK & UAE' },
  { value: '24h', label: 'Cold-Chain Dispatch Target' },
]

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Verified Transparency',
    text: 'Every batch we sell is backed by a published Certificate of Analysis, tested by Eurofins UK, covering identity and HPLC purity — not a purity number asserted on a product page with nothing behind it.',
  },
  {
    icon: FlaskConical,
    title: 'Research-Focused Catalogue',
    text: 'Our range is structured exclusively for laboratory and non-clinical scientific research. Product pages describe compound identity and documentation, not dosing, administration, or expected outcomes.',
  },
  {
    icon: FileCheck,
    title: 'Independent Testing Standards',
    text: 'Analytical testing is conducted by a third-party laboratory, not an in-house team with an obvious incentive to pass its own product. That separation is the point of third-party testing.',
  },
  {
    icon: Microscope,
    title: 'Controlled Quality Systems',
    text: 'Standardised handling, batch-level lot tracking, and consistent documentation procedures across the catalogue, so a result on a COA can be traced back to the exact vial it describes.',
  },
]

const QUALITY_STEPS = [
  { title: 'Identity confirmation', text: 'Compound identity is confirmed against the expected molecular sequence before a batch is released for sale.' },
  { title: 'HPLC purity analysis', text: 'High-performance liquid chromatography quantifies purity as a percentage of total peak area, with the chromatogram published alongside the number.' },
  { title: 'Batch-level traceability', text: 'Every product carries a lot number linking it to its specific test result — not a single COA reused across every unit ever sold.' },
  { title: 'Structured COA documentation', text: 'Certificates follow a consistent format (compound, lot, test date, purity, testing lab) so they can be read and cross-checked quickly.' },
  { title: 'Cold-chain storage and handling', text: 'Temperature-controlled packaging on dispatch, reflecting how peptides actually degrade in transit — not just at rest in a warehouse.' },
  { title: 'Standardised reporting', text: 'The same documentation standard applies whether an order ships to London or Dubai — the UAE catalogue isn\'t held to a lighter standard than the UK one.' },
]

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: `${SITE_URL}/about`,
    mainEntity: {
      '@type': 'Organization',
      name: 'PepcoLab',
      legalName: 'SEE BEE DEE LIMITED',
      url: SITE_URL,
      identifier: { '@type': 'PropertyValue', name: 'Companies House', value: '17072052' },
      areaServed: ['United Kingdom', 'United Arab Emirates'],
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Nav />

      <main className="bg-white text-neutral-900">

        {/* HERO */}
        <section className="relative border-b border-neutral-200 bg-[#f7f6f3] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.08),transparent_45%)]" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-28 relative">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-4">
                About Us
              </p>

              <h1 className="font-serif text-[clamp(44px,6vw,86px)] leading-[0.95] tracking-[-0.06em] text-neutral-950 mb-8">
                Built for
                <br />
                research integrity.
              </h1>

              <p className="text-[17px] leading-8 text-neutral-600 max-w-2xl">
                PepcoLab is a UK-registered supplier of research-grade peptides and laboratory
                compounds, serving researchers in the United Kingdom and United Arab Emirates.
                We supply strictly for laboratory and in-vitro research use — every product is
                documented with a batch-specific Certificate of Analysis, and every claim we make
                about a compound is one we can point to a test result for.
              </p>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {STATS.map(stat => (
                <div key={stat.label}>
                  <div className="font-serif text-5xl lg:text-6xl tracking-[-0.06em] text-neutral-950">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                Our Background
              </p>

              <h2 className="font-serif text-5xl tracking-[-0.05em] text-neutral-950">
                A response to inconsistent research standards.
              </h2>
            </div>

            <div className="space-y-6 text-neutral-600 leading-8">
              <p>
                The research peptide sector has a documentation problem. Purity claims are cheap to
                print on a product page and expensive for a buyer to verify independently — and across
                the UK and UAE markets, it's common to see the same generic "99% pure, HPLC verified"
                line repeated across dozens of near-identical storefronts with no batch data behind it.
              </p>

              <p>
                That gap creates real uncertainty for researchers who need reproducible materials for
                controlled laboratory work. A compound that varies unpredictably between orders — or
                whose stated purity can't be checked against an actual chromatogram — introduces a
                variable into an experiment before the experiment has even started.
              </p>

              <p>
                PepcoLab was built around a simple operating rule: every batch we sell has a
                Certificate of Analysis behind it, tested by Eurofins UK, published for that specific
                lot — not a generic PDF reused across every unit we've ever sold. If we can't produce
                that documentation for a batch, we don't sell it.
              </p>

              <p>
                Our compounds are manufactured and sourced from Denver, Colorado, USA, then batch-tested
                by Eurofins UK before being released for dispatch to the UK and UAE — the same supply
                chain and documentation standard regardless of which market an order ships to.
              </p>

              <p>
                We serve both the UK and UAE from that same standard. Pricing and currency adapt to
                where you're ordering from (GBP for UK researchers, AED for UAE researchers), but the
                testing and documentation requirement behind every product does not change between
                markets.
              </p>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="bg-[#faf9f7] border-y border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="max-w-2xl mb-14">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                Core Principles
              </p>

              <h2 className="font-serif text-5xl tracking-[-0.05em] text-neutral-950">
                Standards that guide every batch.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {VALUES.map(v => {
                const Icon = v.icon

                return (
                  <div
                    key={v.title}
                    className="bg-white border border-neutral-200 rounded-3xl p-8"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                      <Icon size={20} />
                    </div>

                    <h3 className="text-xl font-semibold mb-3 text-neutral-950">
                      {v.title}
                    </h3>

                    <p className="text-neutral-600 leading-7">
                      {v.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* QUALITY */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">
                Quality Framework
              </p>

              <h2 className="font-serif text-5xl tracking-[-0.05em] text-neutral-950 mb-6">
                Documented verification at each stage.
              </h2>

              <p className="text-neutral-600 leading-8">
                Six checkpoints run between synthesis and dispatch. Each one produces a record that
                traces back to the specific batch and, ultimately, the specific vial a researcher
                receives.
              </p>
            </div>

            <div className="space-y-5">
              {QUALITY_STEPS.map(step => (
                <div
                  key={step.title}
                  className="flex items-start gap-4 border-b border-neutral-200 pb-5"
                >
                  <CheckCircle2 size={18} className="text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-neutral-900 font-semibold mb-1">{step.title}</div>
                    <span className="text-neutral-600 leading-7 text-[15px]">{step.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO WE SERVE + LOGISTICS */}
        <section className="bg-[#faf9f7] border-y border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 grid lg:grid-cols-3 gap-8">
            <div className="bg-white border border-neutral-200 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                <Building2 size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-950">Who We Serve</h3>
              <p className="text-neutral-600 leading-7">
                Independent researchers, laboratory technicians, and research organisations in the
                UK and UAE who need documented, batch-traceable compounds for in-vitro and laboratory
                study. We do not offer guidance on human or veterinary administration, and our product
                pages are written accordingly.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                <Snowflake size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-950">Cold-Chain Logistics</h3>
              <p className="text-neutral-600 leading-7">
                Temperature-controlled packaging on every order, with next-day tracked dispatch across
                the UK and fast dispatch across the UAE. See our{' '}
                <Link href="/shipping" className="underline decoration-neutral-300 hover:decoration-neutral-600">
                  shipping page
                </Link>{' '}
                for current delivery windows by region.
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-8">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                <FileText size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-950">Registration</h3>
              <p className="text-neutral-600 leading-7">
                PepcoLab is operated by SEE BEE DEE LIMITED, a company registered in the UK
                (Companies House number 17072052). Read our{' '}
                <Link href="/terms" className="underline decoration-neutral-300 hover:decoration-neutral-600">
                  terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline decoration-neutral-300 hover:decoration-neutral-600">
                  privacy policy
                </Link>{' '}
                for full detail.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950 text-white">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-4">
              Explore Catalogue
            </p>

            <h2 className="font-serif text-5xl tracking-[-0.05em] mb-6">
              Access verified research compounds.
            </h2>

            <p className="text-white/60 max-w-2xl mx-auto leading-8 mb-10">
              Browse our catalogue of research materials, each supported by structured documentation,
              batch traceability, and independent quality control — or read our{' '}
              <Link href="/guides" className="underline decoration-white/30 hover:decoration-white">
                research guides
              </Link>{' '}
              for handling, storage, and compliance reference.
            </p>

            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-white text-neutral-950 px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition"
            >
              View Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
