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
  { value: '99%+', label: 'Avg. Verified Purity' },
  { value: '40+', label: 'Research Compounds' },
  { value: '100%', label: 'Batch COA Coverage' },
  { value: '<24h', label: 'Processing Target' },
]

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Verified Transparency',
    text: 'Each batch is supported by documented analytical data including purity and identity verification where applicable.',
  },
  {
    icon: FlaskConical,
    title: 'Research-Focused Catalogue',
    text: 'Our product range is structured exclusively for laboratory and non-clinical scientific research applications.',
  },
  {
    icon: FileCheck,
    title: 'Independent Testing Standards',
    text: 'Where applicable, third-party analytical testing is conducted to support consistency and batch verification.',
  },
  {
    icon: Microscope,
    title: 'Controlled Quality Systems',
    text: 'We apply standardized handling and documentation procedures to maintain traceability and reproducibility.',
  },
]

export default function AboutPage() {
  return (
    <>
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
                We operate a research supply platform focused on providing
                clearly documented, batch-traceable compounds intended strictly
                for laboratory and scientific investigation. Our emphasis is on
                transparency, reproducibility, and controlled quality systems.
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
                The research peptide and fine chemical sector has historically
                lacked standardized transparency, particularly in relation to
                batch verification and analytical reporting.
              </p>

              <p>
                This gap creates uncertainty for researchers who rely on
                reproducible materials for controlled laboratory studies.
              </p>

              <p>
                Our platform was developed to address this issue through
                structured documentation, verifiable batch data, and consistent
                quality procedures.
              </p>

              <p>
                Each product is associated with traceable production
                information intended to support scientific evaluation and
                reproducibility.
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
                Our quality framework is designed to ensure traceability and
                consistency across production, handling, and distribution
                stages.
              </p>
            </div>

            <div className="space-y-5">
              {[
                'Identity confirmation where applicable',
                'Purity and composition analysis',
                'Batch-level traceability records',
                'Structured COA documentation',
                'Controlled storage and handling procedures',
                'Standardized reporting practices',
              ].map(item => (
                <div
                  key={item}
                  className="flex items-start gap-4 border-b border-neutral-200 pb-5"
                >
                  <CheckCircle2 size={18} className="text-emerald-600 mt-1" />
                  <span className="text-neutral-700 leading-7">{item}</span>
                </div>
              ))}
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
              Browse our catalogue of research materials supported by structured
              documentation, batch traceability, and quality control
              procedures.
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