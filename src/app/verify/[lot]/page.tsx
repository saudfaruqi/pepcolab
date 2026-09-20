// app/verify/[lot]/page.tsx
//
// One page per published batch, at its own permanent URL.
//
// WHY A PAGE PER LOT RATHER THAN A TABLE ROW
//
// A certificate is only useful as proof if it can be pointed at. A row in a
// table on /certificates cannot be sent to a compliance officer, quoted in a
// dispute, linked from an order email, or handed to a customer's own
// customer. A URL can. Competitors that publish certificates at all publish
// them as a flat list or a PDF link with no page of its own; the record
// exists but has no address.
//
// It is also the only form of this content that can rank. "bpc-157 coa",
// "kpv coa", "epithalon coa" and "ahk-cu coa" are live queries in Search
// Console sitting at positions 42 to 153, and a single /certificates page
// cannot rank for all of them. A page per lot, carrying the compound name,
// the measured purity and the lot identifier as text, can.
//
// These are statically generated at build time from COA_BATCHES, so there is
// no runtime cost and no database. Adding a batch to coaData.ts creates its
// page on the next deploy.

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COA_BATCHES } from '@/app/coaData'
import { allBatches, lotSlug, verifyHref } from '@/lib/coaLookup'

const INK = '#0D0D0D'
const BORDER = 'rgba(13,13,13,.08)'
const GREEN = '#0A7B45'

export const dynamicParams = false

export function generateStaticParams() {
  return COA_BATCHES.map(b => ({ lot: lotSlug(b.lot) }))
}

function batchForSlug(slug: string) {
  return COA_BATCHES.find(b => lotSlug(b.lot) === slug) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lot: string }>
}): Promise<Metadata> {
  const { lot } = await params
  const batch = batchForSlug(lot)
  if (!batch) return { title: 'Batch not found' }

  // The title leads with the compound and the words people actually search
  // ("certificate of analysis"), then the lot, because the compound is what
  // matches the query and the lot is what proves this page is the specific
  // record rather than a generic claims page.
  const title = `${batch.product} Certificate of Analysis — Lot ${batch.lot}`
  const description = `Independent COA for ${batch.product}, lot ${batch.lot}. ${batch.purityAvg} purity by HPLC, identity ${batch.identity.toLowerCase()}, tested by Freedom Diagnostics and reported ${batch.reported}. Accession ${batch.accession}.`

  return {
    title,
    description,
    alternates: { canonical: verifyHref(batch) },
    openGraph: { title: `${title} | PepcoLab`, description, type: 'article' },
  }
}

export default async function VerifyLotPage({
  params,
}: {
  params: Promise<{ lot: string }>
}) {
  const { lot } = await params
  const batch = batchForSlug(lot)
  if (!batch) notFound()

  const others = allBatches().filter(b => b.lot !== batch.lot).slice(0, 6)

  const rows: [string, string][] = [
    ['Compound', batch.product],
    ['Lot number', batch.lot],
    ['Cap code', batch.code],
    ['Laboratory accession', batch.accession],
    ['Identity', batch.identity],
    ['Purity (HPLC)', batch.purityAvg],
    ['Net peptide content', batch.netContentAvg],
    ['Appearance', batch.appearance],
    ['Received by laboratory', batch.received],
    ['Reported', batch.reported],
    ['Testing laboratory', 'Freedom Diagnostics (independent third party)'],
  ]

  // Marked up as a factual record so the measured values are machine-readable
  // rather than only visible to a human reading the table.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${batch.product} — Certificate of Analysis, lot ${batch.lot}`,
    description: `Independent third-party certificate of analysis for ${batch.product}, lot ${batch.lot}. Purity ${batch.purityAvg} by HPLC.`,
    identifier: batch.lot,
    dateCreated: batch.reported,
    creator: { '@type': 'Organization', name: 'Freedom Diagnostics' },
    publisher: { '@type': 'Organization', name: 'PepcoLab' },
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/pdf',
      contentUrl: batch.pdfUrl,
    },
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(36px,6vw,72px) clamp(20px,5vw,48px)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: 'rgba(13,13,13,.5)', marginBottom: 20 }}>
        <Link href="/verify" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Batch verification
        </Link>
        <span aria-hidden="true"> / </span>
        <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace" }}>{batch.lot}</span>
      </nav>

      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: GREEN }}>
        Certificate published
      </p>

      <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-.035em', color: INK, margin: '10px 0 14px' }}>
        {batch.product}
      </h1>

      <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(13,13,13,.7)', margin: '0 0 8px', maxWidth: 680 }}>
        This is the record for lot <strong style={{ color: INK }}>{batch.lot}</strong> —
        the specific production run, not a reference document reused across
        batches. It was tested by Freedom Diagnostics, an independent
        laboratory, and reported on {batch.reported}.
      </p>

      <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'rgba(13,13,13,.55)', margin: '0 0 30px', maxWidth: 680 }}>
        Check the lot number above against the one printed on your vial. If
        they differ, this is not your certificate — search again from the{' '}
        <Link href="/verify" style={{ color: INK, textDecoration: 'underline' }}>
          verification page
        </Link>
        .
      </p>

      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <caption style={{ captionSide: 'top', textAlign: 'left', padding: '16px 18px 6px', fontSize: 12.5, color: 'rgba(13,13,13,.5)' }}>
            Reported values for this lot
          </caption>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th
                  scope="row"
                  style={{
                    padding: '13px 18px', fontSize: 12.5, fontWeight: 700,
                    letterSpacing: '.04em', textTransform: 'uppercase',
                    color: 'rgba(13,13,13,.45)', borderBottom: `1px solid ${BORDER}`,
                    textAlign: 'left', whiteSpace: 'nowrap', width: '42%',
                    verticalAlign: 'top',
                  }}
                >
                  {label}
                </th>
                <td
                  style={{
                    padding: '13px 18px', fontSize: 14.5,
                    color: label === 'Purity (HPLC)' ? GREEN : INK,
                    fontWeight: label === 'Purity (HPLC)' ? 700 : 500,
                    fontFamily: ['Lot number', 'Cap code', 'Laboratory accession'].includes(label)
                      ? "'DM Mono',ui-monospace,monospace"
                      : undefined,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 24 }}>
        <a
          href={batch.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block', padding: '14px 26px', fontSize: 15,
            fontWeight: 700, color: '#fff', background: INK,
            borderRadius: 12, textDecoration: 'none',
          }}
        >
          Open the signed certificate (PDF)
        </a>
      </p>

      <p style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(13,13,13,.45)', marginTop: 22, maxWidth: 700 }}>
        Purity is the measured figure for this batch alone. PepcoLab does not
        publish a single site-wide purity claim, because purity varies between
        production runs and an averaged number tells you less than the record
        for the lot in your hand.
      </p>

      {others.length > 0 && (
        <section style={{ marginTop: 48, paddingTop: 28, borderTop: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em', color: INK, margin: '0 0 14px' }}>
            Other published lots
          </h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {others.map(b => (
              <li key={b.lot} style={{ padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                <Link href={verifyHref(b)} style={{ fontSize: 14.5, fontWeight: 600, color: INK, textDecoration: 'none' }}>
                  {b.product}
                </Link>
                <span style={{ fontSize: 13, color: 'rgba(13,13,13,.5)', fontFamily: "'DM Mono',ui-monospace,monospace" }}>
                  {' '}&middot; {b.lot}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 16 }}>
            <Link href="/verify" style={{ fontSize: 14.5, fontWeight: 700, color: INK, textDecoration: 'underline' }}>
              See every published certificate
            </Link>
          </p>
        </section>
      )}
    </main>
  )
}