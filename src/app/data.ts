



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