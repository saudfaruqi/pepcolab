'use client'

// src/components/LotLookup.tsx
//
// The search box for /verify.
//
// Resolution happens on the client because COA_BATCHES is a compiled-in
// constant, not a database — there is nothing to fetch and no reason to make
// someone wait on a round trip to be told their lot is or isn't published.
//
// Three deliberate choices:
//
// 1. A MISS IS A REAL ANSWER, not an error state. If a lot doesn't resolve,
//    the honest reading is either that we haven't published it yet or that
//    the vial isn't ours — and the second possibility is the entire reason
//    a verification tool is worth having. The copy says both.
//
// 2. NO "DID YOU MEAN". See lib/coaLookup.ts — guessing at an identifier
//    someone read off a label is how you hand them the wrong certificate.
//
// 3. The result is a LINK to the batch's own page, not an inline reveal.
//    A verifiable record needs a URL the customer can send to someone else.

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { findBatch, findBatchesByCode, verifyHref } from '@/lib/coaLookup'
import type { CoaBatch } from '@/app/coaData'

const INK = '#0D0D0D'
const BORDER = 'rgba(13,13,13,.14)'
const GREEN = '#0A7B45'

type Result =
  | { state: 'idle' }
  | { state: 'found'; batch: CoaBatch }
  | { state: 'multiple'; batches: CoaBatch[] }
  | { state: 'missing'; term: string }

export default function LotLookup() {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<Result>({ state: 'idle' })

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const term = value.trim()
      if (!term) return

      const exact = findBatch(term)
      if (exact) {
        setResult({ state: 'found', batch: exact })
        return
      }

      const shared = findBatchesByCode(term)
      if (shared.length > 1) {
        setResult({ state: 'multiple', batches: shared })
        return
      }

      setResult({ state: 'missing', term })
    },
    [value]
  )

  const describedBy = useMemo(
    () => (result.state === 'missing' ? 'lot-lookup-miss' : undefined),
    [result.state]
  )

  return (
    <div style={{ maxWidth: 620 }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label htmlFor="lot-lookup-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
          Lot number, accession number or cap code
        </label>
        <input
          id="lot-lookup-input"
          name="lot"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={e => {
            setValue(e.target.value)
            if (result.state !== 'idle') setResult({ state: 'idle' })
          }}
          placeholder="e.g. PAL-TES5-2605-01"
          aria-describedby={describedBy}
          style={{
            flex: '1 1 280px',
            minWidth: 0,
            padding: '14px 16px',
            fontSize: 15,
            fontFamily: "'DM Mono',ui-monospace,monospace",
            color: INK,
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            flex: '0 0 auto',
            padding: '14px 26px',
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            background: INK,
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          Verify batch
        </button>
      </form>

      <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(13,13,13,.5)', margin: '10px 0 0' }}>
        The lot number is printed on the vial label. The cap code and the
        laboratory accession number both work too.
      </p>

      <div aria-live="polite" style={{ marginTop: result.state === 'idle' ? 0 : 20 }}>
        {result.state === 'found' && (
          <div style={{ padding: '18px 20px', border: `1px solid ${GREEN}33`, background: `${GREEN}0A`, borderRadius: 14 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: GREEN }}>
              Certificate published
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 17, fontWeight: 700, color: INK }}>
              {result.batch.product}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'rgba(13,13,13,.65)' }}>
              Lot {result.batch.lot} &middot; {result.batch.purityAvg} by HPLC &middot; reported {result.batch.reported}
            </p>
            <Link
              href={verifyHref(result.batch)}
              style={{ display: 'inline-block', marginTop: 14, fontSize: 14.5, fontWeight: 700, color: INK, textDecoration: 'underline' }}
            >
              Open the full record for this lot
            </Link>
          </div>
        )}

        {result.state === 'multiple' && (
          <div style={{ padding: '18px 20px', border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff' }}>
            <p style={{ margin: 0, fontSize: 14.5, color: INK }}>
              That code covers {result.batches.length} production runs. Check the
              lot number on your label against these:
            </p>
            <ul style={{ margin: '12px 0 0', padding: '0 0 0 18px' }}>
              {result.batches.map(b => (
                <li key={b.lot} style={{ margin: '0 0 8px' }}>
                  <Link href={verifyHref(b)} style={{ fontSize: 14, fontFamily: "'DM Mono',ui-monospace,monospace", color: INK, textDecoration: 'underline' }}>
                    {b.lot}
                  </Link>
                  <span style={{ fontSize: 13.5, color: 'rgba(13,13,13,.55)' }}>
                    {' '}&mdash; {b.purityAvg}, reported {b.reported}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.state === 'missing' && (
          <div id="lot-lookup-miss" style={{ padding: '18px 20px', border: `1px solid ${BORDER}`, borderRadius: 14, background: '#fff' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: INK }}>
              No published certificate matches &ldquo;{result.term}&rdquo;.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.75, color: 'rgba(13,13,13,.65)' }}>
              That means one of two things, and we would rather you knew both.
              Either we have not published the certificate for that lot yet, or
              the vial did not come from us. If you bought it from PepcoLab,
              send us the lot number and we will either publish the certificate
              or tell you plainly that we cannot account for it.
            </p>
            <a
              href="/contact"
              style={{ display: 'inline-block', marginTop: 14, fontSize: 14.5, fontWeight: 700, color: INK, textDecoration: 'underline' }}
            >
              Report this lot to us
            </a>
          </div>
        )}
      </div>
    </div>
  )
}