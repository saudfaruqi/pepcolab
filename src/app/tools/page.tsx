'use client'

import { useMemo, useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import {getProducts} from '@/lib/shopify'
import {
  Calculator,
  Search,
  CheckCircle2,
  FlaskConical,
  Beaker,
  ShieldCheck,
} from 'lucide-react'

function ToolCard({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
          {icon}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>

      {children}
    </div>
  )
}

function ReconstitutionCalculator() {
  const [mg, setMg] = useState('')
  const [target, setTarget] = useState('1000')

  const result = useMemo(() => {
    const peptideMg = Number(mg)
    const concentration = Number(target)

    if (!peptideMg || !concentration) return null

    return (peptideMg * 1000) / concentration
  }, [mg, target])

  return (
    <ToolCard
      title="Reconstitution Calculator"
      description="Calculate bacteriostatic water volume."
      icon={<FlaskConical size={20} />}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Peptide Amount (mg)
          </label>
          <input
            type="number"
            value={mg}
            onChange={(e) => setMg(e.target.value)}
            placeholder="5"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Target Concentration (mcg/mL)
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {result && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500 mb-1">
              Add bacteriostatic water
            </div>

            <div className="text-4xl font-bold tracking-tight">
              {result.toFixed(2)} mL
            </div>

            <div className="text-sm text-zinc-500 mt-2">
              {(result * 1000).toFixed(0)} µL
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function DoseCalculator() {
  const [concentration, setConcentration] = useState('')
  const [dose, setDose] = useState('')

  const units = useMemo(() => {
    const conc = Number(concentration)
    const targetDose = Number(dose)

    if (!conc || !targetDose) return null

    return targetDose / conc
  }, [concentration, dose])

  return (
    <ToolCard
      title="Dose Calculator"
      description="Convert desired dose into injection volume."
      icon={<Beaker size={20} />}
    >
      <div className="space-y-4">
        <input
          type="number"
          value={concentration}
          onChange={(e) => setConcentration(e.target.value)}
          placeholder="Concentration (mcg/mL)"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          type="number"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          placeholder="Desired dose (mcg)"
          className="w-full rounded-xl border px-4 py-3"
        />

        {units && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500">
              Required Volume
            </div>

            <div className="text-4xl font-bold">
              {units.toFixed(2)} mL
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

function BatchVerifier() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    getProducts().then(setProducts)
  }, [])

  const result = useMemo(() => {
    if (!query) return null

    return products.find((p) =>
      p.lot?.toLowerCase().includes(query.toLowerCase())
    )
  }, [query, products])

  return (
    <ToolCard
      title="Batch Verifier"
      description="Search any published lot number."
      icon={<ShieldCheck size={20} />}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="PEP-2412-07"
            className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none focus:border-black"
          />
        </div>

        {query && (
          <>
            {result ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                  <CheckCircle2 size={18} />
                  Batch Verified
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Product:</strong> {result.name}
                  </div>

                  <div>
                    <strong>Lot:</strong> {result.lot}
                  </div>

                  <div>
                    <strong>Purity:</strong> {result.purity}%
                  </div>

                  <div>
                    <strong>Test Date:</strong> {result.testDate}
                  </div>

                  <div>
                    <strong>Status:</strong> Passed
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
                No batch found.
              </div>
            )}
          </>
        )}
      </div>
    </ToolCard>
  )
}

function PurityCalculator() {
  const [actual, setActual] = useState('')
  const [expected, setExpected] = useState('')

  const purity = useMemo(() => {
    const a = Number(actual)
    const e = Number(expected)

    if (!a || !e) return null

    return (a / e) * 100
  }, [actual, expected])

  return (
    <ToolCard
      title="Purity Calculator"
      description="Calculate purity percentage."
      icon={<Calculator size={20} />}
    >
      <div className="space-y-4">
        <input
          type="number"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          placeholder="Measured amount"
          className="w-full rounded-xl border px-4 py-3"
        />

        <input
          type="number"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="Expected amount"
          className="w-full rounded-xl border px-4 py-3"
        />

        {purity && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500">Calculated Purity</div>

            <div className="text-4xl font-bold">
              {purity.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

export default function ToolsPage() {
  return (
    <>
      <Nav />

      <main className="min-h-screen bg-zinc-50">
        {/* Hero */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
            <div className="max-w-3xl">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                Research Utilities
              </span>

              <h1 className="mt-4 text-5xl lg:text-7xl font-serif tracking-tight text-zinc-900">
                Lab Tools
              </h1>

              <p className="mt-6 text-lg text-zinc-600 leading-relaxed">
                Practical calculators and verification tools for peptide
                researchers. Fast, accurate, and designed for day-to-day
                laboratory workflows.
              </p>
            </div>
          </div>
        </section>

        {/* Tools */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <ReconstitutionCalculator />
            <DoseCalculator />
            <BatchVerifier />
            <PurityCalculator />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}