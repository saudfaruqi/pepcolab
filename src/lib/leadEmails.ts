// src/lib/leadEmails.ts
//
// Emails for /learn leads: the guide delivery (sent at once) and the
// follow-up series (cron: lead-nurture). Same branded shell as every other
// customer email (lib/orderEmails.ts).
//
// SEQUENCE (Meta Ads Strategy, 12 Oct 2026, section 6)
//   step 0  day 0   Your guide                         (everyone who asks)
//   step 1  day 2   The one line that decides everything  ┐
//   step 2  day 5   Three questions to ask any supplier   │ only if the lead
//   step 3  day 9   One batch, one certificate            │ ticked the opt-in
//   step 4  day 14  What changed in UK & UAE regulation   ┘
//
// COPY RULES: supply side only — testing, documentation, storage, regulation.
// Never what a compound does, never dosing or administration, no compound
// promotion, and no certificate-page links in email (Mohammed, Oct 2026).
import { sendMail } from '@/lib/mailer'
import {
  emailShell,
  preheader,
  statusPill,
  primaryButton,
  INK,
  INK_60,
  INK_40,
  GOLD_TEXT,
  GOLD_TINT,
  BORDER,
} from '@/lib/orderEmails'
import { unsubscribeLinks } from '@/lib/marketing/render'
import { LEARN_GUIDES, getLearnGuide, type LearnGuide } from '@/lib/learnGuides'
import type { LeadRecord } from '@/lib/leadStore'

const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com').replace(/\/$/, '')
const SUPPORT_EMAIL = process.env.SMTP_FROM || 'hello@pepcolab.com'

/** Days after sign-up for each step. Index = step number. */
export const NURTURE_OFFSETS_DAYS = [0, 2, 5, 9, 14]

function esc(v: string): string {
  return (v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function utm(path: string, content: string): string {
  const u = new URL(path.startsWith('http') ? path : `${SITE_URL}${path}`)
  if (u.hostname.replace(/^www\./, '') === new URL(SITE_URL).hostname.replace(/^www\./, '')) {
    u.searchParams.set('utm_source', 'email')
    u.searchParams.set('utm_medium', 'lead-series')
    u.searchParams.set('utm_content', content)
  }
  return u.toString()
}

const h1 = (t: string) =>
  `<h1 style="margin:0 0 16px; font-size:28px; line-height:1.18; font-weight:700; letter-spacing:-.025em; color:${INK};">${t}</h1>`
const p = (t: string, mb = 18) => `<p style="margin:0 0 ${mb}px; font-size:15px; line-height:1.7; color:${INK_60};">${t}</p>`
const list = (items: string[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">${items
    .map(
      (i) => `<tr><td width="22" valign="top" style="padding:0 0 12px; font-size:14px; line-height:1.65; color:${GOLD_TEXT};">&mdash;</td>
      <td valign="top" style="padding:0 0 12px; font-size:14.5px; line-height:1.65; color:${INK_60};">${i}</td></tr>`
    )
    .join('')}</table>`
const quote = (t: string) =>
  `<div style="margin:0 0 20px; padding:16px 18px; border:1px solid ${BORDER}; border-radius:14px; font-size:14px; line-height:1.7; color:${INK}; white-space:pre-line;">${t}</div>`

const COMPANY_LINE = 'PepcoLab is a trading name of SEE BEE DEE LIMITED (17072052).'

function footer(email: string, reason: string): string {
  const links = unsubscribeLinks(email)
  return `<div style="margin-top:24px; padding-top:18px; border-top:1px solid ${BORDER}; font-size:11.5px; line-height:1.7; color:${INK_40}; text-align:center;">
    Questions? Just reply, or write to <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:${INK_40};">${esc(SUPPORT_EMAIL)}</a>.<br />
    ${COMPANY_LINE} ${reason} <a href="${esc(links.page)}" style="color:${INK_40};">Unsubscribe</a>.
  </div>`
}

function hi(lead: Pick<LeadRecord, 'firstName'>): string {
  return lead.firstName ? `Hi ${esc(lead.firstName)},` : 'Hi,'
}

async function send(lead: LeadRecord, subject: string, pre: string, body: string, text: string, reason: string, stream: 'transactional' | 'marketing' = 'transactional') {
  const links = unsubscribeLinks(lead.email)
  await sendMail({
    stream,
    to: lead.email,
    subject,
    html: emailShell(`${preheader(esc(pre))}${body}${footer(lead.email, reason)}`),
    text: `${text}\n\nFor laboratory and research purposes only. Not for human or veterinary use.\n${COMPANY_LINE} ${reason}\nUnsubscribe: ${links.page}`,
    headers: {
      'List-Unsubscribe': `<${links.oneClick}>, <mailto:${SUPPORT_EMAIL}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })
}

