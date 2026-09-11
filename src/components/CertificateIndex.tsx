// src/components/CertificateIndex.tsx
//
// A server-rendered table of every published certificate.
//
// WHY THIS EXISTS
// Google reported /certificates as "Crawled — currently not indexed", which
// is a judgement about value, not a crawl failure. The reason was visible
// once you read the page as a crawler does: it rendered a search box and a
// grid of product cards, and the actual certificate DATA — lot numbers,
// accession numbers, measured purity, test dates — was never on the page at
// all. COA_BATCHES was sitting in the codebase, unrendered.
//
// So the page asked to be indexed on the strength of a search input. There
// was nothing unique on it to index.
//
// This puts the real records into the first HTML response as text. It is
// also the content that matches what people are actually searching: Search
// Console shows "kpv coa", "epithalon coa", "ahk-cu coa" and
// "mod grf 1-29 coa" as live queries. Those searchers want a lot number and a
// purity figure, and until now the page they landed on had neither.
//
// Deliberately a plain table rather than cards: a table of measured values is
// what a certificate index IS, it reads as a record rather than a storefront,
// and it survives being rendered without CSS — which is roughly how a crawler
// sees it.

import { COA_BATCHES } from '@/app/coaData'

const INK = '#0D0D0D'
const BORDER = 'rgba(13,13,13,.08)'

export default function CertificateIndex() {
  // Newest report first — the most recent batch is the one someone holding a
  // fresh vial is most likely looking for.
  const batches = [...COA_BATCHES].sort((a, b) => (a.reported < b.reported ? 1 : -1))

  if (batches.length === 0) return null

  return (
    <section
      aria-labelledby="coa-index-heading"
      style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,48px)' }}
    >
      <h2
        id="coa-index-heading"
        style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-.035em', color: INK, margin: '0 0 12px' }}
      >
        Published certificates by lot
      </h2>

      <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 680, margin: '0 0 10px' }}>
        Every batch below was tested by Freedom Diagnostics, an independent
        third-party laboratory. Each certificate reports identity and purity by
        HPLC, the method used and the date of analysis, and is tied to the lot
        number printed on the vial you receive &mdash; not to a generic
        reference document reused across production runs.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(13,13,13,.5)', maxWidth: 680, margin: '0 0 26px' }}>
        Take the lot number from your vial and find it here. If it isn&apos;t
        listed, tell us &mdash; a lot we cannot match to a published
        certificate is something we want to know about immediately.
      </p>

      <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', textAlign: 'left' }}>
          <caption style={{ captionSide: 'top', textAlign: 'left', padding: '14px 16px 4px', fontSize: 12.5, color: 'rgba(13,13,13,.5)' }}>
            {batches.length} published certificates of analysis, most recent first.
          </caption>
          <thead>
            <tr>
              {['Compound', 'Lot number', 'Purity (HPLC)', 'Identity', 'Reported', 'Certificate'].map(h => (
                <th
                  key={h}
                  scope="col"
                  style={{
                    padding: '12px 16px', fontSize: 11.5, fontWeight: 700,
                    letterSpacing: '.05em', textTransform: 'uppercase',
                    color: 'rgba(13,13,13,.45)', borderBottom: `1px solid ${BORDER}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.lot}>
                <th
                  scope="row"
                  style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, color: INK, borderBottom: `1px solid ${BORDER}`, textAlign: 'left' }}
                >
                  {b.product}
                </th>
                <td style={{ padding: '13px 16px', fontSize: 13, fontFamily: "'DM Mono',ui-monospace,monospace", color: 'rgba(13,13,13,.75)', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                  {b.lot}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: '#0A7B45', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                  {b.purityAvg}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13.5, color: 'rgba(13,13,13,.65)', borderBottom: `1px solid ${BORDER}` }}>
                  {b.identity}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13.5, color: 'rgba(13,13,13,.55)', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                  {b.reported}
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13.5, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                  <a
                    href={b.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: INK, fontWeight: 600, textDecoration: 'underline' }}
                  >
                    View COA
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12.5, lineHeight: 1.8, color: 'rgba(13,13,13,.45)', marginTop: 16, maxWidth: 720 }}>
        Accession numbers are assigned by the testing laboratory and appear on
        each certificate. Purity is the measured figure for that specific batch;
        PepcoLab does not publish a single site-wide purity claim, because
        purity varies between production runs and an averaged number would tell
        you less than the record for the lot in your hand.
      </p>
    </section>
  )
}