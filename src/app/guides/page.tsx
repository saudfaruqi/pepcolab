'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Search, Clock, ArrowLeft, ChevronRight, BookOpen } from 'lucide-react'

// ─── FULL GUIDE CONTENT ────────────────────────────────────────────────────────


type ContentBlock =
  | { type: 'intro' | 'heading' | 'paragraph' | 'callout'; text: string; items?: never }
  | { type: 'list'; items: string[]; text?: never }

type Guide = {
  id: string
  title: string
  category: string
  readTime: string
  excerpt: string
  publishedAt: string
  content: ContentBlock[]
}

const GUIDES: Guide[] = [
  {
    id: 'peptide-reconstitution',
    title: 'Peptide Reconstitution: Complete Step-by-Step Guide',
    category: 'Lab Basics',
    readTime: '6 min',
    excerpt:
      'Proper reconstitution techniques to maintain peptide stability and research integrity.',
    publishedAt: 'June 2, 2025',
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
]

const CATEGORIES = ['All', 'Lab Basics', 'Storage', 'Calculations', 'Pharmacology', 'Documentation']

// ─── CATEGORY BADGE COLORS ─────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'Lab Basics':    { bg: '#eef2ff', color: '#3730a3' },
  'Storage':       { bg: '#ecfdf5', color: '#065f46' },
  'Calculations':  { bg: '#fff7ed', color: '#9a3412' },
  'Pharmacology':  { bg: '#fdf4ff', color: '#7e22ce' },
  'Documentation': { bg: '#eff6ff', color: '#1e40af' },
}

// ─── CONTENT RENDERER ──────────────────────────────────────────────────────────
function GuideContent({ content }: { content: ContentBlock[] }) {
  return (
    <div style={{ maxWidth: 720 }}>
      {content.map((block: ContentBlock, i: number) => {
        if (block.type === 'intro') return (
          <p key={i} style={{
            fontSize: 17,
            lineHeight: 1.75,
            color: 'rgba(13,13,13,.75)',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            marginBottom: 32,
            paddingBottom: 28,
            borderBottom: '1px solid rgba(13,13,13,.08)',
          }}>
            {block.text}
          </p>
        )

        if (block.type === 'heading') return (
          <h2 key={i} style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-.025em',
            marginTop: 40,
            marginBottom: 14,
            color: '#0d0d0d',
          }}>
            {block.text}
          </h2>
        )

        if (block.type === 'paragraph') return (
          <p key={i} style={{
            fontSize: 15.5,
            lineHeight: 1.8,
            color: 'rgba(13,13,13,.72)',
            marginBottom: 18,
          }}>
            {block.text}
          </p>
        )

        if (block.type === 'list') return (
          <ul key={i} style={{
            margin: '0 0 20px 0',
            paddingLeft: 22,
          }}>
            {block.items!.map((item: string, j: number) => (
              <li key={j} style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: 'rgba(13,13,13,.7)',
                marginBottom: 8,
              }}>
                {item}
              </li>
            ))}
          </ul>
        )

        if (block.type === 'callout') return (
          <div key={i} style={{
            background: '#f0f4ff',
            borderLeft: '3px solid #3b5bdb',
            borderRadius: '0 10px 10px 0',
            padding: '16px 20px',
            margin: '24px 0',
          }}>
            <p style={{
              fontSize: 14.5,
              lineHeight: 1.7,
              color: '#1e3a8a',
              margin: 0,
              fontWeight: 500,
            }}>
              {block.text}
            </p>
          </div>
        )

        return null
      })}
    </div>
  )
}

// ─── READING PROGRESS BAR ──────────────────────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      if (scrollHeight > 0) setProgress((scrollTop / scrollHeight) * 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      zIndex: 1000,
      background: 'rgba(13,13,13,.08)',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: '#0d0d0d',
        transition: 'width .1s linear',
      }} />
    </div>
  )
}