// ── Step 0: the guide ─────────────────────────────────────────────────────
export async function sendGuideEmail(lead: LeadRecord, guide: LearnGuide): Promise<void> {
  const pdf = `${SITE_URL}${guide.pdfPath}`
  const others = LEARN_GUIDES.filter((g) => g.slug !== guide.slug)
  const body = `
    <div style="margin-bottom:20px;">${statusPill('Your free guide', GOLD_TEXT, GOLD_TINT)}</div>
    ${h1(esc(guide.title))}
    ${p(`${hi(lead)} here is ${esc(guide.shortName)} you asked for — ${guide.pages} pages, written to be read in one sitting.`)}
    ${primaryButton('Open the guide (PDF)', esc(pdf), 22)}
    ${p('Two more free guides from the same series, if they are useful:', 10)}
    ${list(others.map((g) => `<a href="${esc(utm(`/learn/${g.slug}`, `guide-${g.slug}`))}" style="color:${INK}; font-weight:600;">${esc(g.title)}</a>`))}
  `
  const text = [
    `${lead.firstName ? `Hi ${lead.firstName},` : 'Hi,'} here is ${guide.shortName} you asked for.`,
    '',
    `Open the guide (PDF): ${pdf}`,
    '',
    'More free guides:',
    ...others.map((g) => `- ${g.title}: ${utm(`/learn/${g.slug}`, `guide-${g.slug}`)}`),
  ].join('\n')
  await send(lead, `Your guide: ${guide.title}`, `${guide.pages} pages, readable in one sitting.`, body, text, 'You requested this guide from PepcoLab.')
}

// ── Steps 1–4: the series ─────────────────────────────────────────────────
interface SeriesEmail {
  subject: string
  pre: string
  html: (lead: LeadRecord) => string
  text: (lead: LeadRecord) => string
}

