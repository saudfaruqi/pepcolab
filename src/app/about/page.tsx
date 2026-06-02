'use client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  ShieldCheck,
  FlaskConical,
  FileCheck,
  Microscope,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const STATS = [
  {
    value: '99%+',
    label: 'Average Purity',
  },
  {
    value: '40+',
    label: 'Research Compounds',
  },
  {
    value: '100%',
    label: 'COA Transparency',
  },
  {
    value: '24h',
    label: 'Dispatch Target',
  },
]

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Transparency',
    text: 'Every batch includes publicly accessible testing data, certificates of analysis, and purity verification.',
  },
  {
    icon: FlaskConical,
    title: 'Research First',
    text: 'Our catalogue is curated around compounds actively studied within modern peptide research.',
  },
  {
    icon: FileCheck,
    title: 'Independent Testing',
    text: 'Every production batch undergoes third-party analytical verification before release.',
  },
  {
    icon: Microscope,
    title: 'Scientific Standards',
    text: 'Strict quality-control processes ensure consistency, traceability, and reproducibility.',
  },
]

export default function AboutPage() {
  return (
    <>
      <Nav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-neutral-200 bg-[#f7f6f3]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,.08),transparent_40%)]" />

          <div className="max-w-7xl mx-auto px-2 lg:px-12 py-24 relative">
            <div className="max-w-3xl">
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-4">
                About PepcoLab
              </div>

              <h1 className="font-serif text-[clamp(48px,8vw,88px)] leading-[0.95] tracking-[-0.06em] text-neutral-950 mb-8">
                Research
                <br />
                without compromise.
              </h1>

              <p className="text-[17px] leading-8 text-neutral-600 max-w-2xl">
                PepcoLab was built around a simple principle: researchers
                should have access to verified compounds backed by transparent
                analytical data, rigorous quality control, and dependable
                batch-to-batch consistency.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {STATS.map(stat => (
                <div key={stat.label}>
                  <div className="font-serif text-5xl lg:text-6xl tracking-[-0.06em] text-neutral-950">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-neutral-500 uppercase tracking-[0.12em]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-3">
                  Our Story
                </div>

                <h2 className="font-serif text-5xl tracking-[-0.05em] text-neutral-950 mb-6">
                  Built for serious research.
                </h2>
              </div>

              <div className="space-y-6 text-neutral-600 leading-8">
                <p>
                  The peptide industry has historically suffered from
                  inconsistent quality standards, incomplete documentation,
                  and limited transparency around testing practices.
                </p>

                <p>
                  PepcoLab was founded to address those challenges by creating
                  a research-focused platform where analytical verification is
                  treated as a requirement rather than a marketing feature.
                </p>

                <p>
                  Every product released through our catalogue is linked to
                  documented batch data, enabling researchers to verify purity,
                  identity, and testing history before beginning work.
                </p>

                <p>
                  Our objective is straightforward: provide reliable research
                  materials supported by data researchers can trust.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-[#faf9f7] border-y border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="max-w-2xl mb-14">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-3">
                Why Researchers Choose Us
              </div>

              <h2 className="font-serif text-5xl tracking-[-0.05em] text-neutral-950">
                Data-backed quality at every stage.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {VALUES.map(item => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="bg-white border border-neutral-200 rounded-3xl p-8"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                      <Icon size={20} />
                    </div>

                    <h3 className="text-xl font-semibold text-neutral-950 mb-3">
                      {item.title}
                    </h3>

                    <p className="text-neutral-600 leading-7">
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Quality */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-3">
                  Quality Assurance
                </div>

                <h2 className="font-serif text-5xl tracking-[-0.05em] text-neutral-950 mb-6">
                  Every batch verified.
                </h2>

                <p className="text-neutral-600 leading-8">
                  We maintain strict quality-control procedures and publish
                  testing information wherever possible to support complete
                  research transparency.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  'Identity verification',
                  'Purity analysis',
                  'Certificate of Analysis publication',
                  'Batch traceability',
                  'Lot-specific documentation',
                  'Transparent reporting standards',
                ].map(item => (
                  <div
                    key={item}
                    className="flex items-center gap-4 border-b border-neutral-200 pb-5"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600 flex-shrink-0"
                    />
                    <span className="text-neutral-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="bg-[#0d0d0d] text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="max-w-3xl mb-16">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-semibold mb-3">
                Growth
              </div>

              <h2 className="font-serif text-5xl tracking-[-0.05em]">
                Continuing to expand.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  year: '2023',
                  text: 'Foundation and initial catalogue launch.',
                },
                {
                  year: '2024',
                  text: 'Expanded testing transparency and documentation.',
                },
                {
                  year: '2025',
                  text: 'Broader peptide catalogue and public COA library.',
                },
              ].map(item => (
                <div key={item.year}>
                  <div className="font-serif text-5xl text-white mb-4">
                    {item.year}
                  </div>

                  <p className="text-white/60 leading-7">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-4">
              Explore
            </div>

            <h2 className="font-serif text-5xl tracking-[-0.05em] text-neutral-950 mb-6">
              Browse our research catalogue.
            </h2>

            <p className="text-neutral-600 max-w-2xl mx-auto leading-8 mb-10">
              Discover research compounds supported by transparent testing,
              published batch information, and rigorous quality standards.
            </p>

            <Link
              href="/products"
              className="inline-flex items-center gap-3 bg-neutral-950 text-white px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition"
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