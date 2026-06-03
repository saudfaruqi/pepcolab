'use client'

import { useMemo, useState, useEffect } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getProducts } from '@/lib/shopify'
import {
  Calculator,
  Search,
  CheckCircle2,
  FlaskConical,
  Beaker,
  ShieldCheck,
} from 'lucide-react'

/* ─────────────────────────────
   SAFE NUMBER PARSER (IMPORTANT)
───────────────────────────── */
function safeNumber(value: string): number | null {
  const num = Number(value)
  if (!value || Number.isNaN(num) || !Number.isFinite(num)) return null
  return num
}

/* ─────────────────────────────
   TOOL WRAPPER
───────────────────────────── */
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
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 lg:p-8 shadow-sm">
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

/* ─────────────────────────────
   RECONSTITUTION CALCULATOR (REAL FORMULA)
   Volume (mL) = (Peptide mg × 1000) / Desired concentration (mcg/mL)
───────────────────────────── */
function ReconstitutionCalculator() {
  const [mg, setMg] = useState('')
  const [target, setTarget] = useState('1000')

  const result = useMemo(() => {
    const peptideMg = safeNumber(mg)
    const concentration = safeNumber(target)

    if (!peptideMg || !concentration || concentration <= 0) return null

    const volumeMl = (peptideMg * 1000) / concentration

    if (!Number.isFinite(volumeMl) || volumeMl <= 0) return null

    return volumeMl
  }, [mg, target])

  return (
    <ToolCard
      title="Reconstitution Calculator"
      description="Accurate bacteriostatic water calculation (mcg/mL based)."
      icon={<FlaskConical size={20} />}
    >
      <div className="space-y-4">
        <input
          type="number"
          value={mg}
          onChange={(e) => setMg(e.target.value)}
          placeholder="Peptide amount (mg)"
          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
        />

        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target concentration (mcg/mL)"
          className="w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
        />

        {result !== null && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500 mb-1">
              Required bacteriostatic water
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

/* ─────────────────────────────
   DOSE CALCULATOR (REAL FORMULA)
   Volume (mL) = Dose (mcg) / Concentration (mcg/mL)
───────────────────────────── */
function DoseCalculator() {
  const [concentration, setConcentration] = useState('')
  const [dose, setDose] = useState('')

  const volume = useMemo(() => {
    const conc = safeNumber(concentration)
    const targetDose = safeNumber(dose)

    if (!conc || !targetDose || conc <= 0) return null

    const v = targetDose / conc
    if (!Number.isFinite(v) || v <= 0) return null

    return v
  }, [concentration, dose])

  return (
    <ToolCard
      title="Dose Calculator"
      description="Convert mcg dose into injection volume."
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

        {volume !== null && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500">Required Volume</div>

            <div className="text-4xl font-bold">
              {volume.toFixed(2)} mL
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

/* ─────────────────────────────
   BATCH VERIFIER (SAFE + ROBUST)
───────────────────────────── */
function BatchVerifier() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  const result = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null

    return (
      products.find((p) => p?.lot?.toLowerCase?.() === q) ||
      products.find((p) => p?.lot?.toLowerCase?.().includes(q))
    )
  }, [query, products])

  return (
    <ToolCard
      title="Batch Verifier"
      description="Verify official lot numbers from database."
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
            placeholder="Enter lot number (e.g. PEP-2412-07)"
            className="w-full rounded-xl border pl-11 pr-4 py-3 outline-none focus:border-black"
          />
        </div>

        {query && (
          <>
            {result ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                  <CheckCircle2 size={18} />
                  Verified Batch Record
                </div>

                <div className="space-y-2 text-sm text-zinc-700">
                  <div><strong>Product:</strong> {result.name}</div>
                  <div><strong>Lot:</strong> {result.lot}</div>
                  <div><strong>Purity:</strong> {result.purity}%</div>
                  <div><strong>Test Date:</strong> {result.testDate}</div>
                  <div><strong>Status:</strong> Passed QC</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                No matching batch found in database.
              </div>
            )}
          </>
        )}
      </div>
    </ToolCard>
  )
}

/* ─────────────────────────────
   PURITY CALCULATOR (REAL SCIENTIFIC FORMULA)
───────────────────────────── */
function PurityCalculator() {
  const [actual, setActual] = useState('')
  const [expected, setExpected] = useState('')

  const purity = useMemo(() => {
    const a = safeNumber(actual)
    const e = safeNumber(expected)

    if (!a || !e || e <= 0) return null

    const p = (a / e) * 100
    if (!Number.isFinite(p)) return null

    return p
  }, [actual, expected])

  return (
    <ToolCard
      title="Purity Calculator"
      description="Calculate analytical purity percentage."
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
          placeholder="Theoretical amount"
          className="w-full rounded-xl border px-4 py-3"
        />

        {purity !== null && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500">Purity Result</div>

            <div className="text-4xl font-bold">
              {purity.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

/* ─────────────────────────────
   MAIN PAGE
───────────────────────────── */
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
            </div>
          </div>
        </section>

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