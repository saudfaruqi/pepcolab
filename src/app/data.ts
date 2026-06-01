export interface Product {
  id: string
  slug: string
  name: string
  shortName: string
  category: string
  categorySlug: string
  mg: string
  description: string
  longDesc?: string
purity?: number
lot?: string
  price: number
  oldPrice?: number
  testDate: string
  sequence?: string
  badge?: 'popular' | 'new' | 'sale' | 'bestseller'
  color: {
    bg: string
    accent: string
    pill: string
    pillText: string
    purityBar: string
    btn: string
    vialFrom: string   // add this
    vialTo: string 
  }
  inStock: boolean
  stockCount: number
  // Shopify variant ID — populated from Storefront API in production
  variantId?: string
}

export interface Category {
  slug: string
  label: string
  count: number
}

export const CATEGORIES: Category[] = [
  { slug: 'all',         label: 'All',          count: 40 },
  { slug: 'metabolic',   label: 'Metabolic',    count: 8  },
  { slug: 'recovery',    label: 'Recovery',     count: 7  },
  { slug: 'cognitive',   label: 'Cognitive',    count: 6  },
  { slug: 'hormonal',    label: 'Hormonal',     count: 9  },
  { slug: 'anti-ageing', label: 'Anti-Ageing',  count: 5  },
  { slug: 'skin',        label: 'Skin & Repair', count: 5 },
]

export const PRODUCTS: Product[] = [
  {
    id: '1', slug: 'glp-1-tera-5mg', name: 'GLP-1 (Tera) 5mg', shortName: 'GLP-1',
    category: 'Metabolic · Weight', categorySlug: 'metabolic', mg: '5mg',
    description: 'Glucagon-like peptide-1 analogue for metabolic research',
    longDesc: 'A synthetic analogue of GLP-1 used in metabolic and obesity research. High receptor affinity with HPLC and mass-spec verified purity. Ideal for in-vitro receptor binding studies and preclinical metabolic investigations.',
    price: 49.99, purity: 99.1, lot: 'PEP-2412-07', testDate: 'Apr 2025',
    sequence: 'His-Aib-Glu-Gly-Thr-Phe-Thr-Ser-Asp', badge: 'popular',
    color: { bg: '#EEF2FD', accent: '#2055F0', pill: '#DBEAFE', pillText: '#1D4ED8', purityBar: '#3B82F6', btn: '#2055F0', vialFrom: '#2055F0', vialTo: '#93C5FD' },
    inStock: true, stockCount: 34,
  },
  {
    id: '2', slug: 'bpc-157-5mg', name: 'BPC-157 5mg', shortName: 'BPC-157',
    category: 'Healing · Recovery', categorySlug: 'recovery', mg: '5mg',
    description: 'Body protection compound, 15-amino sequence',
    longDesc: 'Pentadecapeptide derived from human gastric juice proteins. Studied for its role in tissue repair and wound healing research. Stable in aqueous solution. HPLC purity >98.7%.',
    price: 52.99, purity: 98.7, lot: 'BPC-119-A', testDate: 'Mar 2025',
    sequence: 'Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val', badge: 'bestseller',
    color: { bg: '#EDFAF3', accent: '#0D7A45', pill: '#DCFCE7', pillText: '#15803D', purityBar: '#22C55E', btn: '#0D7A45', vialFrom: '#0D7A45', vialTo: '#86EFAC' },
    inStock: true, stockCount: 18,
  },
  {
    id: '3', slug: 'semax-2mg', name: 'Semax 2mg', shortName: 'Semax',
    category: 'Cognitive · Neuro', categorySlug: 'cognitive', mg: '2mg',
    description: 'ACTH-derived neuropeptide fragment',
    longDesc: 'Heptapeptide analogue of ACTH(4–10). Studied for nootropic effects and neuroprotection in cognitive research settings. Highly stable in lyophilised form.',
    price: 58.99, purity: 99.3, lot: 'SMX-044-B', testDate: 'May 2025', badge: 'new',
    color: { bg: '#FDF0F8', accent: '#BE185D', pill: '#FCE7F3', pillText: '#9D174D', purityBar: '#F472B6', btn: '#DB2777', vialFrom: '#BE185D', vialTo: '#F9A8D4' },
    inStock: true, stockCount: 11,
  },
  {
    id: '4', slug: 'tb-500-10mg', name: 'TB-500 10mg', shortName: 'TB-500',
    category: 'Hormonal · Peptide', categorySlug: 'hormonal', mg: '10mg',
    description: 'Thymosin Beta-4 synthetic analogue',
    longDesc: 'Synthetic version of Thymosin Beta-4. Researched for actin regulation, tissue repair signalling and angiogenesis pathways. Ships lyophilised under nitrogen.',
    price: 44.99, oldPrice: 59.99, purity: 98.4, lot: 'TB5-088-C', testDate: 'Feb 2025', badge: 'sale',
    color: { bg: '#FFFBEB', accent: '#B45309', pill: '#FEF3C7', pillText: '#92400E', purityBar: '#FBBF24', btn: '#D97706', vialFrom: '#B45309', vialTo: '#FCD34D' },
    inStock: true, stockCount: 29,
  },
  {
    id: '5', slug: 'epithalon-5mg', name: 'Epithalon 5mg', shortName: 'Epithalon',
    category: 'Anti-Ageing · Longevity', categorySlug: 'anti-ageing', mg: '5mg',
    description: 'Tetrapeptide telomere research compound',
    longDesc: 'Synthetic tetrapeptide (Ala-Glu-Asp-Gly) derived from the pineal gland. Researched for telomerase activation and longevity pathways. Every batch third-party tested by Eurofins UK.',
    price: 64.99, purity: 98.9, lot: 'EPI-201-D', testDate: 'Apr 2025',
    color: { bg: '#F4F1FE', accent: '#7C3AED', pill: '#EDE9FE', pillText: '#5B21B6', purityBar: '#A78BFA', btn: '#7C3AED', vialFrom: '#7C3AED', vialTo: '#C4B5FD' },
    inStock: true, stockCount: 22,
  },
  {
    id: '6', slug: 'ghk-cu-5mg', name: 'GHK-Cu 5mg', shortName: 'GHK-Cu',
    category: 'Skin · Regeneration', categorySlug: 'skin', mg: '5mg',
    description: 'Copper-binding tripeptide complex',
    longDesc: 'Glycyl-L-histidyl-L-lysine copper complex. Researched extensively for skin repair, collagen stimulation and wound healing. Lyophilised, ready to reconstitute.',
    price: 39.99, purity: 99.0, lot: 'GHK-307-E', testDate: 'May 2025',
    color: { bg: '#FFF3ED', accent: '#C2410C', pill: '#FFEDD5', pillText: '#9A3412', purityBar: '#FB923C', btn: '#EA580C', vialFrom: '#C2410C', vialTo: '#FED7AA' },
    inStock: true, stockCount: 41,
  },
  {
    id: '7', slug: 'selank-5mg', name: 'Selank 5mg', shortName: 'Selank',
    category: 'Cognitive · Neuro', categorySlug: 'cognitive', mg: '5mg',
    description: 'Anxiolytic heptapeptide analogue',
    longDesc: 'Synthetic analogue of tuftsin (Thr-Lys-Pro-Arg-Pro-Gly-Pro). Researched for anxiolytic and nootropic effects in preclinical models. Highly bioavailable, >98.6% HPLC.',
    price: 54.99, purity: 98.6, lot: 'SEL-088-F', testDate: 'Mar 2025',
    color: { bg: '#EEF2FD', accent: '#2055F0', pill: '#DBEAFE', pillText: '#1E40AF', purityBar: '#60A5FA', btn: '#2563EB', vialFrom: '#2563EB', vialTo: '#BAE6FD' },
    inStock: true, stockCount: 15,
  },
  {
    id: '8', slug: 'ipamorelin-2mg', name: 'Ipamorelin 2mg', shortName: 'Ipamorelin',
    category: 'Hormonal · Peptide', categorySlug: 'hormonal', mg: '2mg',
    description: 'Selective GH secretagogue pentapeptide',
    longDesc: 'A selective growth hormone secretagogue and ghrelin receptor agonist. Researched for its role in GH pulsatile release with high selectivity. Currently out of stock; restock expected Q3 2025.',
    price: 46.99, purity: 99.2, lot: 'IPA-156-G', testDate: 'Apr 2025',
    color: { bg: '#EDFAF3', accent: '#059669', pill: '#DCFCE7', pillText: '#065F46', purityBar: '#34D399', btn: '#059669', vialFrom: '#059669', vialTo: '#6EE7B7' },
    inStock: false, stockCount: 0,
  },
]

