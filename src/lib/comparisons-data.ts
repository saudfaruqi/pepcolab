// src/lib/comparisons-data.ts
//
// SEO FIX (growth-playbook §04 Phase 1, "Comparison pages"): "BPC-157 vs
// TB-500, GHK-Cu vs Matrixyl, CJC-1295 vs Ipamorelin, etc. Research-profile
// framing only. A format nobody has claimed."
//
// Research-profile framing only, matching PepcoLab's own compliance rule —
// mechanism, structure, and research-literature differences, never dosing,
// administration, or human-outcome claims.
//
// ─── EXPANSION (Oct 2026) ─────────────────────────────────────────────────
//
// Four comparisons added, each chosen because SERP review found the query
// either uncontested or served only by product pages:
//
//   semax-vs-selank              Both in the catalogue, both from the same
//                                research institute, routinely conflated.
//   ghk-cu-vs-ahk-cu             We sell BOTH copper tripeptides and nothing
//                                on the web distinguishes them; "is ghk cu
//                                legal in uk" already ranks for us at pos 9.
//   kpv-vs-bpc-157               Both in the catalogue, both studied in GI
//                                inflammation models, different mechanisms.
//   supplier-coa-vs-third-party-testing
//                                Not a compound pair. "Can I trust a COA
//                                provided directly by the supplier?" is a
//                                top PAA question on every COA query and no
//                                supplier answers it honestly, because the
//                                honest answer is "verify it independently".
//                                We can answer it, because our batches are
//                                publicly checkable at /verify.
//
// Every comparison now also carries a `faq` block. In nine of the ten query
// clusters reviewed, the page at position 1 carries NO FAQ markup, while the
// pages that do are winning the question boxes underneath. See
// components/FaqSection.tsx for the two rules governing those answers.

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
  /**
   * Catalogue handles. Verified against the live sitemap at
   * https://www.pepcolab.com/sitemap.xml — do not add a slug without
   * checking it there first, because a guessed handle 404s rather than
   * sells. The display label comes from PRODUCT_LABELS below so the anchor
   * text reads "Shop BPC-157" rather than "Shop bpc 157".
   */
  relatedProductSlugs?: string[]
  /** Visible Q&A, rendered and emitted as FAQPage JSON-LD. */
  faq?: { q: string; a: string }[]
  /**
   * Set when the comparison is a format other than compound-vs-compound, so
   * the page drops the "Research-profile comparison" compliance footnote
   * that only makes sense for two compounds.
   */
  kind?: 'compound' | 'practice'
}

/**
 * Proper display names for catalogue handles. Mechanical slug→title-case
 * produces "Ghk Cu" and "Bpc 157", which is both wrong and weak anchor text
 * on the one internal link that points at a buying page.
 */
export const PRODUCT_LABELS: Record<string, string> = {
  'bpc-157': 'BPC-157',
  'ghk-cu': 'GHK-Cu',
  'ahk-cu': 'AHK-Cu',
  kpv: 'KPV',
  semax: 'Semax',
  selank: 'Selank',
  epithalon: 'Epithalon',
  'ss-31': 'SS-31',
  'igf-1-lr3': 'IGF-1 LR3',
  tesamorelin: 'Tesamorelin',
  retatrutide: 'Retatrutide',
  cagrilintide: 'Cagrilintide',
  'bacteriostatic-water': 'Bacteriostatic Water',
  'pharma-grade-bac-water': 'Pharma-Grade Bacteriostatic Water',
  matrixyl: 'Matrixyl',
  'thymosin-alpha': 'Thymosin Alpha-1',
  ipamorelin: 'Ipamorelin',
  'cjc-no-dac': 'CJC-1295 (No DAC)',
  'snap-8': 'SNAP-8',
}

