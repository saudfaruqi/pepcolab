// src/lib/chatContent.ts
//
// SINGLE SOURCE OF TRUTH for the support assistant.
// ------------------------------------------------
// Everything the widget can say lives here. ChatWidget.tsx contains no copy
// of its own — it renders what this file defines. That separation is the
// whole point of the restructure: adding a question, correcting an answer, or
// changing how the assistant behaves on a given page is a data edit here, not
// a component change.
//
// DESIGN RULES — please keep to these when editing:
//
// 1. EVERY ANSWER IS PRE-WRITTEN. No model generates customer-facing text.
//    For a research-compound supplier that is a compliance decision, not a
//    cost one: a generated answer can invent a dosage, a delivery date or a
//    purity figure, and any of those is a serious problem. If a question
//    isn't answered here, the assistant says so and offers a human.
//
// 2. ANSWERS STATE ONLY WHAT THE SITE CAN SUBSTANTIATE. Policy answers below
//    are taken verbatim in substance from /shipping and /refund-policy. If
//    those pages change, change these too.
//
// 3. NO ACCREDITATION CLAIM. The previous chat flow told every visitor that
//    Freedom Diagnostics is "a UKAS-accredited laboratory". Nothing on the
//    site supports that, and an accreditation claim is precisely the kind of
//    statement a competitor or regulator checks. The answers below say
//    "independent third-party laboratory" and name it. If Freedom
//    Diagnostics confirms it holds ISO/IEC 17025 or UKAS accreditation, add
//    it here and nowhere else, and it will appear everywhere at once.
//
// 4. NEVER ANSWER A DOSING, PROTOCOL OR HUMAN-USE QUESTION. The matcher
//    routes those to REFUSAL_ANSWER regardless of what else they look like.
//    That check runs before normal matching so it cannot be bypassed by
//    phrasing a dosing question as a storage question.

export interface ChatLink {
  label: string
  href: string
}

export interface Faq {
  id: string
  /** Shown as a tappable chip and as the question bubble when selected. */
  question: string
  /** One paragraph per array entry, rendered as separate bubbles. */
  answer: string[]
  /** Lowercase terms used for free-text matching. Include misspellings. */
  keywords: string[]
  /** Links offered under the answer. */
  links?: ChatLink[]
  /** Related FAQ ids offered as follow-ups. */
  related?: string[]
  /** Topic grouping for the browse-by-topic menu. */
  topic: TopicId
}

export type TopicId =
  | 'ordering'
  | 'testing'
  | 'shipping'
  | 'handling'
  | 'account'
  | 'compliance'

export const TOPICS: { id: TopicId; label: string; blurb: string }[] = [
  { id: 'testing', label: 'Testing & COAs', blurb: 'Purity, batch certificates, lot lookup' },
  { id: 'ordering', label: 'Ordering & payment', blurb: 'Placing an order, prices, bundles' },
  { id: 'shipping', label: 'Shipping & tracking', blurb: 'Dispatch times, cold chain, where we ship' },
  { id: 'handling', label: 'Storage & handling', blurb: 'Temperatures, reconstitution, shelf life' },
  { id: 'account', label: 'Orders & returns', blurb: 'Track an order, damaged items, refunds' },
  { id: 'compliance', label: 'Legal & research use', blurb: 'What research use only means' },
]

/* -------------------------------------------------------------------------- */
/* SAFETY                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Terms that must never reach a normal answer. Checked before matching.
 *
 * These are the questions where being helpful and being responsible pull in
 * opposite directions, and the assistant is not the right place to resolve
 * that. A human can have the conversation; a chat widget cannot.
 */
export const BLOCKED_TERMS = [
  'dose', 'dosage', 'dosing', 'how much should i', 'how many mg', 'mg per',
  'inject', 'injection', 'injecting', 'subcutaneous', 'intramuscular',
  'cycle', 'stack for', 'protocol for me', 'take it', 'taking it',
  'safe for humans', 'human use', 'consume', 'consumption', 'eat', 'drink',
  'side effect', 'side-effect', 'weight loss', 'lose weight', 'fat loss',
  'build muscle', 'bodybuilding', 'before and after', 'results in',
  'prescription', 'prescribe', 'doctor', 'medical advice', 'treat', 'cure',
]