export const BUNDLES = [
  {
    id: 'b1', name: 'Recovery Stack',
    desc: 'BPC-157 5mg + TB-500 10mg',
    products: ['bpc-157-5mg', 'tb-500-10mg'],
    price: 89.99, save: 7.99,
    accent: '#0D7A45',
    bg: '#EDFAF3',
  },
  {
    id: 'b2', name: 'Longevity Protocol',
    desc: 'Epithalon 5mg + GHK-Cu 5mg',
    products: ['epithalon-5mg', 'ghk-cu-5mg'],
    price: 99.99, save: 4.99,
    accent: '#7C3AED',
    bg: '#F4F1FE',
  },
  {
    id: 'b3', name: 'Cognitive Edge',
    desc: 'Semax 2mg + Selank 5mg',
    products: ['semax-2mg', 'selank-5mg'],
    price: 104.99, save: 8.99,
    accent: '#BE185D',
    bg: '#FDF0F8',
  },
  {
    id: 'b4', name: 'Metabolic Focus',
    desc: 'GLP-1 5mg + Ipamorelin 2mg',
    products: ['glp-1-tera-5mg', 'ipamorelin-2mg'],
    price: 89.99, save: 6.99,
    accent: '#2055F0',
    bg: '#EEF2FD',
  },
]

export const REVIEWS = [
  {
    id: 'r1',
    text: 'The COA transparency is genuinely unlike any other supplier I\'ve used. Independent Eurofins verification, downloadable HPLC traces — exactly what serious research requires.',
    author: 'Dr. D. Roswell', role: 'Independent Researcher',
    sub: 'Verified · BPC-157 5mg', initials: 'DR',
    rating: 5,
  },
  {
    id: 'r2',
    text: 'Ordered Friday afternoon, arrived Saturday morning, cold-chain packaging intact. Purity data from my own LC-MS matched their certificate within 0.2%. Exceptional.',
    author: 'M. Kapur, MSc', role: 'Biochemistry Dept.',
    sub: 'Verified · TB-500 10mg', initials: 'MK',
    rating: 5,
  },
  {
    id: 'r3',
    text: 'Finally a UK supplier that publishes their actual lab work. The batch verifier is a game-changer for research documentation. Switching everything to PepcoLab.',
    author: 'S. Lowe', role: 'Pharmacology Research',
    sub: 'Verified · Epithalon 5mg', initials: 'SL',
    rating: 5,
  },
  {
    id: 'r4',
    text: 'The reconstitution calculator alone saves me 20 minutes per session. Product quality is consistently excellent — have ordered 6 times now with zero issues.',
    author: 'T. Griffiths', role: 'Laboratory Technician',
    sub: 'Verified · GLP-1 Tera 5mg', initials: 'TG',
    rating: 5,
  },
]