// ─── GUIDE DETAIL VIEW ─────────────────────────────────────────────────────────
function GuideDetail({ guide, onBack }: { guide: Guide; onBack: () => void }) {
  const cat = CATEGORY_COLORS[guide.category as keyof typeof CATEGORY_COLORS] || { bg: '#f5f5f5', color: '#444' }

  return (
    <>
      <ReadingProgress />
      <main style={{ background: '#fff', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          borderBottom: '1px solid rgba(13,13,13,.07)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(13,13,13,.55)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ArrowLeft size={15} />
            All Guides
          </button>

          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'rgba(13,13,13,.35)',
          }}>
            Research Guides
          </span>
        </div>

        {/* Hero */}
        <section style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '56px 24px 40px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 999,
              background: cat.bg,
              color: cat.color,
            }}>
              {guide.category}
            </span>
            <span style={{
              fontSize: 12,
              color: 'rgba(13,13,13,.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}>
              <Clock size={12} /> {guide.readTime} read
            </span>
            <span style={{ fontSize: 12, color: 'rgba(13,13,13,.35)' }}>
              {guide.publishedAt}
            </span>
          </div>

          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(26px,3.5vw,38px)',
            lineHeight: 1.2,
            letterSpacing: '-.03em',
            marginBottom: 16,
            color: '#0d0d0d',
          }}>
            {guide.title}
          </h1>

          <p style={{
            fontSize: 16,
            lineHeight: 1.65,
            color: 'rgba(13,13,13,.55)',
            maxWidth: 620,
            marginBottom: 0,
          }}>
            {guide.excerpt}
          </p>
        </section>

        {/* Divider */}
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ borderTop: '1px solid rgba(13,13,13,.08)', marginBottom: 48 }} />
        </div>

        {/* Body */}
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 100px' }}>
          <GuideContent content={guide.content} />
        </section>
      </main>
    </>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function GuidesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null)

  const filtered = useMemo(() => {
    return GUIDES.filter((g) => {
      const matchCategory = category === 'All' || g.category === category
      const matchSearch =
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.excerpt.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [search, category])

  if (activeGuide) {
    return (
      <>
        <Nav />
        <GuideDetail guide={activeGuide} onBack={() => setActiveGuide(null)} />
        <Footer />
      </>
    )
  }

  return (
    <>
      <Nav />

      <main style={{ background: '#f7f5f1', minHeight: '100vh' }}>
        {/* ── HERO ── */}
        <section style={{
          padding: '72px 24px 40px',
          borderBottom: '1px solid rgba(13,13,13,.08)',
          background: '#fff',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}>
              <BookOpen size={13} style={{ color: 'rgba(13,13,13,.35)' }} />
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                color: 'rgba(13,13,13,.4)',
              }}>
                Knowledge Base
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(28px,4vw,44px)',
              letterSpacing: '-.04em',
              marginBottom: 10,
              color: '#0d0d0d',
            }}>
              Research Guides
            </h1>

            <p style={{
              maxWidth: 600,
              fontSize: 14,
              lineHeight: 1.7,
              color: 'rgba(13,13,13,.6)',
              marginBottom: 22,
            }}>
              Structured protocols, lab techniques, and foundational knowledge for peptide
              research and handling. Built for consistency and reproducibility.
            </p>

            <div style={{ position: 'relative', maxWidth: 420 }}>
              <Search size={14} style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(13,13,13,.35)',
              }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guides…"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  fontSize: 13,
                  border: '1px solid rgba(13,13,13,.15)',
                  borderRadius: 10,
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </section>

        {/* ── FILTERS ── */}
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid rgba(13,13,13,.15)',
                background: category === c ? '#0d0d0d' : '#fff',
                color: category === c ? '#fff' : 'rgba(13,13,13,.6)',
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* ── COUNT ── */}
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 24px 12px',
          fontSize: 12,
          color: 'rgba(13,13,13,.4)',
        }}>
          {filtered.length} guide{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* ── GRID ── */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
            gap: 16,
          }}>
            {filtered.map((g) => {
              const cat = CATEGORY_COLORS[g.category as keyof typeof CATEGORY_COLORS] || { bg: '#f5f5f5', color: '#444' }
              return (
                <article
                  key={g.id}
                  onClick={() => setActiveGuide(g)}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(13,13,13,.08)',
                    borderRadius: 14,
                    padding: '20px 20px 16px',
                    cursor: 'pointer',
                    transition: 'transform .2s ease, box-shadow .2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,.07)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Top row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: cat.bg,
                      color: cat.color,
                    }}>
                      {g.category}
                    </span>

                    <span style={{
                      fontSize: 11,
                      color: 'rgba(13,13,13,.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Clock size={11} /> {g.readTime}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 18,
                    lineHeight: 1.3,
                    letterSpacing: '-.02em',
                    marginBottom: 10,
                    color: '#0d0d0d',
                    flex: 1,
                  }}>
                    {g.title}
                  </h3>

                  <p style={{
                    fontSize: 13,
                    color: 'rgba(13,13,13,.58)',
                    lineHeight: 1.65,
                    marginBottom: 16,
                  }}>
                    {g.excerpt}
                  </p>

                  {/* Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(13,13,13,.06)',
                    paddingTop: 12,
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(13,13,13,.35)' }}>
                      {g.publishedAt}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0d0d0d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      Read Guide <ChevronRight size={13} />
                    </span>
                  </div>
                </article>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '80px 0',
              color: 'rgba(13,13,13,.4)',
              fontSize: 14,
            }}>
              No guides found for your search.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}