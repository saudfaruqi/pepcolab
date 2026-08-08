// data.ts

export interface Product {
  id: string
  slug: string
  name: string
  shortName: string
  category: string
  categorySlug: string
  mg: string
  description: string
  descriptionHtml?: string
  longDesc?: string
  purity?: number
  lot?: string
  price: number
  oldPrice?: number
  testDate: string
  sequence?: string
  badge?: 'popular' | 'new' | 'sale' | 'bestseller'
  image?: string        // ← add
  imageAlt?: string     // ← add
  color: {
    bg: string
    accent: string
    pill: string
    pillText: string
    purityBar: string
    btn: string
    vialFrom: string
    vialTo: string
  }
  inStock: boolean
  stockCount: number
  variantId?: string
  variants?: {
    id: string
    title: string
    price: number
    compareAtPrice?: number
    currencyCode?: string
    availableForSale: boolean
  }[]
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

// NOTE on slugs: Shopify product handles follow the pattern "{name}-uae"
// at the PRODUCT level (mg/strength is a variant option, not part of the
// handle) — e.g. "bpc-157-uae", "epithalon-uae". Slugs below were updated
// to match your actual 78-SKU catalogue.
//
// TWO PRODUCTS IN THE ORIGINAL BUNDLES DON'T EXIST IN YOUR CATALOGUE:
//   - "TB-500" (used in Recovery Stack)
//   - "GLP-1 Tera" (used in Metabolic Focus)
// These aren't in your price list, so I can't map them to a real handle —
// I've left them as TODOs below with a real in-catalogue product as a
// placeholder suggestion. Swap in whatever you actually want to bundle.
export const BUNDLES = [
  {
    id: 'b1', name: 'Recovery Stack',
    desc: 'BPC-157 10mg + GHK-Cu 100mg', // TODO: confirm — was "TB-500 10mg", not in catalogue
    products: ['bpc-157-uae', 'ghk-cu-uae'], // TODO: replace ghk-cu-uae if TB-500 gets added later
    price: 89.99, save: 7.99,
    accent: '#0D7A45',
    bg: '#EDFAF3',
  },
  {
    id: 'b2', name: 'Longevity Protocol',
    desc: 'Epithalon 20mg + GHK-Cu 100mg',
    products: ['epithalon-uae', 'ghk-cu-uae'],
    price: 99.99, save: 4.99,
    accent: '#7C3AED',
    bg: '#F4F1FE',
  },
  {
    id: 'b3', name: 'Cognitive Edge',
    desc: 'Semax 10mg + Selank 10mg',
    products: ['semax-uae', 'selank-uae'],
    price: 104.99, save: 8.99,
    accent: '#BE185D',
    bg: '#FDF0F8',
  },
  {
    id: 'b4', name: 'Metabolic Focus',
    desc: 'AOD-9604 10mg + Ipamorelin 10mg', // TODO: confirm — was "GLP-1 Tera 5mg", not in catalogue
    products: ['aod-9604-uae', 'ipamorelin-uae'],
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