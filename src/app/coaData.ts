// coaData.ts
export interface CoaBatch {
  lot: string          // cap colour / crimp — matches vial label
  code: string         // internal product code on the vial (e.g. "BC10")
  product: string       // compound name confirmed by LC-MS
  purityVial1: string
  purityVial2: string
  purityAvg: string
  netContentAvg: string
  identity: string      // LC-MS identity confirmation string as reported
  accession: string
  received: string
  reported: string
}

export const COA_BATCHES: CoaBatch[] = [
  { lot: 'Grey Cap',        code: 'BB10',          product: 'BPC-157 / Thymosin Beta-4 blend', purityVial1: '99.88%', purityVial2: '99.87%', purityAvg: '99.88%', netContentAvg: 'BPC-157 5.26mg / TB-4 5.53mg', identity: 'Confirmed (LC-MS)', accession: '2606220754', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Blue Cap',        code: 'BC10',          product: 'BPC-157',       purityVial1: '99.30%', purityVial2: '99.36%', purityAvg: '99.33%', netContentAvg: '11.97 mg',  identity: 'Confirmed (LC-MS)', accession: '2606220744', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Red Cap',         code: 'BT10',          product: 'Thymosin Beta-4', purityVial1: '99.22%', purityVial2: '99.29%', purityAvg: '99.26%', netContentAvg: '11.56 mg',  identity: 'Confirmed (LC-MS)', accession: '2606220746', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Purple Cap',      code: 'CU100',         product: 'GHK-Cu',        purityVial1: '99.88%', purityVial2: '99.83%', purityAvg: '99.86%', netContentAvg: '110.29 mg', identity: 'Confirmed (LC-MS)', accession: '2606220760', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Clear Cap/Bronze', code: 'NJ1000',       product: 'NAD+',          purityVial1: '99.91%', purityVial2: '99.93%', purityAvg: '99.92%', netContentAvg: '1053.46 mg', identity: 'Confirmed (LC-MS)', accession: '2606220736', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Red Cap',         code: 'XA10',          product: 'Semax',         purityVial1: '99.73%', purityVial2: '99.82%', purityAvg: '99.78%', netContentAvg: '12.25 mg',  identity: 'Confirmed (LC-MS)', accession: '2606220742', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Purple Cap',      code: 'MS10',          product: 'MOTS-C',        purityVial1: '99.39%', purityVial2: '99.31%', purityAvg: '99.35%', netContentAvg: '10.82 mg',  identity: 'Confirmed (LC-MS)', accession: '2606220756', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Yellow Cap',      code: 'MOTS-C 20mg',   product: 'MOTS-C',        purityVial1: '99.74%', purityVial2: '99.76%', purityAvg: '99.75%', netContentAvg: '24.43 mg',  identity: 'Confirmed (LC-MS)', accession: '2607130572', received: '2026-07-13', reported: '2026-07-15' },
  { lot: 'White Cap',       code: 'MOTS-C 40mg',   product: 'MOTS-C',        purityVial1: '99.26%', purityVial2: '99.26%', purityAvg: '99.26%', netContentAvg: '41.51 mg',  identity: 'Confirmed (LC-MS)', accession: '2607130574', received: '2026-07-13', reported: '2026-07-15' },
  { lot: 'Green Cap',       code: 'RT10',          product: 'Retatrutide',   purityVial1: '99.89%', purityVial2: '99.85%', purityAvg: '99.87%', netContentAvg: '11.47 mg',  identity: 'Confirmed (LC-MS)', accession: '2606220748', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Black Cap',       code: 'Retatrutide 30mg', product: 'Retatrutide', purityVial1: '99.89%', purityVial2: '99.86%', purityAvg: '99.88%', netContentAvg: '33.52 mg', identity: 'Confirmed (LC-MS)', accession: '2607130560', received: '2026-07-13', reported: '2026-07-15' },
  { lot: 'Blue Cap',        code: 'Retatrutide 40mg', product: 'Retatrutide', purityVial1: '99.90%', purityVial2: '99.92%', purityAvg: '99.91%', netContentAvg: '44.45 mg', identity: 'Confirmed (LC-MS)', accession: '2607130562', received: '2026-07-13', reported: '2026-07-15' },
  { lot: 'Grey Cap',        code: 'Retatrutide 60mg', product: 'Retatrutide', purityVial1: '99.86%', purityVial2: '99.84%', purityAvg: '99.85%', netContentAvg: '61.07 mg', identity: 'Confirmed (LC-MS)', accession: '2607130564', received: '2026-07-13', reported: '2026-07-15' },
  { lot: 'Black Cap',       code: 'TSM10',         product: 'Tesamorelin',   purityVial1: '99.24%', purityVial2: '99.33%', purityAvg: '99.29%', netContentAvg: '11.49 mg',  identity: 'Confirmed (LC-MS)', accession: '2606220740', received: '2026-06-22', reported: '2026-06-25' },
  { lot: 'Red Cap',         code: 'Tesamorelin 20mg', product: 'Tesamorelin', purityVial1: '99.89%', purityVial2: '99.87%', purityAvg: '99.88%', netContentAvg: '24.02 mg', identity: 'Confirmed (LC-MS)', accession: '2607130568', received: '2026-07-13', reported: '2026-07-15' },
]

// EXCLUDED: RT20 (accession 2606220750) — Identity (LC-MS) field reads
// "#REF!" on the source certificate, a spreadsheet error, not a lab
// result. Add back once the lab re-issues a corrected COA.