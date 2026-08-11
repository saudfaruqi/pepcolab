'use client'

// components/ToolWidgets.tsx
//
// Extracted from the old monolithic app/tools/page.tsx so the
// Reconstitution Calculator can live at its own indexable URL
// (/tools/reconstitution-calculator) without duplicating the component
// logic. /tools keeps all four tools inline for people browsing the hub;
// the dedicated page reuses ReconstitutionCalculator directly.

import { useMemo, useState, useEffect } from 'react'
import { getProducts } from '@/lib/shopify'
import { Calculator, Search, CheckCircle2, FlaskConical, Beaker, ShieldCheck } from 'lucide-react'

/* ─────────────────────────────
   SAFE NUMBER PARSER
───────────────────────────── */
export function safeNumber(value: string): number | null {
  const num = Number(value)
  if (!value || Number.isNaN(num) || !Number.isFinite(num)) return null
  return num
}

/* ─────────────────────────────
   TOOL WRAPPER
───────────────────────────── */
export function ToolCard({
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
   RECONSTITUTION CALCULATOR
   Volume (mL) = (Peptide mg × 1000) / Desired concentration (mcg/mL)
───────────────────────────── */
export function ReconstitutionCalculator({ standalone = false }: { standalone?: boolean }) {
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

  const body = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Peptide amount in the vial (mg)
        </label>
        <input
          type="number"
          value={mg}
          onChange={(e) => setMg(e.target.value)}
          placeholder="e.g. 5"
          className="w-full bg-white rounded-xl border px-4 py-3 outline-none focus:border-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          Target concentration (mcg/mL)
        </label>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="1000"
          className="w-full bg-white rounded-xl border px-4 py-3 outline-none focus:border-black"
        />
      </div>

      {result !== null && (
        <div className="rounded-2xl bg-zinc-50 p-5 text-center">
          <div className="text-sm text-zinc-500 mb-1">Required diluent volume</div>
          <div className="text-4xl font-bold tracking-tight">{result.toFixed(2)} mL</div>
          <div className="text-sm text-zinc-500 mt-2">{(result * 1000).toFixed(0)} µL</div>
        </div>
      )}
    </div>
  )

  if (!standalone) {
    return (
      <ToolCard
        title="Reconstitution Calculator"
        description="Diluent volume calculation (mcg/mL based)."
        icon={<FlaskConical size={20} />}
      >
        {body}
      </ToolCard>
    )
  }

  // Standalone layout for the dedicated /tools/reconstitution-calculator
  // page — bigger, no card chrome (the page itself supplies that), used
  // as the primary on-page content rather than one of a 2x2 grid.
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 lg:p-10 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
          <FlaskConical size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Reconstitution Calculator</h2>
          <p className="text-sm text-zinc-500">Diluent volume for a target concentration, based on vial mass.</p>
        </div>
      </div>
      {body}
    </div>
  )
}

/* ─────────────────────────────
   DOSE CALCULATOR
   Volume (mL) = Dose (mcg) / Concentration (mcg/mL)
───────────────────────────── */
export function DoseCalculator() {
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
      title="Concentration / Volume Calculator"
      description="Convert a target mcg amount into a solution volume at a given concentration."
      icon={<Beaker size={20} />}
    >
      <div className="space-y-4">
        <input
          type="number"
          value={concentration}
          onChange={(e) => setConcentration(e.target.value)}
          placeholder="Concentration (mcg/mL)"
          className="w-full bg-white rounded-xl border px-4 py-3"
        />
        <input
          type="number"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          placeholder="Target amount (mcg)"
          className="w-full bg-white rounded-xl border px-4 py-3"
        />
        {volume !== null && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500">Required Volume</div>
            <div className="text-4xl font-bold">{volume.toFixed(2)} mL</div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}

/* ─────────────────────────────
   BATCH VERIFIER
───────────────────────────── */
export function BatchVerifier() {
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
      description="Look up a lot number against published batch records."
      icon={<ShieldCheck size={20} />}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter lot number (e.g. PEP-2412-07)"
            className="w-full bg-white rounded-xl border pl-11 pr-4 py-3 outline-none focus:border-black"
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
   PURITY CALCULATOR
───────────────────────────── */
export function PurityCalculator() {
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
          className="w-full bg-white rounded-xl border px-4 py-3"
        />
        <input
          type="number"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
          placeholder="Theoretical amount"
          className="w-full bg-white rounded-xl border px-4 py-3"
        />
        {purity !== null && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-center">
            <div className="text-sm text-zinc-500">Purity Result</div>
            <div className="text-4xl font-bold">{purity.toFixed(2)}%</div>
          </div>
        )}
      </div>
    </ToolCard>
  )
}
