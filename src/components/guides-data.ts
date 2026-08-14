// src/lib/guides-data.ts
// Shared, server-safe content source for /guides and /guides/[slug].
// No 'use client' — this file is imported by Server Components so guide
// content is present in the initial HTML response and indexable by Google,
// unlike the old single client-side /guides page where all six guides lived
// in one React state object with no per-guide URL.

// ─── FULL GUIDE CONTENT ────────────────────────────────────────────────────────


export type ContentBlock =
  | { type: 'intro' | 'heading' | 'paragraph' | 'callout'; text: string; items?: never }
  | { type: 'list'; items: string[]; text?: never }

export type Guide = {
  id: string
  title: string
  category: string
  readTime: string
  excerpt: string
  /** One-sentence, ≤155-char version of the excerpt for <meta name="description">. */
  metaDescription: string
  publishedAt: string
  /** ISO 8601 date matching publishedAt, for JSON-LD datePublished. */
  publishedISO: string
  content: ContentBlock[]
}

export const GUIDES: Guide[] = [
  {
    id: 'peptide-reconstitution',
    title: 'Peptide Reconstitution: Complete Step-by-Step Guide',
    category: 'Lab Basics',
    readTime: '6 min',
    excerpt:
      'Proper reconstitution techniques to maintain peptide stability and research integrity.',
    publishedAt: 'June 2, 2025',
    publishedISO: '2025-06-02',
    metaDescription: 'How to safely reconstitute lyophilized research peptides: solvent selection, sterile technique, dissolution checks and storage after mixing.',
    content: [
      {
        type: 'intro',
        text: 'Reconstitution is one of the most critical steps in peptide research. Done incorrectly, it can degrade your compound before the experiment even begins. This guide walks through the complete process — solvent selection, technique, storage, and common pitfalls.',
      },
      {
        type: 'heading',
        text: 'What Is Reconstitution?',
      },
      {
        type: 'paragraph',
        text: 'Lyophilized (freeze-dried) peptides must be dissolved in an appropriate solvent before use. Reconstitution refers to this process of taking a dry peptide powder and producing a stable, uniform solution at a target concentration.',
      },
      {
        type: 'paragraph',
        text: 'Choosing the wrong solvent, using aggressive mixing, or working in non-sterile conditions can all compromise the compound — sometimes invisibly. This is why standardizing your reconstitution protocol matters.',
      },
      {
        type: 'heading',
        text: 'Step 1 — Determine the Right Solvent',
      },
      {
        type: 'paragraph',
        text: 'The solvent choice depends on the peptide\'s amino acid composition and overall charge. As a general starting point:',
      },
      {
        type: 'list',
        items: [
          'Hydrophilic peptides: sterile water or 0.1% acetic acid',
          'Hydrophobic peptides: a small amount of DMSO (≤10%) followed by aqueous buffer',
          'Acidic peptides: dilute ammonium bicarbonate (~50 mM)',
          'Basic peptides: 0.1% acetic acid in water',
        ],
      },
      {
        type: 'paragraph',
        text: 'When in doubt, consult the Certificate of Analysis (COA) provided with your peptide — reputable suppliers include solubility notes that inform this decision.',
      },
      {
        type: 'heading',
        text: 'Step 2 — Prepare a Sterile Environment',
      },
      {
        type: 'paragraph',
        text: 'All reconstitution should occur inside a laminar flow hood or biological safety cabinet if available. At minimum, work on a clean bench surface wiped with 70% ethanol. Wear gloves and use sterile, single-use syringes and vials.',
      },
      {
        type: 'callout',
        text: 'Allow lyophilized peptide vials to reach room temperature before opening. Opening a cold vial causes moisture condensation, which can degrade the compound.',
      },
      {
        type: 'heading',
        text: 'Step 3 — Add Solvent Gradually',
      },
      {
        type: 'paragraph',
        text: 'Using a sterile syringe, slowly add your chosen solvent along the inner wall of the vial — not directly onto the powder. For a 1 mg vial targeting 1 mg/mL, add 1 mL of solvent. Do not add all the solvent at once.',
      },
      {
        type: 'paragraph',
        text: 'After each addition, gently swirl the vial. Never vortex vigorously — mechanical shear can break peptide bonds and create aggregates that reduce bioavailability in cell-based assays.',
      },
      {
        type: 'heading',
        text: 'Step 4 — Verify Complete Dissolution',
      },
      {
        type: 'paragraph',
        text: 'Hold the vial up to light and inspect for particulates. The solution should be clear to slightly opalescent. Persistent cloudiness or visible particles indicate incomplete dissolution — add additional solvent or briefly sonicate in a cool water bath (30 second intervals).',
      },
      {
        type: 'heading',
        text: 'Step 5 — Aliquot and Store',
      },
      {
        type: 'paragraph',
        text: 'Divide your reconstituted solution into single-use aliquots immediately. Repeated freeze-thaw cycles are among the most common causes of peptide degradation in research settings. Label each aliquot with compound name, concentration, solvent, date, and preparer initials.',
      },
      {
        type: 'list',
        items: [
          'Short-term (days): 4°C in a refrigerator',
          'Medium-term (weeks): −20°C in a non-frost-free freezer',
          'Long-term (months): −80°C, wrapped in foil (light-sensitive peptides)',
        ],
      },
      {
        type: 'heading',
        text: 'Common Mistakes to Avoid',
      },
      {
        type: 'paragraph',
        text: 'Even experienced researchers make these errors. Keep them in mind when training new lab members:',
      },
      {
        type: 'list',
        items: [
          'Using the wrong solvent based on assumed solubility rather than checking the COA',
          'Vortexing aggressively instead of gentle swirling',
          'Opening lyophilized vials while still cold',
          'Storing reconstituted solutions in the same vial repeatedly used for dosing',
          'Failing to record exact concentration and preparation date',
        ],
      },
      {
        type: 'paragraph',
        text: 'Following this protocol consistently will produce reliable, reproducible results and protect the integrity of your research data.',
      },
    ],
  },
  {
    id: 'storage-conditions',
    title: 'Storage Conditions for Research Peptides',
    category: 'Storage',
    readTime: '5 min',
    excerpt: 'Temperature control, freeze-thaw cycles, and long-term preservation best practices.',
    publishedAt: 'May 28, 2025',
    publishedISO: '2025-05-28',
    metaDescription: 'Temperature, humidity and light guidance for storing lyophilized and reconstituted research peptides, plus a quick-reference storage table.',
    content: [
      {
        type: 'intro',
        text: 'Improper storage is the number one cause of peptide degradation in research labs — and it often goes undetected until data becomes inconsistent. Understanding temperature, humidity, and light exposure is essential.',
      },
      {
        type: 'heading',
        text: 'The Core Enemies of Peptide Stability',
      },
      {
        type: 'paragraph',
        text: 'Peptides are susceptible to four primary degradation pathways, all of which are worsened by poor storage: hydrolysis (bond cleavage in the presence of water), oxidation (particularly of methionine and cysteine residues), aggregation (irreversible precipitation), and microbial contamination.',
      },
      {
        type: 'heading',
        text: 'Lyophilized Peptide Storage',
      },
      {
        type: 'paragraph',
        text: 'Lyophilized peptides are significantly more stable than their reconstituted counterparts. Most can be stored at −20°C for several years without meaningful degradation if kept dry. For maximum longevity:',
      },
      {
        type: 'list',
        items: [
          'Store in a desiccated environment (silica gel packets in storage containers)',
          'Keep vials sealed with parafilm after opening',
          'Avoid non-frost-free freezers — their defrost cycles create temperature fluctuations',
          'Group vials in labeled bags by compound and expiry period',
        ],
      },
      {
        type: 'callout',
        text: 'If a lyophilized peptide vial has been stored properly and shows no color change or unusual odor when opened, it is generally still suitable for research use — even if stored beyond the nominal expiry.',
      },
      {
        type: 'heading',
        text: 'Reconstituted Peptide Storage',
      },
      {
        type: 'paragraph',
        text: 'Once dissolved, peptides are far more vulnerable. Stability windows depend on the specific compound, solvent, and concentration, but general guidelines apply:',
      },
      {
        type: 'list',
        items: [
          '4°C: 24–72 hours for most peptides in aqueous buffer',
          '−20°C: up to 3 months with proper aliquoting',
          '−80°C: 6–12 months for most research applications',
        ],
      },
      {
        type: 'paragraph',
        text: 'Aliquot sizes matter. Each aliquot should correspond to a single experimental use — once thawed, it should be used and discarded, not refrozen.',
      },
      {
        type: 'heading',
        text: 'Light and Humidity Considerations',
      },
      {
        type: 'paragraph',
        text: 'Photosensitive peptides (those containing tryptophan, tyrosine, phenylalanine, or disulfide-containing sequences) should be stored in amber vials or wrapped in aluminum foil. Humidity is a concern for lyophilized material — even brief exposure to ambient moisture during weighing or dispensing can initiate hydrolysis.',
      },
      {
        type: 'paragraph',
        text: 'Work quickly when handling lyophilized powders. Return vials to dry storage as soon as possible after use.',
      },
      {
        type: 'heading',
        text: 'A Practical Storage Reference',
      },
      {
        type: 'list',
        items: [
          'Lyophilized, unopened: −20°C, desiccated, 2–5 years',
          'Lyophilized, opened: −20°C, desiccated, use within 6 months',
          'Reconstituted in aqueous: −80°C aliquots, use within 3 months',
          'Reconstituted in DMSO: −20°C aliquots, use within 3 months',
          'Working solutions: 4°C, prepare fresh for each experiment if possible',
        ],
      },
    ],
  },
  {
    id: 'sterile-handling',
    title: 'Sterile Handling Procedures in Research Environments',
    category: 'Lab Basics',
    readTime: '8 min',
    excerpt: 'Minimizing contamination risk during peptide preparation and handling.',
    publishedAt: 'May 20, 2025',
    publishedISO: '2025-05-20',
    metaDescription: 'Sterile technique for peptide research handling: PPE, workspace prep, needle/syringe procedure and documentation for reproducible results.',
    content: [
      {
        type: 'intro',
        text: 'Contamination introduces variables that cannot be controlled for after the fact. Whether you\'re running cell-based assays or in vivo models, sterile technique is non-negotiable for reproducible, publishable data.',
      },
      {
        type: 'heading',
        text: 'Personal Protective Equipment',
      },
      {
        type: 'paragraph',
        text: 'At minimum, wear nitrile gloves throughout all handling. Change gloves after touching non-sterile surfaces, handling vials from storage, or sneezing and coughing near the work area. For aerosol-generating procedures, add a surgical mask.',
      },
      {
        type: 'paragraph',
        text: 'Avoid touching your face, phone, or other surfaces without changing gloves. A single touch of the forehead can deposit enough skin flora to contaminate a cell culture preparation.',
      },
      {
        type: 'heading',
        text: 'Working Environment Preparation',
      },
      {
        type: 'paragraph',
        text: 'Wipe all surfaces with 70% isopropanol (IPA) or 70% ethanol at least 15 minutes before beginning work — this gives the alcohol time to evaporate and for any residual contamination to be eliminated. Include the inside walls, work surface, and any equipment that will be placed inside the hood.',
      },
      {
        type: 'list',
        items: [
          'UV decontamination of biosafety cabinets: 30 minutes before use where available',
          'Surface wipe with 70% ethanol: minimum 15 minutes before use',
          'Pipette tips, tubes, and syringes: use sterile, individually packaged items',
          'Reused glassware: autoclave at 121°C for 15 minutes before use',
        ],
      },
      {
        type: 'heading',
        text: 'Needle and Syringe Technique',
      },
      {
        type: 'paragraph',
        text: 'When drawing up reconstituted peptide, use a fresh sterile syringe and needle for each operation. Do not touch the needle to any non-sterile surface after removing from packaging. Insert through a sterile rubber septum or use a new vial for each draw.',
      },
      {
        type: 'callout',
        text: 'Flaming needles is not sterile technique — it introduces combustion residue and is a fire hazard. Use only sterile, single-use needles.',
      },
      {
        type: 'heading',
        text: 'Sterility Testing Considerations',
      },
      {
        type: 'paragraph',
        text: 'For experiments requiring confirmed sterility (in vivo research with sterility requirements, long-duration cell culture studies), consider filtering reconstituted solutions through a 0.22 µm syringe filter. This removes bacteria and most fungal spores but does not address viral contamination.',
      },
      {
        type: 'paragraph',
        text: 'Note that some peptides may bind to syringe filters — particularly hydrophobic sequences. Pre-wet filters with your solvent and discard the first 0.5–1 mL passing through to reduce binding losses.',
      },
      {
        type: 'heading',
        text: 'Documentation and Traceability',
      },
      {
        type: 'paragraph',
        text: 'Every preparation should be documented in a lab notebook or electronic record: date, operator, compound, lot number, concentration, solvent, volume prepared, sterility measures taken, and storage location. This documentation allows you to trace any anomalous results back to the preparation step.',
      },
    ],
  },
  {
    id: 'dosage-calculations',
    title: 'Dosage Calculation Principles for In Vitro Research',
    category: 'Calculations',
    readTime: '7 min',
    excerpt: 'Understanding concentration, dilution, and measurement accuracy.',
    publishedAt: 'May 12, 2025',
    publishedISO: '2025-05-12',
    metaDescription: 'Concentration units, the C1V1=C2V2 dilution formula, serial dilutions and purity-adjusted dosage calculations for peptide research.',
    content: [
      {
        type: 'intro',
        text: 'Concentration errors are silent killers of experimental reproducibility. An off-by-two error in a dilution series produces data that looks plausible but is entirely wrong. This guide covers the fundamentals every researcher should know.',
      },
      {
        type: 'heading',
        text: 'Key Units and Conversions',
      },
      {
        type: 'paragraph',
        text: 'Peptide concentrations are expressed in multiple units depending on context. Knowing how to convert between them is foundational:',
      },
      {
        type: 'list',
        items: [
          'mg/mL (mass concentration): most common for stock solutions',
          'µg/mL (micrograms per mL): common for working solutions',
          'nM / µM / mM (molar concentration): used when biological activity is molar-dependent',
          'To convert: molarity (µM) = (mg/mL × 1000) / molecular weight (Da)',
        ],
      },
      {
        type: 'heading',
        text: 'The C1V1 = C2V2 Formula',
      },
      {
        type: 'paragraph',
        text: 'The dilution formula is the most frequently used calculation in research bench work. C1 is your starting concentration, V1 is the volume you need to take from it, C2 is your target concentration, and V2 is the final total volume.',
      },
      {
        type: 'paragraph',
        text: 'Example: You have a 1 mg/mL stock and need 200 µL at 100 µg/mL. (1000 µg/mL)(V1) = (100 µg/mL)(200 µL) → V1 = 20 µL of stock, make up to 200 µL total with diluent.',
      },
      {
        type: 'callout',
        text: 'Always double-check dilution calculations by working backwards: confirm that C2 × V2 = C1 × V1 before pipetting.',
      },
      {
        type: 'heading',
        text: 'Serial Dilutions',
      },
      {
        type: 'paragraph',
        text: 'For dose-response experiments, serial dilutions are more accurate than individual dilutions for each concentration. Each step uses the previous concentration as the source, maintaining equal dilution factor across the series.',
      },
      {
        type: 'paragraph',
        text: 'A 1:3 serial dilution from 1000 nM produces: 1000 → 333 → 111 → 37 → 12.3 → 4.1 nM. To set this up, take 33 µL from each well and add to 67 µL of diluent in the next well (100 µL final volume).',
      },
      {
        type: 'heading',
        text: 'Accuracy vs. Precision in Pipetting',
      },
      {
        type: 'paragraph',
        text: 'Inaccurate pipetting compounds across a dilution series. A 5% error at each of three dilution steps produces a cumulative 15%+ error in final concentration. Best practices:',
      },
      {
        type: 'list',
        items: [
          'Calibrate pipettes every 6 months — or verify with gravimetric analysis',
          'Pre-wet tips: aspirate and dispense once before your actual transfer',
          'Pipette slowly to prevent bubble formation',
          'Use the correct pipette range (avoid pipetting 2 µL with a P200)',
          'Avoid aspirating to the very bottom of a vial — this introduces air',
        ],
      },
      {
        type: 'heading',
        text: 'Accounting for Purity in Calculations',
      },
      {
        type: 'paragraph',
        text: 'Peptide purity (listed on the COA as % purity by HPLC) directly affects actual active compound concentration. If you weigh out 1 mg of a peptide with 95% purity, you have 0.95 mg of active compound. Adjust stock concentrations accordingly: effective concentration = (nominal concentration × purity%) / 100.',
      },
    ],
  },
  {
    id: 'peptide-half-life',
    title: 'Understanding Peptide Half-Life in Research Models',
    category: 'Pharmacology',
    readTime: '9 min',
    excerpt: 'How peptide stability impacts experimental outcomes and data interpretation.',
    publishedAt: 'May 5, 2025',
    publishedISO: '2025-05-05',
    metaDescription: 'How biological half-life affects peptide research design, from degradation pathways to modifications that extend stability in vivo.',
    content: [
      {
        type: 'intro',
        text: 'Half-life is not just a pharmacokinetic curiosity — it directly determines how you design experiments, interpret results, and draw conclusions from your data. This guide explains the mechanisms and practical implications.',
      },
      {
        type: 'heading',
        text: 'What Is Biological Half-Life?',
      },
      {
        type: 'paragraph',
        text: 'Biological half-life (t½) refers to the time it takes for the concentration of a substance to be reduced by half in a biological system. For peptides, this encompasses enzymatic degradation, renal clearance, hepatic metabolism, and cellular uptake — all acting simultaneously.',
      },
      {
        type: 'paragraph',
        text: 'Half-lives for unmodified research peptides typically range from minutes to hours. This is short compared to small molecules, which is why half-life is a central design consideration in peptide research.',
      },
      {
        type: 'heading',
        text: 'Primary Mechanisms of Peptide Degradation In Vivo',
      },
      {
        type: 'list',
        items: [
          'Proteolytic cleavage: serine, metalloprotease, and aspartyl proteases in blood and tissue',
          'Renal filtration: peptides below ~30 kDa pass through glomeruli and are excreted',
          'Hepatic metabolism: first-pass effect in liver significantly reduces bioavailability',
          'Cellular internalization: receptor-mediated endocytosis followed by lysosomal degradation',
        ],
      },
      {
        type: 'heading',
        text: 'In Vitro vs. In Vivo Half-Life',
      },
      {
        type: 'paragraph',
        text: 'In vitro half-life measured in buffer or cell media does not reliably predict in vivo behavior. Serum contains proteases absent from buffer systems; cell culture media degrades differently than whole blood. Always interpret in vitro stability data with these caveats in mind.',
      },
      {
        type: 'callout',
        text: 'A peptide stable for 24 hours in PBS may have a plasma half-life of under 10 minutes. Always include relevant biological matrices (serum, plasma) in stability experiments.',
      },
      {
        type: 'heading',
        text: 'How Modifications Alter Half-Life',
      },
      {
        type: 'paragraph',
        text: 'Several chemical modifications are routinely used in research to extend peptide half-life:',
      },
      {
        type: 'list',
        items: [
          'D-amino acid substitution: resists L-stereospecific proteases',
          'PEGylation: increases hydrodynamic radius, reducing renal clearance',
          'N- and C-terminal capping: blocks exopeptidase attack',
          'Cyclization: restricts conformation, reducing protease recognition',
          'Stapling (hydrocarbon bridges): increases helical stability and protease resistance',
        ],
      },
      {
        type: 'heading',
        text: 'Designing Experiments Around Half-Life',
      },
      {
        type: 'paragraph',
        text: 'For cell-based assays with expected short half-lives, consider refreshing compound in the media every few hours rather than dosing once. For longer treatments, evaluate whether degradation products might be bioactive — some peptide fragments retain partial activity or have independent effects.',
      },
      {
        type: 'paragraph',
        text: 'When reporting dose-response data, note the dosing interval relative to estimated half-life. Two studies using the same compound at the same nominal dose but different dosing intervals may produce meaningfully different results.',
      },
      {
        type: 'heading',
        text: 'Half-Life and Data Interpretation',
      },
      {
        type: 'paragraph',
        text: 'Unexplained plateau effects, non-linear dose responses, and time-dependent loss of effect are often attributable to in-experiment degradation rather than biological ceiling effects. Before concluding a compound has reached maximum efficacy, evaluate whether declining concentration may explain the data.',
      },
    ],
  },
  {
    id: 'coa-interpretation',
    title: 'COA Interpretation Guide (HPLC & Mass Spec)',
    category: 'Documentation',
    readTime: '10 min',
    excerpt: 'How to read and verify Certificate of Analysis reports properly.',
    publishedAt: 'April 28, 2025',
    publishedISO: '2025-04-28',
    metaDescription: 'How to read an HPLC and mass spec Certificate of Analysis: what a legitimate COA must show and how to verify supplier documentation.',
    content: [
      {
        type: 'intro',
        text: 'The Certificate of Analysis (COA) is the primary document verifying compound identity, purity, and quality. Being able to read and critically evaluate a COA is essential for ensuring research integrity — and for identifying when a supplier\'s documentation raises concerns.',
      },
      {
        type: 'heading',
        text: 'What a COA Must Contain',
      },
      {
        type: 'paragraph',
        text: 'A legitimate COA from a serious research supplier should include: compound name and CAS/sequence, molecular weight, lot number, synthesis date, HPLC purity (%), mass spectrometry confirmation, appearance (typically white to off-white lyophilized powder), and storage recommendations.',
      },
      {
        type: 'paragraph',
        text: 'Missing any of these is a red flag. A "purity" claim without an attached chromatogram means nothing — you cannot verify it independently.',
      },
      {
        type: 'heading',
        text: 'Reading HPLC Data',
      },
      {
        type: 'paragraph',
        text: 'High-Performance Liquid Chromatography (HPLC) separates compounds by their interaction with a stationary phase. For peptide purity, reversed-phase HPLC (RP-HPLC) is standard. What to look for in a COA chromatogram:',
      },
      {
        type: 'list',
        items: [
          'Single dominant peak: indicates high purity; main peak should represent ≥95% of total area',
          'Peak symmetry: asymmetric or tailing peaks suggest column contamination or degradation products',
          'Baseline flatness: significant noise or secondary peaks indicate impurities',
          'Retention time: should be consistent with the peptide\'s expected hydrophobicity',
        ],
      },
      {
        type: 'callout',
        text: 'Purity is calculated as the area of the target peak divided by total peak area × 100. Reputable suppliers report this value alongside the raw chromatogram, not just as an isolated number.',
      },
      {
        type: 'heading',
        text: 'Reading Mass Spectrometry Data',
      },
      {
        type: 'paragraph',
        text: 'Mass spectrometry (MS) confirms molecular identity by measuring the mass-to-charge ratio (m/z) of the compound. For peptide verification, electrospray ionization (ESI-MS) is most common. The COA should show:',
      },
      {
        type: 'list',
        items: [
          'Observed molecular weight: should match theoretical MW within ±0.5 Da (or ±0.1% for larger peptides)',
          'Multiple charge states: [M+H]+, [M+2H]2+, [M+3H]3+ — all should calculate to the same neutral mass',
          'Isotope pattern: should match theoretical isotope distribution for the formula',
          'No significant adduct peaks: sodium and potassium adducts (+22 or +38 Da) are common but should not dominate',
        ],
      },
      {
        type: 'heading',
        text: 'Interpreting Purity Thresholds',
      },
      {
        type: 'paragraph',
        text: 'Research purity standards vary by application. General guidance:',
      },
      {
        type: 'list',
        items: [
          '≥95% purity: standard for most biological research; appropriate for in vitro studies',
          '≥98% purity: recommended for receptor binding assays and pharmacological studies',
          '<90% purity: acceptable only for exploratory screening; not for mechanistic studies',
          'GMP-grade (≥99%): required for clinical translation and regulatory-relevant research',
        ],
      },
      {
        type: 'heading',
        text: 'Verifying Third-Party COAs',
      },
      {
        type: 'paragraph',
        text: 'Some suppliers send peptides for third-party testing and include those results. When evaluating these, confirm the testing lab is named and verifiable. Be cautious of COAs where the testing date precedes the listed synthesis date, or where lot numbers do not match between COA header and chromatogram footer.',
      },
      {
        type: 'paragraph',
        text: 'If you have access to analytical instrumentation, consider running your own HPLC or MS verification on receipt — particularly for high-stakes experiments. Retaining a reference standard from first-receipt analysis allows you to verify lot-to-lot consistency over time.',
      },
      {
        type: 'heading',
        text: 'Building a COA Archive',
      },
      {
        type: 'paragraph',
        text: 'Maintain a digital archive of COAs linked to lot numbers used in each experiment. If questions arise about data reproducibility during peer review or regulatory inspection, the ability to produce COA documentation for every compound used is invaluable.',
      },
    ],
  },
  {
    id: 'research-peptides-legal-status-uk',
    title: 'Are Research Peptides Legal in the UK? A Compliance Overview',
    category: 'Legality & Compliance',
    readTime: '9 min',
    excerpt: 'What UK law actually says about buying, possessing and supplying research-use peptides — and where the responsibility sits with the researcher.',
    metaDescription: 'A plain-English overview of UK law on research peptides: MHRA classification, the Human Medicines Regulations, the Consumer Rights Act, and what "research use only" means in practice.',
    publishedAt: 'August 4, 2026',
    publishedISO: '2026-08-04',
    content: [
      {
        type: 'intro',
        text: 'This is a general compliance overview, not legal advice. Research peptide regulation sits at the intersection of medicines law, consumer protection law, and general product safety law, and the correct classification can depend on the specific compound, its intended use, and how it is marketed. If you need a definitive answer for a specific situation, consult a solicitor with experience in life sciences regulation or contact the MHRA directly.',
      },
      {
        type: 'heading',
        text: 'The Basic Position',
      },
      {
        type: 'paragraph',
        text: 'In the UK, peptides sold explicitly for laboratory and in-vitro research use — not for human consumption, administration, or therapeutic use — are not automatically classed as medicines. The Human Medicines Regulations 2012 define a "medicinal product" partly by function (something presented as treating or preventing disease) and partly by intent. A compound marketed, labelled, and sold strictly as a research reagent, with no health claims attached, generally falls outside that definition.',
      },
      {
        type: 'paragraph',
        text: 'This is why every legitimate UK research peptide supplier — PepcoLab included — labels products "for laboratory research use only, not for human or veterinary use" and avoids any dosing, administration, or health-outcome language on product pages. The moment a supplier suggests how a compound should be used in or on the human body, they risk that product being reclassified as an unlicensed medicine, which is a criminal offence under Regulation 46 of the Human Medicines Regulations 2012 to manufacture, sell, or supply without a marketing authorisation.',
      },
      {
        type: 'heading',
        text: 'What This Means for Researchers',
      },
      {
        type: 'list',
        items: [
          'Purchasing research peptides for genuine laboratory or in-vitro research purposes is lawful.',
          'Suppliers must not make medicinal claims (treatment, prevention, performance, cosmetic or health benefits) about research-only products.',
          'Buyers are responsible for how they actually use a compound after purchase — a "research use only" label does not authorise human use, and using a research compound on yourself or another person falls outside what the product was lawfully supplied for.',
          'Some individual peptides may separately be classified as prescription-only medicines or controlled substances depending on their pharmacological profile — this varies by compound and is worth checking independently if you are uncertain.',
        ],
      },
      {
        type: 'callout',
        text: 'A Certificate of Analysis is a purity and identity document, not a legal or safety authorisation. It confirms what is in the vial, not that using it outside a laboratory setting is lawful or safe.',
      },
      {
        type: 'heading',
        text: 'Consumer Protection and the DMCC Act 2024',
      },
      {
        type: 'paragraph',
        text: 'The Digital Markets, Competition and Consumers Act 2024 introduced stricter enforcement against fake reviews and misleading commercial practices, including fabricated testimonials, invented credentials, and unsubstantiated superiority claims ("the UK\'s most trusted supplier" without evidence). When evaluating a supplier, treat unverifiable review counts and unnamed "Dr." endorsements as a red flag rather than reassurance — reputable suppliers are increasingly cautious about this exact issue.',
      },
      {
        type: 'heading',
        text: 'Import and Customs Considerations',
      },
      {
        type: 'paragraph',
        text: 'For UK-based buyers ordering from a UK-registered supplier with UK stock, this is generally straightforward — no customs declaration is needed for a domestic order. If you are ordering research peptides from outside the UK, be aware that customs may hold or inspect shipments, particularly compounds that resemble scheduled substances by name or classification, and delivery times become unpredictable. Sourcing from a UK-based, UK-registered supplier avoids this exposure entirely.',
      },
      {
        type: 'heading',
        text: 'Practical Checklist Before You Buy',
      },
      {
        type: 'list',
        items: [
          'Confirm the supplier is a UK-registered company (check Companies House) with a real registered address, not just a website.',
          'Confirm the product listing makes no health, dosing, or performance claims.',
          'Confirm a batch-specific Certificate of Analysis is available, ideally from an independent, named testing laboratory.',
          'Understand that your own subsequent use of the compound is your responsibility, separate from the lawfulness of the purchase itself.',
        ],
      },
    ],
  },
  {
    id: 'research-peptides-legal-status-uae',
    title: 'Buying Research Peptides in the UAE: What to Know Before You Order',
    category: 'Legality & Compliance',
    readTime: '8 min',
    excerpt: 'How UAE regulation of research compounds differs from the UK, what documentation to expect, and why sourcing from a compliant supplier matters more in the Emirates.',
    metaDescription: 'An overview of how research-use peptides are regulated in the UAE, the role of MOHAP/DHA oversight for clinical use, and what to check before ordering online.',
    publishedAt: 'August 4, 2026',
    publishedISO: '2026-08-04',
    content: [
      {
        type: 'intro',
        text: 'This is a general overview, not legal advice, and UAE regulation of health-adjacent products is more actively enforced than in many other jurisdictions. If you have any doubt about a specific compound or use case, verify directly with the UAE Ministry of Health and Prevention (MOHAP) or, for Dubai, the Dubai Health Authority (DHA).',
      },
      {
        type: 'heading',
        text: 'Two Very Different Supply Channels',
      },
      {
        type: 'paragraph',
        text: 'In the UAE, peptide-adjacent compounds reach the market through two distinct channels that are regulated very differently. The first is clinical: DHA- or MOHAP-licensed clinics and compounding pharmacies dispensing pharmaceutical-grade compounds under direct medical supervision for a diagnosed purpose. The second is the research-reagent channel: compounds sold explicitly for laboratory and in-vitro research, not for human administration, in the same way UK and EU suppliers operate. These channels are not interchangeable, and conflating them is where most confusion — and most risk — comes from.',
      },
      {
        type: 'heading',
        text: 'What "Research Use Only" Means in the UAE',
      },
      {
        type: 'paragraph',
        text: 'A compound labelled for research use only is not licensed or approved for human or veterinary use in the UAE. Legitimate research suppliers operating into the UAE market — PepcoLab among them — sell strictly on that basis: no dosing guidance, no administration instructions, no therapeutic claims. As with the UK, the responsibility for how a compound is subsequently used sits with the buyer, not the supplier, and using a research-only compound outside a laboratory setting falls outside the terms it was supplied under.',
      },
      {
        type: 'heading',
        text: 'Documentation That Actually Matters',
      },
      {
        type: 'list',
        items: [
          'A batch-specific Certificate of Analysis (COA) from a named, independent testing laboratory — not just a generic purity percentage on the product page.',
          'Clear labelling stating research/laboratory use only, with no implied human application.',
          'A supplier with a real, checkable business registration — not only a WhatsApp number or Instagram storefront.',
          'Transparent, temperature-controlled (cold-chain) shipping information, given the UAE climate makes uncontrolled shipping a genuine stability risk, not just a marketing point.',
        ],
      },
      {
        type: 'callout',
        text: 'Free-zone or overseas-registered storefronts with no verifiable UAE presence are harder to hold accountable if a shipment is delayed, seized, or misrepresented. A supplier with disclosed UAE distribution and clear customs handling is lower-risk than one that is vague about where the product physically ships from.',
      },
      {
        type: 'heading',
        text: 'Import and Customs',
      },
      {
        type: 'paragraph',
        text: 'UAE customs authorities do inspect shipments of health-adjacent products, and enforcement has tightened in recent years. Orders shipped from UAE-held stock with correct research-use labelling and documentation clear more predictably than international shipments, which can be delayed or held at customs for review — sometimes indefinitely if paperwork is incomplete. This is one of the practical reasons to prioritise suppliers with genuine local (Dubai/UAE) inventory over overseas drop-shipping.',
      },
      {
        type: 'heading',
        text: 'Practical Checklist Before You Buy',
      },
      {
        type: 'list',
        items: [
          'Verify the supplier ships from UAE-held stock rather than importing per-order from overseas.',
          'Check that product pages carry no dosing or human-use language.',
          'Confirm a per-batch COA is available before you order, not only "on request" after purchase.',
          'If in doubt about a specific compound\'s status, check directly with MOHAP or DHA rather than relying on a supplier\'s framing.',
        ],
      },
    ],
  },
  {
    id: 'how-to-choose-a-research-peptide-supplier',
    title: 'How to Vet a Research Peptide Supplier: A Practical Checklist',
    category: 'Buying Guide',
    readTime: '7 min',
    excerpt: 'The concrete, checkable signals that separate a serious research-grade supplier from a re-labelled grey-market one — and the marketing claims worth treating with suspicion.',
    metaDescription: 'A practical checklist for evaluating research peptide suppliers in the UK and UAE: COA verification, accreditation claims, business registration and red flags to watch for.',
    publishedAt: 'August 4, 2026',
    publishedISO: '2026-08-04',
    content: [
      {
        type: 'intro',
        text: 'Purity claims are cheap to print and expensive to verify. This guide focuses on what you can actually check yourself before an order — not marketing language, but checkable facts about a supplier\'s documentation, registration, and testing practices.',
      },
      {
        type: 'heading',
        text: 'Start With the Certificate of Analysis',
      },
      {
        type: 'paragraph',
        text: 'A trustworthy supplier publishes a batch-specific COA for every product — not a single generic COA reused across every lot. Look for a named, independently operating testing laboratory (not an in-house lab with no external accreditation), a lot number that matches what\'s printed on your vial, an HPLC chromatogram (not just a purity percentage in isolation), and mass spectrometry confirmation of molecular identity. If a supplier only offers a COA "on request after purchase," that is a materially weaker standard than one published openly for every batch before you buy.',
      },
      {
        type: 'heading',
        text: 'Check the Business, Not Just the Website',
      },
      {
        type: 'list',
        items: [
          'UK suppliers: search the company on Companies House — a real registration number, filing history, and registered address are all public and free to check.',
          'UAE suppliers: look for a genuine trade licence and a physical UAE presence rather than an overseas-registered storefront targeting UAE buyers.',
          'A working, monitored contact channel beyond a single WhatsApp number or Instagram DM.',
          'Terms, privacy, and shipping pages that exist and are specific to the business — generic boilerplate copied across many near-identical peptide storefronts is a sign of a template drop-shipping operation, not an independent lab-relationship supplier.',
        ],
      },
      {
        type: 'heading',
        text: 'Treat These Claims With Extra Scrutiny',
      },
      {
        type: 'list',
        items: [
          'Specific review counts with no way to verify them, or testimonials attributed to invented credentials ("Dr. …", "Biochemistry Dept.") that can\'t be checked.',
          '"Highest purity in the UK/UAE" or similar unqualified superiority claims — purity should be demonstrated per batch, not asserted as a blanket brand claim.',
          'Accreditation labels (cGMP, ISO 9001, ISO 17025) mentioned without a certificate number or issuing body — a real accreditation is checkable against a public register.',
          'Any product copy describing dosing, administration, or "what researchers report" in terms that sound like usage instructions rather than research parameters.',
        ],
      },
      {
        type: 'callout',
        text: 'A specific, checkable claim beats a generic superlative every time: "Freedom Diagnostics–tested, batch BT10, 99.26% purity, COA attached" tells you something. "The UK\'s most trusted peptide supplier" tells you nothing you can verify.',
      },
      {
        type: 'heading',
        text: 'Logistics and Storage',
      },
      {
        type: 'paragraph',
        text: 'Peptides are temperature-sensitive. A supplier that is specific about cold-chain packaging, dispatch cut-off times, and expected transit windows is generally more operationally mature than one that only advertises "fast shipping" without detail. For UAE buyers in particular, ask whether stock ships domestically or is imported per-order — domestic UAE stock clears faster and is less exposed to customs delay than an overseas shipment.',
      },
      {
        type: 'heading',
        text: 'A Short Checklist',
      },
      {
        type: 'list',
        items: [
          'Batch-specific COA published before purchase, from a named independent lab',
          'Verifiable business registration (Companies House / UAE trade licence)',
          'No dosing, administration, or health-outcome claims on product pages',
          'Specific, checkable accreditation and testing claims rather than unqualified superlatives',
          'Clear cold-chain and dispatch information, with disclosed shipping origin',
        ],
      },
    ],
  },
  {
    id: 'net-peptide-content',
    title: 'Net Peptide Content Explained: Why Purity % Isn\u2019t the Whole Picture',
    category: 'Documentation',
    readTime: '6 min',
    excerpt: 'HPLC purity and net peptide content answer different questions — and mixing them up leads to under- or over-estimated stock concentrations.',
    publishedAt: 'August 3, 2025',
    publishedISO: '2025-08-03',
    metaDescription: 'What net peptide content (NPC) means, how it differs from HPLC purity, and why it matters for accurate stock concentration calculations.',
    content: [
      {
        type: 'intro',
        text: 'A vial listing 99% HPLC purity is not necessarily 99% peptide by weight. Purity and net peptide content (NPC) measure different things, and conflating them is one of the more common — and consequential — mistakes in interpreting a Certificate of Analysis.',
      },
      {
        type: 'heading',
        text: 'What HPLC Purity Actually Measures',
      },
      {
        type: 'paragraph',
        text: 'HPLC (high-performance liquid chromatography) purity describes the proportion of peptide-related material in a sample that corresponds to the target sequence, relative to other peptide-related impurities (truncated sequences, deletion products, oxidised variants). It says nothing about how much of the vial\u2019s total mass is peptide at all.',
      },
      {
        type: 'heading',
        text: 'What Net Peptide Content Measures',
      },
      {
        type: 'paragraph',
        text: 'Lyophilised peptide powder is rarely 100% peptide by mass. Counter-ions from the synthesis and purification process (commonly acetate or trifluoroacetate salts), residual moisture, and other non-peptide material make up the remainder. Net peptide content is the percentage of the total vial mass that is actually peptide — determined by amino acid analysis, elemental analysis, or mass balance, not by HPLC.',
      },
      {
        type: 'callout',
        text: 'A peptide can show 99% HPLC purity and still have an NPC of 75–85% — meaning roughly 15–25% of the vial\u2019s weighed mass is salts and moisture, not peptide.',
      },
      {
        type: 'heading',
        text: 'Why This Matters for Stock Concentrations',
      },
      {
        type: 'paragraph',
        text: 'If you weigh out 1 mg of lyophilised material and reconstitute assuming 100% NPC, your actual stock concentration will be lower than intended — proportionally, by the gap between the assumed and true NPC. For experiments sensitive to absolute concentration (dose-response curves, binding assays with defined Kd targets), this gap can meaningfully shift results.',
      },
      {
        type: 'list',
        items: [
          'Effective peptide mass = vial mass × (NPC% / 100)',
          'Example: 5 mg vial at 82% NPC contains 4.1 mg of actual peptide',
          'HPLC purity and NPC should both appear on a complete COA — one without the other is an incomplete picture',
        ],
      },
      {
        type: 'heading',
        text: 'Reading Both Figures on a COA',
      },
      {
        type: 'paragraph',
        text: 'A rigorous Certificate of Analysis reports HPLC purity (sequence-level quality) and net peptide content (mass-level composition) as separate figures, typically from separate analytical methods. If a COA lists only "99% pure" with no NPC or amino acid analysis figure, that is a gap worth asking the supplier about directly before treating the nominal vial weight as the true peptide mass in a calculation.',
      },
    ],
  },
  {
    id: 'bacteriostatic-water-vs-sterile-water',
    title: 'Bacteriostatic Water vs. Sterile Water for Peptide Reconstitution',
    category: 'Lab Basics',
    readTime: '5 min',
    excerpt: 'The two most common reconstitution diluents solve different problems — mixing them up affects both sterility and multi-use stability.',
    publishedAt: 'August 5, 2025',
    publishedISO: '2025-08-05',
    metaDescription: 'The difference between bacteriostatic water and sterile (non-bacteriostatic) water for peptide reconstitution, and which applies to which use case.',
    content: [
      {
        type: 'intro',
        text: 'Both are water for injection-grade diluents used to reconstitute lyophilised peptides, and both are sterile at time of packaging. The difference is what happens after the vial is first opened — and that difference changes how a reconstituted solution should be stored and used.',
      },
      {
        type: 'heading',
        text: 'Sterile Water',
      },
      {
        type: 'paragraph',
        text: 'Sterile water contains no preservative. It is sterile when the vial is sealed, but once opened it offers no protection against microbial growth from repeated needle entries or ambient exposure. It is the appropriate choice for single-use preparations that will be consumed in one sitting, or for applications where a preservative could interfere with a downstream assay.',
      },
      {
        type: 'heading',
        text: 'Bacteriostatic Water',
      },
      {
        type: 'paragraph',
        text: 'Bacteriostatic water contains 0.9% benzyl alcohol as a preservative, which inhibits (but does not eliminate) bacterial growth across repeated vial entries. This makes it the standard choice for reconstituting a vial that will be drawn from multiple times over days or weeks, since it reduces contamination risk introduced by successive needle punctures.',
      },
      {
        type: 'callout',
        text: 'Benzyl alcohol is a preservative, not a sterilant — bacteriostatic water inhibits regrowth between uses, it does not sterilise a vial that has already been contaminated by poor technique.',
      },
      {
        type: 'heading',
        text: 'Which One for Which Preparation',
      },
      {
        type: 'list',
        items: [
          'Single-use, same-day preparation: sterile water is sufficient',
          'Multi-draw vial used across several sessions: bacteriostatic water reduces contamination risk between draws',
          'Benzyl alcohol-sensitive assays or very small research subjects: sterile water avoids introducing the preservative as a confound',
        ],
      },
      {
        type: 'heading',
        text: 'A Note on Peptide Compatibility',
      },
      {
        type: 'paragraph',
        text: 'A small number of peptides are reported to interact with benzyl alcohol or show reduced stability in its presence. When in doubt for a specific compound, sterile water paired with strict single-use aliquoting (see our reconstitution guide) removes the question entirely, at the cost of needing to prepare fresh aliquots more often.',
      },
    ],
  },
]

export const CATEGORIES = ['All', 'Lab Basics', 'Storage', 'Calculations', 'Pharmacology', 'Documentation', 'Legality & Compliance', 'Buying Guide']

// ─── CATEGORY BADGE COLORS ─────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  'Lab Basics':            { bg: '#eef2ff', color: '#3730a3' },
  'Storage':               { bg: '#ecfdf5', color: '#065f46' },
  'Calculations':          { bg: '#fff7ed', color: '#9a3412' },
  'Pharmacology':          { bg: '#fdf4ff', color: '#7e22ce' },
  'Documentation':         { bg: '#eff6ff', color: '#1e40af' },
  'Legality & Compliance': { bg: '#fef2f2', color: '#991b1b' },
  'Buying Guide':          { bg: '#f0fdfa', color: '#0f766e' },
}

export function getGuideBySlug(slug: string) {
  return GUIDES.find((g) => g.id === slug)
}
