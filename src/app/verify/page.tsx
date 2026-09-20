// app/verify/page.tsx
//
// The batch verification entry point.
//
// POSITIONING NOTE — read this before editing the copy.
//
// Every competitor in both markets claims independent testing. Five of nine
// UK suppliers put "COA verified" or "HPLC-verified" in their title tag and
// then route every certificate request to an email form. The claim is
// worthless because it is universal; the DIFFERENCE is letting a stranger
// check one without asking permission.
//
// That only stays true if this page is honest about coverage. A verification
// page that implies every product is covered, when a customer can see that
// their compound is not in the list, does more damage than not having the
// page at all — it converts a gap into a caught exaggeration. So the
// coverage figure below is computed from the data rather than written into
// the copy, and it will go up on its own as certificates are published. Do
// not replace it with a round number or a marketing line.

import type { Metadata } from 'next'
import Link from 'next/link'
import LotLookup from '@/components/LotLookup'
import { allBatches, coveredCompounds, verifyHref } from '@/lib/coaLookup'

const INK = '#0D0D0D'
const BORDER = 'rgba(13,13,13,.08)'
const GREEN = '#0A7B45'

export const metadata: Metadata = {
  title: 'Verify a Batch — Look Up Any Lot Number',
  description:
    'Type the lot number from your vial and open that batch’s certificate of analysis. Independent HPLC results, tied to the production run you received. No account, no email required.',
  alternates: { canonical: '/verify' },
  openGraph: {
    title: 'Verify a Batch — Look Up Any Lot Number | PepcoLab',
    description:
      'Type the lot number from your vial and open that batch’s certificate of analysis. No account, no email required.',
    type: 'website',
  },
}

export default function VerifyPage() {
  const batches = allBatches()
  const compounds = coveredCompounds()

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(36px,6vw,72px) clamp(20px,5vw,48px)' }}>
      <h1 style={{ fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 800, letterSpacing: '-.035em', color: INK, margin: '0 0 16px' }}>
        Verify a batch
      </h1>

      <p style={{ fontSize: 17, lineHeight: 1.75, color: 'rgba(13,13,13,.7)', maxWidth: 660, margin: '0 0 10px' }}>
        Take the lot number printed on your vial, type it below, and open the
        certificate of analysis for that exact production run. No account, no
        email address, no waiting for someone to send it to you.
      </p>

      <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(13,13,13,.55)', maxWidth: 660, margin: '0 0 30px' }}>
        You do not need to have bought anything from us to use this. If you are
        holding a vial and want to know whether its paperwork is real, that is
        exactly what this is for.
      </p>

      <LotLookup />

      <section style={{ marginTop: 56, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: '0 0 12px' }}>
          What is published so far
        </h2>

        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 680, margin: '0 0 10px' }}>
          {batches.length} {batches.length === 1 ? 'certificate covers' : 'certificates cover'}{' '}
          {compounds.length} {compounds.length === 1 ? 'compound' : 'compounds'}:{' '}
          {compounds.join(', ')}.
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(13,13,13,.65)', maxWidth: 680, margin: '0 0 26px' }}>
          That is not the whole catalogue, and we are not going to pretend
          otherwise. Certificates go up as batches are tested and released. If
          the compound you want is not listed yet, ask us for its lot number
          and testing status before you order — we would rather answer that
          than have you assume.
        </p>

        <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff' }}>
          <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                {['Compound', 'Lot number', 'Purity (HPLC)', 'Reported', 'Record'].map(h => (
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
                  <th scope="row" style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, color: INK, borderBottom: `1px solid ${BORDER}`, textAlign: 'left' }}>
                    {b.product}
                  </th>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontFamily: "'DM Mono',ui-monospace,monospace", color: 'rgba(13,13,13,.75)', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                    {b.lot}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: GREEN, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                    {b.purityAvg}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13.5, color: 'rgba(13,13,13,.55)', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                    {b.reported}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13.5, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>
                    <Link href={verifyHref(b)} style={{ color: INK, fontWeight: 600, textDecoration: 'underline' }}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: '0 0 12px' }}>
          Why this page exists
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(13,13,13,.65)', maxWidth: 700, margin: '0 0 14px' }}>
          Nearly every research-peptide supplier says its products are
          independently tested. Far fewer will show you the certificate for the
          specific vial you are holding, and a good number will only send one
          after you have emailed them and explained who you are.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(13,13,13,.65)', maxWidth: 700, margin: 0 }}>
          A purity claim you cannot check is a marketing line. A lot number you
          can look up, tied to a dated report from a named laboratory, is a
          record. We would rather be judged on the second kind.
        </p>
      </section>
    </main>
  )
}