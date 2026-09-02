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
    title: 'The Chemistry of Peptide Degradation: Why Storage Conditions Matter',
    date: 'Apr 2025',
    dateISO: '2025-04-10',
    metaDescription: 'The degradation chemistry behind peptide instability — oxidation, deamidation, aggregation and hydrolysis kinetics — and what the evidence says about storage variables.',
    tag: 'Longevity',
    readTime: '6 min',
    excerpt:
      'A mechanistic look at why peptides degrade in storage: the oxidation, deamidation, and aggregation pathways behind the temperature and handling variables researchers control for.',
    image: 'guide',
    content: [
      {
        type: 'intro',
        text: 'Storage guidelines for research peptides are usually presented as a checklist — freeze it, keep it dark, don\'t re-thaw it. What that checklist doesn\'t explain is why those variables matter, and that gap matters for research design: a compound performing inconsistently across experiments is often assumed to have a complex pharmacological explanation when the real cause is degraded material. This article looks at the underlying chemistry — the specific reactions that consume peptide integrity in storage — rather than the step-by-step handling procedure itself. For the procedural version, see our companion Storage Conditions guide.',
      },
      {
        type: 'heading',
        text: 'Hydrolysis: The Default Degradation Pathway',
      },
      {
        type: 'paragraph',
        text: 'Peptide bonds are thermodynamically favored to hydrolyze back into their constituent amino acids; the reaction proceeds slowly at low temperature and neutral pH but accelerates sharply with heat, moisture, and pH extremes. This is the chemical basis for lyophilization as a storage form — removing water removes the medium the hydrolysis reaction needs to proceed at a meaningful rate. It\'s also why "how cold" and "how dry" are the two variables that dominate storage research, rather than being arbitrary precautions: each one independently slows the same underlying reaction.',
      },
      {
        type: 'heading',
        text: 'Oxidation: Sequence-Dependent Vulnerability',
      },
      {
        type: 'paragraph',
        text: 'Not all peptides degrade at the same rate under identical storage conditions, and sequence composition is the main reason why. Methionine and cysteine residues are particularly oxidation-prone — methionine sulfoxide formation (a +16 Da mass shift, readily detected by mass spectrometry) and cysteine disulfide scrambling are among the most commonly reported degradation products in stability studies. Tryptophan and histidine are secondary oxidation risks. This sequence-dependence is why compound-specific research articles on this site (for example, on GHK-Cu\'s copper-catalyzed oxidation risk, or LR3\'s deamidation-driven binding changes) flag handling notes beyond generic storage advice — the chemistry isn\'t identical across compounds.',
      },
      {
        type: 'heading',
        text: 'Deamidation: A Slower, Often-Overlooked Pathway',
      },
      {
        type: 'paragraph',
        text: 'Asparagine and glutamine residues are subject to deamidation — a spontaneous reaction converting them to aspartate/isoaspartate or glutamate, with a small (+1 Da) mass shift that is easy to miss without high-resolution mass spectrometry. Deamidation proceeds even in properly frozen storage, just far more slowly, which is why stability windows are generally stated in months rather than treated as indefinite. Critically, deamidation can silently alter receptor-binding affinity without any visible change to a reconstituted solution\'s appearance — the compound can look, and even assay as approximately correct by mass, while behaving differently in a bioassay.',
      },
      {
        type: 'heading',
        text: 'Aggregation: A Physical Rather Than Chemical Failure Mode',
      },
      {
        type: 'paragraph',
        text: 'Beyond covalent bond changes, peptides in solution can aggregate — partially unfolding and self-associating into oligomers or larger particulates, particularly under mechanical stress (vigorous vortexing), at high concentration, or near a peptide\'s isoelectric point where net charge repulsion is minimized. Aggregation is a physical rather than chemical degradation pathway, but its research consequences are similar: reduced effective concentration of correctly folded, bioactive monomer, and in some cases altered pharmacokinetics if aggregated material is administered in animal models.',
      },
      {
        type: 'callout',
        text: 'Certificate of Analysis (CoA) purity values describe the material at time of manufacture, not at time of use. HPLC and mass spectrometry re-testing before critical experiments — rather than assuming CoA values still hold months into a storage window — is the only way to directly confirm a stock solution\'s current integrity rather than inferring it from storage conditions alone.',
      },
      {
        type: 'heading',
        text: 'For Step-by-Step Handling Protocol',
      },
      {
        type: 'paragraph',
        text: 'This article covers the reactions driving degradation; it isn\'t a procedural checklist. For temperature ranges, aliquoting technique, and a practical day-to-day storage protocol, see the Storage Conditions for Research Peptides guide in our Guides section.',
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
    title: 'Solvent Selection Chemistry: Why Peptide Polarity Dictates Reconstitution',
    date: 'Feb 2025',
    dateISO: '2025-02-22',
    metaDescription: 'The physicochemical logic behind peptide solvent selection — charge, hydrophobicity, and isoelectric point — and what the research literature says about solubility failure modes.',
    tag: 'Longevity',
    readTime: '6 min',
    excerpt:
      'Why solvent choice for peptide reconstitution isn\'t arbitrary: the charge, hydrophobicity, and isoelectric-point chemistry that determines which solvent a given sequence needs.',
    image: 'guide',
    content: [
      {
        type: 'intro',
        text: 'Reconstitution guidance is usually presented as a lookup table — hydrophilic peptides get water, basic peptides get dilute acid, hydrophobic peptides get DMSO. That table is useful, but it obscures the underlying physical chemistry, and understanding that chemistry is what lets a researcher reason correctly about a novel or poorly characterized sequence rather than just following a rule. This article covers the solubility physics; for the procedural walk-through of measuring, mixing, and aliquoting, see our companion Peptide Reconstitution guide.',
      },
      {
        type: 'heading',
        text: 'Isoelectric Point and Aqueous Solubility',
      },
      {
        type: 'paragraph',
        text: 'Every peptide has an isoelectric point (pI) — the pH at which its net charge is zero. Near the pI, a peptide has minimal electrostatic self-repulsion, which makes it more prone to aggregation and precipitation in solution, since there\'s no charge barrier keeping molecules apart. This is the mechanistic reason solvent pH matters: choosing a solvent pH well above or below a peptide\'s pI maximizes net charge and, with it, aqueous solubility and colloidal stability. Basic peptides (rich in lysine, arginine, histidine) have a high pI and solubilize better in mildly acidic solvent; acidic peptides (rich in aspartate, glutamate) have a low pI and solubilize better in mildly basic or neutral solvent.',
      },
      {
        type: 'heading',
        text: 'Hydrophobicity and the Role of DMSO',
      },
      {
        type: 'paragraph',
        text: 'Peptides with a high proportion of nonpolar residues (leucine, isoleucine, valine, phenylalanine) resist hydration by water\'s polar solvent shell, and pure aqueous solvent may fail to disrupt the intermolecular forces holding the lyophilized cake together at all. DMSO works as a co-solvent because it can hydrogen-bond with both polar and nonpolar peptide surfaces, effectively bridging the compound into an aqueous-compatible state once diluted further. The practical constraint researchers work within is DMSO\'s own biological activity — it doesn\'t stay chemically inert past around 0.1% final concentration in cell-based assay systems, which is why hydrophobic-peptide protocols specify wetting with a small DMSO volume before diluting the bulk of the way with aqueous buffer, rather than using DMSO as the final solvent.',
      },
      {
        type: 'heading',
        text: 'Why Benzyl Alcohol Preservative Matters for Multi-Draw Use',
      },
      {
        type: 'paragraph',
        text: 'Bacteriostatic water\'s 0.9% benzyl alcohol content exists specifically to allow repeated draws from a single vial without microbial contamination accumulating between uses — a meaningful research-logistics consideration for a stock solution used across many experimental sessions. The trade-off is that benzyl alcohol is itself a bioactive small molecule with documented effects in some in vitro systems, which is why protocols for cell-based assays (where the benzyl alcohol itself could confound results) generally specify preservative-free sterile water for injection instead, accepting the shorter usable window of an unpreserved solution in exchange for assay purity.',
      },
      {
        type: 'callout',
        text: 'A solubility failure — persistent turbidity after full solvent addition — is diagnostic information, not just an obstacle to work around. It typically indicates either a pI/solvent-pH mismatch or an underestimated hydrophobic character, and researchers troubleshooting an unfamiliar sequence can use the pattern of failure to infer which physicochemical property was misjudged, rather than defaulting to arbitrary solvent substitution.',
      },
      {
        type: 'heading',
        text: 'For the Full Reconstitution Protocol',
      },
      {
        type: 'paragraph',
        text: 'This article explains why particular solvents are chosen; it isn\'t a materials list or step sequence. For calculating target volumes, aseptic technique, and aliquoting practice, see the Peptide Reconstitution: Complete Step-by-Step Guide in our Guides section.',
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
  {
    id: 'tesamorelin',
    title: 'Tesamorelin: GHRH Analog Research in Metabolic and Visceral Fat Studies',
    date: 'Sep 2026',
    dateISO: '2026-09-02',
    metaDescription: 'Tesamorelin\'s mechanism as a GHRH analog, its research history in visceral adipose tissue and metabolic studies, and open questions on GH-axis pulsatility.',
    tag: 'Metabolic',
    readTime: '7 min',
    excerpt:
      'A research overview of Tesamorelin, a stabilized GHRH(1-44) analog studied for its effects on visceral adipose tissue, IGF-1 signaling, and pulsatile growth hormone release.',
    image: 'metabolic',
    content: [
      {
        type: 'intro',
        text: 'Tesamorelin is a synthetic analog of growth hormone-releasing hormone (GHRH), modified with a trans-3-hexenoic acid group at the N-terminus to resist rapid degradation by dipeptidyl peptidase-4 (DPP-4). Unlike exogenous growth hormone itself, Tesamorelin acts upstream at the pituitary somatotroph, stimulating endogenous GH release in a manner that preserves the body\'s natural pulsatile secretion pattern. This distinction — indirect, pulsatile stimulation versus direct, continuous GH exposure — is central to why Tesamorelin has drawn sustained research interest, particularly in visceral adiposity models.',
      },
      {
        type: 'heading',
        text: 'Mechanism: Pituitary GHRH Receptor Activation',
      },
      {
        type: 'paragraph',
        text: 'Tesamorelin binds the GHRH receptor (GHRHR) on anterior pituitary somatotrophs, activating a Gs-protein-coupled cascade that raises intracellular cAMP and triggers GH vesicle release. Because this pathway remains subject to the hypothalamus\'s native negative-feedback loop — via somatostatin and IGF-1 — GH release stays pulsatile rather than sustained, which research models suggest lowers the risk of the receptor desensitization and compensatory suppression seen with continuous GH-axis stimulation.',
      },
      {
        type: 'heading',
        text: 'Visceral Adipose Tissue: The Primary Research Focus',
      },
      {
        type: 'paragraph',
        text: 'The bulk of controlled Tesamorelin research centers on visceral adipose tissue (VAT) reduction, most extensively in HIV-associated lipodystrophy models and trials — the indication for which it holds regulatory approval in some jurisdictions. Mechanistically, the proposed pathway runs through increased lipolysis in visceral fat depots (which carry a higher density of GH-sensitive adipocytes than subcutaneous fat) and downstream IGF-1-mediated shifts in substrate metabolism. Imaging-based studies (CT-quantified VAT area) report reductions on the order of 15–20% over 26-week treatment windows relative to placebo, without matched reductions in subcutaneous fat — a selectivity pattern that is itself an active area of mechanistic study.',
      },
      {
        type: 'list',
        items: [
          'VAT-selective lipolysis is attributed to higher GH-receptor density and greater beta-adrenergic sensitivity in visceral versus subcutaneous adipocytes.',
          'IGF-1 elevation following Tesamorelin administration is dose-dependent and used in research settings as a pharmacodynamic marker of GH-axis engagement.',
          'Effects on VAT appear to reverse within months of discontinuation in longitudinal follow-up cohorts, consistent with a maintenance-dependent rather than structural mechanism.',
        ],
      },
      {
        type: 'heading',
        text: 'Metabolic and Lipid Parameters',
      },
      {
        type: 'paragraph',
        text: 'Secondary endpoints in Tesamorelin research frequently include triglycerides, HDL cholesterol, and markers of hepatic fat content. Triglyceride reductions of 10–15% are commonly reported alongside VAT loss, plausibly linked to reduced free-fatty-acid flux from a smaller visceral depot. Hepatic fat fraction, measured by MRI proton-density fat fraction (MRI-PDFF) in a subset of studies, shows modest but statistically significant reductions, generating research interest in Tesamorelin as a tool compound for studying GH-axis contributions to non-alcoholic fatty liver models — though this remains investigational rather than an established application.',
      },
      {
        type: 'callout',
        text: 'Tesamorelin research protocols consistently note glucose/insulin sensitivity as a monitoring parameter — GH elevation has counter-regulatory effects on insulin signaling, and studies report small increases in fasting glucose in a subset of subjects despite the favorable lipid and VAT findings. This is typically framed as a trade-off requiring ongoing metabolic monitoring within a study design, not a contraindication to further research.',
      },
      {
        type: 'heading',
        text: 'Stability and Handling in Research Settings',
      },
      {
        type: 'paragraph',
        text: 'Like most GHRH-class peptides, Tesamorelin is susceptible to degradation via oxidation of its methionine residue and is typically supplied lyophilized for this reason. Reconstituted solutions are commonly used within the same research session or short-term storage window at refrigerated temperatures, with long-term stock kept frozen and lyophilized until use — consistent with general peptide storage principles rather than requiring compound-specific handling beyond standard aseptic reconstitution technique.',
      },
    ],
  },
  {
    id: 'igf-1-lr3',
    title: 'IGF-1 LR3: Extended Half-Life Analog in Tissue Growth Research',
    date: 'Sep 2026',
    dateISO: '2026-09-02',
    metaDescription: 'IGF-1 LR3\'s engineered mutations, its use as an extended-half-life research tool for IGF-1 receptor signaling, and evidence on hyperplasia versus hypertrophy.',
    tag: 'Recovery',
    readTime: '7 min',
    excerpt:
      'How a 13-amino-acid B-domain extension and single point mutation transform native IGF-1 into a long-acting research tool for studying anabolic signaling and satellite cell activity.',
    image: 'recovery',
    content: [
      {
        type: 'intro',
        text: 'Insulin-like Growth Factor 1 Long Arg3 (IGF-1 LR3) is an 83-amino-acid engineered analog of native human IGF-1. It differs from the endogenous hormone in two ways: a 13-amino-acid extension of the B-domain at the N-terminus, and substitution of glutamic acid for arginine at position 3. Neither modification meaningfully alters binding affinity for the IGF-1 receptor (IGF-1R) — the changes exist specifically to reduce affinity for IGF-binding proteins (IGFBPs), which in native circulation sequester the vast majority of IGF-1 within minutes of release.',
      },
      {
        type: 'heading',
        text: 'Why the B-Domain Extension Matters',
      },
      {
        type: 'paragraph',
        text: 'In normal physiology, over 90% of circulating IGF-1 is bound to IGFBPs (principally IGFBP-3, in a ternary complex with acid-labile subunit), which limits free, receptor-available IGF-1 to a small fraction of total serum concentration at any given time. The Arg3 substitution and B-domain extension in LR3 sterically and electrostatically reduce IGFBP binding affinity roughly 10-fold relative to native IGF-1, while leaving IGF-1R affinity essentially unchanged. The practical research consequence is a dramatically extended functional half-life — native IGF-1 has a circulating half-life measured in minutes once unbound, whereas LR3\'s reduced IGFBP sequestration extends this to several hours in research models.',
      },
      {
        type: 'heading',
        text: 'IGF-1 Receptor Signaling and Downstream Pathways',
      },
      {
        type: 'paragraph',
        text: 'IGF-1R is a receptor tyrosine kinase structurally related to the insulin receptor. Ligand binding triggers autophosphorylation and activates two principal downstream cascades studied extensively in LR3 research: the PI3K/Akt/mTOR pathway, which drives protein synthesis and is considered the dominant route for anabolic signaling in skeletal muscle, and the Ras/MAPK/ERK pathway, more closely associated with cell proliferation and differentiation. The relative weighting between these pathways — and how LR3\'s extended exposure window shifts that balance compared to pulsatile native IGF-1 signaling — remains an active question in in vitro and animal research.',
      },
      {
        type: 'heading',
        text: 'Satellite Cell Activation and Hyperplasia Research',
      },
      {
        type: 'paragraph',
        text: 'A significant strand of LR3 research concerns satellite cells — quiescent muscle stem cells that, upon activation, can proliferate and either fuse with existing myofibers (contributing to hypertrophy) or in some animal models generate genuinely new muscle fibers (hyperplasia). LR3 is a commonly used tool compound in this line of research because its extended half-life sustains satellite cell mitogenic signaling for longer than native IGF-1 pulses allow in culture or in vivo. Findings on true fiber-number hyperplasia remain mixed and highly species- and model-dependent; most controlled evidence supports robust hypertrophic (existing-fiber growth) effects, with hyperplasia results considered preliminary and not consistently replicated.',
      },
      {
        type: 'list',
        items: [
          'In vitro myoblast studies show LR3 sustains Akt phosphorylation for hours longer than equimolar native IGF-1, correlating with increased proliferation markers.',
          'Rodent models report increased satellite cell nuclei-to-fiber ratios with prolonged LR3 exposure, though translation to hyperplasia versus hypertrophy is model-dependent.',
          'IGF-1R is also expressed outside skeletal muscle (adipose, cardiac, neural tissue), so systemic research protocols must account for off-target signaling when interpreting muscle-specific outcomes.',
        ],
      },
      {
        type: 'heading',
        text: 'Cross-Reactivity with the Insulin Receptor',
      },
      {
        type: 'paragraph',
        text: 'IGF-1R and the insulin receptor share substantial structural homology, and IGF-1 (including LR3) retains weak but non-negligible affinity for the insulin receptor. Research protocols using LR3 typically account for this by monitoring glucose parameters as a confound variable, since insulin-receptor cross-activation can independently affect glucose uptake in ways that overlap with — and complicate interpretation of — the compound\'s primary IGF-1R-mediated effects.',
      },
      {
        type: 'callout',
        text: 'Because LR3\'s extended half-life is a direct function of reduced IGFBP binding, degraded or improperly stored material that has undergone deamidation near the mutation site can regain native-like IGFBP affinity — silently reverting the compound toward native IGF-1 kinetics without any visible change to the solution. This makes stringent cold-chain handling and fresh reconstitution more consequential for LR3 than for many other research peptides.',
      },
    ],
  },
  {
    id: 'ghk-cu',
    title: 'GHK-Cu: Copper-Binding Tripeptide Research in Skin and Wound Biology',
    date: 'Sep 2026',
    dateISO: '2026-09-02',
    metaDescription: 'GHK-Cu\'s copper-chelation chemistry, its research history in dermal remodeling and wound healing, and gene-expression findings from microarray studies.',
    tag: 'Aesthetic',
    readTime: '7 min',
    excerpt:
      'A research overview of GHK-Cu, a naturally occurring copper-binding tripeptide studied for its effects on collagen remodeling, gene expression, and wound repair.',
    image: 'aesthetic',
    content: [
      {
        type: 'intro',
        text: 'GHK-Cu (glycyl-L-histidyl-L-lysine, complexed with copper(II)) is a naturally occurring tripeptide first isolated from human plasma in 1973, where it was noted to decline substantially with age — from roughly 200 ng/mL in young adults to a fraction of that by the sixth decade. This age-related decline, combined with its high-affinity copper-chelating structure, is what originally directed research attention toward its role in tissue maintenance and repair, and it remains one of the more mechanistically well-characterized peptides in the dermal-research literature.',
      },
      {
        type: 'heading',
        text: 'Copper Chelation Chemistry',
      },
      {
        type: 'paragraph',
        text: 'The tripeptide\'s glycine-histidine-lysine sequence forms a square-planar coordination complex with Cu²⁺ with high binding affinity, involving the imidazole nitrogen of histidine, the terminal amino group, and a peptide backbone nitrogen. This is not incidental to the molecule\'s biological activity — copper is a required cofactor for lysyl oxidase (which cross-links collagen and elastin), for superoxide dismutase (an antioxidant enzyme), and for cytochrome c oxidase in mitochondrial respiration. GHK-Cu is understood in the research literature primarily as a copper-delivery and copper-trafficking vehicle whose biological effects are difficult to separate from copper\'s own enzymatic roles.',
      },
      {
        type: 'heading',
        text: 'Gene Expression Findings',
      },
      {
        type: 'paragraph',
        text: 'GHK-Cu is one of the more extensively profiled peptides in connective-tissue transcriptomic research. Broad gene-expression microarray studies in human fibroblast and skin models report GHK-Cu modulating several hundred genes, with notable upregulation clusters in collagen types I and III, matrix metalloproteinases balanced against their tissue inhibitors (TIMPs), and antioxidant-response genes. This broad transcriptional footprint is the basis for GHK-Cu\'s reputation in the literature as a "tissue remodeling signal" rather than a single-pathway agent — though the breadth of the effect also makes isolating a primary mechanism of action more difficult than for more receptor-specific peptides.',
      },
      {
        type: 'list',
        items: [
          'Stimulates collagen and glycosaminoglycan synthesis in fibroblast culture models, supporting extracellular matrix research applications.',
          'Modulates matrix metalloproteinase (MMP) and TIMP expression in a pattern research literature associates with balanced remodeling rather than net degradation.',
          'Shows chemotactic effects on macrophages and mast cells in wound-model research, consistent with a role in early inflammatory-phase repair signaling.',
          'Exhibits antioxidant activity attributed both to its own radical-scavenging capacity and to copper-dependent superoxide dismutase support.',
        ],
      },
      {
        type: 'heading',
        text: 'Wound Healing Models',
      },
      {
        type: 'paragraph',
        text: 'Animal wound-healing research is where GHK-Cu has the longest track record. In rodent excisional and incisional wound models, topical or local GHK-Cu application is repeatedly associated with accelerated healing timelines, increased wound-breaking strength, and improved angiogenesis in the healing bed relative to controls. Proposed contributing mechanisms include the chemotactic recruitment of immune cells noted above, stimulated collagen deposition, and copper-dependent angiogenic signaling via effects on endothelial cell migration.',
      },
      {
        type: 'heading',
        text: 'Hair Follicle and Dermal Research',
      },
      {
        type: 'paragraph',
        text: 'A separate research strand examines GHK-Cu\'s effects on hair follicle biology, based on its capacity to stimulate follicle stem cell proliferation and modulate the anagen (growth) phase of the hair cycle in animal and ex vivo human scalp models. As with the broader dermal literature, effect sizes vary considerably across study designs, delivery methods, and concentrations, and comparative research against established reference compounds remains limited.',
      },
      {
        type: 'callout',
        text: 'GHK-Cu solutions are prone to oxidative degradation distinct from typical peptide bond hydrolysis — free copper ions can catalyze oxidation of the peptide backbone and of other components in a formulation if the complex dissociates. Research protocols generally recommend protecting reconstituted GHK-Cu from light and prolonged room-temperature exposure, and avoiding co-formulation with reducing agents that could destabilize the copper coordination complex.',
      },
    ],
  },
  {
    id: 'tb-500',
    title: 'TB-500: The Thymosin Beta-4 Actin-Binding Fragment in Repair Research',
    date: 'Sep 2026',
    dateISO: '2026-09-02',
    metaDescription: 'TB-500\'s relationship to the naturally occurring protein Thymosin Beta-4, its actin-binding mechanism, and research findings on cell migration and tissue repair.',
    tag: 'Recovery',
    readTime: '7 min',
    excerpt:
      'How a 43-amino-acid synthetic fragment of Thymosin Beta-4 became a widely studied tool compound for actin dynamics, cell migration, and tissue-repair research.',
    image: 'recovery',
    content: [
      {
        type: 'intro',
        text: 'TB-500 is a synthetic peptide corresponding to the biologically active region of Thymosin Beta-4 (Tβ4), a naturally occurring 43-amino-acid protein present in nearly all human and animal cells and found at particularly high concentrations in platelets and wound fluid. Tβ4 itself was first characterized in the thymus (hence the name) but is now understood to be ubiquitously expressed, with its research relevance centered on a single, well-defined biochemical property: high-affinity binding to monomeric (G-actin) actin.',
      },
      {
        type: 'heading',
        text: 'Actin Sequestration: The Core Mechanism',
      },
      {
        type: 'paragraph',
        text: 'Actin exists in cells in a dynamic equilibrium between monomeric G-actin and filamentous F-actin, and this equilibrium underlies essentially all cell motility, shape change, and cytoskeletal remodeling. TB-500 binds G-actin in a 1:1 complex, sequestering a pool of actin monomers and modulating the rate at which they become available for filament assembly. This is not a receptor-mediated signaling mechanism in the conventional sense — TB-500\'s research relevance flows directly from this actin-binding chemistry, which allows it to accelerate or reorganize actin-dependent processes such as cell migration, without engaging a distinct cell-surface receptor pathway of its own.',
      },
      {
        type: 'heading',
        text: 'Cell Migration Research',
      },
      {
        type: 'paragraph',
        text: 'Because directed cell migration depends on coordinated actin polymerization at the leading edge of a moving cell, TB-500\'s actin-binding activity makes it a widely used tool in migration research across several cell types relevant to tissue repair — including keratinocytes, endothelial cells, and various stem and progenitor cell populations. In scratch-wound and Boyden-chamber migration assays, TB-500 exposure is consistently associated with increased migration rates relative to untreated controls, an effect attributed to more efficient lamellipodial actin turnover at the cell periphery.',
      },
      {
        type: 'list',
        items: [
          'Endothelial cell migration studies link TB-500 to increased angiogenic sprouting, positioning it as a research tool for studying vascularization in repair models.',
          'Keratinocyte migration assays report accelerated wound-edge closure in vitro, a frequently cited basis for dermal repair research interest.',
          'Cardiac progenitor cell studies in animal models associate TB-4/TB-500 exposure with increased progenitor cell migration into infarcted tissue, an active area of cardiac-repair research.',
          'TB-500\'s small size (unlike full-length Tβ4 in some contexts) is reported to allow more efficient tissue penetration in systemic administration models, a property researchers cite when comparing it to the parent protein.',
        ],
      },
      {
        type: 'heading',
        text: 'Anti-Inflammatory and Anti-Fibrotic Signaling',
      },
      {
        type: 'paragraph',
        text: 'Beyond direct actin effects, TB-500/Tβ4 research describes downstream modulation of inflammatory and fibrotic signaling — including reported suppression of pro-inflammatory cytokine release and downregulation of transforming growth factor-beta (TGF-β)-driven fibrotic gene programs in some tissue-injury models. This has directed a meaningful share of the literature toward scarring and fibrosis research, on the hypothesis that a compound promoting more organized, migration-driven repair may reduce the disorganized collagen deposition characteristic of fibrotic healing — though this remains a research hypothesis rather than an established clinical finding.',
      },
      {
        type: 'heading',
        text: 'Distinguishing TB-500 from Full-Length Thymosin Beta-4',
      },
      {
        type: 'paragraph',
        text: 'A recurring point of confusion in the research literature and in commercial peptide sourcing is the distinction between full-length Tβ4 (43 amino acids, the naturally occurring protein) and TB-500, a synthetic fragment corresponding to the region of Tβ4 believed to retain the actin-binding activity responsible for most of its studied effects. Researchers comparing findings across studies should note which form was used, as reported potency, stability, and pharmacokinetic properties are not necessarily interchangeable between the two.',
      },
      {
        type: 'callout',
        text: 'TB-500 is generally reported as stable under standard lyophilized peptide storage conditions, with no unusual degradation pathways beyond the typical hydrolysis and oxidation risks common to peptides of its size — standard cold-chain and fresh-reconstitution practices described in general peptide storage research apply without compound-specific modification.',
      },
    ],
  },
  {
    id: 'sermorelin',
    title: 'Sermorelin: GHRH(1-29) Research and the Foundations of GH Secretagogue Study',
    date: 'Sep 2026',
    dateISO: '2026-09-02',
    metaDescription: 'Sermorelin\'s history as the first characterized GHRH fragment, its short half-life, and its continued role as a reference compound in GH-axis research.',
    tag: 'Longevity',
    readTime: '6 min',
    excerpt:
      'A research overview of Sermorelin, the 29-amino-acid GHRH fragment that established the pharmacological basis for the entire class of GH-secretagogue research compounds.',
    image: 'longevity',
    content: [
      {
        type: 'intro',
        text: 'Sermorelin is a synthetic 29-amino-acid peptide corresponding to the N-terminal fragment of endogenous growth hormone-releasing hormone, GHRH(1-29)-NH2. This fragment retains the full biological activity of the native 44-amino-acid hormone — the C-terminal residues beyond position 29 are not required for receptor binding or activation. Sermorelin holds a particular place in the research literature as the first GHRH analog to be extensively characterized, and much of the foundational pharmacology of the GHRH receptor was established using it as the reference ligand.',
      },
      {
        type: 'heading',
        text: 'Mechanism and Receptor Pharmacology',
      },
      {
        type: 'paragraph',
        text: 'Like other GHRH-class compounds, Sermorelin binds the GHRH receptor on pituitary somatotrophs, activating adenylate cyclase and raising intracellular cAMP to stimulate GH synthesis and pulsatile release. Because it acts upstream of GH itself and remains subject to hypothalamic-pituitary feedback via somatostatin, Sermorelin research consistently reports preservation of the natural pulsatile GH secretion pattern — a property considered mechanistically important for downstream IGF-1 signaling, which research suggests responds differently to pulsatile versus continuous GH exposure.',
      },
      {
        type: 'heading',
        text: 'Short Half-Life as a Research Variable',
      },
      {
        type: 'paragraph',
        text: 'Sermorelin\'s defining pharmacokinetic feature is its very short plasma half-life — on the order of 10–20 minutes, driven primarily by rapid degradation via dipeptidyl peptidase-4 (DPP-4) cleavage at the N-terminal Tyr-Ala bond. This is frequently discussed in the literature both as a limitation (requiring more frequent dosing intervals in longitudinal research protocols) and as a research advantage: the short window of receptor engagement produces a single, well-defined GH pulse per administration, making Sermorelin a useful tool for studying acute GH-axis dynamics in isolation, without the sustained receptor occupancy that complicates interpretation of longer-acting GHRH analogs.',
      },
      {
        type: 'list',
        items: [
          'DPP-4-mediated cleavage is the dominant degradation pathway, motivating later-generation GHRH analogs (including Tesamorelin) engineered specifically for DPP-4 resistance.',
          'GH pulse amplitude following Sermorelin administration correlates with baseline somatostatin tone, a variable research protocols typically control for via standardized timing (e.g., fasting, time of day).',
          'Because Sermorelin acts on endogenous somatotroph reserve rather than supplying GH directly, its effects are attenuated in models of pituitary insufficiency — a property researchers use diagnostically to distinguish pituitary from hypothalamic causes of GH deficiency in animal models.',
        ],
      },
      {
        type: 'heading',
        text: 'Diagnostic and Reference-Compound Applications',
      },
      {
        type: 'paragraph',
        text: 'Sermorelin\'s clean, well-characterized single-pulse GH response has made it a standard reference or stimulation-test compound in GH-axis research, used to establish somatotroph functional reserve independent of hypothalamic GHRH output. This diagnostic-style application is distinct from — but closely related to — its use in longer-term research protocols examining cumulative effects of repeated GHRH receptor stimulation on IGF-1 levels, body composition, and sleep architecture, the latter driven by GH\'s established relationship with slow-wave sleep.',
      },
      {
        type: 'heading',
        text: 'Comparative Position Among GHRH Analogs',
      },
      {
        type: 'paragraph',
        text: 'Within the broader class of GHRH-class research compounds, Sermorelin is generally positioned as the shortest-acting reference standard, against which longer-acting, protease-resistant analogs (such as Tesamorelin, or GHRP-class secretagogues acting through a distinct ghrelin-receptor mechanism) are benchmarked. Comparative research designs frequently pair Sermorelin\'s well-characterized acute pulse profile with a longer-acting analog to separate acute receptor-engagement effects from cumulative, multi-dose outcomes.',
      },
      {
        type: 'callout',
        text: 'Sermorelin\'s short half-life in circulation does not describe its stability in solution outside the body — reconstituted Sermorelin is still subject to the same aggregation and hydrolysis risks as other lyophilized peptides and should be handled with standard fresh-reconstitution and cold-storage practice; the two half-life concepts (in vivo clearance versus in vitro solution stability) are frequently and incorrectly conflated in informal discussion.',
      },
    ],
  },
  {
    id: 'ss-31',
    title: 'SS-31 (Elamipretide): Mitochondria-Targeted Peptide Research',
    date: 'Sep 2026',
    dateISO: '2026-09-02',
    metaDescription: 'SS-31\'s cardiolipin-binding mechanism, its selective mitochondrial accumulation, and research findings on oxidative stress and bioenergetic function.',
    tag: 'Longevity',
    readTime: '8 min',
    excerpt:
      'A research overview of SS-31, a Szeto-Schiller peptide engineered to concentrate in the inner mitochondrial membrane and studied for its effects on cardiolipin stability and oxidative stress.',
    image: 'longevity',
    content: [
      {
        type: 'intro',
        text: 'SS-31 (also known by its investigational name elamipretide) is a synthetic aromatic-cationic tetrapeptide developed by Hazel Szeto and Peter Schiller, from whom the "SS" designation derives. It belongs to a small class of peptides engineered not around a receptor-binding pharmacophore but around a specific subcellular targeting property: selective, energy-independent accumulation in the inner mitochondrial membrane, where it is understood to interact directly with the phospholipid cardiolipin.',
      },
      {
        type: 'heading',
        text: 'Mitochondrial Targeting Without a Delivery Vehicle',
      },
      {
        type: 'paragraph',
        text: 'Most mitochondria-targeted research compounds achieve organelle specificity by conjugation to a delivery moiety (commonly a triphenylphosphonium cation) that exploits the mitochondrial membrane potential to drive accumulation — a mechanism that depends on the very membrane potential often compromised in the disease and aging models researchers want to study. SS-31\'s alternating aromatic-cationic residue pattern instead confers intrinsic, membrane-potential-independent affinity for the inner mitochondrial membrane, meaning it continues to concentrate in mitochondria even under conditions of reduced or dissipated membrane potential — a property considered a key methodological advantage for studying dysfunctional mitochondria specifically.',
      },
      {
        type: 'heading',
        text: 'Cardiolipin Binding: The Proposed Core Mechanism',
      },
      {
        type: 'paragraph',
        text: 'SS-31\'s primary proposed molecular target is cardiolipin, a phospholipid found almost exclusively in the inner mitochondrial membrane, where it is essential for the structural organization of the electron transport chain complexes and for maintaining efficient electron flow (a property linked to "supercomplex" assembly of Complexes I, III, and IV). Cardiolipin is highly susceptible to oxidative damage — particularly peroxidation of its polyunsaturated acyl chains — which research associates with electron transport chain dysfunction, increased reactive oxygen species (ROS) generation, and triggering of the mitochondrial permeability transition pore. SS-31 is proposed to bind and stabilize cardiolipin, preventing this oxidative cascade and preserving cristae architecture and supercomplex assembly under oxidative-stress conditions.',
      },
      {
        type: 'list',
        items: [
          'In vitro and animal models of ischemia-reperfusion injury report SS-31 preserving mitochondrial membrane potential and ATP production during the reperfusion oxidative burst.',
          'Cardiac and renal ischemia models show reduced infarct size and preserved organ function associated with SS-31 administration, driving much of the compound\'s clinical-stage research interest.',
          'Neurodegeneration models (including Parkinsonian and Alzheimer\'s-pattern models) report reduced ROS production and improved mitochondrial bioenergetics with SS-31 exposure, an active area of ongoing research.',
          'Skeletal muscle aging research associates SS-31 with improved mitochondrial respiratory capacity in aged animal models, contributing to its positioning within longevity-adjacent research.',
        ],
      },
      {
        type: 'heading',
        text: 'Bioenergetic and ROS Findings',
      },
      {
        type: 'paragraph',
        text: 'Beyond structural cardiolipin stabilization, SS-31 research reports downstream effects on mitochondrial bioenergetics measured via oxygen consumption rate (OCR) assays — including improved coupling efficiency (the ratio of ATP-linked respiration to total oxygen consumption) and reduced proton leak in stressed mitochondrial preparations. Parallel reductions in mitochondrially-generated superoxide and hydrogen peroxide are frequently reported alongside these bioenergetic improvements, consistent with the proposed mechanism of reduced electron leak from a more efficiently organized electron transport chain, though the precise causal sequence between cardiolipin stabilization, ROS reduction, and improved respiration is still being resolved in the literature.',
      },
      {
        type: 'heading',
        text: 'Distinguishing SS-31 from Antioxidant Compounds',
      },
      {
        type: 'paragraph',
        text: 'A common point of confusion in secondary literature is treating SS-31 as a conventional free-radical scavenging antioxidant. While it does exhibit some direct ROS-scavenging capacity in cell-free assays, the research consensus attributes most of its functional effect to the structural cardiolipin-stabilization mechanism described above — a distinction researchers designing comparative studies typically account for by including both a direct antioxidant (e.g., MitoQ or a Trolox analog) and SS-31 as separate arms, since the two are not expected to produce fully overlapping effects despite both being mitochondria-targeted.',
      },
      {
        type: 'callout',
        text: 'SS-31\'s aromatic-cationic structure and small size (4 residues) make it comparatively resistant to the aggregation issues seen in larger peptides, but it remains subject to standard oxidative and hydrolytic degradation in solution. As with other research peptides, reconstituted stock should be aliquoted and stored per general peptide storage principles rather than assumed to be more stable than other compounds simply because of its resistance to membrane-potential-dependent uptake mechanisms — a frequently conflated but unrelated property.',
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