// src/lib/chatFlow.ts
//
// Enhanced, research-focused chat flow for ChatWidget — no AI, purely scripted.
// Designed to position PepcoLab as a credible research supplier while maintaining
// strict "research use only" compliance.
//
// Structure:
// - Main menu with clear research-oriented categories
// - Detailed product information with scientific context
// - Transparent COA and testing explanations
// - Clear "research use only" disclaimers throughout
// - Helpful technical guidance for researchers

import { CATEGORIES } from '@/app/data'

export interface ChatOption {
  label: string
  next?: string
  href?: string
  action?: 'handoff'
}

export interface ChatNode {
  id: string
  message: string | string[]
  options: ChatOption[]
  keywords?: string[]
  // Research-specific metadata
  researchFocus?: string
  disclaimer?: string
}

// Helper to generate category options from live data
const categoryOptions: ChatOption[] = CATEGORIES.filter((c) => c.slug !== 'all').map((c) => ({
  label: `${c.label} (${c.count})`,
  href: `/products?category=${c.slug}`,
}))

// ============================================================
// MAIN MENU OPTIONS — Research-Focused
// ============================================================
const MAIN_OPTIONS: ChatOption[] = [
  { label: '🔬 Browse research compounds', next: 'categories' },
  { label: '📊 Certificates of Analysis (COAs)', next: 'coa' },
  { label: '📦 Shipping & cold-chain logistics', next: 'shipping' },
  { label: '🧪 Research protocols & guides', next: 'research_guides' },
  { label: '⚗️ Reconstitution & handling', next: 'reconstitution' },
  { label: '📋 Batch verification & lot lookup', next: 'batch_verify' },
  { label: '💰 Pricing & bulk orders', next: 'pricing' },
  { label: '🔄 Returns & quality assurance', next: 'refunds' },
  { label: '👨‍🔬 Speak with a research specialist', action: 'handoff' },
]

// ============================================================
// COMPREHENSIVE NODE DEFINITIONS
// ============================================================

