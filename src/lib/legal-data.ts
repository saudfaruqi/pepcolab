// src/lib/legal-data.ts
//
// GEO/SEO FIX (growth-playbook §04 Phase 1, "Legal / compliance cluster"):
// '"Is [compound] legal in the UK / UAE?"... High-intent, zero competition,
// fully RUO-safe. No rival has any of this.'
//
// Deliberately covers a curated set of flagship compounds rather than all
// ~37 SKUs — accuracy matters more than coverage here, and each entry was
// checked against current MHRA/UK-law reporting before being written (see
// chat notes, Aug 2026). Extend this list compound-by-compound as each one
// is verified, not by batch-generating the rest from a template.
//
// SCOPE NOTE: Melanotan II is deliberately NOT included here. Unlike the
// compounds below — which sit in the standard "unlicensed-for-human-use but
// lawful to sell/possess as a research reagent" position — Melanotan II has
// been the subject of specific, sustained MHRA enforcement action (public
// warnings since 2009, dozens of UK vendor websites closed) because the
// "research use only" label is widely treated by MHRA as a fig leaf for
// what's understood to be tanning/cosmetic use. Writing UK legal-status
// content for it would need a compliance/legal sign-off first, not a
// content-team judgement call — flagged separately outside this file.

export type LegalNote = {
  compound: string
  slug: string
  /** One or two sentence, quotable, GEO-friendly direct answer. */
  ukSummary: string
  uaeSummary: string
  /** Longer supporting paragraph, UK-specific. */
  ukDetail: string
  /** Longer supporting paragraph, UAE-specific. */
  uaeDetail: string
  relatedProductSlug?: string
  relatedResearchId?: string
}

