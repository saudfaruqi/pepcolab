// src/lib/research-data.ts
// Shared, server-safe content source for /research and /research/[slug].
// Same rationale as guides-data.ts: no 'use client', imported directly by
// Server Components so article bodies are present in the initial HTML.

/* ─────────────────────────────────────────
   FULL ARTICLE DATA
───────────────────────────────────────── */

// Reuses the same block shape as guides-data.ts / ContentBlocks.tsx so both
// guides and research articles render through one shared component.
import type { ContentBlock as ArticleContentBlock } from './guides-data'
export type { ArticleContentBlock }

export type Article = {
  id: string
  title: string
  date: string
  /** ISO 8601 date matching `date`, for JSON-LD datePublished. */
  dateISO: string
  tag: string
  readTime: string
  excerpt: string
  /** One-sentence, ≤155-char version of the excerpt for <meta name="description">. */
  metaDescription: string
  image: string
  content: ArticleContentBlock[]
}

export const ARTICLES: Article[] = [
  {
    id: 'bpc-157',
    title: 'BPC-157: Mechanisms of Action and Research Applications',
    date: 'May 2025',
    dateISO: '2025-05-15',
    metaDescription: 'BPC-157\'s proposed mechanisms, musculoskeletal and GI research findings, and the key limitations of current preclinical evidence.',
    tag: 'Recovery',
    readTime: '8 min',
    excerpt:
      'A deep-dive into Body Protection Compound-157, its gastroprotective origins, and its expanding role in musculoskeletal and neurological recovery research.',
    image: 'recovery',
    content: [
      {
        type: 'intro',
        text: 'BPC-157 (Body Protection Compound-157) is a pentadecapeptide — a chain of 15 amino acids — derived from a partial sequence of human gastric juice protein. First isolated and studied in the 1990s by Dr. Predrag Sikirić and colleagues at the University of Zagreb, it has since become one of the most widely investigated peptides in preclinical research, particularly for its regenerative and cytoprotective properties.',
      },
      {
        type: 'heading',
        text: 'Origins and Structure',
      },
      {
        type: 'paragraph',
        text: 'The peptide sequence Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val is a stable fragment that does not appear to exist naturally in isolation but is derived from BPC, a 98-amino-acid protein present in gastric juice. Crucially, BPC-157 demonstrates notable stability in gastric acid, which partially explains its oral bioavailability in rodent models — a property uncommon among peptides of its class.',
      },
      {
        type: 'heading',
        text: 'Primary Mechanisms',
      },
      {
        type: 'paragraph',
        text: 'BPC-157 exerts its effects through multiple, partially overlapping pathways. The most well-characterized include:',
      },
      {
        type: 'list',
        items: [
          'Upregulation of growth hormone receptor (GHR) expression, particularly in tendon and ligament fibroblasts, accelerating collagen synthesis and extracellular matrix remodeling.',
          'Modulation of the nitric oxide (NO) system — BPC-157 appears to interact with both eNOS (endothelial nitric oxide synthase) and the downstream cGMP cascade, promoting vascular integrity without the systemic hypotension associated with exogenous NO donors.',
          'FAK-paxillin signaling pathway activation, which facilitates cell survival, migration, and angiogenesis in injured tissue beds.',
          'Counter-regulation of the dopaminergic and serotonergic systems, contributing to its observed neuroprotective and mood-stabilizing effects in rodent models.',
        ],
      },
      {
        type: 'heading',
        text: 'Musculoskeletal Applications',
      },
      {
        type: 'paragraph',
        text: 'The bulk of published preclinical data centers on tendon-to-bone healing. In rat Achilles tendon transection models, BPC-157 administration — whether systemic (intraperitoneal or subcutaneous) or local — consistently accelerated the formation of organized collagen fibers and improved tensile strength at four weeks post-injury compared to saline controls. Similar results have been replicated in models of rotator cuff damage, ligament rupture, and bone fracture.',
      },
      {
        type: 'paragraph',
        text: 'The proposed mechanism in musculoskeletal tissue is primarily the upregulation of VEGF (vascular endothelial growth factor) and PDGF-BB, both of which are rate-limiting factors in tendon healing. Histological analyses from multiple Zagreb-group studies document markedly increased vascularity at the repair site in BPC-157-treated animals, which correlates with improved functional outcomes on treadmill and grip-strength testing.',
      },
      {
        type: 'callout',
        text: 'Important note: All mechanistic and efficacy data referenced in this article are from in vitro studies or preclinical animal models. BPC-157 has not completed Phase I or Phase II clinical trials as of the date of publication. Researchers should treat all findings as hypothesis-generating rather than clinically validated.',
      },
      {
        type: 'heading',
        text: 'Gastrointestinal Research',
      },
      {
        type: 'paragraph',
        text: 'The peptide\'s gastric origins predict its potent effects on GI tissue. In NSAID-induced ulceration models, BPC-157 administered at doses as low as 10 ng/kg demonstrated statistically significant reductions in ulcer index scores, outperforming omeprazole and misoprostol in head-to-head comparisons for tissue regeneration endpoints (though not for acid suppression, which remains omeprazole\'s primary mechanism). The compound also shows promise in inflammatory bowel disease models, reducing TNF-α and IL-6 expression in colonic tissue.',
      },
      {
        type: 'heading',
        text: 'Neurological and Systemic Effects',
      },
      {
        type: 'paragraph',
        text: 'A growing body of work examines BPC-157 in the context of central nervous system injury. Spinal cord contusion models in rats show improved locomotor recovery scores and reduced lesion volume when BPC-157 is administered within 24 hours of injury. The proposed mechanism involves both anti-inflammatory action (suppression of NF-κB signaling) and direct neurotrophic support through BDNF upregulation. Separately, several groups have documented reversal of dopaminergic lesion-induced catalepsy and hyperactivity, suggesting potential relevance to Parkinson\'s and addiction research.',
      },
      {
        type: 'heading',
        text: 'Research Considerations and Limitations',
      },
      {
        type: 'paragraph',
        text: 'The overwhelming majority of BPC-157 research originates from a single academic group in Zagreb, which raises valid questions about independent replication. While the results are consistently impressive in that body of work, external laboratories have produced more mixed findings, particularly regarding optimal dosing windows and route-of-administration equivalency. The field would benefit substantially from multi-center, independently funded replication studies before definitive mechanistic conclusions are drawn.',
      },
      {
        type: 'paragraph',
        text: 'For research purposes, BPC-157 is typically reconstituted in bacteriostatic water and stored at -20°C. Freeze-thaw cycles should be minimized, and working solutions prepared fresh. The peptide is moderately sensitive to oxidation; researchers working with it should minimize air exposure during handling.',
      },
    ],
  },
  {
    id: 'glp1',
    title: 'Understanding GLP-1 Receptor Agonists in Metabolic Research',
    date: 'Apr 2025',
    dateISO: '2025-04-20',
    metaDescription: 'How GLP-1 receptor agonists work in metabolic research, key preclinical findings, and the distinction between research compounds and approved medicines.',
    tag: 'Metabolic',
    readTime: '12 min',
    excerpt:
      'A comprehensive review of glucagon-like peptide-1 receptor signalling, the structural biology of synthetic agonists, and emerging metabolic research directions.',
    image: 'metabolic',
    content: [
      {
        type: 'intro',
        text: 'Glucagon-like peptide-1 (GLP-1) is a 30-amino-acid incretin hormone secreted by intestinal L-cells in response to nutrient ingestion. Its discovery in the mid-1980s and subsequent characterization of its receptor (GLP-1R) opened one of the most productive chapters in modern metabolic biology — ultimately yielding drug classes that have reshaped the treatment of type 2 diabetes and obesity. This article reviews the fundamental receptor biology and the structural logic behind synthetic agonists, with an emphasis on research-relevant considerations.',
      },
      {
        type: 'heading',
        text: 'Receptor Biology and Signaling Cascade',
      },
      {
        type: 'paragraph',
        text: 'The GLP-1 receptor is a class B G protein-coupled receptor (GPCR) with a large extracellular domain that coordinates initial peptide binding. Upon agonist binding, the receptor undergoes a conformational change that couples to Gαs, activating adenylyl cyclase and elevating intracellular cAMP. This triggers PKA-mediated phosphorylation of voltage-gated calcium channels and potassium channels in pancreatic β-cells, enhancing glucose-stimulated insulin secretion (GSIS) in a glucose-dependent manner — the key property that largely explains the favorable safety profile of GLP-1-based therapies.',
      },
      {
        type: 'paragraph',
        text: 'Beyond the canonical Gαs pathway, GLP-1R also signals through β-arrestin recruitment, which initiates receptor internalization and activates a parallel set of intracellular signals including ERK1/2 and PI3K. This biased signaling concept is now central to next-generation agonist design: compounds that preferentially engage the Gαs pathway over β-arrestin internalization maintain prolonged surface receptor availability, translating to sustained insulin secretion and reduced tachyphylaxis.',
      },
      {
        type: 'heading',
        text: 'Structural Basis of Synthetic Agonists',
      },
      {
        type: 'paragraph',
        text: 'Native GLP-1(7-36) amide has a plasma half-life of approximately 2 minutes, rapidly cleaved by DPP-4 (dipeptidyl peptidase-4) at the His7-Ala8 bond. Synthetic agonists circumvent this limitation through three primary strategies:',
      },
      {
        type: 'list',
        items: [
          'Substitution of Ala8 with α-aminoisobutyric acid (Aib) or α-methylalanine, creating DPP-4-resistant analogs (exendin-4 uses Gly at position 2 for similar stability).',
          'Fatty acid acylation (as in semaglutide) enabling reversible albumin binding, extending the half-life to ~7 days through reduced renal clearance and protection from proteolysis.',
          'Fc fusion technologies and half-life extension via conjugation to IgG4 fragments, as explored in several pipeline candidates.',
        ],
      },
      {
        type: 'heading',
        text: 'Central Nervous System Actions',
      },
      {
        type: 'paragraph',
        text: 'GLP-1Rs are expressed in the hypothalamus, brainstem (particularly nucleus tractus solitarius and area postrema), mesolimbic dopamine pathways, and hippocampus. Central GLP-1R activation reduces food intake through hypothalamic arc nucleus circuits, modulates gastric emptying through vagal efferent pathways, and exerts direct neuroprotective effects through PI3K/Akt and MAPK cascades. The neuroprotective angle has opened substantial research interest in Alzheimer\'s and Parkinson\'s disease, where GLP-1R agonism reduces amyloid burden and α-synuclein aggregation in preclinical models.',
      },
      {
        type: 'callout',
        text: 'GLP-1 research peptides used in laboratory settings are distinct from pharmaceutical formulations. Research-grade peptides are intended solely for in vitro and preclinical in vivo studies. Purity characterization (HPLC ≥98%, mass spectrometry verification) is essential for reproducible results.',
      },
      {
        type: 'heading',
        text: 'Dual and Triple Agonism: The Next Research Frontier',
      },
      {
        type: 'paragraph',
        text: 'The recognition that GIP (glucose-dependent insulinotropic polypeptide) receptor and glucagon receptor agonism can be synergistic with GLP-1R activation has driven intense research into dual (GLP-1/GIP or GLP-1/glucagon) and triple (GLP-1/GIP/glucagon) agonists. These compounds demonstrate superior metabolic effects compared to GLP-1-only agonists, driven in part by additive effects on adipose tissue lipolysis and independent contributions to satiety. Research peptides that explore this space include various chimeric sequences designed to probe the relative receptor contributions.',
      },
      {
        type: 'heading',
        text: 'Methodological Notes for In Vitro Research',
      },
      {
        type: 'paragraph',
        text: 'Cell-based GLP-1R activation assays most commonly use transfected HEK293 cells or INS-1E rat insulinoma cells. cAMP accumulation assays (HTRF or ELISA-based) are preferred for characterizing Gαs engagement; β-arrestin recruitment is best quantified with PathHunter or BRET-based biosensor systems. Researchers should note that species differences in GLP-1R pharmacology are substantial — mouse and rat receptors show 5-10 fold differences in affinity for several synthetic analogs compared to the human receptor, complicating translation of rodent efficacy data.',
      },
    ],
  },
  {
    id: 'peptide-storage',
    title: 'Peptide Storage: Best Practices for Research Integrity',
    date: 'Apr 2025',
    dateISO: '2025-04-10',
    metaDescription: 'Temperature, light and humidity factors that determine peptide stability in storage, with a practical reference for lyophilized and reconstituted forms.',
    tag: 'Guide',
    readTime: '5 min',
    excerpt:
      'A practical reference covering lyophilized storage conditions, reconstitution protocols, freeze-thaw management, and common degradation pitfalls.',
    image: 'guide',
    content: [
      {
        type: 'intro',
        text: 'Improper peptide storage is one of the most common and least-discussed sources of experimental variability in peptide research. A compound that performs inconsistently across experiments may not have a complex pharmacological explanation — it may simply be degraded material. This guide provides evidence-based protocols for maintaining peptide integrity from receipt through experimental use.',
      },
      {
        type: 'heading',
        text: 'Lyophilized Peptide Storage',
      },
      {
        type: 'paragraph',
        text: 'Lyophilized (freeze-dried) peptides are the most stable form for long-term storage. General guidelines:',
      },
      {
        type: 'list',
        items: [
          '-20°C is appropriate for most peptides for up to 12 months. For highly sensitive or cysteine/methionine-containing sequences, -80°C is recommended.',
          'Peptides should be stored in desiccated, sealed vials. Do not open cold vials immediately upon removal from the freezer — allow vials to equilibrate to room temperature for 15–20 minutes before opening to prevent condensation from atmospheric humidity.',
          'Avoid repeated temperature cycling. Assign a dedicated storage aliquot separate from your working stock.',
          'Peptides with disulfide bonds are particularly vulnerable to oxidation during storage. Storage under inert gas (argon headspace) significantly extends stability.',
        ],
      },
      {
        type: 'heading',
        text: 'Reconstitution Protocols',
      },
      {
        type: 'paragraph',
        text: 'The choice of reconstitution solvent is peptide-dependent and should be guided by the compound\'s physicochemical properties:',
      },
      {
        type: 'list',
        items: [
          'Bacteriostatic water (0.9% benzyl alcohol in WFI): The default for most research peptides. Suitable for subcutaneous administration in animal models. The benzyl alcohol preservative allows multiple draws from the same vial without microbial contamination.',
          'Sterile water for injection (WFI): Used when benzyl alcohol sensitivity is a concern or when the peptide will be used for in vitro assays where preservatives would confound results.',
          'Dilute acetic acid (0.1–1% v/v): Recommended for basic peptides (high proportion of Lys, Arg, His residues) that aggregate or precipitate in neutral aqueous solution.',
          'Dilute DMSO (<10%): For highly hydrophobic peptides that are insoluble in aqueous media. Always dilute to <0.1% final DMSO concentration before cell-based assays to avoid cytotoxicity.',
        ],
      },
      {
        type: 'callout',
        text: 'Always reconstitute peptides gently — roll or invert the vial rather than vortexing. Mechanical shear can disrupt secondary structure in longer peptide sequences and promote aggregation.',
      },
      {
        type: 'heading',
        text: 'Managing Freeze-Thaw Cycles',
      },
      {
        type: 'paragraph',
        text: 'Repeated freeze-thaw cycles are a primary cause of peptide degradation in solution. Best practice is to aliquot reconstituted stock solutions into single-use volumes immediately after reconstitution. Label each aliquot with peptide ID, concentration, reconstitution date, and solvent. Discard unused thawed aliquots; do not re-freeze.',
      },
      {
        type: 'paragraph',
        text: 'For experiments requiring precise dosing over extended periods, calculate total volume requirements upfront and create a complete aliquot set on the same day from the same stock solution. This eliminates batch-to-batch variability in your working solutions.',
      },
      {
        type: 'heading',
        text: 'Quality Verification',
      },
      {
        type: 'paragraph',
        text: 'For critical experiments, independent verification of peptide integrity adds substantial confidence to results. Reverse-phase HPLC with UV detection (214 nm for peptide bond absorption) can detect degradation products as deviations from the expected retention time profile. Mass spectrometry (ESI-MS or MALDI-TOF) confirms molecular weight and can identify oxidation (+16 Da on Met or Trp), deamidation (+1 Da on Asn or Gln), or disulfide scrambling. Certificate of Analysis (CoA) values reflect the material at time of manufacture; laboratories should consider periodic re-testing for long-term studies.',
      },
    ],
  },
  {
    id: 'epithalon',
    title: 'Epithalon and Telomere Biology: A Research Overview',
    date: 'Mar 2025',
    dateISO: '2025-03-18',
    metaDescription: 'Epithalon\'s proposed role in telomerase activity and pineal gland research, and what current preclinical evidence does and doesn\'t show.',
    tag: 'Longevity',
    readTime: '10 min',
    excerpt:
      'Exploring the tetrapeptide Epithalon, its interactions with telomerase, pineal gland regulation, and its position within the broader landscape of longevity research.',
    image: 'longevity',
    content: [
      {
        type: 'intro',
        text: 'Epithalon (Epitalon; Ala-Glu-Asp-Gly) is a synthetic tetrapeptide developed by the Institute of Bioregulation and Gerontology in St. Petersburg, Russia, under the direction of Professor Vladimir Khavinson. The compound is conceptually derived from epithalamin, a polypeptide extract of the bovine pineal gland with observed immunomodulatory and life-extension properties in rodent studies. Epithalon\'s simplicity — just four amino acids — belies a proposed mechanism with profound implications for cellular aging: induction of telomerase activity.',
      },
      {
        type: 'heading',
        text: 'Telomeres, Telomerase, and Cellular Aging',
      },
      {
        type: 'paragraph',
        text: 'Telomeres are repetitive (TTAGGG)n sequences capping the ends of linear chromosomes, protecting coding DNA from the end-replication problem — the inability of DNA polymerase to fully replicate the 3\' end of a linear template. With each mitotic division, approximately 50–200 base pairs are lost from telomeric repeats. When telomere length falls below a critical threshold (~5-7 kb in humans), cells enter replicative senescence (the Hayflick limit) or apoptosis. Critically short telomeres also activate p53-dependent DNA damage responses, contributing to the tissue dysfunction observed in aging.',
      },
      {
        type: 'paragraph',
        text: 'Telomerase is a ribonucleoprotein complex comprising the catalytic reverse transcriptase subunit (hTERT) and an RNA template component (hTERC). It extends telomeres by adding TTAGGG repeats using the RNA template. In somatic cells, telomerase is largely silenced post-embryonically; its activity is retained in stem cell compartments, germ cells, and, pathologically, in the majority of cancer cells.',
      },
      {
        type: 'heading',
        text: 'Epithalon\'s Proposed Telomerase-Activating Mechanism',
      },
      {
        type: 'paragraph',
        text: 'Khavinson\'s group demonstrated in a series of cell culture experiments that Epithalon treatment of somatic cells (including human fetal fibroblasts) was associated with increased telomere length and extended replicative lifespan compared to untreated controls. The proposed mechanism centers on Epithalon\'s interaction with chromatin remodeling complexes that normally silence the hTERT promoter in differentiated cells. Specifically, in silico docking analyses suggest Epithalon may interact with histone H1 and affect the methylation status of CpG islands in the hTERT promoter region, de-repressing telomerase transcription.',
      },
      {
        type: 'callout',
        text: 'The telomerase-activating claim, while intriguing, requires independent replication in rigorously controlled settings. The primary body of evidence comes from the originating research group. Independent confirmation using standardized TRAP assay protocols and modern single-molecule telomere length measurement (e.g., TeSLA or STELA) would substantially strengthen these findings.',
      },
      {
        type: 'heading',
        text: 'Pineal Regulation and Circadian Biology',
      },
      {
        type: 'paragraph',
        text: 'Beyond telomere biology, Epithalon has been studied for its effects on pineal function, specifically melatonin synthesis. Aging is associated with reduced pineal output and disrupted circadian rhythmicity, which correlates with increased oxidative stress, impaired immune function, and accelerated cellular aging. In aged rat models, Epithalon administration restored melatonin secretion patterns toward those observed in young animals, normalized circadian gene expression (BMAL1, CLOCK, Per2), and reduced lipid peroxidation markers. Whether this represents a direct pinealocyte-stimulating effect or is secondary to more upstream neuroendocrine normalization remains under investigation.',
      },
      {
        type: 'heading',
        text: 'Oncological Safety Considerations',
      },
      {
        type: 'paragraph',
        text: 'Any discussion of telomerase activation must address oncological risk. Telomerase is active in ~85-90% of human cancers, and its reactivation is considered a hallmark of malignant transformation. Khavinson\'s group has reported that Epithalon does not induce malignant transformation in treated cells and actually reduced spontaneous tumor incidence in long-term rat carcinogenesis studies. The proposed explanation is that normalized melatonin secretion provides antioxidant protection that more than offsets any telomerase-related risk. This remains one of the most contested aspects of Epithalon research and warrants careful mechanistic investigation before any broad conclusions are drawn.',
      },
    ],
  },
  {
    id: 'semax',
    title: 'Semax and Cognitive Enhancement Research',
    date: 'Mar 2025',
    dateISO: '2025-03-05',
    metaDescription: 'Semax\'s history as a nootropic research compound, proposed BDNF-related mechanisms, and the current state of cognitive research evidence.',
    tag: 'Cognitive',
    readTime: '9 min',
    excerpt:
      'A systematic review of Semax pharmacology, its BDNF-upregulating and neuroprotective mechanisms, and the clinical research landscape from its origins in Soviet neuroscience.',
    image: 'cognitive',
    content: [
      {
        type: 'intro',
        text: 'Semax (Met-Glu-His-Phe-Pro-Gly-Pro) is a heptapeptide analog of the ACTH(4-10) fragment, developed in Russia in the 1980s by Nikolai Myasoedov and colleagues at the Russian Academy of Sciences. Unlike intact ACTH, Semax lacks steroidogenic activity — it does not stimulate cortisol production — but retains and amplifies the neuroprotective and nootropic properties associated with the ACTH fragment. It is approved in Russia for clinical use in stroke, neurological trauma, and attention deficit disorders, making it one of the few peptides in this class with a clinical registration history.',
      },
      {
        type: 'heading',
        text: 'BDNF Upregulation: The Core Mechanism',
      },
      {
        type: 'paragraph',
        text: 'The most consistently replicated finding in Semax research is its ability to upregulate brain-derived neurotrophic factor (BDNF) and its high-affinity receptor TrkB (tropomyosin receptor kinase B). BDNF is critical for neuronal survival, synaptic plasticity, long-term potentiation (LTP), and the support of cholinergic and dopaminergic neuron populations. In the hippocampus — a region central to declarative memory and particularly vulnerable to ischemic injury — Semax administration in rodents produces robust BDNF mRNA increases (2-5 fold over baseline) within 24 hours, persisting for up to 3 days after a single intranasal dose.',
      },
      {
        type: 'paragraph',
        text: 'The mechanism involves Semax binding to melanocortin receptors (MC4R and MC5R are the primary candidates, though this remains incompletely characterized) and downstream activation of CREB (cAMP response element-binding protein), a transcription factor that drives BDNF gene expression. Separately, Semax modulates NGF (nerve growth factor) expression in cholinergic basal forebrain neurons, which may contribute to its observed effects on attention and working memory in animal models.',
      },
      {
        type: 'heading',
        text: 'Neuroprotective Mechanisms in Ischemia',
      },
      {
        type: 'paragraph',
        text: 'The majority of Semax\'s clinical data comes from stroke research. In middle cerebral artery occlusion (MCAO) rat models, Semax administered intranasally within 3 hours of ischemia onset reduces infarct volume by 30–50% in multiple independent studies. The proposed neuroprotective mechanisms are multi-factorial:',
      },
      {
        type: 'list',
        items: [
          'Anti-excitotoxic: Semax reduces post-ischemic glutamate release and attenuates NMDA receptor hyperactivation, limiting calcium-mediated neuronal necrosis in the ischemic penumbra.',
          'Anti-inflammatory: Suppression of microglial activation and reduction of TNF-α, IL-1β, and IL-6 in the peri-infarct zone.',
          'Anti-apoptotic: Upregulation of Bcl-2 and downregulation of Bax and caspase-3 in threatened neurons.',
          'Pro-angiogenic: Enhanced VEGF expression and microvessel density in the peri-lesion area at 7–14 days post-ischemia, supporting long-term recovery.',
        ],
      },
      {
        type: 'heading',
        text: 'Intranasal Delivery and CNS Bioavailability',
      },
      {
        type: 'paragraph',
        text: 'Semax is administered intranasally in all approved formulations, exploiting olfactory and trigeminal nerve transport pathways to achieve CNS delivery without systemic circulation. This bypasses the blood-brain barrier entirely for a portion of the administered dose: radiotracer studies in rodents demonstrate detectable Semax (or its active fragments) in olfactory bulb, hippocampus, and frontal cortex within 30 minutes of intranasal application, at concentrations substantially above those achievable by intravenous dosing at equivalent amounts.',
      },
      {
        type: 'callout',
        text: 'Semax degrades rapidly in aqueous solution (t½ ~15 minutes at 37°C due to aminopeptidase activity). Research solutions should be prepared fresh immediately before use, or stored as lyophilized aliquots and reconstituted just prior to administration.',
      },
      {
        type: 'heading',
        text: 'Cognitive Enhancement in Non-Pathological Contexts',
      },
      {
        type: 'paragraph',
        text: 'Beyond neuroprotection, a subset of Semax research investigates cognitive enhancement in healthy subjects. In healthy volunteer EEG studies, intranasal Semax produced measurable increases in alpha and beta power in frontal and temporal regions at 40–60 minutes post-administration, consistent with a state of enhanced alertness and focused attention. Controlled cognitive battery tests in these populations showed improvements in working memory span and processing speed. It is worth noting that most such studies are small (n=20–40), and the absence of preregistration in the older literature limits confidence in reported effect sizes.',
      },
    ],
  },
  {
    id: 'reconstitution-guide',
    title: 'Peptide Reconstitution Guide',
    date: 'Feb 2025',
    dateISO: '2025-02-22',
    metaDescription: 'A step-by-step protocol for reconstituting lyophilized research peptides, from solvent selection through aliquoting and storage.',
    tag: 'Guide',
    readTime: '6 min',
    excerpt:
      'Step-by-step protocols for reconstituting lyophilized peptides, calculating concentrations, and preparing accurate working solutions for research use.',
    image: 'guide',
    content: [
      {
        type: 'intro',
        text: 'Accurate reconstitution is the foundation of reproducible peptide research. Errors at this step — incorrect solvent selection, inaccurate volume measurement, or inadequate dissolution — propagate through every subsequent experiment. This guide provides systematic protocols applicable to the vast majority of research peptides.',
      },
      {
        type: 'heading',
        text: 'Step 1: Gather Materials',
      },
      {
        type: 'paragraph',
        text: 'Before opening any vial, prepare the following:',
      },
      {
        type: 'list',
        items: [
          'Appropriate reconstitution solvent (see solvent selection below)',
          'Calibrated insulin syringe or micropipette with appropriate tips',
          'Peptide vial with CoA confirming mg content',
          'Clean bench surface or biosafety cabinet for aseptic technique',
          'Labeling materials (waterproof marker or cryogenic labels)',
          'Small aliquot vials (0.5–2 mL microcentrifuge tubes or glass vials with septa)',
        ],
      },
      {
        type: 'heading',
        text: 'Step 2: Calculate Required Volume',
      },
      {
        type: 'paragraph',
        text: 'Determine your target concentration and calculate the volume of solvent needed using: Volume (mL) = Mass (mg) ÷ Target Concentration (mg/mL). For example, a 5 mg vial reconstituted to 2 mg/mL requires 2.5 mL of solvent. Always verify your calculation before proceeding. For conversion to μg/μL or nmol/μL (useful for in vitro dosing), ensure you account for the peptide\'s molecular weight from the CoA.',
      },
      {
        type: 'heading',
        text: 'Step 3: Solvent Selection',
      },
      {
        type: 'paragraph',
        text: 'Select solvent based on peptide polarity:',
      },
      {
        type: 'list',
        items: [
          'Hydrophilic peptides (charged residues predominant): Bacteriostatic water or sterile water directly.',
          'Basic peptides (net positive charge): 0.1–1% acetic acid in water.',
          'Acidic peptides (net negative charge): Dilute ammonium bicarbonate solution (5–10 mM).',
          'Hydrophobic/amphipathic peptides: Begin with a small volume (10–20% of total) of DMSO to fully wet the pellet, then gradually add aqueous solvent to the final volume.',
        ],
      },
      {
        type: 'callout',
        text: 'Solubility testing protocol: If unsure of solubility, start with a small test aliquot. Dissolve ~0.1 mg in 0.1 mL of your chosen solvent. Visual clarity at this 1 mg/mL concentration indicates adequate solubility. Turbidity or visible particles requires solvent adjustment before proceeding with the full batch.',
      },
      {
        type: 'heading',
        text: 'Step 4: Reconstitution Technique',
      },
      {
        type: 'paragraph',
        text: 'Allow the sealed, unopened peptide vial to equilibrate to room temperature (15–20 minutes). Swab the septum with 70% ethanol. Inject solvent slowly down the inner wall of the vial rather than directly onto the lyophilized cake. Do not agitate vigorously — gently roll the vial between your palms or use slow end-over-end inversion until the pellet is fully dissolved. Avoid vortexing. Allow the solution to sit for 5 minutes; inspect against a dark background for visible particles before proceeding.',
      },
      {
        type: 'heading',
        text: 'Step 5: Aliquoting and Labeling',
      },
      {
        type: 'paragraph',
        text: 'Immediately aliquot the reconstituted stock into single-use volumes before freezing. Label every aliquot with: peptide name and lot number, concentration and units, reconstitution date, solvent composition, and researcher initials. Transfer aliquots to storage at -80°C (preferred) or -20°C promptly. Working solutions for a single experiment may be kept at 4°C for up to 24 hours if they will be used the same day; discard thereafter.',
      },
    ],
  },
  {
    id: 'melanotan-ii',
    title: 'Melanotan II: Melanocortin Receptor Pharmacology and Research History',
    date: 'Aug 2026',
    dateISO: '2026-08-19',
    metaDescription: 'Melanotan II\u2019s origins at the University of Arizona, its non-selective MC1R\u2013MC5R activity, and what the published early-phase human studies actually found.',
    tag: 'Aesthetic',
    readTime: '7 min',
    excerpt:
      'How a 1980s photoprotection research programme at the University of Arizona produced one of the most-studied non-selective melanocortin agonists — and eventually led, via a more selective descendant, to an FDA-approved drug.',
    image: 'aesthetic',
    content: [
      {
        type: 'intro',
        text: 'Melanotan II (MT-II) is a synthetic, non-selective melanocortin receptor agonist first developed at the University of Arizona in the late 1980s as a stabilized cyclic analog of alpha-melanocyte-stimulating hormone (α-MSH). Unlike the receptor-selective compounds that followed it, MT-II activates MC1R, MC3R, MC4R, and MC5R simultaneously — the property that made it a foundational research tool for mapping the melanocortin system, and also the reason its own clinical development was eventually set aside in favor of more selective successors.',
      },
      {
        type: 'heading',
        text: 'Origins and Structure',
      },
      {
        type: 'paragraph',
        text: 'MT-II traces back to a 1980 paper by Sawyer, Sanfilippo, Hruby, and Hadley describing [Nle4,D-Phe7]-α-MSH, a linear analog roughly 26 times more potent than native α-MSH in early receptor assays. Researchers at Arizona subsequently cyclized this sequence with a lactam bridge — the structure typically written as Ac-Nle4-Asp5-His6-D-Phe7-Arg8-Trp9-Lys10-NH2 — producing a compound substantially more resistant to enzymatic degradation than its linear precursor, with a longer receptor residence time. The original research rationale was chemopreventive: could controlled, UV-independent induction of melanogenesis reduce the population burden of sun-induced skin cancer?',
      },
      {
        type: 'heading',
        text: 'Mechanism of Action: Why "Non-Selective" Matters',
      },
      {
        type: 'paragraph',
        text: 'The melanocortin system comprises five receptor subtypes (MC1R–MC5R) with distinct tissue distributions and functions. MT-II binds four of them with meaningful affinity:',
      },
      {
        type: 'list',
        items: [
          'MC1R — expressed on melanocytes; activation drives eumelanin synthesis, the pathway underlying MT-II\u2019s pigmentary research applications.',
          'MC3R and MC4R — expressed centrally; implicated in energy homeostasis and, separately, in autonomic pathways linked to sexual arousal.',
          'MC5R — peripheral, exocrine-associated; comparatively less characterized in the MT-II literature.',
          'MC2R — notably not meaningfully engaged, distinguishing MT-II\u2019s profile from ACTH-driven adrenal pathways.',
        ],
      },
      {
        type: 'paragraph',
        text: 'This breadth is precisely what made MT-II useful as an early pharmacological tool for probing the melanocortin system before selective agonists existed — and precisely what limits its interpretability as a model for any single receptor pathway in isolation.',
      },
      {
        type: 'heading',
        text: 'What Did the Early Human Studies Find?',
      },
      {
        type: 'paragraph',
        text: 'A 1996 pilot Phase I study by Dorr and colleagues, published in Life Sciences, administered subcutaneous MT-II to three healthy male volunteers at the University of Arizona, starting at 0.01 mg/kg and escalating every other weekday over two weeks. Two of the three subjects developed increased facial, upper-body, and buttock pigmentation. The 0.03 mg/kg dose produced Grade II somnolence and fatigue in one subject, and researchers documented spontaneous erections lasting one to five hours accompanied by a stretching-and-yawning complex — an off-target finding that would go on to define a second, entirely separate branch of melanocortin research.',
      },
      {
        type: 'paragraph',
        text: 'That second branch was formalized in a 1998 double-blind, placebo-controlled crossover study by Wessells and colleagues in the Journal of Urology, which tested MT-II in men with psychogenic erectile dysfunction and reported a 75% response rate — comparable to apomorphine, an active comparator used in that era of research. The "stretching-yawning syndrome" observed alongside these central effects has since been documented across multiple mammalian species tested with melanocortin agonists, including rabbits, cats, rats, mice, and monkeys — a cross-species consistency that researchers have used as supporting evidence for a conserved central mechanism.',
      },
      {
        type: 'callout',
        text: 'MT-II\u2019s non-selectivity is both its historical value and its central limitation. Because it engages multiple receptor subtypes at once, the compound cannot cleanly isolate any single melanocortin pathway — which is exactly why later research moved toward selective analogs. MT-II itself never progressed through a full registration pathway to approval for any indication; the studies referenced above are early-phase, small-cohort investigations, not evidence of safety or efficacy for any human use. This article describes published research findings only and does not constitute guidance for human use.',
      },
      {
        type: 'heading',
        text: 'From MT-II to an Approved Drug: The Bremelanotide Story',
      },
      {
        type: 'paragraph',
        text: 'The central MC4R activity documented in the Wessells study informed the development of a more receptor-selective descendant, PT-141 (bremelanotide), by Palatin Technologies. Unlike MT-II, bremelanotide was carried through full clinical development and received FDA approval in 2019, marketed as Vyleesi, for hypoactive sexual desire disorder. This lineage — a non-selective research tool giving rise to a selective, approved therapeutic — is a useful case study in structure-activity relationship research: MT-II\u2019s broad receptor profile helped identify which pathway mattered, and later chemistry narrowed in on it.',
      },
      {
        type: 'heading',
        text: 'Why Researchers Still Use Non-Selective Agonists Like MT-II',
      },
      {
        type: 'paragraph',
        text: 'Despite the existence of newer, more selective compounds, non-selective agonists remain useful as comparator tools — establishing an upper bound of melanocortin pathway activation against which selective agonists can be benchmarked, and supporting receptor-mapping work where the research question is the system as a whole rather than one subtype. As with any pharmacological tool compound, interpretation depends on controlling for the fact that observed effects may reflect contributions from multiple receptors rather than one.',
      },
    ],
  },
]