export function productLabel(slug: string): string {
  return PRODUCT_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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
      { label: 'Stability profile', a: 'Reported to be relatively stable across a range of conditions in preclinical work', b: 'Similar handling considerations to other short peptide fragments — see our [storage guide](/guides/storage-conditions)' },
    ],
    takeaway:
      'Both are studied in tissue-repair contexts but through different proposed mechanisms — BPC-157 research centres on gastroprotective and growth-factor pathways, TB-500 research centres on actin regulation and cell migration. Treat published comparisons of the two with appropriate scepticism; head-to-head preclinical data is limited.',
    relatedResearchIds: ['bpc-157'],
    relatedProductSlugs: ['bpc-157'],
    faq: [
      {
        q: 'Are BPC-157 and TB-500 the same thing?',
        a: 'No. They are structurally unrelated. BPC-157 is a 15-amino-acid sequence derived from a protein found in gastric juice; TB-500 is a fragment of thymosin beta-4. They appear together in recovery-research literature because both are studied in tissue-repair models, not because they are variants of one compound.',
      },
      {
        q: 'Why are BPC-157 and TB-500 so often discussed together?',
        a: 'Both appear in the same body of preclinical musculoskeletal and wound-healing literature, which leads to them being grouped in secondary sources and forum summaries. That grouping reflects a shared research context rather than a shared mechanism — the proposed pathways are different.',
      },
      {
        q: 'Is there head-to-head research comparing BPC-157 and TB-500?',
        a: 'Direct comparative preclinical data is limited. Most published work studies each compound separately against a control, not against the other, which means any ranking of the two you encounter online is usually inference rather than measurement.',
      },
      {
        q: 'Does PepcoLab sell TB-500 as a standalone compound?',
        a: 'Not as a standalone vial. TB-500 appears only within a blend in our catalogue, which is why there is no standalone product link on this page. You can see what we do stock, with the batch certificate for each, on the [products page](/products).',
      },
    ],
    kind: 'compound',
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
    relatedProductSlugs: ['ghk-cu', 'matrixyl'],
    faq: [
      {
        q: 'Is Matrixyl a copper peptide?',
        a: 'No. Matrixyl (palmitoyl pentapeptide-4) contains no copper and its proposed mechanism does not involve metal-ion binding. Only GHK-Cu of the two is a copper complex, and in GHK-Cu the copper ion is integral rather than incidental.',
      },
      {
        q: 'Can GHK-Cu and Matrixyl be used in the same formulation?',
        a: 'Formulation compatibility is outside what we can advise on, and published guidance is mixed — copper complexes are reported to interact with some other actives. That is a formulation-chemistry question for the researcher designing the preparation, not something a supplier can answer generically.',
      },
      {
        q: 'Which has more published research behind it?',
        a: 'GHK-Cu has the longer literature trail, with work on the tripeptide dating back decades and covering extracellular matrix and gene-expression models. Matrixyl literature is narrower and concentrated on collagen signalling in fibroblast models. Volume of publications is not the same as strength of evidence for any given claim.',
      },
      {
        q: 'Is GHK-Cu legal to buy in the UK?',
        a: 'GHK-Cu is supplied for laboratory research use and is not a licensed medicine in the UK. The position is covered in detail on our [GHK-Cu legal note](/legal/ghk-cu) and in the [UK compliance overview](/guides/research-peptides-legal-status-uk).',
      },
    ],
    kind: 'compound',
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
      { label: 'Regulatory note', a: 'On the WADA Prohibited List; no MHRA/UK marketing authorisation — see our [legal-status page](/legal/cjc-1295)', b: 'On the WADA Prohibited List; no MHRA/UK marketing authorisation — see our [legal-status page](/legal/ipamorelin)' },
    ],
    takeaway:
      'They act on two different receptors within the same growth-hormone-release pathway rather than being alternative versions of the same mechanism, which is why research literature frequently studies them together rather than as substitutes for one another.',
    relatedProductSlugs: ['ipamorelin', 'cjc-no-dac'],
    faq: [
      {
        q: 'What is the difference between a GHRH analogue and a secretagogue?',
        a: 'A GHRH analogue mimics growth hormone-releasing hormone and acts at the GHRH receptor. A secretagogue such as Ipamorelin acts at a different receptor entirely — the ghrelin receptor, GHS-R1a. Both sit in the same growth-hormone-release pathway but enter it at different points.',
      },
      {
        q: 'What does "DAC" mean on a CJC-1295 label?',
        a: 'DAC stands for Drug Affinity Complex, a modification reported to extend the compound\'s circulating half-life substantially in preclinical models. CJC-1295 is supplied both with and without it, and the two are not interchangeable in a research protocol — check which variant a certificate of analysis refers to. Our catalogue stocks the no-DAC form.',
      },
      {
        q: 'Are CJC-1295 and Ipamorelin on the WADA Prohibited List?',
        a: 'Yes, both appear on the WADA Prohibited List. The list is revised annually, so verify the current year\'s edition directly with WADA rather than relying on any supplier page, including this one.',
      },
      {
        q: 'Are either of these licensed medicines in the UK?',
        a: 'Neither holds a UK marketing authorisation. Both are supplied for laboratory research use only. The broader regulatory picture is set out in our [UK compliance overview](/guides/research-peptides-legal-status-uk).',
      },
    ],
    kind: 'compound',
  },
  {
    slug: 'semax-vs-selank',
    compoundA: 'Semax',
    compoundB: 'Selank',
    title: 'Semax vs Selank: Research Profile Comparison',
    metaDescription:
      'Semax and Selank compared on structure, parent molecule and research focus — two heptapeptides from the same institute studying different pathways.',
    intro:
      'Semax and Selank are routinely mentioned in the same breath, and for once there is a real reason: both are synthetic heptapeptides developed at the Institute of Molecular Genetics of the Russian Academy of Sciences, both are registered as medicines in Russia and in almost no other jurisdiction, and both are studied largely through Russian-language literature that is unevenly translated. That shared provenance is where the similarity ends. They derive from entirely different parent molecules and are studied against different pathways.',
    rows: [
      { label: 'Parent molecule', a: 'Fragment of adrenocorticotropic hormone — the ACTH(4–10) sequence, modified at the C-terminus for stability', b: 'Analogue of tuftsin, a tetrapeptide fragment of immunoglobulin G, extended with a stabilising tripeptide' },
      { label: 'Length', a: 'Heptapeptide (7 residues)', b: 'Heptapeptide (7 residues)' },
      { label: 'Primary research focus', a: 'Neurotrophic and neuroprotective models; attention and memory paradigms in rodent studies', b: 'Anxiolytic models; immunomodulation via the tuftsin pathway' },
      { label: 'Proposed mechanism', a: 'Reported to increase BDNF and NGF expression in preclinical models; no corticotropic activity, the ACTH hormonal action having been engineered out', b: 'Reported to modulate GABAergic and monoamine signalling, and to inhibit enkephalin degradation, in preclinical models' },
      { label: 'Regulatory status', a: 'Registered as a medicine in Russia; no MHRA, EMA or FDA authorisation — see our [Semax legal note](/legal/semax)', b: 'Registered as a medicine in Russia; no MHRA, EMA or FDA authorisation — see our [Selank legal note](/legal/selank)' },
      { label: 'Evidence base', a: 'Substantial Russian clinical literature, limited independent Western replication', b: 'Smaller literature than Semax, similarly concentrated in Russian-language publications' },
      { label: 'Handling', a: 'Lyophilised; short-chain peptide handling applies — see [storage](/guides/storage-conditions)', b: 'Lyophilised; short-chain peptide handling applies — see [storage](/guides/storage-conditions)' },
    ],
    takeaway:
      'The shared institute, shared peptide length and shared regulatory position make these two look like a matched pair, and they are genuinely studied alongside one another. But Semax descends from a pituitary hormone fragment and is studied for neurotrophic signalling, while Selank descends from an immunoglobulin fragment and is studied for anxiolytic and immunomodulatory activity. The single most important caveat applies to both equally: the evidence base is overwhelmingly Russian-language and thinly replicated outside it, so confidence intervals on any reported finding should be read as wider than the publication count alone suggests.',
    relatedResearchIds: ['semax'],
    relatedProductSlugs: ['semax', 'selank'],
    faq: [
      {
        q: 'Are Semax and Selank the same compound?',
        a: 'No. Both are seven-residue synthetic peptides from the same research institute, which is why they are so often paired, but they come from different parent molecules — Semax from an ACTH fragment, Selank from the immunoglobulin-derived tetrapeptide tuftsin — and are studied against different pathways.',
      },
      {
        q: 'Does Semax still act like ACTH?',
        a: 'The ACTH(4–10) fragment Semax is based on lacks the portion of the hormone responsible for corticotropic activity, and the published rationale for the molecule is specifically that the hormonal action is absent while neurotropic activity is retained. It is studied as a neuroactive peptide, not as a hormone analogue.',
      },
      {
        q: 'Is Semax legal in the UK?',
        a: 'Semax has no UK marketing authorisation and is not a licensed medicine here; it is supplied for laboratory research use only. Our [Semax legal note](/legal/semax) sets out the position, and the [UK compliance overview](/guides/research-peptides-legal-status-uk) covers the framework it sits in.',
      },
      {
        q: 'Why is most Semax and Selank research in Russian?',
        a: 'Both were developed at the Institute of Molecular Genetics of the Russian Academy of Sciences and brought to market within the Russian pharmaceutical system, so the clinical literature accumulated there. Independent replication in Western journals is limited, which is a meaningful limitation on how confidently any individual finding should be read.',
      },
      {
        q: 'Are Semax or Selank on the WADA Prohibited List?',
        a: 'Neither appears on the Prohibited List as a named substance at the time of writing, but WADA revises the list annually and also prohibits broad classes of compound by mechanism rather than only by name. Anyone subject to anti-doping testing should check the current list with WADA directly rather than rely on a supplier page.',
      },
    ],
    kind: 'compound',
  },
  {
    slug: 'ghk-cu-vs-ahk-cu',
    compoundA: 'GHK-Cu',
    compoundB: 'AHK-Cu',
    title: 'GHK-Cu vs AHK-Cu: What One Amino Acid Changes',
    metaDescription:
      'GHK-Cu and AHK-Cu differ by one amino acid and are studied for different things. The structural difference and the research split, side by side.',
    intro:
      'GHK-Cu and AHK-Cu are both copper-complexed tripeptides, both end in histidine-lysine, and differ in exactly one position: the first residue is glycine in GHK-Cu and alanine in AHK-Cu. One methyl group apart. Because the names are a single letter apart too, they are mixed up constantly in supplier listings and secondary write-ups — and the research literature on them points in noticeably different directions, so the confusion is not harmless.',
    rows: [
      { label: 'Sequence', a: 'Glycyl-L-histidyl-L-lysine (Gly-His-Lys), copper-complexed', b: 'Alanyl-L-histidyl-L-lysine (Ala-His-Lys), copper-complexed' },
      { label: 'Structural difference', a: 'Glycine at position 1 — the smallest amino acid, no side chain', b: 'Alanine at position 1 — glycine plus a single methyl group' },
      { label: 'Occurrence', a: 'Occurs naturally in human plasma; plasma concentration is reported to decline with age, which is the origin of much of the interest in it', b: 'Not established as a naturally occurring human plasma peptide in the same way; studied as a synthetic analogue' },
      { label: 'Primary research focus', a: 'Extracellular matrix remodelling, collagen and glycosaminoglycan synthesis, wound-healing and antioxidant models; a notably broad gene-expression literature', b: 'Angiogenesis and vascular endothelial growth factor signalling; dermal papilla and hair-follicle models' },
      { label: 'Copper role', a: 'Copper is integral to the proposed mechanism, not a carrier — the apo-peptide and the complex are not treated as equivalent in the literature', b: 'Also studied as a copper complex, with the metal ion similarly treated as part of the active species' },
      { label: 'Literature volume', a: 'The larger body of work by a wide margin, spanning decades', b: 'Substantially smaller and more narrowly focused' },
      { label: 'Handling', a: 'Copper complexes are light- and oxidation-sensitive; see [storage conditions](/guides/storage-conditions) and [how long peptides last](/guides/how-long-do-peptides-last)', b: 'Same considerations as GHK-Cu — treat both as light-sensitive copper complexes' },
    ],
    takeaway:
      'The two are not interchangeable despite being one methyl group apart. GHK-Cu carries the far larger literature and is studied principally for extracellular matrix and wound-repair biology; AHK-Cu research clusters instead around angiogenic signalling and follicular models. If a supplier listing, a formulation ingredient list or a secondary article uses the names loosely, assume it has not distinguished them deliberately and go back to the certificate of analysis — the sequence on the COA is the only thing that settles which compound is actually in the vial.',
    relatedResearchIds: ['ghk-cu'],
    relatedProductSlugs: ['ghk-cu', 'ahk-cu'],
    faq: [
      {
        q: 'What is the difference between GHK-Cu and AHK-Cu?',
        a: 'A single amino acid at the first position: glycine in GHK-Cu, alanine in AHK-Cu. Both are copper-complexed tripeptides ending in histidine-lysine. Despite that closeness, GHK-Cu research centres on extracellular matrix and wound-healing biology while AHK-Cu research centres on angiogenic signalling and hair-follicle models.',
      },
      {
        q: 'Is AHK-Cu just a cheaper version of GHK-Cu?',
        a: 'No — they are distinct compounds with distinct research literatures, not grades of the same thing. Pricing differences reflect synthesis and demand, not potency equivalence, and nothing in the published work supports treating one as a substitute for the other.',
      },
      {
        q: 'How do I tell which one I actually received?',
        a: 'The certificate of analysis is the only reliable answer: it states the sequence and the measured molecular weight, and the two differ by 14 daltons — one methyl group. Our guide on [reading a COA](/guides/coa-interpretation) explains how to check a reported mass against the theoretical one, and every PepcoLab batch is checkable by lot number at [/verify](/verify).',
      },
      {
        q: 'Does the copper matter, or is it just a delivery vehicle?',
        a: 'In both compounds the copper ion is treated in the literature as part of the active species rather than as a carrier. Research on the copper-free peptide and on the complex is not interchangeable, which is one reason a COA that does not specify the complexed form leaves a real ambiguity.',
      },
      {
        q: 'Do copper peptides need different storage from other peptides?',
        a: 'They warrant particular care with light and oxidation on top of the usual lyophilised-peptide considerations. The general framework is in our [storage guide](/guides/storage-conditions), with stability timeframes by state in [how long peptides last](/guides/how-long-do-peptides-last).',
      },
    ],
    kind: 'compound',
  },
  {
    slug: 'kpv-vs-bpc-157',
    compoundA: 'KPV',
    compoundB: 'BPC-157',
    title: 'KPV vs BPC-157: Research Profile Comparison',
    metaDescription:
      'KPV and BPC-157 are studied in the same gut-inflammation models through different mechanisms. Structure, parent molecules and research focus compared.',
    intro:
      'KPV and BPC-157 turn up together in gut-inflammation research discussions, which has produced a fair amount of writing treating them as alternatives. They are about as structurally different as two peptides studied in the same model system can be: one is a three-residue fragment of a pituitary hormone, the other a fifteen-residue sequence derived from a gastric protein, and the pathways they are studied against barely overlap.',
    rows: [
      { label: 'Length', a: 'Tripeptide — lysine-proline-valine (3 residues)', b: 'Pentadecapeptide (15 residues)' },
      { label: 'Parent molecule', a: 'The C-terminal fragment of alpha-melanocyte-stimulating hormone (α-MSH)', b: 'Derived from a sequence within body protection compound, a protein identified in gastric juice' },
      { label: 'Primary research focus', a: 'Anti-inflammatory signalling; colitis and mucosal inflammation models', b: 'Gastroprotection; tendon, ligament and musculoskeletal repair models, alongside gastrointestinal work' },
      { label: 'Proposed mechanism', a: 'Reported to act on NF-κB-dependent inflammatory signalling; studied as a substrate of the PepT1 peptide transporter expressed in intestinal epithelium', b: 'Reported to modulate growth factor pathways, VEGF expression and nitric oxide signalling in preclinical models' },
      { label: 'Why they get compared', a: 'Both appear in intestinal-inflammation literature', b: 'Both appear in intestinal-inflammation literature' },
      { label: 'Mechanistic overlap', a: 'Minimal — the shared ground is the model system studied, not the pathway', b: 'Minimal — the shared ground is the model system studied, not the pathway' },
      { label: 'Regulatory note', a: 'No UK or EU marketing authorisation; laboratory research use only', b: 'No UK or EU marketing authorisation; see our [BPC-157 legal note](/legal/bpc-157)' },
    ],
    takeaway:
      'The comparison is a comparison of research contexts rather than of mechanisms. Both compounds appear in mucosal and gastrointestinal inflammation literature, which is why they are grouped; beyond that, KPV is a three-residue α-MSH fragment studied against inflammatory transcription signalling, and BPC-157 is a fifteen-residue sequence studied against growth factor and nitric oxide pathways with a much broader musculoskeletal literature attached. Anything presenting them as interchangeable is reasoning from the model system backwards.',
    relatedResearchIds: ['bpc-157'],
    relatedProductSlugs: ['kpv', 'bpc-157'],
    faq: [
      {
        q: 'Is KPV a fragment of BPC-157?',
        a: 'No. KPV is the C-terminal tripeptide of alpha-melanocyte-stimulating hormone. BPC-157 is a separate fifteen-residue sequence derived from a protein found in gastric juice. Neither contains the other.',
      },
      {
        q: 'Why are KPV and BPC-157 studied in the same models?',
        a: 'Both appear in gastrointestinal and mucosal inflammation research, so experimental work on the two often uses comparable colitis or mucosal-injury models. Shared model systems are not shared mechanisms — the proposed pathways are different.',
      },
      {
        q: 'What is PepT1 and why does it come up with KPV?',
        a: 'PepT1 is a peptide transporter expressed in intestinal epithelium. KPV is studied as a substrate for it, which is part of why the compound features in intestinal-specific research rather than in systemic inflammation work generally.',
      },
      {
        q: 'Does a shorter peptide mean a more stable one?',
        a: 'Not reliably. Chain length is one factor among several — sequence composition, the presence of oxidation-prone residues, and the storage state all matter more in practice. Our guide on [how long peptides last](/guides/how-long-do-peptides-last) covers what actually drives stability by state.',
      },
    ],
    kind: 'compound',
  },
  {
    slug: 'supplier-coa-vs-third-party-testing',
    compoundA: 'Supplier-supplied COA',
    compoundB: 'Independent third-party test',
    title: 'Supplier COA vs Third-Party Testing: What Each One Actually Proves',
    metaDescription:
      'A supplier COA and an independent third-party test answer different questions. What each establishes, what neither proves, and how to check both.',
    intro:
      '"Can I trust a COA the supplier gave me?" is one of the most asked questions on this subject, and almost nobody selling research peptides answers it straight — because the straight answer involves telling you to go and check their work somewhere else. So: a supplier certificate of analysis and an independently commissioned test are not competing versions of the same document. They establish different things, they fail in different ways, and knowing which question each one answers is more useful than treating either as a verdict.',
    rows: [
      { label: 'What it is', a: 'An analytical report, usually HPLC purity and a mass-spectrometry identity check, commissioned by the supplier on a production batch', b: 'The same class of analysis, commissioned by the buyer on the vial actually received, from a laboratory with no relationship to the seller' },
      { label: 'What it establishes', a: 'That a named batch, at the time it was tested, met the stated purity and matched the expected molecular weight', b: 'That the specific vial in your hand, at the time you tested it, contains what the label says at the measured purity' },
      { label: 'What it does not establish', a: 'That the vial you received came from the batch on the certificate, or that nothing degraded in transit or storage since', b: 'Anything about other vials, other batches, or the supplier\'s process generally — it is a single-sample result' },
      { label: 'Who chose the sample', a: 'The supplier', b: 'You' },
      { label: 'Main failure mode', a: 'A real certificate for a real batch, presented alongside a vial that is not from it — or a certificate reused past the point where it describes current production', b: 'Sampling and handling error at your end, and the cost of testing every purchase, which is why almost nobody does it routinely' },
      { label: 'How to check it', a: 'Verify the lot number resolves on the supplier\'s own records and that the accession number resolves with the testing laboratory. Ours are published at [/verify](/verify) and listed at [/certificates](/certificates)', b: 'Choose the laboratory yourself and submit the sample yourself — a test the seller arranges on your behalf is not independent, whatever it is called' },
      { label: 'Cost to you', a: 'None — it should come with the vial, and a supplier declining to provide one is itself the answer to the question', b: 'A per-sample fee, typically the main reason buyers rely on supplier documentation instead' },
    ],
    takeaway:
      'Treat a supplier COA as a necessary minimum rather than a guarantee: no certificate at all is disqualifying, and a certificate whose lot number and accession number both resolve independently is meaningfully better than one that cannot be checked, because an unverifiable certificate costs nothing to fabricate. Independent testing is the only thing that closes the gap between "this batch was good" and "this vial is good" — and if you are going to commission one, commission it yourself. The practical middle ground most researchers land on: buy from suppliers whose batch records are publicly checkable, spot-test independently rather than exhaustively, and treat any supplier who cannot produce a lot number you can look up as untested regardless of what their PDF says.',
    faq: [
      {
        q: 'Can I trust a certificate of analysis provided by the supplier?',
        a: 'A supplier COA tells you what a named batch measured at the time it was tested. What it cannot tell you is whether the vial you received came from that batch. That gap is why a lot number you can independently look up matters more than the certificate\'s existence — an unverifiable PDF costs nothing to produce. Ours resolve by lot number at [/verify](/verify).',
      },
      {
        q: 'What is the difference between a vendor COA and third-party testing?',
        a: 'The vendor commissions the first on a production batch and chooses the sample; you commission the second on the vial you actually received and choose the sample yourself. The first speaks to a batch, the second to a vial. A test the seller arranges on your behalf is not third-party testing regardless of what it is called.',
      },
      {
        q: 'How can I tell if a COA is fake?',
        a: 'Check whether the lot number resolves on the supplier\'s own published records, and whether the accession or report number resolves with the laboratory that supposedly issued it. Then check the internal arithmetic — reported mass against theoretical mass, purity against the chromatogram. Our [COA interpretation guide](/guides/coa-interpretation) walks through each check.',
      },
      {
        q: 'How much does independent peptide testing cost?',
        a: 'It is charged per sample and varies by laboratory and by the panel requested, so quotes are worth getting directly rather than relying on a figure quoted second-hand on a supplier site. Cost per sample is the main reason most researchers spot-check rather than test every purchase.',
      },
      {
        q: 'What should I do if a supplier refuses to provide a COA?',
        a: 'Treat the refusal as the answer. Batch documentation is a routine part of supplying research chemicals, and a supplier who will not produce one — or who produces one with no lot number you can look up — has told you what you need to know.',
      },
      {
        q: 'Does a COA expire?',
        a: 'A certificate describes a batch at the moment it was tested; it does not become invalid on a date, but it becomes less informative as the material ages and as storage conditions accumulate. A certificate from two years ago for lyophilised material stored correctly still means something; the same certificate for a vial that has been reconstituted and sitting at room temperature means very little. Stability by state is covered in [how long peptides last](/guides/how-long-do-peptides-last).',
      },
    ],
    kind: 'practice',
  },
]

export function getComparisonBySlug(slug: string) {
  return COMPARISONS.find((c) => c.slug === slug)
}