export const LEGAL_NOTES: LegalNote[] = [
  {
    compound: 'BPC-157',
    slug: 'bpc-157',
    ukSummary:
      'BPC-157 is not a controlled substance in the UK and is lawful to buy and possess as a research reagent. It has no MHRA marketing authorisation, so selling or supplying it for human use is unlawful under the Human Medicines Regulations 2012.',
    uaeSummary:
      'BPC-157 is not scheduled as a controlled substance in the UAE. It can be lawfully supplied as a research-use-only reagent; it is not licensed by MOHAP/DHA for human administration.',
    ukDetail:
      'BPC-157 does not appear on the Misuse of Drugs Act 1971 schedules or the Psychoactive Substances Act 2016 list, so purchase and possession for genuine research purposes is not a criminal offence. The separate question is medicinal-product status: it has never been granted a UK marketing authorisation, so any sale, marketing, or supply that presents it for human treatment or enhancement falls under Regulation 46 of the Human Medicines Regulations 2012 and is an offence. A supplier selling it strictly as a laboratory reagent, with no dosing or health-outcome claims, is operating within the standard RUO framing that UK research-chemical law recognises.',
    uaeDetail:
      'The UAE does not list BPC-157 under its controlled-substance schedules. As with all research-use compounds in the Emirates, the distinction that matters is channel: DHA/MOHAP-licensed clinical supply versus the research-reagent channel that PepcoLab and comparable suppliers operate in, which carries no human-use authorisation. Buyers should expect UAE customs to inspect health-adjacent shipments, and sourcing from UAE-held stock rather than overseas drop-shipping reduces that friction considerably.',
    relatedProductSlug: 'bpc-157',
    relatedResearchId: 'bpc-157',
  },
  {
    compound: 'TB-500',
    slug: 'tb-500',
    ukSummary:
      'TB-500 (thymosin beta-4 fragment) is not a controlled substance in the UK. It has no MHRA marketing authorisation, so it can only be lawfully sold and supplied as a research reagent, not for human use.',
    uaeSummary:
      'TB-500 is not scheduled as a controlled substance in the UAE and can be lawfully supplied as a research-use-only compound; it holds no MOHAP/DHA authorisation for clinical use.',
    ukDetail:
      'Like BPC-157, TB-500 sits outside the Misuse of Drugs Act and Psychoactive Substances Act schedules, so possessing it for genuine research is not itself a criminal matter. It has never held a UK marketing authorisation, so any supply framed around human injection, dosing, or recovery outcomes would breach the Human Medicines Regulations 2012 — which is why compliant UK suppliers restrict listings to identity, purity, and handling information rather than use guidance.',
    uaeDetail:
      'TB-500 is not on the UAE controlled-substance list. It reaches the market only through the research-reagent channel unless dispensed under DHA/MOHAP clinical supervision using pharmaceutical-grade stock, which is a separate and much narrower route than online research-peptide suppliers operate through.',
  },
  {
    compound: 'CJC-1295',
    slug: 'cjc-1295',
    ukSummary:
      'CJC-1295 is not a UK controlled substance, but it is prohibited under the WADA Prohibited List (relevant to UK Anti-Doping) and has no MHRA marketing authorisation — lawful to buy as a research reagent, not lawful to sell or use as a human growth-hormone-releasing product.',
    uaeSummary:
      'CJC-1295 is not scheduled as a controlled substance in the UAE and is available through the research-reagent channel only; it has no MOHAP/DHA clinical authorisation.',
    ukDetail:
      'CJC-1295 is a growth-hormone-releasing hormone analogue. It does not appear on the Misuse of Drugs Act schedules, so research purchase and possession is lawful, but it is on the World Anti-Doping Agency Prohibited List, which matters specifically for anyone subject to UK Anti-Doping testing (competitive athletes). It has no UK marketing authorisation, so supply framed around human use — rather than laboratory research — is unlawful under the Human Medicines Regulations 2012.',
    uaeDetail:
      'CJC-1295 is not a scheduled controlled substance in the UAE. As with the other compounds here, it is supplied research-use-only, with human administration falling outside what a research-reagent supplier is authorised to sell for.',
  },
  {
    compound: 'Ipamorelin',
    slug: 'ipamorelin',
    ukSummary:
      'Ipamorelin is not a UK controlled substance but is prohibited under the WADA Prohibited List, and has no MHRA marketing authorisation — lawful as a research reagent, not lawful to market for human growth-hormone use.',
    uaeSummary:
      'Ipamorelin is not scheduled as a controlled substance in the UAE and is available only through the research-reagent channel, with no MOHAP/DHA clinical authorisation.',
    ukDetail:
      'Ipamorelin, a selective growth-hormone secretagogue, sits outside the Misuse of Drugs Act schedules but is on the WADA Prohibited List, relevant to anyone tested under UK Anti-Doping rules. It has never received a UK marketing authorisation, so the same Human Medicines Regulations 2012 restriction on human-use marketing applies as with CJC-1295.',
    uaeDetail:
      'Ipamorelin is not scheduled in the UAE. It is supplied research-use-only; clinical growth-hormone treatment in the UAE runs through DHA/MOHAP-licensed prescribers using authorised pharmaceutical products, a separate route entirely.',
  },
  {
    compound: 'GLP-1 Research Peptides (Semaglutide / Tirzepatide / Retatrutide class)',
    slug: 'glp',
    ukSummary:
      'GLP-1-class research peptides sold outside a licensed pharmacy are not MHRA-approved medicines. Licensed versions (Wegovy, Mounjaro) are prescription-only; unlicensed research-labelled vials are lawful to sell only as laboratory reagents, never for self-administration.',
    uaeSummary:
      'GLP-1-class compounds are supplied in the UAE research-reagent channel without MOHAP/DHA clinical authorisation; licensed weight-management treatment runs through registered UAE clinics separately.',
    ukDetail:
      'This is the compound class the MHRA has warned about most publicly and enforced against most actively, precisely because demand for weight-management peptides is so high. The MHRA-approved, NICE-recommended route for GLP-1 treatment is a licensed prescription medicine (semaglutide as Wegovy, tirzepatide as Mounjaro) dispensed by a registered pharmacy. A research-labelled vial of the same or a related compound (including investigational, not-yet-approved molecules such as retatrutide) sold by a research supplier carries no such authorisation, and the Human Medicines Regulations 2012 make it a criminal offence to sell or supply it for human use. PepcoLab lists this class strictly as a research reagent — no dosing, injection, or weight-loss claims — and buyers should treat "research use only" as exactly that, not as a workaround for obtaining a prescription medicine.',
    uaeDetail:
      'GLP-1-class compounds reach UAE buyers through the same two channels as everywhere else: DHA/MOHAP-licensed clinical prescribing for approved weight-management treatment, or the research-reagent channel with no human-use authorisation. Given how closely this class is associated with self-administration, buyers should be especially deliberate about which channel they are actually using.',
    relatedResearchId: 'glp1',
  },
  {
    compound: 'GHK-Cu',
    slug: 'ghk-cu',
    ukSummary:
      'GHK-Cu (copper peptide) is not a controlled substance in the UK and is lawful to buy as a research reagent; it has no MHRA marketing authorisation for topical, cosmetic, or medicinal human use.',
    uaeSummary:
      'GHK-Cu is not scheduled as a controlled substance in the UAE and is supplied research-use-only, separate from any DHA/MOHAP-licensed cosmetic or clinical product containing copper peptides.',
    ukDetail:
      'GHK-Cu is widely present in licensed cosmetic formulations at controlled concentrations, which sometimes causes confusion about the raw research compound\'s status. Sold as a research reagent — unformulated, no carrier, no cosmetic claims — it sits outside medicines regulation the same way the other compounds on this page do: lawful to purchase for research, not lawful for a supplier to market for skin, hair, or wound-healing outcomes without the relevant cosmetic-product or medicines authorisation.',
    uaeDetail:
      'GHK-Cu is not scheduled in the UAE. As a raw research reagent it is distinct from finished cosmetic products containing copper peptides, which are regulated separately under UAE cosmetics rules.',
  },
  {
    compound: 'Epithalon',
    slug: 'epithalon',
    ukSummary:
      'Epithalon (epitalon) is not a controlled substance in the UK and is lawful to buy as a research reagent; it holds no MHRA marketing authorisation for human use.',
    uaeSummary:
      'Epithalon is not scheduled as a controlled substance in the UAE and is supplied research-use-only, with no MOHAP/DHA clinical authorisation.',
    ukDetail:
      'Epithalon does not appear on UK controlled-substance schedules, so research purchase and possession is lawful. It has no marketing authorisation as a medicine, so — as with every compound on this page — a supplier must restrict listings to identity, purity, and handling, not longevity or anti-ageing outcome claims, to stay within the Human Medicines Regulations 2012.',
    uaeDetail:
      'Epithalon is not scheduled in the UAE and is available through the research-reagent channel on the same basis as the rest of this list.',
    relatedResearchId: 'epithalon',
  },
  {
    compound: 'Semax',
    slug: 'semax',
    ukSummary:
      'Semax is not a controlled substance in the UK and is lawful to buy as a research reagent. It is an approved prescription medicine in Russia but holds no MHRA marketing authorisation in the UK.',
    uaeSummary:
      'Semax is not scheduled as a controlled substance in the UAE and is supplied research-use-only; it has no MOHAP/DHA authorisation.',
    ukDetail:
      'Semax is licensed as a prescription nasal-spray medicine in Russia, which is sometimes cited (inaccurately) as evidence it is "approved." That approval does not extend to the UK. It is not on UK controlled-substance schedules, so research purchase and possession is lawful, but without a UK or EU marketing authorisation, it can only be supplied here as a laboratory research reagent.',
    uaeDetail:
      'Semax is not scheduled in the UAE and reaches buyers only through the research-reagent channel, on the same terms as the other compounds on this page.',
    relatedResearchId: 'semax',
  },
  {
    compound: 'Selank',
    slug: 'selank',
    ukSummary:
      'Selank is not a controlled substance in the UK and is lawful to buy as a research reagent. It is an approved prescription medicine in Russia but holds no MHRA marketing authorisation in the UK.',
    uaeSummary:
      'Selank is not scheduled as a controlled substance in the UAE and is supplied research-use-only, with no MOHAP/DHA authorisation.',
    ukDetail:
      'Selank shares Semax\'s regulatory position: licensed as a prescription medicine in Russia, unlicensed in the UK. It is not on UK controlled-substance schedules, so it is lawful to purchase and possess for research, but it can only be lawfully sold here as a research reagent, not marketed for anxiolytic or cognitive human-use claims.',
    uaeDetail:
      'Selank is not scheduled in the UAE and is available strictly through the research-reagent channel.',
  },
  {
    compound: 'Thymosin Alpha-1',
    slug: 'thymosin-alpha',
    ukSummary:
      'Thymosin Alpha-1 is not a controlled substance in the UK. It holds regulatory approval in some other countries under the brand Zadaxin but has no MHRA marketing authorisation, so UK supply is lawful only as a research reagent.',
    uaeSummary:
      'Thymosin Alpha-1 is not scheduled as a controlled substance in the UAE. Zadaxin holds registration in some markets, but any UAE supply outside DHA/MOHAP-licensed clinical channels is research-use-only.',
    ukDetail:
      'Thymosin Alpha-1 is marketed as an approved immune-modulating medicine (Zadaxin) in a number of countries, though not currently in the UK or the wider EU/UK regulatory framework. It is not on UK controlled-substance schedules, so research purchase is lawful, but without a UK marketing authorisation it can only be sold and supplied here as a laboratory reagent, not for immune-support or clinical claims.',
    uaeDetail:
      'Thymosin Alpha-1 is not scheduled in the UAE. Zadaxin has registration status in some regional markets under clinical prescribing, which is a separate channel from the research-reagent supply this page describes.',
  },
]

export function getLegalNoteBySlug(slug: string) {
  return LEGAL_NOTES.find((n) => n.slug === slug)
}
