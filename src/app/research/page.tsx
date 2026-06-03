'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  Brain,
  Activity,
  ShieldCheck,
  Microscope,
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  ChevronRight,
  X,
} from 'lucide-react'
import Navbar from '@/components/Nav'

/* ─────────────────────────────────────────
   FULL ARTICLE DATA
───────────────────────────────────────── */

type ArticleContentBlock =
  | { type: 'intro' | 'heading' | 'paragraph' | 'callout'; text: string; items?: never }
  | { type: 'list'; items: string[]; text?: never }

type Article = {
  id: string
  title: string
  date: string
  tag: string
  readTime: string
  excerpt: string
  image: string
  content: ArticleContentBlock[]
}

const ARTICLES: Article[] = [
  {
    id: 'bpc-157',
    title: 'BPC-157: Mechanisms of Action and Research Applications',
    date: 'May 2025',
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
        text: 'The recognition that GIP (glucose-dependent insulinotropic polypeptide) receptor and glucagon receptor agonism can be synergistic with GLP-1R activation has driven intense research into dual (GLP-1/GIP or GLP-1/glucagon) and triple (GLP-1/GIP/glucagon) agonists. Tirzepatide, the first approved dual agonist, demonstrates superior weight loss versus GLP-1-only agonists, driven in part by GIP\'s additive effect on adipose tissue lipolysis and its independent contribution to satiety. Research peptides that explore this space include various chimeric sequences designed to probe the relative receptor contributions.',
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
]

const categories = [
  { title: 'Recovery', icon: Activity, count: 18, color: '#22c55e' },
  { title: 'Metabolic', icon: FlaskConical, count: 24, color: '#f97316' },
  { title: 'Cognitive', icon: Brain, count: 12, color: '#8b5cf6' },
  { title: 'Longevity', icon: ShieldCheck, count: 15, color: '#3b82f6' },
]

const tagColors = {
  Recovery: { bg: '#dcfce7', text: '#16a34a' },
  Metabolic: { bg: '#ffedd5', text: '#c2410c' },
  Cognitive: { bg: '#ede9fe', text: '#7c3aed' },
  Longevity: { bg: '#dbeafe', text: '#1d4ed8' },
  Guide: { bg: '#f1f5f9', text: '#475569' },
}

/* ─────────────────────────────────────────
   ARTICLE DETAIL VIEW
───────────────────────────────────────── */
function ArticleDetail({ article, onBack }: { article: Article; onBack: () => void }) {
  const tc = tagColors[article.tag as keyof typeof tagColors] || tagColors.Guide

  return (
    
    <div style={{ background: '#fafaf8', minHeight: '100vh' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(250,250,248,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(13,13,13,.07)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(13,13,13,.12)',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#0d0d0d',
          }}
        >
          <ArrowLeft size={14} />
          Back to Research Hub
        </button>
        <span style={{ fontSize: 13, color: 'rgba(13,13,13,.4)' }}>
          <ChevronRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
          {' '}{article.tag}
        </span>
      </div>

      {/* Article header */}
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '56px 24px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              background: tc.bg,
              color: tc.text,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            {article.tag}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: 'rgba(13,13,13,.45)',
            }}
          >
            <Calendar size={12} />
            {article.date}
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              color: 'rgba(13,13,13,.45)',
            }}
          >
            <Clock size={12} />
            {article.readTime} read
          </span>
        </div>

        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(30px, 5vw, 52px)',
            lineHeight: 1.1,
            letterSpacing: '-.04em',
            marginBottom: 24,
            color: '#0d0d0d',
          }}
        >
          {article.title}
        </h1>

        <p
          style={{
            fontSize: 19,
            lineHeight: 1.75,
            color: 'rgba(13,13,13,.6)',
            marginBottom: 40,
            borderLeft: '3px solid #2563EB',
            paddingLeft: 20,
            fontStyle: 'italic',
          }}
        >
          {article.excerpt}
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(13,13,13,.08)', marginBottom: 40 }} />
      </div>

      {/* Article body */}
      <div
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '0 24px 80px',
        }}
      >
        {article.content.map((block: ArticleContentBlock, i: number) => {
          if (block.type === 'intro') {
            return (
              <p
                key={i}
                style={{
                  fontSize: 18,
                  lineHeight: 1.85,
                  color: '#1a1a1a',
                  marginBottom: 36,
                  fontWeight: 400,
                }}
              >
                {block.text}
              </p>
            )
          }
          if (block.type === 'heading') {
            return (
              <h2
                key={i}
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 26,
                  letterSpacing: '-.03em',
                  color: '#0d0d0d',
                  marginTop: 48,
                  marginBottom: 16,
                  lineHeight: 1.2,
                }}
              >
                {block.text}
              </h2>
            )
          }
          if (block.type === 'paragraph') {
            return (
              <p
                key={i}
                style={{
                  fontSize: 16,
                  lineHeight: 1.85,
                  color: 'rgba(13,13,13,.75)',
                  marginBottom: 24,
                }}
              >
                {block.text}
              </p>
            )
          }
          if (block.type === 'list') {
            return (
              <ul
                key={i}
                style={{
                  marginBottom: 28,
                  paddingLeft: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {block.items!.map((item: string, j: number) => (
                  <li
                    key={j}
                    style={{
                      display: 'flex',
                      gap: 14,
                      fontSize: 15.5,
                      lineHeight: 1.75,
                      color: 'rgba(13,13,13,.75)',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#2563EB',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 3,
                      }}
                    >
                      {j + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            )
          }
          if (block.type === 'callout') {
            return (
              <div
                key={i}
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderLeft: '4px solid #2563EB',
                  borderRadius: 12,
                  padding: '20px 22px',
                  margin: '32px 0',
                  fontSize: 14.5,
                  lineHeight: 1.75,
                  color: '#1e3a8a',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2563EB' }}>
                  Research Note
                </strong>
                {block.text}
              </div>
            )
          }
          return null
        })}

        {/* Footer nav */}
        <div
          style={{
            marginTop: 60,
            paddingTop: 32,
            borderTop: '1px solid rgba(13,13,13,.08)',
          }}
        >
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 999,
              border: 'none',
              background: '#0d0d0d',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={15} />
            Back to Research Hub
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   MAIN RESEARCH HUB PAGE
───────────────────────────────────────── */
export default function ResearchPage() {
  const [activeArticle, setActiveArticle] = useState<Article | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')

  if (activeArticle) {
    return <ArticleDetail article={activeArticle} onBack={() => setActiveArticle(null)} />
  }

  const allTags = ['All', ...categories.map(c => c.title), 'Guide']
  const filtered =
    activeCategory === 'All'
      ? ARTICLES
      : ARTICLES.filter(a => a.tag === activeCategory)

  const featured = ARTICLES.find(a => a.id === 'glp1') ?? ARTICLES[0]

  return (


    <main style={{ background: '#f7f7f5', minHeight: '100vh' }}>

      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          borderBottom: '1px solid rgba(13,13,13,.08)',
          background: 'linear-gradient(160deg,#fff 0%,#f0f4ff 60%,#f7f7f5 100%)',
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 20px 64px' }}>
          <div style={{ maxWidth: 740 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                marginBottom: 22,
                color: '#2563EB',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
              }}
            >
              <Microscope size={14} />
              Knowledge Base
            </div>

            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(48px,7vw,84px)',
                lineHeight: 0.92,
                letterSpacing: '-.05em',
                margin: '0 0 22px',
                color: '#0d0d0d',
              }}
            >
              Research
              <br />
              Hub
            </h1>

            <p
              style={{
                fontSize: 17,
                lineHeight: 1.8,
                color: 'rgba(13,13,13,.55)',
                maxWidth: 600,
                marginBottom: 40,
              }}
            >
              In-depth research articles, peptide protocols, laboratory methodologies,
              and scientific resources curated for serious researchers.
            </p>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
              maxWidth: 900,
            }}
          >
            {[
              ['6', 'Research Articles'],
              ['2', 'Protocols & Guides'],
              ['5', 'Research Areas'],
              ['Open', 'Access Library'],
            ].map(([value, label]) => (
              <div
                key={label}
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  padding: '22px 24px',
                  border: '1px solid rgba(13,13,13,.07)',
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.05em', marginBottom: 5 }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(13,13,13,.5)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED ARTICLE ── */}
      <section>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 20px' }}>
          <button
            onClick={() => setActiveArticle(featured)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#0d0d0d',
              borderRadius: 28,
              padding: '52px 40px',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 24,
              alignItems: 'end',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                  opacity: 0.45,
                  marginBottom: 16,
                }}
              >
                Featured Publication
              </div>
              <h2
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 'clamp(28px,5vw,52px)',
                  lineHeight: 1.05,
                  letterSpacing: '-.04em',
                  marginBottom: 18,
                  maxWidth: 680,
                }}
              >
                {featured.title}
              </h2>
              <p
                style={{
                  maxWidth: 600,
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: 'rgba(255,255,255,.6)',
                  marginBottom: 32,
                }}
              >
                {featured.excerpt}
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  borderRadius: 999,
                  background: '#fff',
                  color: '#0d0d0d',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Read Full Article
                <ArrowRight size={15} />
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 16,
                padding: '16px 20px',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.45, marginBottom: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>Stats</div>
              {[['Tag', featured.tag], ['Read', featured.readTime], ['Date', featured.date]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13, marginBottom: 6, color: 'rgba(255,255,255,.7)' }}>
                  <span style={{ opacity: 0.5 }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </button>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px 52px' }}>
          <h2
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 32,
              marginBottom: 22,
              letterSpacing: '-.04em',
              color: '#0d0d0d',
            }}
          >
            Research Categories
          </h2>
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            }}
          >
            {categories.map(cat => (
              <button
                key={cat.title}
                onClick={() => setActiveCategory(activeCategory === cat.title ? 'All' : cat.title)}
                style={{
                  background: activeCategory === cat.title ? cat.color : '#fff',
                  borderRadius: 20,
                  padding: '22px 22px',
                  border: `1px solid ${activeCategory === cat.title ? cat.color : 'rgba(13,13,13,.08)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <cat.icon
                  size={22}
                  style={{
                    marginBottom: 16,
                    color: activeCategory === cat.title ? '#fff' : cat.color,
                  }}
                />
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: activeCategory === cat.title ? '#fff' : '#0d0d0d',
                  }}
                >
                  {cat.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: activeCategory === cat.title ? 'rgba(255,255,255,.7)' : 'rgba(13,13,13,.5)',
                  }}
                >
                  {cat.count} publications
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <section>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px 28px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(13,13,13,.45)', marginRight: 4 }}>
              <Tag size={12} style={{ display: 'inline', marginRight: 4 }} />
              Filter:
            </span>
            {allTags.map(tag => {
              const tc = tagColors[tag as keyof typeof tagColors]
              const active = activeCategory === tag
              return (
                <button
                  key={tag}
                  onClick={() => setActiveCategory(tag)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: `1px solid ${active ? 'transparent' : 'rgba(13,13,13,.12)'}`,
                    background: active ? (tc ? tc.bg : '#e0e7ff') : '#fff',
                    color: active ? (tc ? tc.text : '#2563EB') : 'rgba(13,13,13,.6)',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {tag}
                </button>
              )
            })}
            {activeCategory !== 'All' && (
              <button
                onClick={() => setActiveCategory('All')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(220,38,38,.25)',
                  background: '#fff5f5',
                  color: '#dc2626',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <X size={10} />
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── ARTICLE GRID ── */}
      <section>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 32,
                letterSpacing: '-.04em',
                color: '#0d0d0d',
                margin: 0,
              }}
            >
              {activeCategory === 'All' ? 'All Research' : activeCategory}
            </h2>
            <span style={{ fontSize: 13, color: 'rgba(13,13,13,.4)', fontWeight: 500 }}>
              {filtered.length} article{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: '#fff',
                borderRadius: 24,
                border: '1px solid rgba(13,13,13,.07)',
                color: 'rgba(13,13,13,.45)',
              }}
            >
              No articles in this category yet.
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gap: 18,
              gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
            }}
          >
            {filtered.map(article => {
              const tc = tagColors[article.tag as keyof typeof tagColors] || tagColors.Guide
              return (
                <article
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  style={{
                    background: '#fff',
                    borderRadius: 22,
                    padding: 24,
                    border: '1px solid rgba(13,13,13,.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 240,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <span
                      style={{
                        background: tc.bg,
                        color: tc.text,
                        padding: '4px 11px',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {article.tag}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: 'rgba(13,13,13,.38)',
                      }}
                    >
                      <Clock size={11} />
                      {article.readTime}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 18,
                      lineHeight: 1.38,
                      marginBottom: 14,
                      color: '#0d0d0d',
                      fontWeight: 700,
                      letterSpacing: '-.02em',
                    }}
                  >
                    {article.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.65,
                      color: 'rgba(13,13,13,.55)',
                      flex: 1,
                      marginBottom: 20,
                    }}
                  >
                    {article.excerpt}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(13,13,13,.06)',
                      paddingTop: 16,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        color: 'rgba(13,13,13,.4)',
                      }}
                    >
                      <Calendar size={11} />
                      {article.date}
                    </span>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#2563EB',
                      }}
                    >
                      Read article
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── RESOURCES BANNER ── */}
      <section>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px 80px' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 28,
              padding: '36px 36px',
              border: '1px solid rgba(13,13,13,.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={22} color="#2563EB" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#0d0d0d' }}>
                  Scientific Resources
                </div>
                <div style={{ fontSize: 14, color: 'rgba(13,13,13,.55)', maxWidth: 480 }}>
                  Storage protocols, reconstitution guides, handling standards, and peer-reviewed literature references.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
  const guide = ARTICLES.find(a => a.id === 'peptide-storage')
  if (guide) setActiveArticle(guide)
}}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 22px',
                borderRadius: 999,
                border: '1px solid rgba(13,13,13,.12)',
                background: '#0d0d0d',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}
            >
              Browse Guides
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}