// FIX: counts (18, 24, 12, 15 in the original) were hardcoded placeholders
// that never matched the real 6-article catalogue above — a visitor
// filtering by "Recovery" would see "18" in the pill and find one article.
// Derived from ARTICLES instead, so the number shown always matches reality.
export const TAG_COLOR: Record<string, string> = {
  Recovery: '#22c55e',
  Metabolic: '#f97316',
  Cognitive: '#8b5cf6',
  Longevity: '#3b82f6',
  Aesthetic: '#ec4899',
  Guide: '#64748b',
}

export const CATEGORIES = Array.from(new Set(ARTICLES.map((a) => a.tag))).map((title) => ({
  title,
  count: ARTICLES.filter((a) => a.tag === title).length,
  color: TAG_COLOR[title] ?? '#64748b',
}))

export const tagColors: Record<string, { bg: string; text: string }> = {
  Recovery: { bg: '#dcfce7', text: '#16a34a' },
  Metabolic: { bg: '#ffedd5', text: '#c2410c' },
  Cognitive: { bg: '#ede9fe', text: '#7c3aed' },
  Longevity: { bg: '#dbeafe', text: '#1d4ed8' },
  Aesthetic: { bg: '#fce7f3', text: '#be185d' },
  Guide: { bg: '#f1f5f9', text: '#475569' },
}

export function getArticleBySlug(slug: string) {
  return ARTICLES.find((a) => a.id === slug)
}