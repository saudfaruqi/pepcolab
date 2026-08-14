// app/coaData.ts
//
// Single source of truth for published Certificates of Analysis. Each
// entry corresponds to one real Freedom Diagnostics report, one real
// accession number, and one PDF file living in /public/pdf. Everything
// referencing COAs — the homepage terminal preview (COASection.tsx), the
// /certificates search page (via coaIndex.ts), and any other component —
// should read from this array rather than hardcoding batch data.
//
// `code` is the short product-code identifier printed on the vial cap
// label (e.g. what a customer would actually check against their order).
// Adjust these to match your real cap-color/code scheme if it differs —
// they're placeholders derived from compound + strength here.

export interface CoaBatch {
  accession: string
  code: string
  lot: string
  product: string
  identity: string
  // Numeric purity for UI code that does math/formatting with it (e.g.
  // the /certificates card, which renders `${product.purity}%` and
  // computes an average across all products). purityAvg is the
  // pre-formatted display string ("99.82%") used in COASection.tsx's
  // terminal preview — keep both in sync when adding a batch.
  purity: number
  purityAvg: string
  netContentAvg: string
  received: string
  reported: string
  appearance: string
  pdfUrl: string
}

export const COA_BATCHES: CoaBatch[] = [
  {
    accession: '2606090460',
    purity: 99.82,
    code: 'TES5',
    lot: 'PAL-TES5-2605-01',
    product: 'Tesamorelin 5mg',
    identity: 'Tesamorelin',
    purityAvg: '99.82%',
    netContentAvg: '9.47 mg',
    received: '06/09/2026',
    reported: '06/12/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_Tesamorelin_5mg_COA.pdf',
  },
  {
    accession: '2606090459',
    purity: 99.7,
    code: 'IGF1',
    lot: 'PAL-IGF1-2606-01',
    product: 'IGF1-LR3 1mg',
    identity: 'IGF-LR3',
    purityAvg: '99.70%',
    netContentAvg: '1.08 mg',
    received: '06/09/2026',
    reported: '06/12/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_IGF1-LR3_1mg_COA.pdf',
  },
  {
    accession: '2606090458',
    purity: 99.86,
    code: 'MT2-10',
    lot: 'PAL-MT2-2605-01',
    product: 'MT2 10mg',
    identity: 'Melanotan-II',
    purityAvg: '99.86%',
    netContentAvg: '10.71 mg',
    received: '06/09/2026',
    reported: '06/12/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_MT2_10mg_COA.pdf',
  },
  {
    accession: '2605180344',
    purity: 99.58,
    code: 'GLOW70',
    lot: 'PAL-GLO70-2605-02',
    product: 'GLOW 70mg',
    identity: 'GHK-Cu/TB-500/BPC-157',
    purityAvg: '99.58%',
    netContentAvg: 'GHK-Cu 56.85mg / TB-500 8.53mg / BPC-157 13.86mg',
    received: '05/18/2026',
    reported: '05/19/2026',
    appearance: 'Blue Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_GLOW_70mg_COA.pdf',
  },
  {
    accession: '2605180343',
    purity: 99.86,
    code: 'TZP40',
    lot: 'PAL-TZP40-2605-01',
    product: 'Tirzepatide (GLP2) 40mg',
    identity: 'GLP TZ',
    purityAvg: '99.86%',
    netContentAvg: '39.86 mg',
    received: '05/18/2026',
    reported: '05/19/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_Tirzepatide_40mg_COA.pdf',
  },
  {
    accession: '2605180342',
    purity: 99.33,
    code: 'SER10',
    lot: 'PAL-SER10-2605-01',
    product: 'Sermorelin 10mg',
    identity: 'Sermorelin',
    purityAvg: '99.33%',
    netContentAvg: '10.86 mg',
    received: '05/18/2026',
    reported: '05/19/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_Sermorelin_10mg_COA.pdf',
  },
  {
    accession: '2605180341',
    purity: 99.95,
    code: 'SS31-50',
    lot: 'PAL-SS50-2605-01',
    product: 'SS-31 50mg',
    identity: 'SS-31',
    purityAvg: '99.95%',
    netContentAvg: '52.15 mg',
    received: '05/18/2026',
    reported: '05/19/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_SS-31_50mg_COA.pdf',
  },
  {
    accession: '2605110026',
    purity: 99.81,
    code: 'RET30',
    lot: 'PAL-RET30-2605-01',
    product: 'Retatrutide 30mg (GLP3)',
    identity: 'GLP RT',
    purityAvg: '99.81%',
    netContentAvg: '28.57 mg',
    received: '05/11/2026',
    reported: '05/12/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_Retatrutide_30mg_COA.pdf',
  },
  {
    accession: '2605110025',
    purity: 99.5,
    code: 'RET20',
    lot: 'PAL-RET20-2605-01',
    product: 'Retatrutide 20mg (GLP3)',
    identity: 'GLP RT',
    purityAvg: '99.50%',
    netContentAvg: '22.30 mg',
    received: '05/11/2026',
    reported: '05/12/2026',
    appearance: 'White Lyophilized Powder',
    pdfUrl: '/pdf/PepcoLab_Retatrutide_20mg_COA.pdf',
  },
]