const SERIES: Record<number, SeriesEmail> = {
  1: {
    subject: 'The one line on a certificate that decides everything',
    pre: 'Purity tells you how clean a sample is. It does not tell you what it is.',
    html: (lead) => `
      ${h1('The one line that decides everything')}
      ${p(`${hi(lead)} most people read a certificate of analysis from the top: the big purity number, usually 98 or 99%. It is the least important line on the page.`)}
      ${p('Purity by HPLC measures how much of the sample came off the column as one peak. It says nothing about <strong style="color:#0D0D0D;">which molecule</strong> that peak is. A vial of the wrong compound can be 99% pure.')}
      ${p('The line that decides everything is <strong style="color:#0D0D0D;">identity</strong> — usually confirmed by mass spectrometry, which weighs the molecule and compares it with the mass it should have. No identity result, and the purity figure answers a question nobody asked.')}
      ${list([
        'Look for an identity method (MS, LC-MS or MALDI) and an observed mass next to the expected one.',
        'Check the lot number on the certificate matches the lot on the label.',
        'Note who ran the test: the manufacturer, or an independent laboratory.',
      ])}
      ${primaryButton('Read the full certificate guide', esc(utm('/learn/coa-guide', 'series-1')), 0)}
    `,
    text: (lead) =>
      `${lead.firstName ? `Hi ${lead.firstName},` : 'Hi,'} most people read a certificate from the top: the big purity number. It is the least important line on the page.\n\nPurity by HPLC says how clean a sample is, not which molecule it is. The line that decides everything is identity, usually by mass spectrometry.\n\n- Look for an identity method (MS, LC-MS, MALDI) and an observed mass next to the expected one.\n- Check the lot number on the certificate matches the label.\n- Note who ran the test: the manufacturer or an independent lab.\n\nThe full certificate guide: ${utm('/learn/coa-guide', 'series-1')}`,
  },
  2: {
    subject: 'Three questions to ask any supplier',
    pre: 'A message you can copy, paste and send to any of them.',
    html: (lead) => `
      ${h1('Three questions to ask any supplier')}
      ${p(`${hi(lead)} you do not need a laboratory to judge a supplier. You need three answers, and the speed and clarity of the reply tells you almost as much as the answers themselves.`)}
      ${p('Copy this and send it to anyone you are considering:', 10)}
      ${quote(`Hello — before I order, could you tell me:
1. Is the certificate for the exact lot you will send me, and which laboratory issued it?
2. Does it include an identity result (mass spectrometry), not just HPLC purity?
3. How is the order packed and kept cold in transit?
Thank you.`)}
      ${p('A good supplier answers all three within a day, names the laboratory, and can show you the certificate for your batch before you pay. Vague answers, a generic “sample” certificate, or no lot numbers at all are the warning signs.')}
      ${p('The full five-point checklist goes further — it is free if you have not had it yet.', 10)}
      ${primaryButton('Get the supplier checklist', esc(utm('/learn/vendor-checklist', 'series-2')), 0)}
    `,
    text: (lead) =>
      `${lead.firstName ? `Hi ${lead.firstName},` : 'Hi,'} you do not need a laboratory to judge a supplier. Send this to anyone you are considering:\n\nHello — before I order, could you tell me:\n1. Is the certificate for the exact lot you will send me, and which laboratory issued it?\n2. Does it include an identity result (mass spectrometry), not just HPLC purity?\n3. How is the order packed and kept cold in transit?\n\nGood suppliers answer all three within a day and name the laboratory.\n\nThe full checklist: ${utm('/learn/vendor-checklist', 'series-2')}`,
  },
  3: {
    subject: 'One batch, one certificate',
    pre: 'Why a certificate only means something when it matches the lot in your hand.',
    html: (lead) => `
      ${h1('One batch, one certificate')}
      ${p(`${hi(lead)} a certificate is a test report on one production batch. That sounds obvious, but it is where most of the confusion in this market comes from.`)}
      ${p('A “representative” certificate — one document shown for every batch a seller ever ships — tells you about a sample someone once tested. It tells you nothing about the vial you receive.')}
      ${p('This is why every lot PepcoLab sells is tested by an independent laboratory and published by its lot number, so the certificate and the label can be checked against each other. It is the standard we think every supplier should be held to — including us.')}
      ${list([
        'The lot number on the label should appear on the certificate.',
        'The test date should be recent and after the batch was made.',
        'The laboratory should be named, and should not be the seller.',
      ])}
      ${primaryButton('About PepcoLab', esc(utm('/about', 'series-3')), 0)}
    `,
    text: (lead) =>
      `${lead.firstName ? `Hi ${lead.firstName},` : 'Hi,'} a certificate is a test report on one batch. A "representative" certificate shown for every batch tells you nothing about the vial you receive.\n\nEvery lot PepcoLab sells is tested by an independent laboratory and published by its lot number.\n\n- The lot number on the label should appear on the certificate.\n- The test date should be recent.\n- The laboratory should be named, and should not be the seller.\n\nAbout PepcoLab: ${utm('/about', 'series-3')}`,
  },
  4: {
    subject: 'What changed in UK and UAE peptide regulation this summer',
    pre: 'A short, factual round-up — and what it means for anyone buying laboratory material.',
    html: (lead) => `
      ${h1('What changed this summer')}
      ${p(`${hi(lead)} 2026 was the year regulators on both sides of our market started acting on online peptide sales, not just warning about them. In short:`)}
      ${list([
        '<strong style="color:#0D0D0D;">UAE.</strong> In July the Emirates Drug Establishment took action against dozens of online sources of unapproved peptide products and referred social-media promoters to the National Media Office. Abu Dhabi’s Department of Health now requires prior approval for peptide marketing.',
        '<strong style="color:#0D0D0D;">UK.</strong> The MHRA has continued seizures of unlicensed products sold for personal use, and judges a product by how it is presented as a whole — a “research use only” label does not outweigh marketing that implies human use.',
        '<strong style="color:#0D0D0D;">US.</strong> The FDA’s advisory committee reviewed several peptides for pharmacy compounding, with the agency’s own reviewers citing one recurring problem: you cannot always reliably say what is in the vial.',
      ])}
      ${p('That last point is the thread running through all three. The safest supplier is the one that can prove what it ships — batch by batch, with independent identity testing — and that sells laboratory material as laboratory material.')}
      ${p('We read the rules the same way. If you have a question about any of it, reply to this email — a person will answer.', 0)}
    `,
    text: (lead) =>
      `${lead.firstName ? `Hi ${lead.firstName},` : 'Hi,'} 2026 was the year regulators started acting on online peptide sales.\n\n- UAE: in July the Emirates Drug Establishment acted against online sources of unapproved peptide products; Abu Dhabi's DoH now requires prior approval for peptide marketing.\n- UK: the MHRA continues to seize unlicensed products and judges how a product is presented as a whole.\n- US: the FDA's advisory committee review of peptides for compounding kept returning to one problem — knowing what is in the vial.\n\nThe safest supplier is the one that can prove what it ships, batch by batch. Questions? Just reply.`,
  },
}

export const LAST_STEP = 4

export async function sendSeriesEmail(lead: LeadRecord, step: number): Promise<void> {
  const email = SERIES[step]
  if (!email) throw new Error(`No follow-up email for step ${step}`)
  await send(
    lead,
    email.subject,
    email.pre,
    email.html(lead),
    email.text(lead),
    "You're receiving this because you opted in to PepcoLab research updates.",
    'marketing'
  )
}

export function guideFor(slug: string): LearnGuide | undefined {
  return getLearnGuide(slug)
}
