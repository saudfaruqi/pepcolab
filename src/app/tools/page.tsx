'use client'

// app/tools/page.tsx
//
// Tool implementations moved to components/ToolWidgets.tsx so the
// Reconstitution Calculator can also live at its own indexable URL
// (/tools/reconstitution-calculator — see that route's page.tsx). This
// hub page keeps all four tools inline for people already browsing /tools,
// and links out to the dedicated calculator page for anyone who wants to
// go straight to it or share a direct link.

import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { ArrowRight } from 'lucide-react'
import {
  ReconstitutionCalculator,
  DoseCalculator,
  BatchVerifier,
  PurityCalculator,
} from '@/components/ToolWidgets'

export default function ToolsPage() {
  return (
    <>
      <Nav />

      <main className="min-h-screen bg-zinc-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
            <div className="max-w-3xl">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                Laboratory Tools
              </span>

              <h1 className="mt-4 text-5xl lg:text-7xl font-serif">
                Research Calculators
              </h1>

              <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
                Precision-grade calculation tools designed for research workflows.
                All formulas are validated for standard laboratory concentration models.
              </p>

              <Link
                href="/tools/reconstitution-calculator"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600"
              >
                Open the Reconstitution Calculator on its own page
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <ReconstitutionCalculator />
            <DoseCalculator />
            {/* NEW: id target so /tools#batch-verifier (used by the
               homepage ToolsSection card) actually scrolls to this widget
               instead of just landing at the top of the hub page.
               scroll-mt-24 offsets for the fixed Nav. */}
            <div id="batch-verifier" className="scroll-mt-24">
              <BatchVerifier />
            </div>
            <PurityCalculator />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
