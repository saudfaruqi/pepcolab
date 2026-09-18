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
//    LIVE LOOKUPS DO NOT BREAK THIS RULE. The assistant can now answer
//    "is BPC-157 in stock?" and "where is order SOR-A5EVGI?" — but those
//    answers are TEMPLATES in lib/chatLookup.ts with real values slotted in,
//    not prose a model wrote. The sentence structure is fixed and reviewable;
//    only the numbers change.
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
//
// ── SEPTEMBER 2026 REVISION ────────────────────────────────────────────────
//
// A. THE SAFETY LIST WAS REFUSING ORDINARY QUESTIONS. BLOCKED_TERMS matched
//    bare substrings, so 'eat' fired inside "cr-EAT-e", "rep-EAT", "h-EAT"
//    and "gr-EAT", and 'cure' fired inside "se-CURE". Six of sixteen
//    realistic questions were refused in testing. "Is your checkout secure?"
//    returned a lecture about not discussing human use. Everything is now
//    matched on word boundaries, with an explicit allow-list checked first
//    for legitimate phrases that contain blocked words ("freeze-thaw cycle").
//
// B. TWO ANSWERS WERE FACTUALLY WRONG. Both said tracking details are
//    emailed at dispatch. The couriers used do not supply tracking on most
//    orders — roughly 90% simply arrive the next working day. Promising a
//    tracking email generates exactly the "where is my tracking number?"
//    contact it was meant to prevent. Both now describe what really happens.
//
// C. THE THREE QUESTIONS THAT ACTUALLY COST TIME had no answers at all:
//    pen clicks, delivery expectations without tracking, and legality by
//    country. Added below.
//
// D. FREE TEXT NOW TOLERATES TYPOS. "bacteriostaic" and "purtiy" matched
//    nothing before.

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
  { id: 'handling', label: 'Storage & handling', blurb: 'Temperatures, reconstitution, pen clicks' },
  { id: 'account', label: 'Orders & returns', blurb: 'Track an order, damaged items, refunds' },
  { id: 'compliance', label: 'Legal & research use', blurb: 'What research use only means' },
]

/* -------------------------------------------------------------------------- */
/* SAFETY                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Legitimate phrases that contain a word the block list would otherwise catch.
 * Checked FIRST — if one of these is present the message skips the block list
 * entirely and goes to normal matching.
 *
 * "freeze-thaw cycle" is the important one: it is the correct technical term
 * for a storage question, and it appears in our own storage answer.
 */
const SAFETY_ALLOW_PATTERNS: RegExp[] = [
  /\bfreeze[-\s]?thaw\b/i,
  /\bcold[-\s]?chain\b/i,
  /\bshipping cycle\b/i,
  /\bbilling cycle\b/i,
]

/**
 * Patterns that must never reach a normal answer. Checked before matching.
 *
 * These are the questions where being helpful and being responsible pull in
 * opposite directions, and the assistant is not the right place to resolve
 * that. A human can have the conversation; a chat widget cannot.
 *
 * WORD BOUNDARIES ARE LOAD-BEARING. Every pattern below is anchored with \b.
 * The previous version used bare `includes()`, which is why "create an
 * account" and "is your checkout secure?" were both refused. If you add a
 * term here, add it as an anchored pattern and add a case to the test list in
 * lib/chatContent.test-cases.ts.
 */