export const REFUSAL_ANSWER: string[] = [
  'I can\u2019t help with that one. Everything PepcoLab supplies is for in-vitro laboratory research only, so we don\u2019t provide dosing, administration, protocol or human-use guidance \u2014 not through chat, not by email, and not over WhatsApp.',
  'That isn\u2019t us being unhelpful. It is the line that keeps the compounds available at all, and any supplier willing to cross it is telling you something about how they operate.',
  'If your question is about the material itself \u2014 purity, batch documentation, storage temperatures, formats or supply \u2014 I can help with all of that.',
]

/* -------------------------------------------------------------------------- */
/* FAQS                                                                        */
/* -------------------------------------------------------------------------- */

export const FAQS: Faq[] = [
  // ── Testing & COAs ────────────────────────────────────────────────────────
  {
    id: 'coa-what',
    topic: 'testing',
    question: 'What testing does each batch get?',
    answer: [
      'Every batch is tested by Freedom Diagnostics, an independent third-party laboratory \u2014 not by us, and not self-certified.',
      'The certificate of analysis reports identity and purity by HPLC, the method used, and the test date. Crucially, it is matched to the specific lot number printed on the vial you receive, rather than being a generic reference document reused across batches.',
      'That last part is the one worth checking with any supplier. A certificate that cannot be tied to a physical lot proves nothing about the material in front of you.',
    ],
    keywords: ['test', 'testing', 'tested', 'lab', 'laboratory', 'freedom diagnostics', 'third party', 'third-party', 'independent', 'hplc', 'purity', 'analysis', 'quality'],
    links: [{ label: 'Browse the certificate library', href: '/certificates' }],
    related: ['coa-find', 'coa-purity'],
  },
  {
    id: 'coa-find',
    topic: 'testing',
    question: 'How do I find the COA for my batch?',
    answer: [
      'The certificate library is searchable by product and by lot number. Take the lot number printed on your vial, enter it, and you get the certificate for that exact batch.',
      'If a lot number doesn\u2019t return anything, tell us \u2014 that is something we want to know about immediately, and a representative can pull it for you directly.',
    ],
    keywords: ['find coa', 'lot', 'lot number', 'batch number', 'look up', 'lookup', 'search certificate', 'my batch', 'verify', 'verification'],
    links: [{ label: 'Search by lot number', href: '/certificates' }],
    related: ['coa-what', 'contact-human'],
  },
  {
    id: 'coa-purity',
    topic: 'testing',
    question: 'What purity are the compounds?',
    answer: [
      'Purity is stated per batch on that batch\u2019s certificate of analysis, measured by HPLC. We publish the measured figure for the lot rather than a blanket marketing number, because purity varies slightly between production runs and a single site-wide claim would be an average at best.',
      'You can see the actual figure for any batch before you order.',
    ],
    keywords: ['purity', 'pure', 'percent', '99', 'how pure', 'quality', 'grade'],
    links: [{ label: 'See published certificates', href: '/certificates' }],
    related: ['coa-what'],
  },

  // ── Ordering & payment ────────────────────────────────────────────────────
  {
    id: 'order-how',
    topic: 'ordering',
    question: 'How do I place an order?',
    answer: [
      'Add what you need to the cart and check out on the site \u2014 payment is handled by STRABL, and Visa, Mastercard and American Express are all accepted.',
      'If you\u2019d rather order through a person, or you\u2019re ordering in volume, message us on WhatsApp and a representative will handle it with you directly.',
    ],
    keywords: ['order', 'buy', 'purchase', 'checkout', 'how do i order', 'place an order'],
    links: [{ label: 'Browse the catalogue', href: '/products' }],
    related: ['order-payment', 'order-bulk'],
    // topic assigned above
  },
  {
    id: 'order-payment',
    topic: 'ordering',
    question: 'What payment methods do you take?',
    answer: [
      'Card payments through STRABL \u2014 Visa, Mastercard and American Express. Prices and charges are in UAE dirhams (AED).',
      'One compound, Retatrutide, is sold through a direct payment link rather than the normal cart. If you\u2019re ordering that one and the checkout looks different, that is expected.',
    ],
    keywords: ['pay', 'payment', 'card', 'visa', 'mastercard', 'amex', 'currency', 'aed', 'dirham', 'gbp', 'pound', 'strabl', 'crypto'],
    related: ['order-how', 'shipping-uk'],
  },
  {
    id: 'order-bulk',
    topic: 'ordering',
    question: 'Do you do bulk or institutional orders?',
    answer: [
      'Yes. Universities, contract research organisations and laboratory purchasers order from us regularly, and volume pricing is handled case by case rather than through a fixed table.',
      'A representative is the fastest route here \u2014 tell us the compounds, quantities and destination and you\u2019ll get a real quote back.',
    ],
    keywords: ['bulk', 'wholesale', 'volume', 'institution', 'university', 'quote', 'discount', 'trade', 'reseller', 'b2b'],
    related: ['contact-human'],
  },
  {
    id: 'order-bundles',
    topic: 'ordering',
    question: 'Are there bundles or discounts?',
    answer: [
      'Bundles combine commonly paired compounds at 10% off the individual prices.',
      'There is also a referral programme: share your link, your contact gets 15% off their first order, and you get 20% credit on yours.',
    ],
    keywords: ['bundle', 'stack', 'discount', 'offer', 'deal', 'promo', 'code', 'coupon', 'referral', 'refer', 'cheaper', 'save'],
    links: [
      { label: 'See bundles', href: '/bundles' },
      { label: 'Referral programme', href: '/referrals' },
    ],
  },

  // ── Shipping ──────────────────────────────────────────────────────────────
  {
    id: 'shipping-times',
    topic: 'shipping',
    question: 'How fast do orders ship?',
    answer: [
      'Most orders are dispatched within one business day of payment being confirmed and verified. Orders placed after hours, at weekends or on public holidays are processed on the next business day.',
      'Tracking details are emailed once your order has been dispatched. Delivery windows shown at checkout are estimates and depend on the courier and destination \u2014 timelines run from dispatch, not from when you placed the order.',
    ],
    keywords: ['ship', 'shipping', 'dispatch', 'delivery', 'how long', 'when will', 'arrive', 'fast', 'speed', 'courier', 'tracking'],
    links: [{ label: 'Full shipping information', href: '/shipping' }],
    related: ['shipping-cold', 'order-track'],
  },
  {
    id: 'shipping-cold',
    topic: 'shipping',
    question: 'How is the cold chain handled?',
    answer: [
      'Compounds are dispatched in temperature-controlled packaging. Lyophilised peptides are stable for the transit window under those conditions.',
      'The handling and storage requirements for your specific compound are printed on the documentation supplied with the order \u2014 follow those rather than a general rule, because pens and vials differ.',
    ],
    keywords: ['cold chain', 'cold-chain', 'temperature', 'ice', 'cool', 'packaging', 'transit', 'melt', 'warm'],
    related: ['handling-storage'],
  },
  {
    id: 'shipping-uk',
    topic: 'shipping',
    question: 'Do you ship to the UK?',
    answer: [
      'Not yet. PepcoLab currently dispatches from the UAE. UK supply is in preparation and will be announced to the launch list first.',
      'You can browse the full catalogue and every published certificate from the UK now, and join the list to be told the day UK ordering opens \u2014 with GBP pricing and UK delivery estimates.',
    ],
    keywords: ['uk', 'united kingdom', 'britain', 'british', 'england', 'london', 'international', 'worldwide', 'abroad', 'ship to', 'europe', 'usa', 'america'],
    links: [{ label: 'UK launch details', href: '/uk' }],
    related: ['shipping-times'],
  },

  // ── Storage & handling ────────────────────────────────────────────────────
  {
    id: 'handling-storage',
    topic: 'handling',
    question: 'How should compounds be stored?',
    answer: [
      'It depends on the format, and the exact requirement for your compound is printed on its documentation and shown on its product page.',
      'As a general pattern: lyophilised vials are stored at \u221220\u00a0\u00b0C, desiccated and protected from light. Pre-filled pens and nasal sprays are kept at 2\u20138\u00a0\u00b0C and must not be frozen. Once opened or reconstituted, material is held at 2\u20138\u00a0\u00b0C and used within 28 days, avoiding repeated freeze\u2013thaw cycles.',
    ],
    keywords: ['store', 'storage', 'storing', 'fridge', 'freezer', 'freeze', 'temperature', 'shelf life', 'expiry', 'expire', 'how long does it last', 'keep'],
    related: ['handling-reconstitution', 'shipping-cold'],
  },
  {
    id: 'handling-reconstitution',
    topic: 'handling',
    question: 'How do I work out reconstitution volumes?',
    answer: [
      'There is a reconstitution calculator on the site that works out concentrations from the vial contents and the volume of solvent added.',
      'Bacteriostatic water and laboratory-grade acetic acid are both stocked as accessories for compounds with limited water solubility.',
      'To be explicit: the calculator handles the arithmetic of preparing a solution for laboratory work. It is not a dosing tool and we don\u2019t provide administration guidance.',
    ],
    keywords: ['reconstitute', 'reconstitution', 'mix', 'dilute', 'dilution', 'solvent', 'bac water', 'bacteriostatic', 'water', 'calculator', 'concentration', 'ml'],
    links: [
      { label: 'Reconstitution calculator', href: '/tools/reconstitution-calculator' },
      { label: 'Solvents & accessories', href: '/products/category/accessories' },
    ],
    related: ['handling-storage'],
  },

  // ── Orders & returns ──────────────────────────────────────────────────────
  {
    id: 'order-track',
    topic: 'account',
    question: 'Where is my order?',
    answer: [
      'You can look up an order and its tracking on the order tracking page. Tracking details are also emailed at dispatch \u2014 worth checking spam if you haven\u2019t seen it.',
      'If tracking hasn\u2019t updated or something looks wrong, get a representative on it rather than waiting. That is usually a five-minute fix at our end.',
    ],
    keywords: ['track', 'tracking', 'where is my order', 'order status', 'not arrived', 'late', 'delayed', 'missing', 'lost', 'hasnt arrived', "hasn't arrived"],
    links: [{ label: 'Track your order', href: '/track-order' }],
    related: ['contact-human', 'order-damaged'],
  },
  {
    id: 'order-damaged',
    topic: 'account',
    question: 'My order arrived damaged or wrong',
    answer: [
      'You\u2019re covered, and this is worth doing straight away: claims need to be submitted within 48 hours of delivery, with photos of the packaging, the shipping label and the affected product.',
      'Once reviewed and approved, you get a full refund or a replacement \u2014 your choice. Refunds go back to the original payment method through STRABL, typically initiated within 3\u20135 business days, with your bank usually taking another 5\u201310 on top.',
      'Send the photos to a representative now and we\u2019ll start it.',
    ],
    keywords: ['damaged', 'broken', 'wrong', 'incorrect', 'defective', 'faulty', 'leaked', 'melted', 'missing item', 'not what i ordered', 'complaint'],
    links: [{ label: 'Refund policy', href: '/refund-policy' }],
    related: ['order-refund', 'contact-human'],
  },
  {
    id: 'order-refund',
    topic: 'account',
    question: 'Can I return or cancel an order?',
    answer: [
      'Before dispatch, an order can be cancelled. Once it has been dispatched it can\u2019t be \u2014 at that point it falls under the returns terms instead.',
      'Because these are cold-chain research compounds, products that have left dispatch cannot be physically returned, with one exception: anything arriving damaged, defective or incorrect is eligible for a refund or replacement. Opened or altered products aren\u2019t eligible unless the fault is ours or the carrier\u2019s.',
    ],
    keywords: ['return', 'refund', 'cancel', 'money back', 'send back', 'exchange', 'policy'],
    links: [{ label: 'Full refund policy', href: '/refund-policy' }],
    related: ['order-damaged'],
  },

  // ── Compliance ────────────────────────────────────────────────────────────
  {
    id: 'compliance-ruo',
    topic: 'compliance',
    question: 'What does "research use only" mean?',
    answer: [
      'It means every compound we supply is intended solely for in-vitro laboratory research. None of it is a medicine or a supplement, none of it is licensed by any medicines regulator, and none of it is for human or veterinary consumption.',
      'It also means there are questions we won\u2019t answer \u2014 dosing, administration, protocols, anything about use in a person. Buyers are responsible for ensuring their intended use is lawful where they are.',
    ],
    keywords: ['research use', 'ruo', 'legal', 'law', 'lawful', 'allowed', 'regulation', 'mhra', 'fda', 'licence', 'license', 'approved', 'what does research use only mean'],
    links: [{ label: 'Legal status by compound', href: '/legal' }],
    related: ['compliance-who'],
  },
  {
    id: 'compliance-who',
    topic: 'compliance',
    question: 'Who is PepcoLab?',
    answer: [
      'PepcoLab supplies research-grade peptides and laboratory compounds to universities, contract research organisations and qualified laboratory purchasers, dispatching from the UAE with UK supply in preparation.',
      'PepcoLab is the trading name of SEE BEE DEE LIMITED, registered in England and Wales, company number 17072052.',
    ],
    keywords: ['who are you', 'about', 'company', 'registered', 'legit', 'trust', 'real', 'scam', 'based', 'located', 'where are you'],
    links: [{ label: 'About PepcoLab', href: '/about' }],
    related: ['coa-what'],
  },
  {
    id: 'contact-human',
    topic: 'account',
    question: 'I want to speak to a person',
    answer: [
      'Of course \u2014 that is always available, and you never have to work through me first.',
    ],
    keywords: ['human', 'person', 'agent', 'representative', 'someone', 'talk to', 'speak to', 'real person', 'support', 'help me', 'contact', 'call', 'phone', 'email', 'whatsapp'],
    related: [],
  },
]

