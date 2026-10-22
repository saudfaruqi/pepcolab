// src/lib/learnGuides.ts
//
// The three free guides behind /learn: an email sign-up for visitors arriving
// from search and the site's guides (no paid ads point here).
//
// RULES FOR ANYTHING ON /learn (why these pages look the way they do):
//   - The page is the guide. No shop button, no
//     product grid, no prices, no compound names in headings.
//   - Nothing about what any compound does in or to a body.
//   - The guide is delivered by EMAIL, not as an on-page download, so a lead
//     is a real, reachable address.
//   - `source` is the hidden attribution value (learn-coa, learn-check,
//     learn-store), overridable by ?src= on the URL. Keep health words out.

export interface LearnGuide {
  slug: string
  source: string
  title: string
  /** Page H1. */
  headline: string
  subhead: string
  bullets: { title: string; text: string }[]
  /** Public PDF path (public/downloads/…). */
  pdfPath: string
  pages: number
  /** Short name used in emails. */
  shortName: string
  seoDescription: string
}

export const LEARN_GUIDES: LearnGuide[] = [
  {
    slug: 'coa-guide',
    source: 'learn-coa',
    title: 'How to read a certificate of analysis',
    headline: 'How to read a certificate of analysis',
    subhead:
      'A free, plain-English guide to the one document that tells you what is actually in a laboratory vial — and the four details that show whether a certificate is real.',
    bullets: [
      {
        title: 'What a certificate is, and what it is not',
        text: 'A test report on one batch — not a licence, an approval or a guarantee — and why that difference matters.',
      },
      {
        title: 'Identity, purity and content, explained',
        text: 'Why mass spectrometry answers "is it the right molecule?", HPLC answers "how clean is it?", and neither tells you the amount on its own.',
      },
      {
        title: 'Four tells of a genuine certificate',
        text: 'Lot numbers, laboratory details and the checks that take sixty seconds — plus the red flags ranked by how much they should worry you.',
      },
    ],
    pdfPath: '/downloads/pepcolab-guide-reading-a-coa.pdf',
    pages: 4,
    shortName: 'the certificate guide',
    seoDescription:
      'Free guide: how to read a laboratory certificate of analysis — identity, purity, net content, and four signs a certificate is genuine.',
  },
  {
    slug: 'vendor-checklist',
    source: 'learn-check',
    title: 'The 5-point supplier checklist',
    headline: 'Five questions to ask any laboratory supplier',
    subhead:
      'A one-page checklist for judging a research-compound supplier before you order — with a copy-and-paste message you can send to any of them.',
    bullets: [
      {
        title: 'Who did the testing',
        text: 'The difference between a manufacturer’s own paperwork and an independent laboratory — and how to tell which one you are looking at.',
      },
      {
        title: 'Whether the paperwork matches the vial',
        text: 'Why a batch-matched certificate is the only kind that answers anything, and what to ask for when a lot number is missing.',
      },
      {
        title: 'What happens in transit',
        text: 'Storage and packing questions that separate a laboratory supplier from a reseller, and the answers to expect.',
      },
    ],
    pdfPath: '/downloads/pepcolab-guide-supplier-checklist.pdf',
    pages: 2,
    shortName: 'the supplier checklist',
    seoDescription:
      'Free one-page checklist: five questions to ask any laboratory supplier about testing, batch documentation and cold-chain handling.',
  },
  {
    slug: 'storage-guide',
    source: 'learn-store',
    title: 'Laboratory storage guide',
    headline: 'How to store lyophilised peptides in the lab',
    subhead:
      'A practical guide to keeping freeze-dried and reconstituted laboratory material stable — temperatures, light, moisture and the mistakes that quietly degrade a sample.',
    bullets: [
      {
        title: 'Before and after reconstitution',
        text: 'Why the rules change once a powder becomes a solution, and the temperatures each state needs.',
      },
      {
        title: 'The four things that degrade a sample',
        text: 'Heat, light, moisture and repeated freeze–thaw cycles — what each one does and how to prevent it.',
      },
      {
        title: 'A bench-ready checklist',
        text: 'Labelling, logging and handling habits that keep material traceable and stable for as long as possible.',
      },
    ],
    pdfPath: '/downloads/pepcolab-guide-laboratory-storage.pdf',
    pages: 3,
    shortName: 'the storage guide',
    seoDescription:
      'Free guide: storing lyophilised and reconstituted laboratory peptides — temperature, light, moisture and freeze–thaw handling.',
  },
]

export function getLearnGuide(slug: string): LearnGuide | undefined {
  return LEARN_GUIDES.find((g) => g.slug === slug)
}

/** Attribution value: letters, digits and dashes only, health words never expected. */
export function cleanSource(raw: string | null | undefined, fallback: string): string {
  const v = (raw || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  return v || fallback
}

/**
 * Consent wording, version "email-v1" (clean-up brief B4). Shown verbatim
 * next to every optional email opt-in box and stored with the consent.
 */
export const EMAIL_OPT_IN_TEXT =
  'Email me PepcoLab research updates: new batches, certificate releases and restock notices. I can unsubscribe at any time.'
export const EMAIL_OPT_IN_VERSION = 'email-v1'

/** Optional "what best describes your work?" dropdown on the guide form. */
export const RESEARCH_AREAS: { value: string; label: string }[] = [
  { value: 'academic', label: 'Academic or university research' },
  { value: 'analytical', label: 'Analytical or testing laboratory' },
  { value: 'formulation', label: 'Formulation or development' },
  { value: 'quality-control', label: 'Quality control or procurement' },
  { value: 'other', label: 'Something else' },
]