export const BLOCKED_PATTERNS: RegExp[] = [
  // Dosing
  /\bdos(e|es|age|ages|ing)\b/i,
  /\bhow (much|many) (should|do|would|can|could) (i|we|you|he|she|they)\b/i,
  /\b\d+\s*(mg|mcg|iu|ug)\s*(per|a|each|every)\s*(day|week|month|dose|shot)\b/i,
  // Same question without a number: "how many mg per week".
  /\b(mg|mcg|iu|ug)\s*(per|a|each|every)\s*(day|week|month|dose|shot)\b/i,
  /\bmg\s*\/\s*kg\b/i,
  /\btitrat(e|ing|ion)\b/i,
  /\bloading (dose|phase)\b/i,

  // Administration
  /\binject(s|ed|ing|ion|ions|able)?\b/i,
  /\bsub[-\s]?cutaneous\b/i,
  /\bintramuscular\b/i,
  /\bself[-\s]?administer(ing|ed)?\b/i,
  /\b(pin|shoot|jab)\s+(it|this|myself)\b/i,

  // Human use
  /\bhuman (use|consumption|trial|trials|grade for use)\b/i,
  /\b(safe|ok|okay|fine|alright) (for|to) (humans?|people|me|take|use on|consume)\b/i,
  /\b(can|should|could|may) (i|we|you) (take|use|consume|drink|try|have) (it|this|these|them)\b/i,
  /\bon myself\b/i,
  /\bfor personal use\b/i,
  /\bfor my own use\b/i,
  /\bconsumption\b/i,

  // Outcomes and effects
  /\bside[-\s]?effects?\b/i,
  /\bweight[-\s]?loss\b/i,
  /\blos(e|ing) weight\b/i,
  /\bfat[-\s]?loss\b/i,
  /\bbuild(ing)? muscle\b/i,
  /\bmuscle (gain|growth)\b/i,
  /\bbodybuild(ing|er|ers)?\b/i,
  /\bbefore and after\b/i,

  // Medical framing
  /\bprescri(be|bed|ption|ptions)\b/i,
  /\bmedical advice\b/i,
  /\btreats?\b/i,
  /\bcures?\b/i,
  /\bdiagnos(e|is|ing)\b/i,
  /\bmy (doctor|gp|physician)\b/i,

  // Protocols and cycles
  /\b(my|a|the|first|next|second|beginner|starter) cycle\b/i,
  /\bcycle (length|support|on|off)\b/i,
  /\bprotocol for (me|my)\b/i,
  /\bstack (for|to) (me|my|lose|gain|build|cut|bulk)\b/i,
]

/**
 * True if the message must be refused. Allow-list wins over the block list.
 */
export function isBlocked(input: string): boolean {
  const q = (input || '').toLowerCase()
  if (!q.trim()) return false
  if (SAFETY_ALLOW_PATTERNS.some(re => re.test(q))) return false
  return BLOCKED_PATTERNS.some(re => re.test(q))
}

export const REFUSAL_ANSWER: string[] = [
  'I can’t help with that one. Everything PepcoLab supplies is for in-vitro laboratory research only, so we don’t provide dosing, administration, protocol or human-use guidance — not through chat, not by email, and not over WhatsApp.',
  'That isn’t us being unhelpful. It is the line that keeps the compounds available at all, and any supplier willing to cross it is telling you something about how they operate.',
  'If your question is about the material itself — purity, batch documentation, storage temperatures, formats or supply — I can help with all of that.',
]

/* -------------------------------------------------------------------------- */
/* LIVE LOOKUPS                                                                */
/* -------------------------------------------------------------------------- */

export type LookupIntent = 'product' | 'lot' | 'order'

export interface LookupRequest {
  intent: LookupIntent
  /** The raw term to resolve server-side — a product name, lot or order code. */
  query: string
}

/** Order short codes as issued by STRABL and stored in lib/orderStore.ts. */
const ORDER_CODE_RE = /\b(SOR-[A-Z0-9]{4,12})\b/i

/**
 * Batch identifiers as they appear on our own documentation: the accession
 * number (a long digit string) and the printed lot ("PAL-TES5-2605-01").
 */
const LOT_CODE_RE = /\b(\d{8,14})\b/
const PRINTED_LOT_RE = /\b([A-Z]{2,4}-[A-Z0-9]{2,6}-\d{3,6}-\d{1,3})\b/i

const PRODUCT_INTENT_RE =
  /\b(in stock|out of stock|stock|available|availability|how much (is|are|for)|price of|cost of|what does .* cost|do you (have|sell|stock)|what formats?|which formats?|comes? in)\b/i

/**
 * Words that look like a product to the extractor but are concepts we have a
 * written answer for. If nothing but these survives stopword removal, it is
 * not a catalogue lookup — "how much is each click" is a pen question.
 */
