// src/lib/comparisons-data.ts
//
// SEO FIX (growth-playbook §04 Phase 1, "Comparison pages"): "BPC-157 vs
// TB-500, GHK-Cu vs Matrixyl, CJC-1295 vs Ipamorelin, etc. Research-profile
// framing only. A format nobody has claimed."
//
// Research-profile framing only, matching PepcoLab's own compliance rule —
// mechanism, structure, and research-literature differences, never dosing,
// administration, or human-outcome claims.

export type ComparisonRow = { label: string; a: string; b: string }

export type Comparison = {
  slug: string
  compoundA: string
  compoundB: string
  title: string
  metaDescription: string
  intro: string
  rows: ComparisonRow[]
  takeaway: string
  relatedResearchIds?: string[]
  relatedProductSlugs?: string[]
}

export const COMPARISONS: Comparison[] = [
  {
    slug: 'bpc-157-vs-tb-500',
    compoundA: 'BPC-157',
    compoundB: 'TB-500',
    title: 'BPC-157 vs TB-500: Research Profile Comparison',
    metaDescription:
      'How BPC-157 and TB-500 differ in structure, proposed mechanism, and research literature focus — a research-profile comparison, not a usage guide.',
    intro:
      'BPC-157 and TB-500 are frequently discussed together in musculoskeletal-recovery research literature, and are sometimes assumed to be interchangeable. Structurally and mechanistically, they are distinct compounds studied through different research lenses.',
    rows: [
      { label: 'Origin', a: 'Synthetic 15-amino-acid fragment derived from a protein found in gastric juice', b: 'Synthetic fragment of thymosin beta-4, a naturally occurring protein' },
      { label: 'Class', a: 'Body-protection compound (BPC) family', b: 'Actin-regulating peptide fragment' },
      { label: 'Primary research focus', a: 'Gastrointestinal protection; musculoskeletal and tendon-ligament research', b: 'Cell migration, angiogenesis, and wound-healing research' },
      { label: 'Proposed mechanism', a: 'Modulates growth factor pathways and nitric oxide signalling in preclinical models', b: 'Regulates actin polymerisation, implicated in cell motility during tissue repair models' },
      { label: 'Stability profile', a: 'Reported to be relatively stable across a range of conditions in preclinical work', b: 'Similar handling considerations to other short peptide fragments — see our storage guide' },
    ],
    takeaway:
      'Both are studied in tissue-repair contexts but through different proposed mechanisms — BPC-157 research centres on gastroprotective and growth-factor pathways, TB-500 research centres on actin regulation and cell migration. Treat published comparisons of the two with appropriate scepticism; head-to-head preclinical data is limited.',
    relatedResearchIds: ['bpc-157'],
    relatedProductSlugs: ['bpc-157'],
  },
  {
    slug: 'ghk-cu-vs-matrixyl',
    compoundA: 'GHK-Cu',
    compoundB: 'Matrixyl (Palmitoyl Pentapeptide-4)',
    title: 'GHK-Cu vs Matrixyl: Research Profile Comparison',
    metaDescription:
      'How GHK-Cu (copper peptide) and Matrixyl differ in structure and research application — a research-profile comparison for laboratory use.',
    intro:
      'GHK-Cu and Matrixyl are both well-established in dermal-research literature and both appear in commercial cosmetic formulations, which sometimes leads to them being treated as equivalent. Structurally they are unrelated compounds.',
    rows: [
      { label: 'Structure', a: 'Tripeptide (glycyl-L-histidyl-L-lysine) complexed with copper', b: 'Palmitic acid conjugated to a synthetic five-amino-acid sequence' },
      { label: 'Class', a: 'Copper peptide complex, naturally occurring in human plasma', b: 'Lipidated (palmitoylated) synthetic pentapeptide' },
      { label: 'Primary research focus', a: 'Extracellular matrix remodelling, wound-healing and anti-inflammatory research', b: 'Collagen-signalling research in dermal fibroblast models' },
      { label: 'Copper dependency', a: 'Mechanism is copper-dependent — the copper ion is integral to its proposed activity', b: 'No copper involvement; mechanism is independent of metal-ion binding' },
      { label: 'Typical research format', a: 'Supplied as a lyophilised copper-complexed peptide', b: 'Supplied as a lyophilised lipidated peptide' },
    ],
    takeaway:
      'The overlap is functional (both appear in dermal-research and cosmetic-formulation literature), not structural — GHK-Cu is a copper-dependent tripeptide complex, Matrixyl is an unrelated palmitoylated pentapeptide. Reported research effects are not necessarily comparable in mechanism, magnitude, or evidence base.',
    relatedProductSlugs: ['ghk-cu'],
  },
  {
    slug: 'cjc-1295-vs-ipamorelin',
    compoundA: 'CJC-1295',
    compoundB: 'Ipamorelin',
    title: 'CJC-1295 vs Ipamorelin: Research Profile Comparison',
    metaDescription:
      'How CJC-1295 and Ipamorelin differ in mechanism and research classification — a research-profile comparison, not a usage or stacking guide.',
    intro:
      'CJC-1295 and Ipamorelin are commonly discussed together in growth-hormone-axis research because they act on different receptors within the same pathway. They are not the same class of compound.',
    rows: [
      { label: 'Class', a: 'Growth hormone-releasing hormone (GHRH) analogue', b: 'Growth hormone secretagogue (ghrelin/GHS-R1a receptor agonist)' },
      { label: 'Receptor target', a: 'GHRH receptor', b: 'Ghrelin receptor (GHS-R1a)' },
      { label: 'Selectivity (research literature)', a: 'Reported to stimulate GH release with limited effect on other pituitary hormones', b: 'Reported as one of the more receptor-selective secretagogues studied, with limited reported effect on cortisol or prolactin in preclinical work' },
      { label: 'Regulatory note', a: 'On the WADA Prohibited List; no MHRA/UK marketing authorisation — see our legal-status page', b: 'On the WADA Prohibited List; no MHRA/UK marketing authorisation — see our legal-status page' },
    ],
    takeaway:
      'They act on two different receptors within the same growth-hormone-release pathway rather than being alternative versions of the same mechanism, which is why research literature frequently studies them together rather than as substitutes for one another.',
    relatedProductSlugs: [],
  },
]

export function getComparisonBySlug(slug: string) {
  return COMPARISONS.find((c) => c.slug === slug)
}