export const CHAT_NODES: Record<string, ChatNode> = {
  // ============================================================
  // MAIN ENTRY
  // ============================================================
  main: {
    id: 'main',
    message: [
      "Welcome to PepcoLab's research assistant. I'm here to help you navigate our catalogue of research-grade compounds, understand our testing protocols, and provide technical guidance for your laboratory work.",
      "All products are sold strictly for in-vitro laboratory research and scientific study — not for human or veterinary use.",
      "How can I assist you today?"
    ],
    options: MAIN_OPTIONS,
    researchFocus: 'General research support',
    disclaimer: 'For laboratory research use only. Not for human consumption.'
  },

  // ============================================================
  // CATEGORIES — Expanded Research Descriptions
  // ============================================================
  categories: {
    id: 'categories',
    message: [
      "Our research catalogue is organized by primary research area. Each category contains compounds with published COAs and batch-specific analytical data.",
      "Select a category below to explore, or ask me about specific compounds, purity data, or research applications."
    ],
    options: [
      ...categoryOptions,
      { label: '🔬 View all research compounds', href: '/products' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['category', 'categories', 'peptide', 'browse', 'shop', 'catalogue', 'catalog', 'compound', 'compounds'],
    researchFocus: 'Product catalogue navigation',
    disclaimer: 'All compounds are for research purposes only.'
  },

  // ============================================================
  // COA — Detailed Testing Transparency
  // ============================================================
  coa: {
    id: 'coa',
    message: [
      "Every batch we supply undergoes independent third-party testing by Freedom Diagnostics, a UKAS-accredited laboratory.",
      "Our Certificate of Analysis (COA) includes:",
      "• HPLC-UV purity analysis with full chromatogram",
      "• Mass spectrometry identity confirmation (LC-MS)",
      "• Net content verification",
      "• Batch-specific lot number for full traceability",
      "",
      "We publish every COA publicly — no hidden results, no selective reporting."
    ],
    options: [
      { label: '📄 Search the COA library', href: '/certificates' },
      { label: '🔍 Verify a specific batch', next: 'batch_verify' },
      { label: '🧪 Understanding HPLC purity testing', next: 'hplc_explained' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['coa', 'certificate', 'certificates', 'purity', 'lab test', 'hplc', 'lc-ms', 'mass spec', 'freedom diagnostics', 'third party', 'third-party', 'tested', 'analytical', 'chromatogram'],
    researchFocus: 'Quality assurance and testing transparency',
    disclaimer: 'All testing is conducted by independent third-party laboratories.'
  },

  // ============================================================
  // HPLC EXPLAINED — Educational Content
  // ============================================================
  hplc_explained: {
    id: 'hplc_explained',
    message: [
      "High-Performance Liquid Chromatography (HPLC) is the gold standard for purity analysis in peptide research.",
      "Here's what our HPLC testing verifies:",
      "",
      "1. **Purity Assessment**: The percentage of the target compound relative to all peaks detected at 214nm UV wavelength.",
      "2. **Impurity Profiling**: Identification of any related substances, synthesis byproducts, or degradation products.",
      "3. **Batch Consistency**: Each batch's HPLC profile is compared against reference standards and previous batches.",
      "",
      "All HPLC data is included in the public COA, allowing you to independently evaluate the analytical results."
    ],
    options: [
      { label: '📊 View sample HPLC data', href: '/certificates' },
      { label: '📋 Back to COA overview', next: 'coa' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['hplc', 'chromatography', 'purity testing', 'analytical', 'peak', '214nm', 'uv detection'],
    researchFocus: 'Analytical methodology education'
  },

  // ============================================================
  // SHIPPING — Cold-Chain Logistics
  // ============================================================
  shipping: {
    id: 'shipping',
    message: [
      "We ship all research compounds using cold-chain validated packaging to maintain integrity during transit.",
      "",
      "**Shipping Details:**",
      "• Same-day dispatch for orders placed before 2pm UAE time",
      "• Temperature-controlled packaging with gel packs and insulated containers",
      "• Real-time tracking with delivery confirmation",
      "• COA included with every shipment for batch verification",
      "",
      "For specific delivery timelines, please refer to our shipping policy or contact our logistics team."
    ],
    options: [
      { label: '📦 View full shipping policy', href: '/shipping' },
      { label: '🔍 Track an existing order', next: 'track' },
      { label: '🌡️ Cold-chain handling protocols', next: 'cold_chain' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['ship', 'shipping', 'delivery', 'deliver', 'dispatch', 'cold chain', 'temperature', 'packaging', 'tracking', 'courier'],
    researchFocus: 'Logistics and handling'
  },

  // ============================================================
  // COLD CHAIN — Technical Handling
  // ============================================================
  cold_chain: {
    id: 'cold_chain',
    message: [
      "Our cold-chain protocol is designed to preserve compound integrity from our facility to your laboratory.",
      "",
      "**Packaging Standards:**",
      "• Insulated shipping containers with phase-change gel packs",
      "• Temperature monitoring indicators (optional, available on request)",
      "• Sealed, moisture-resistant primary packaging",
      "",
      "**Upon Receipt:**",
      "• Inspect the packaging for any signs of damage or temperature compromise",
      "• Immediately transfer vials to appropriate storage conditions",
      "• Document the condition of the shipment in your lab's receiving log"
    ],
    options: [
      { label: '📋 Storage guidelines', next: 'storage' },
      { label: '📦 Back to shipping overview', next: 'shipping' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['cold chain', 'temperature', 'gel pack', 'insulated', 'shipping', 'receiving', 'integrity'],
    researchFocus: 'Compound handling and integrity'
  },

  // ============================================================
  // STORAGE GUIDELINES
  // ============================================================
  storage: {
    id: 'storage',
    message: [
      "Proper storage is critical for maintaining research compound integrity.",
      "",
      "**General Storage Guidelines:**",
      "• Lyophilized peptides: Store at -20°C for long-term stability (up to 24 months)",
      "• Reconstituted solutions: Store at 2-8°C and use within 28 days",
      "• Avoid repeated freeze-thaw cycles — aliquot if possible",
      "• Protect from light and moisture",
      "• Record lot numbers and receipt dates in your lab inventory",
      "",
      "Specific stability data is available on each product's COA."
    ],
    options: [
      { label: '🧪 Reconstitution protocols', next: 'reconstitution' },
      { label: '📋 Back to cold-chain info', next: 'cold_chain' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['storage', 'freeze', 'refrigerate', 'aliquot', 'stability', 'reconstitution', 'lyophilized'],
    researchFocus: 'Compound stability and handling'
  },

  // ============================================================
  // RECONSTITUTION — Technical Protocols
  // ============================================================
  reconstitution: {
    id: 'reconstitution',
    message: [
      "Reconstitution is the process of dissolving lyophilized peptide into solution for research use.",
      "",
      "**General Protocol:**",
      "1. Equilibrate the vial to room temperature (avoid warming)",
      "2. Use sterile, RNase-free water or the solvent specified in your research protocol",
      "3. Add the appropriate volume — use our calculator for precision",
      "4. Gently swirl (do not vortex) until fully dissolved",
      "5. Centrifuge briefly if needed to collect all liquid",
      "",
      "⚠️ **Important:**",
      "• Always use sterile techniques",
      "• Do not use peptides that appear discolored or particulate",
      "• Never reuse reconstitution solvents",
      "",
      "Use our Reconstitution Calculator for precise volume calculations."
    ],
    options: [
      { label: '🧮 Open Reconstitution Calculator', href: '/tools' },
      { label: '📋 Storage guidelines', next: 'storage' },
      { label: '📖 Research protocols library', next: 'research_guides' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['reconstitut', 'dissolve', 'diluent', 'solvent', 'water', 'buffer', 'peptide', 'vial', 'volume', 'calculator'],
    researchFocus: 'Research methodology guidance'
  },

  // ============================================================
  // RESEARCH GUIDES — Educational Content
  // ============================================================
  research_guides: {
    id: 'research_guides',
    message: [
      "Our Research Hub provides comprehensive technical resources for your laboratory work:",
      "",
      "**Available Resources:**",
      "• In-depth compound profiles with literature references",
      "• Reconstitution and storage protocols",
      "• Analytical method development guides",
      "• Stability and degradation studies",
      "• Citations of peer-reviewed research using each compound",
      "",
      "All content is written for experienced researchers and assumes familiarity with laboratory techniques."
    ],
    options: [
      { label: '📚 Visit the Research Hub', href: '/research' },
      { label: '📖 View our Guides', href: '/guides' },
      { label: '🧪 Reconstitution protocols', next: 'reconstitution' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['guide', 'research', 'protocol', 'method', 'literature', 'reference', 'citation', 'study', 'experimental'],
    researchFocus: 'Research methodology education'
  },

  // ============================================================
  // BATCH VERIFICATION
  // ============================================================
  batch_verify: {
    id: 'batch_verify',
    message: [
      "Every batch we supply has a unique lot number that corresponds to a published Certificate of Analysis.",
      "",
      "**How to verify:**",
      "1. Locate the lot number on your vial (format: BCXX or Grey/Red Cap)",
      "2. Search our Certificate Library using the lot number or product code",
      "3. Compare the data against your expectations",
      "",
      "All batches are independently tested and results are published without modification."
    ],
    options: [
      { label: '🔍 Search COA Library', href: '/certificates' },
      { label: '📊 Understanding HPLC purity', next: 'hplc_explained' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['verify', 'batch', 'lot', 'lookup', 'search', 'number', 'validate', 'trace'],
    researchFocus: 'Quality assurance and traceability'
  },

  // ============================================================
  // PRICING & BULK
  // ============================================================
  pricing: {
    id: 'pricing',
    message: [
      "We offer competitive pricing for research compounds with full analytical transparency.",
      "",
      "**Pricing Information:**",
      "• List prices are available on each product page",
      "• Bulk/wholesale pricing is available for qualified research institutions and laboratories",
      "• Volume discounts apply for qualifying orders",
      "• All prices are in AED (UAE Dirham)",
      "",
      "For bulk or wholesale inquiries, please contact our research sales team."
    ],
    options: [
      { label: '💼 Bulk/wholesale inquiry', action: 'handoff' },
      { label: '🛒 Browse products', href: '/products' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['price', 'pricing', 'cost', 'bulk', 'wholesale', 'discount', 'volume', 'institution', 'lab', 'university'],
    researchFocus: 'Pricing and procurement'
  },

  // ============================================================
  // TRACK ORDER
  // ============================================================
  track: {
    id: 'track',
    message: [
      "You can track your order status at any time using our order tracking system.",
      "",
      "You'll need:",
      "• Your order number (format: PL-XXXX)",
      "• The email address used at checkout",
      "",
      "Orders are dispatched within 1 business day and tracking details are sent via email."
    ],
    options: [
      { label: '🔍 Track my order', href: '/track-order' },
      { label: '📦 Shipping information', next: 'shipping' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['track', 'order status', 'where is my order', 'tracking', 'dispatch', 'shipped'],
    researchFocus: 'Order management'
  },

  // ============================================================
  // REFUNDS & QUALITY
  // ============================================================
  refunds: {
    id: 'refunds',
    message: [
      "We stand behind the quality of our research compounds and maintain transparent quality assurance processes.",
      "",
      "**Our Commitment:**",
      "• All products are independently tested before shipment",
      "• Published COAs confirm batch-specific purity and identity",
      "• Any confirmed quality issue will be investigated and resolved",
      "",
      "For full details, please refer to our refund policy page."
    ],
    options: [
      { label: '📋 View full refund policy', href: '/refund-policy' },
      { label: '📊 COA verification process', next: 'coa' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['refund', 'return', 'returns', 'quality', 'issue', 'problem', 'damage', 'exchange', 'replace'],
    researchFocus: 'Quality assurance'
  },

  // ============================================================
  // RESEARCH-ONLY DISCLAIMER NODE
  // ============================================================
  research_only: {
    id: 'research_only',
    message: [
      "⚠️ **Important Research-Use-Only Statement**",
      "",
      "All products supplied by PepcoLab are:",
      "• Intended solely for in-vitro laboratory research and scientific study",
      "• Not for human or veterinary use, consumption, or household purposes",
      "• Not approved by any regulatory authority for therapeutic or clinical use",
      "• Sold to qualified researchers only",
      "",
      "By purchasing from PepcoLab, you confirm that:",
      "• You are a qualified researcher",
      "• Products will be handled by trained personnel using appropriate safety equipment",
      "• You will use products in compliance with all applicable laws and regulations",
      "",
      "We maintain full batch traceability to support research accountability."
    ],
    options: [
      { label: '📋 Legal & Compliance', href: '/legal' },
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['research use only', 'ruo', 'disclaimer', 'legal', 'compliance', 'regulation', 'not for human'],
    researchFocus: 'Legal and compliance'
  },

  // ============================================================
  // HUMAN HANDOFF
  // ============================================================
  human: {
    id: 'human',
    message: [
      "I'll connect you with our research support team. They can assist with:",
      "• Complex research inquiries",
      "• Bulk or institutional orders",
      "• Custom synthesis requests",
      "• Technical method development",
      "",
      "Our team includes researchers and analytical chemists who understand your work.",
      "",
      "Please leave your details below and we'll be in touch."
    ],
    options: [
      { label: '← Back to main menu', next: 'main' }
    ],
    keywords: ['human', 'agent', 'real person', 'representative', 'support', 'someone', 'speak', 'talk', 'team'],
    researchFocus: 'Human support escalation'
  },

  // ============================================================
  // FALLBACK — NOT FOUND
  // ============================================================
  not_found: {
    id: 'not_found',
    message: [
      "I don't have a specific scripted answer for that question yet.",
      "",
      "Here's what I can help with:",
      "• Finding specific compounds or categories",
      "• Explaining our testing and COA processes",
      "• Providing research protocols and handling guidance",
      "• Order tracking and shipping inquiries",
      "",
      "Or you can speak directly with our research team — we have analytical chemists and researchers on staff."
    ],
    options: MAIN_OPTIONS,
    keywords: [],
    researchFocus: 'General assistance'
  },
}

// ============================================================
// EXPORTS
// ============================================================

export const START_NODE_ID = 'main'

// Very small keyword router — substring match against each node's
// `keywords`, longest keyword wins so more specific phrases beat generic
// ones.
export function routeFreeText(text: string): string {
  const q = text.toLowerCase()
  let best: { nodeId: string; len: number } | null = null

  for (const node of Object.values(CHAT_NODES)) {
    if (!node.keywords) continue
    for (const kw of node.keywords) {
      if (q.includes(kw) && (!best || kw.length > best.len)) {
        best = { nodeId: node.id, len: kw.length }
      }
    }
  }

  return best?.nodeId ?? 'not_found'
}