const CONCEPT_TERMS = new Set([
  'click', 'clicks', 'shipping', 'delivery', 'postage', 'vat', 'tax', 'duty',
  'refund', 'returns', 'bundle', 'bundles', 'referral', 'discount', 'tracking',
])

const STOPWORDS = new Set([
  'do', 'you', 'have', 'sell', 'stock', 'in', 'the', 'a', 'an', 'is', 'are', 'any',
  'of', 'for', 'how', 'much', 'many', 'cost', 'price', 'what', 'does', 'available',
  'availability', 'got', 'and', 'or', 'me', 'i', 'can', 'get', 'buy', 'order',
  'formats', 'format', 'comes', 'come', 'sizes', 'size', 'left', 'still', 'your',
  'each', 'one', 'per', 'single', 'this', 'that', 'it', 'there', 'they',
])

/**
 * Detects a question that needs real data rather than a written answer, and
 * extracts the term to resolve. Resolution itself happens server-side against
 * the live catalogue / COA index / order store — this function deliberately
 * knows nothing about which products exist, so it never goes stale.
 *
 * Returns null when the question is not a lookup, which is the common case.
 */
export function detectLookup(input: string): LookupRequest | null {
  const raw = (input || '').trim()
  if (!raw) return null

  const order = raw.match(ORDER_CODE_RE)
  if (order) return { intent: 'order', query: order[1].toUpperCase() }

  // A printed lot code is unambiguous on its own.
  const printedLot = raw.match(PRINTED_LOT_RE)
  if (printedLot) return { intent: 'lot', query: printedLot[1].toUpperCase() }

  // A bare long number only counts alongside lot/batch/COA wording, so an
  // order total or a phone number isn't mistaken for a batch.
  const lot = raw.match(LOT_CODE_RE)
  if (lot && /\b(lot|batch|coa|certificate|accession)\b/i.test(raw)) {
    return { intent: 'lot', query: lot[1] }
  }

  if (PRODUCT_INTENT_RE.test(raw)) {
    const term = raw
      .toLowerCase()
      .replace(/[?!.,]/g, ' ')
      .replace(PRODUCT_INTENT_RE, ' ')
      .split(/\s+/)
      .filter(w => w && !STOPWORDS.has(w))
      .join(' ')
      .trim()
    const meaningful = term.split(/\s+/).filter(w => !CONCEPT_TERMS.has(w))
    if (meaningful.length === 0) return null // a concept question, not a product one
    if (term.length >= 2) return { intent: 'product', query: term }
  }

  return null
}

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
      'Every batch is tested by Freedom Diagnostics, an independent third-party laboratory — not by us, and not self-certified.',
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
      'You can also just type the lot number to me and I’ll look it up for you.',
      'If a lot number doesn’t return anything, tell us — that is something we want to know about immediately, and a representative can pull it for you directly.',
    ],
    keywords: ['find coa', 'lot', 'lot number', 'batch number', 'look up', 'lookup', 'search certificate', 'my batch', 'verify', 'verification', 'accession'],
    links: [{ label: 'Search by lot number', href: '/certificates' }],
    related: ['coa-what', 'contact-human'],
  },
  {
    id: 'coa-purity',
    topic: 'testing',
    question: 'What purity are the compounds?',
    answer: [
      'Purity is stated per batch on that batch’s certificate of analysis, measured by HPLC. We publish the measured figure for the lot rather than a blanket marketing number, because purity varies slightly between production runs and a single site-wide claim would be an average at best.',
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
      'Add what you need to the cart and check out on the site — payment is handled by STRABL, and Visa, Mastercard and American Express are all accepted.',
      'If you’d rather order through a person, or you’re ordering in volume, message us on WhatsApp and a representative will handle it with you directly.',
    ],
    keywords: ['order', 'buy', 'purchase', 'checkout', 'how do i order', 'place an order'],
    links: [{ label: 'Browse the catalogue', href: '/products' }],
    related: ['order-payment', 'order-bulk'],
  },
  {
    id: 'order-payment',
    topic: 'ordering',
    question: 'What payment methods do you take?',
    answer: [
      'Card payments through STRABL — Visa, Mastercard and American Express. Prices and charges are in UAE dirhams (AED).',
      'One compound, GLP, is sold through a direct payment link rather than the normal cart. If you’re ordering that one and the checkout looks different, that is expected — the quantity is fixed into the link, so pick your quantity on the product page before you click through.',
    ],
    keywords: ['pay', 'payment', 'card', 'visa', 'mastercard', 'amex', 'currency', 'aed', 'dirham', 'gbp', 'pound', 'strabl', 'crypto', 'secure', 'safe payment'],
    related: ['order-how', 'shipping-uk'],
  },
  {
    id: 'order-bulk',
    topic: 'ordering',
    question: 'Do you do bulk or institutional orders?',
    answer: [
      'Yes. Universities, contract research organisations and laboratory purchasers order from us regularly, and volume pricing is handled case by case rather than through a fixed table.',
      'A representative is the fastest route here — tell us the compounds, quantities and destination and you’ll get a real quote back.',
    ],
    keywords: ['bulk', 'wholesale', 'volume', 'institution', 'university', 'quote', 'discount', 'trade', 'reseller', 'b2b'],
    links: [{ label: 'Bulk and institutional orders', href: '/bulk-orders' }],
    related: ['contact-human'],
  },
  {
    id: 'order-bundles',
    topic: 'ordering',
    question: 'Are there bundles or discounts?',
    answer: [
      'Bundles combine commonly paired compounds at 10% off the individual prices. The discount is applied automatically in your cart once both items are in it — you don’t need a code.',
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
      'Most orders are dispatched within one business day of payment being confirmed. Orders placed after hours, at weekends or on public holidays are processed on the next business day.',
      'From dispatch, most UAE orders arrive the next working day. We email you the moment your order goes out, so you know it is on its way and roughly when to expect it.',
      'That email is the honest version of a tracking update — see the next answer for why most orders do not come with a tracking number.',
    ],
    keywords: ['ship', 'shipped', 'shipping', 'dispatch', 'dispatched', 'delivery', 'delivered', 'how long', 'when will', 'arrive', 'arrives', 'fast', 'speed', 'courier', 'next day', 'same day'],
    links: [{ label: 'Full shipping information', href: '/shipping' }],
    related: ['shipping-tracking', 'shipping-cold', 'order-track'],
  },
  {
    id: 'shipping-tracking',
    topic: 'shipping',
    question: 'Will I get a tracking number?',
    answer: [
      'Usually not, and we’d rather tell you that up front than have you waiting on an email that isn’t coming. The couriers we use for UAE delivery don’t issue tracking references on most consignments.',
      'What you get instead: an email the moment your order is handed over, with the working day to expect it. Roughly nine in ten orders arrive the next working day.',
      'When a courier does give us a reference, it goes straight onto your order and into that email. And if a parcel hasn’t arrived when it should have, tell us — we chase the courier directly, which is faster than a tracking page would have been anyway.',
    ],
    keywords: ['tracking', 'tracking number', 'track number', 'no tracking', 'trace', 'consignment', 'awb', 'reference number', 'where is it now'],
    links: [{ label: 'Check your order status', href: '/track-order' }],
    related: ['order-track', 'shipping-times', 'contact-human'],
  },
  {
    id: 'shipping-cold',
    topic: 'shipping',
    question: 'How is the cold chain handled?',
    answer: [
      'Compounds are dispatched in temperature-controlled packaging. Lyophilised peptides are stable for the transit window under those conditions.',
      'The handling and storage requirements for your specific compound are printed on the documentation supplied with the order — follow those rather than a general rule, because pens and vials differ.',
      'If a parcel arrives warm, or the packaging looks like it has been opened, photograph it before anything else and send it to us. That is a 48-hour claim window and the photos are what make it straightforward.',
    ],
    keywords: ['cold chain', 'cold-chain', 'temperature', 'ice', 'cool', 'packaging', 'transit', 'melt', 'warm', 'hot', 'summer'],
    related: ['handling-storage', 'order-damaged'],
  },
  {
    id: 'shipping-uk',
    topic: 'shipping',
    question: 'Do you ship to the UK?',
    answer: [
      'Not yet. PepcoLab currently dispatches from the UAE. UK supply is in preparation and will be announced to the launch list first.',
      'You can browse the full catalogue and every published certificate from the UK now, and join the list to be told the day UK ordering opens — with GBP pricing and UK delivery estimates.',
    ],
    keywords: ['uk', 'united kingdom', 'britain', 'british', 'england', 'london', 'international', 'worldwide', 'abroad', 'ship to', 'europe', 'usa', 'america', 'saudi', 'ksa', 'qatar', 'kuwait', 'oman', 'bahrain'],
    links: [{ label: 'UK launch details', href: '/uk' }],
    related: ['shipping-times', 'compliance-where'],
  },

  // ── Storage & handling ────────────────────────────────────────────────────
  {
    id: 'handling-pen-clicks',
    topic: 'handling',
    question: 'How many clicks are in a pen, and how much per click?',
    answer: [
      'A pen’s total contents are divided across its clicks, so what one click contains is simply the pen strength divided by the number of clicks on that pen. A 30mg pen with 240 clicks works out at 0.125mg per click.',
      'There is a calculator built into the site for exactly this — open the Calculator button on any page and switch to the Pen tab. Enter the pen strength and its click count and it gives you the amount per click, plus how many clicks make up any quantity you enter.',
      'Check the click count printed on your own pen’s label rather than assuming, because it varies between pen models. To be explicit: this is the arithmetic of what is in the device. It is not a dosing tool, and we don’t give administration guidance.',
    ],
    keywords: ['click', 'clicks', 'per click', 'pen', 'pens', 'dial', 'how many clicks', '240', 'increments', 'graduation', 'pen calculator'],
    links: [
      { label: 'Open the pen calculator', href: '/tools/reconstitution-calculator' },
      { label: 'Browse pen formats', href: '/products' },
    ],
    related: ['handling-reconstitution', 'handling-storage'],
  },
  {
    id: 'handling-storage',
    topic: 'handling',
    question: 'How should compounds be stored?',
    answer: [
      'It depends on the format, and the exact requirement for your compound is printed on its documentation and shown on its product page.',
      'As a general pattern: lyophilised vials are stored at −20 °C, desiccated and protected from light. Pre-filled pens and nasal sprays are kept at 2–8 °C and must not be frozen — freezing a pen can damage what is inside it. Once opened or reconstituted, material is held at 2–8 °C and used within 28 days, avoiding repeated freeze–thaw cycles.',
    ],
    keywords: ['store', 'storage', 'storing', 'fridge', 'freezer', 'freeze', 'frozen', 'temperature', 'shelf life', 'expiry', 'expire', 'how long does it last', 'keep'],
    links: [{ label: 'Storage & handling guide', href: '/guides/storage-conditions' }],
    related: ['handling-reconstitution', 'shipping-cold'],
  },
  {
    id: 'handling-reconstitution',
    topic: 'handling',
    question: 'How do I work out reconstitution volumes?',
    answer: [
      'There is a reconstitution calculator on the site that works out concentrations from the vial contents and the volume of solvent added.',
      'Bacteriostatic water and laboratory-grade acetic acid are both stocked as accessories for compounds with limited water solubility.',
      'To be explicit: the calculator handles the arithmetic of preparing a solution for laboratory work. It is not a dosing tool and we don’t provide administration guidance.',
    ],
    keywords: ['reconstitute', 'reconstitution', 'mix', 'dilute', 'dilution', 'solvent', 'bac water', 'bacteriostatic', 'water', 'calculator', 'concentration', 'ml'],
    links: [
      { label: 'Reconstitution calculator', href: '/tools/reconstitution-calculator' },
      { label: 'Solvents & accessories', href: '/products/category/accessories' },
    ],
    related: ['handling-pen-clicks', 'handling-storage'],
  },

  // ── Orders & returns ──────────────────────────────────────────────────────
  {
    id: 'order-track',
    topic: 'account',
    question: 'Where is my order?',
    answer: [
      'Give me your order code — it looks like SOR-A5EVGI and is on your confirmation email — and I’ll tell you exactly where it is.',
      'You can also look it up yourself on the order tracking page, or sign in to see every order you’ve placed.',
      'Most orders are dispatched within one business day and arrive the next working day after that. If yours is past that and you haven’t heard from us, get a representative on it rather than waiting — that is usually a five-minute fix at our end.',
    ],
    keywords: ['track', 'tracking', 'where is my order', 'order status', 'not arrived', 'late', 'delayed', 'missing', 'lost', 'hasnt arrived', "hasn't arrived", 'still waiting', 'order number'],
    links: [{ label: 'Track your order', href: '/track-order' }],
    related: ['shipping-tracking', 'contact-human', 'order-damaged'],
  },
  {
    id: 'order-damaged',
    topic: 'account',
    question: 'My order arrived damaged or wrong',
    answer: [
      'You’re covered, and this is worth doing straight away: claims need to be submitted within 48 hours of delivery, with photos of the packaging, the shipping label and the affected product.',
      'Once reviewed and approved, you get a full refund or a replacement — your choice. Refunds go back to the original payment method through STRABL, typically initiated within 3–5 business days, with your bank usually taking another 5–10 on top.',
      'Send the photos to a representative now and we’ll start it.',
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
      'Before dispatch, an order can be cancelled. Once it has been dispatched it can’t be — at that point it falls under the returns terms instead.',
      'Because these are cold-chain research compounds, products that have left dispatch cannot be physically returned, with one exception: anything arriving damaged, defective or incorrect is eligible for a refund or replacement. Opened or altered products aren’t eligible unless the fault is ours or the carrier’s.',
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
      'It also means there are questions we won’t answer — dosing, administration, protocols, anything about use in a person. Buyers are responsible for ensuring their intended use is lawful where they are.',
    ],
    keywords: ['research use', 'ruo', 'what does research use only mean', 'in vitro', 'in-vitro'],
    links: [{ label: 'Legal status by compound', href: '/legal' }],
    related: ['compliance-where', 'compliance-who'],
  },
  {
    id: 'compliance-where',
    topic: 'compliance',
    question: 'Is it legal where I am, and will it clear customs?',
    answer: [
      'That depends on the compound and on your country, and it is genuinely your call to make rather than ours — you are responsible for ensuring what you order is lawful where you are, and for any import requirements at your end.',
      'We publish a compliance hub covering how UK and UAE law treats research-use peptides, with a page per compound. It is a general overview written to help you ask the right questions, not legal advice, and it is not a substitute for checking your own position.',
      'On customs specifically: we dispatch from the UAE and ship within the UAE, so most orders never cross a border. Duties, taxes and clearance are the recipient’s responsibility where they do apply, and we can’t guarantee any particular customs outcome.',
    ],
    keywords: ['legal', 'legality', 'law', 'lawful', 'allowed', 'permitted', 'banned', 'illegal', 'regulation', 'regulated', 'mhra', 'fda', 'licence', 'license', 'approved', 'customs', 'import', 'duty', 'duties', 'seized', 'clearance', 'border'],
    links: [{ label: 'Legal & compliance hub', href: '/legal' }],
    related: ['compliance-ruo', 'shipping-uk'],
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
      'Of course — that is always available, and you never have to work through me first.',
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
  greeting: 'Hi — I can check stock and prices, look up a batch certificate, tell you where an order is, or answer questions on testing, shipping and storage. Or put you straight through to a person, whenever you want.',
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
      greeting: 'Anything holding up your order? Payment, shipping or something on the compounds themselves — ask, or I’ll get a person on it right now.',
      suggested: ['order-payment', 'shipping-times', 'shipping-uk', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/track-order'),
    context: {
      label: 'Order tracking',
      greeting: 'Chasing an order? Paste your order code — it looks like SOR-A5EVGI — and I’ll tell you where it is.',
      suggested: ['order-track', 'shipping-tracking', 'order-damaged', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/certificates'),
    context: {
      label: 'Certificate library',
      greeting: 'Looking up a batch? Type the lot number printed on your vial and I’ll find its certificate. If it doesn’t come back, tell me — that’s something we want to know about.',
      suggested: ['coa-find', 'coa-what', 'coa-purity', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/products/category/'),
    context: {
      label: 'Catalogue',
      greeting: 'Browsing this category? Ask me what’s in stock or what something costs, or I can explain how the batch testing and documentation work.',
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
      greeting: 'Ask me what’s in stock, what something costs, or anything about testing, formats, shipping and bundles.',
      suggested: ['coa-what', 'order-bundles', 'shipping-times', 'order-how'],
    },
  },
  {
    match: p => p.startsWith('/uk'),
    context: {
      label: 'UK',
      greeting: 'UK dispatch isn’t open yet, but everything else is. Ask me anything about how we test and document batches — or join the launch list.',
      suggested: ['shipping-uk', 'coa-what', 'compliance-where', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/tools'),
    context: {
      label: 'Tools',
      greeting: 'The calculator handles reconstitution volumes and what each pen click contains. Ask if anything about it is unclear.',
      suggested: ['handling-pen-clicks', 'handling-reconstitution', 'handling-storage', 'coa-what'],
    },
  },
  {
    match: p => p.startsWith('/research') || p.startsWith('/guides') || p.startsWith('/compare') || p.startsWith('/legal'),
    context: {
      label: 'Research library',
      greeting: 'Reading up? I can help with supply, testing and documentation questions. For anything about use in a person, I can’t — and won’t.',
      suggested: ['compliance-ruo', 'compliance-where', 'coa-what', 'coa-purity'],
    },
  },
  {
    match: p => p.startsWith('/shipping'),
    context: {
      label: 'Shipping',
      greeting: 'Shipping questions — dispatch times, tracking, cold chain, or where we deliver?',
      suggested: ['shipping-times', 'shipping-tracking', 'shipping-cold', 'shipping-uk'],
    },
  },
  {
    match: p => p.startsWith('/refund-policy') || p.startsWith('/terms') || p.startsWith('/privacy'),
    context: {
      label: 'Policies',
      greeting: 'If something has gone wrong with an order, don’t work through the policy page — tell me what happened and I’ll route it.',
      suggested: ['order-damaged', 'order-refund', 'order-track', 'contact-human'],
    },
  },
  {
    match: p => p.startsWith('/contact') || p.startsWith('/faq'),
    context: {
      label: 'Support',
      greeting: 'Ask me anything — or skip straight to a person, which is often faster.',
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
        greeting: `Looking at ${name}? I can check its stock and price, pull its batch certificate, or cover storage, formats and shipping — or get a person to you.`,
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
  | { kind: 'lookup'; request: LookupRequest }
  | { kind: 'match'; faq: Faq }
  | { kind: 'ambiguous'; faqs: Faq[] }
  | { kind: 'none' }

/**
 * Damerau–Levenshtein distance, capped for speed. Used only to forgive typos
 * in longer words, where a near-miss is overwhelmingly likely to be a
 * misspelling rather than a different word.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr: number[] = []
  let prevRow: number[] = []
  for (let i = 1; i <= a.length; i++) {
    curr = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      // Transposition ("purtiy" -> "purity") counts as one edit.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prevRow[j - 2] + 1)
      }
      curr[j] = v
      if (v < best) best = v
    }
    if (best > max) return max + 1
    prevRow = prev
    prev = curr
  }
  return prev[b.length]
}

/** How much misspelling to forgive for a word of this length. */
function allowedTypos(len: number): number {
  if (len >= 10) return 2
  if (len >= 5) return 1
  return 0
}

function tokenize(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9+]+/i).filter(Boolean)
}

/** Whole-word (or whole-phrase) presence, so "water" never matches "underwater". */
function containsWord(haystackTokens: string[], needle: string): boolean {
  const needleTokens = tokenize(needle)
  if (needleTokens.length === 0) return false
  if (needleTokens.length === 1) return haystackTokens.includes(needleTokens[0])
  for (let i = 0; i + needleTokens.length <= haystackTokens.length; i++) {
    let ok = true
    for (let j = 0; j < needleTokens.length; j++) {
      if (haystackTokens[i + j] !== needleTokens[j]) { ok = false; break }
    }
    if (ok) return true
  }
  return false
}

/** Same, but forgiving a typo in any single-word keyword. */
function containsFuzzyWord(haystackTokens: string[], needle: string): boolean {
  const needleTokens = tokenize(needle)
  if (needleTokens.length !== 1) return false
  const target = needleTokens[0]
  const budget = allowedTypos(target.length)
  if (budget === 0) return false
  return haystackTokens.some(
    t => Math.abs(t.length - target.length) <= budget && editDistance(t, target, budget) <= budget
  )
}

/** Weak, generic words that shouldn't decide a match on their own. */
const LOW_VALUE_WORDS = new Set(['water', 'order', 'test', 'grade', 'lab', 'keep', 'help', 'code'])

/**
 * Deterministic free-text matching. No model, no embeddings, no network.
 *
 * Scoring is intentionally simple and inspectable: a whole-word keyword hit is
 * worth more than a typo-forgiven one, which is worth more than a hit on the
 * question text; longer keywords beat shorter ones (so "bacteriostatic"
 * outranks an incidental "water"); and a clear leader wins outright while a
 * close field is offered as a choice rather than guessed at.
 *
 * Guessing wrong is worse than asking. A visitor who gets a confidently
 * irrelevant answer stops trusting the whole widget.
 */
export function matchFaq(input: string): MatchResult {
  const q = (input || '').toLowerCase().trim()
  if (!q) return { kind: 'none' }

  // Safety first, and it cannot be bypassed by dressing a dosing question up
  // as a storage question.
  if (isBlocked(q)) return { kind: 'blocked' }

  // Questions that need real data rather than written copy.
  const lookup = detectLookup(input)
  if (lookup) return { kind: 'lookup', request: lookup }

  const tokens = tokenize(q)

  const scored = FAQS.map(faq => {
    let score = 0
    for (const kw of faq.keywords) {
      const weight = 2 + Math.min(kw.length / 8, 2)
      if (containsWord(tokens, kw)) {
        score += LOW_VALUE_WORDS.has(kw) ? weight * 0.4 : weight
      } else if (containsFuzzyWord(tokens, kw)) {
        score += (LOW_VALUE_WORDS.has(kw) ? weight * 0.4 : weight) * 0.6
      }
    }
    const questionWords = tokenize(faq.question).filter(w => w.length > 3)
    for (const w of questionWords) {
      if (tokens.includes(w)) score += 0.6
    }
    return { faq, score }
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return { kind: 'none' }

  // A single weak signal — one short, generic keyword — is not an answer.
  // Better to admit it and offer a person than to confidently misfire.
  if (scored[0].score < 1.6) return { kind: 'none' }

  if (scored.length === 1 || scored[0].score >= scored[1].score * 1.5) {
    return { kind: 'match', faq: scored[0].faq }
  }
  return { kind: 'ambiguous', faqs: scored.slice(0, 3).map(x => x.faq) }
}

export const NO_MATCH_ANSWER: string[] = [
  'I don’t have a pre-written answer for that one, and I’d rather say so than guess.',
  'A representative can answer it properly — they’ll see what page you’re on and what we’ve covered so far, so you won’t have to start again.',
]

/** Shown while a live lookup is in flight. */
export const LOOKUP_PENDING_ANSWER = 'One moment — checking that now…'

/** Shown when the lookup service itself fails (network, outage). */
export const LOOKUP_ERROR_ANSWER: string[] = [
  'I couldn’t reach our records just then — that’s on us, not you.',
  'Try again in a moment, or let me put you through to a person who can look it up directly.',
]