export const FAQ_BY_ID: Record<string, Faq> = Object.fromEntries(FAQS.map(f => [f.id, f]))

/* -------------------------------------------------------------------------- */
/* PAGE CONTEXT                                                                */
/* -------------------------------------------------------------------------- */

export interface PageContext {
  /** Human label for where the visitor is — shown in the assistant header. */
  label: string
  /** Opening line, written for someone standing on this specific page. */
  greeting: string
  /** FAQ ids surfaced first here, in order. */
  suggested: string[]
}

const DEFAULT_CONTEXT: PageContext = {
  label: 'PepcoLab',
  greeting: 'Hi \u2014 I can answer questions about testing, orders, shipping and storage. Or put you straight through to a person, whenever you want.',
  suggested: ['coa-what', 'shipping-times', 'order-how', 'compliance-ruo'],
}

/**
 * Route-specific behaviour. Order matters: the FIRST matching prefix wins, so
 * more specific paths must come before their parents.
 *
 * Being genuinely page-aware is what separates this from a widget that says
 * "How can I help?" everywhere. Someone on /checkout has a different problem
 * from someone on /certificates, and the difference between a useful
 * assistant and an annoying one is mostly whether the first screen already
 * contains what they were about to type.
 */
const CONTEXT_RULES: { match: (p: string) => boolean; context: PageContext }[] = [
  {
    match: p => p.startsWith('/checkout') || p.startsWith('/cart'),
    context: {
      label: 'Checkout',
      greeting: 'Anything holding up your order? Payment, shipping or something on the compounds themselves \u2014 ask, or I\u2019ll get a person on it right now.',
      suggested: ['order-payment', 'shipping-times', 'shipping-uk', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/track-order'),
    context: {
      label: 'Order tracking',
      greeting: 'Chasing an order? I can tell you how dispatch and tracking work \u2014 and if something is actually wrong, a person can look it up properly.',
      suggested: ['order-track', 'shipping-times', 'order-damaged', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/certificates'),
    context: {
      label: 'Certificate library',
      greeting: 'Looking up a batch? Search by the lot number printed on your vial. If it doesn\u2019t come back, tell me \u2014 that\u2019s something we want to know about.',
      suggested: ['coa-find', 'coa-what', 'coa-purity', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/products/category/'),
    context: {
      label: 'Catalogue',
      greeting: 'Browsing this category? I can explain how the batch testing and documentation work, or what shipping looks like.',
      suggested: ['coa-what', 'order-bundles', 'shipping-times', 'handling-storage'],
    },
  },
  {
    match: p => /^\/products\/[^/]+$/.test(p),
    context: {
      label: 'Product',
      greeting: '', // replaced at runtime with the product name — see resolvePageContext
      suggested: ['coa-find', 'handling-storage', 'shipping-times', 'order-payment'],
    },
  },
  {
    match: p => p.startsWith('/products') || p.startsWith('/bundles'),
    context: {
      label: 'Catalogue',
      greeting: 'Anything you want to know about the catalogue \u2014 testing, formats, shipping or bundles?',
      suggested: ['coa-what', 'order-bundles', 'shipping-times', 'order-how'],
    },
  },
  {
    match: p => p.startsWith('/uk'),
    context: {
      label: 'UK',
      greeting: 'UK dispatch isn\u2019t open yet, but everything else is. Ask me anything about how we test and document batches \u2014 or join the launch list.',
      suggested: ['shipping-uk', 'coa-what', 'compliance-who', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/tools'),
    context: {
      label: 'Tools',
      greeting: 'The calculator handles reconstitution arithmetic for laboratory preparation. Ask if anything about it is unclear.',
      suggested: ['handling-reconstitution', 'handling-storage', 'coa-what'],
    },
  },
  {
    match: p => p.startsWith('/research') || p.startsWith('/guides') || p.startsWith('/compare') || p.startsWith('/legal'),
    context: {
      label: 'Research library',
      greeting: 'Reading up? I can help with supply, testing and documentation questions. For anything about use in a person, I can\u2019t \u2014 and won\u2019t.',
      suggested: ['compliance-ruo', 'coa-what', 'coa-purity', 'compliance-who'],
    },
  },
  {
    match: p => p.startsWith('/shipping'),
    context: {
      label: 'Shipping',
      greeting: 'Shipping questions \u2014 dispatch times, cold chain, or where we deliver?',
      suggested: ['shipping-times', 'shipping-cold', 'shipping-uk', 'order-track'],
    },
  },
  {
    match: p => p.startsWith('/refund-policy') || p.startsWith('/terms') || p.startsWith('/privacy'),
    context: {
      label: 'Policies',
      greeting: 'If something has gone wrong with an order, don\u2019t work through the policy page \u2014 tell me what happened and I\u2019ll route it.',
      suggested: ['order-damaged', 'order-refund', 'order-track', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/contact') || p.startsWith('/faq'),
    context: {
      label: 'Support',
      greeting: 'Ask me anything \u2014 or skip straight to a person, which is often faster.',
      suggested: ['contact-human', 'order-track', 'coa-what', 'shipping-times'],
    },
  },
]

/** Turn a product slug into something readable: "ghk-cu" -> "GHK-Cu". */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(part => (/^\d/.test(part) || part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('-')
}

export function resolvePageContext(pathname: string): PageContext & { productSlug?: string } {
  const path = (pathname || '/').replace(/\/+$/, '') || '/'

  for (const rule of CONTEXT_RULES) {
    if (!rule.match(path)) continue

    // Product pages get the compound's own name in the greeting. Knowing
    // which product someone is looking at is the difference between a
    // generic widget and one that feels like it is paying attention — and
    // it is also what gets attached to a handoff so the representative
    // doesn't have to ask.
    if (rule.context.label === 'Product') {
      const slug = path.split('/')[2] || ''
      const name = slugToName(slug)
      return {
        ...rule.context,
        productSlug: slug,
        greeting: `Looking at ${name}? I can cover its documentation, storage requirements, formats and shipping \u2014 or get a person to you.`,
      }
    }
    return rule.context
  }

  return DEFAULT_CONTEXT
}

/* -------------------------------------------------------------------------- */
/* MATCHING                                                                    */
/* -------------------------------------------------------------------------- */

export type MatchResult =
  | { kind: 'blocked' }
  | { kind: 'match'; faq: Faq }
  | { kind: 'ambiguous'; faqs: Faq[] }
  | { kind: 'none' }

/**
 * Deterministic free-text matching. No model, no embeddings, no network.
 *
 * Scoring is intentionally simple and inspectable: a keyword hit is worth
 * more than a question-text hit, longer keywords beat shorter ones (so
 * "bacteriostatic" outranks an incidental "water"), and a clear leader wins
 * outright while a close field is offered as a choice rather than guessed at.
 *
 * Guessing wrong is worse than asking. A visitor who gets a confidently
 * irrelevant answer stops trusting the whole widget.
 */
export function matchFaq(input: string): MatchResult {
  const q = input.toLowerCase().trim()
  if (!q) return { kind: 'none' }

  if (BLOCKED_TERMS.some(term => q.includes(term))) return { kind: 'blocked' }

  const scored = FAQS.map(faq => {
    let score = 0
    for (const kw of faq.keywords) {
      if (q.includes(kw)) score += 2 + Math.min(kw.length / 8, 2)
    }
    const questionWords = faq.question.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    for (const w of questionWords) {
      if (q.includes(w)) score += 0.6
    }
    return { faq, score }
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { kind: 'none' }
  if (scored.length === 1 || scored[0].score >= scored[1].score * 1.5) {
    return { kind: 'match', faq: scored[0].faq }
  }
  return { kind: 'ambiguous', faqs: scored.slice(0, 3).map(x => x.faq) }
}

export const NO_MATCH_ANSWER: string[] = [
  'I don\u2019t have a pre-written answer for that one, and I\u2019d rather say so than guess.',
  'A representative can answer it properly \u2014 they\u2019ll see what page you\u2019re on and what we\u2019ve covered so far, so you won\u2019t have to start again.',
]