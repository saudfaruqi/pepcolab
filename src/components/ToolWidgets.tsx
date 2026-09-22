'use client'

// components/ToolWidgets.tsx
//
// Extracted from the old monolithic app/tools/page.tsx so the
// Reconstitution Calculator can live at its own indexable URL
// (/tools/reconstitution-calculator) without duplicating the component
// logic. /tools keeps all four tools inline for people browsing the hub;
// the dedicated page reuses ReconstitutionCalculator directly.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Calculator, Search, CheckCircle2, FlaskConical, Beaker, ShieldCheck } from 'lucide-react'
import { findBatch, findBatchesByCode, verifyHref } from '@/lib/coaLookup'
import { COA_BATCHES } from '@/app/coaData'

// The placeholder shown in the Batch Verifier. Taken from the real data
// rather than typed in, so it can never drift out of format again — the
// previous hardcoded "PEP-2412-07" matched no lot the company has ever
// issued, so anyone who copied the example got a miss.
const EXAMPLE_LOT = COA_BATCHES[0]?.lot ?? 'PAL-TES5-2605-01'

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
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 lg:p-10 shadow-sm">
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
// REBUILT (Sep 2026). The previous version had four defects, and the last
// one mattered most:
//
//   1. It searched SHOPIFY PRODUCTS (`p.lot`), not the published certificate
//      records in app/coaData.ts — so it verified against storefront
//      metafields rather than against the laboratory reports. Those fields
//      are optional on the product type, so `purity` and `testDate` rendered
//      as "undefined%" whenever they were unset.
//   2. It fell back to a substring match (`.includes(q)`), meaning typing
//      "PAL" returned whichever batch happened to sit first in the array. A
//      lot number is an identifier, not a search term — a near-match hands
//      someone the certificate for a different production run than the vial
//      in their hand.
//   3. Its placeholder read "PEP-2412-07", a format no real lot uses. Anyone
//      copying the example got nothing, which reads as a broken tool.
//   4. It printed "Status: Passed QC" as a HARDCODED STRING on every match —
//      a quality assertion generated by the UI rather than read from any
//      record. On a page whose purpose is to let people check claims instead
//      of trusting them, that is the one thing the component must never do.
//
// It now resolves against the same source as /verify, exactly or not at all,
// and links to that batch's own page rather than restating values here.
export function BatchVerifier() {
  const [query, setQuery] = useState('')

  const match = useMemo(() => {
    const q = query.trim()
    if (!q) return null
    const exact = findBatch(q)
    if (exact) return { kind: 'one' as const, batch: exact }
    const shared = findBatchesByCode(q)
    if (shared.length > 1) return { kind: 'many' as const, batches: shared }
    return { kind: 'none' as const }
  }, [query])

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
            placeholder={`Enter lot number (e.g. ${EXAMPLE_LOT})`}
            aria-label="Lot number, accession number or cap code"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-white rounded-xl border pl-11 pr-4 py-3 outline-none focus:border-black"
          />
        </div>

        {match?.kind === 'one' && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
              <CheckCircle2 size={18} />
              Certificate published
            </div>
            <div className="space-y-2 text-sm text-zinc-700">
              <div><strong>Compound:</strong> {match.batch.product}</div>
              <div><strong>Lot:</strong> {match.batch.lot}</div>
              <div><strong>Purity (HPLC):</strong> {match.batch.purityAvg}</div>
              <div><strong>Identity:</strong> {match.batch.identity}</div>
              <div><strong>Reported:</strong> {match.batch.reported}</div>
              <div><strong>Tested by:</strong> Freedom Diagnostics</div>
            </div>
            <Link
              href={verifyHref(match.batch)}
              className="inline-block mt-4 text-sm font-semibold underline text-zinc-900"
            >
              Open the full record for this lot
            </Link>
          </div>
        )}

        {match?.kind === 'many' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
            <p className="mb-3">
              That code covers {match.batches.length} production runs. Check the
              lot number on your label against these:
            </p>
            <ul className="space-y-2">
              {match.batches.map((b) => (
                <li key={b.lot}>
                  <Link href={verifyHref(b)} className="font-mono underline text-zinc-900">
                    {b.lot}
                  </Link>
                  <span className="text-zinc-500"> — {b.purityAvg}, reported {b.reported}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {match?.kind === 'none' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold mb-1">No published certificate matches that.</p>
            <p>
              Either we have not published that lot&apos;s certificate yet, or the
              vial did not come from us. If you bought it from PepcoLab, send us
              the lot number and we will publish it or tell you plainly that we
              cannot account for it.
            </p>
            <Link href="/verify" className="inline-block mt-3 font-semibold underline">
              See every published certificate
            </Link>
          </div>
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