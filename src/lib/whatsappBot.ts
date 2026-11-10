// src/lib/whatsappBot.ts
//
// PEPCOLAB WHATSAPP ASSISTANT — SCRIPTED (Nov 2026)
// -------------------------------------------------
// Answers WhatsApp messages with the SAME written answers and live lookups as
// the website chat widget. No AI model writes anything: every reply is either
// a pre-written answer from lib/chatContent.ts (edit answers there and both
// the website chat and WhatsApp change together) or a fixed template filled
// with live data from lib/chatLookup.ts.
//
// How it looks on WhatsApp
//   - Short messages with tappable options: a "How can we help?" list instead
//     of "reply with a number" (typing the number still works).
//   - A product comes as its photo, price and stock with an "Order now"
//     button that opens the website cart with it already in. Several sizes →
//     pick one from a list, then the button. Payment stays on the website.
//   - Prices in AED; UK numbers see GBP only while UK selling is live
//     (UK_CHECKOUT_LIVE in lib/pricing.ts — paused since 10 Nov 2026).
//   - Typos in product names are tolerated (lib/chatLookup.ts).
//   - A lot number gives its certificate; an order code (then the order
//     email) gives the order's status.
//   - "Talk to a person" alerts the owner and the assistant stays quiet for
//     12 hours so staff can reply from the Kapso inbox.
//   Refusals (doses, use, effects) are the same word-for-word refusal as the
//   website, and GLP products, pens and nasal sprays are never offered here.
import { redis } from '@/lib/redis'
import {
  matchFaq, FAQ_BY_ID, REFUSAL_ANSWER, NO_MATCH_ANSWER, resolvePageContext,
  type Faq, type LookupRequest,
} from '@/lib/chatContent'
import { resolveLookup, type LookupAnswer, type ProductCard, type ProductCardVariant } from '@/lib/chatLookup'
import { alertOwner } from '@/lib/ownerAlert'
import { isUaeRestrictedHandle, isUaeRestrictedVariant } from '@/lib/uaeRestrictions'
import { shopifyImg } from '@/lib/utils'
import { toPlainText, type OutMessage } from '@/lib/kapso'
import { UK_CHECKOUT_LIVE } from '@/lib/pricing'

const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com').replace(/\/$/, '')
const MENU_TTL = 24 * 60 * 60
const PENDING_TTL = 60 * 60
const HISTORY_TTL = 3 * 24 * 60 * 60

const K = {
  menu: (p: string) => `wa:menu:${p}`,
  pending: (p: string) => `wa:pending:${p}`,
  history: (p: string) => `wa:hist:${p}`,
}

export interface BotInput {
  /** Sender, digits only with country code. */
  phone: string
  /** WhatsApp profile name, if any. */
  name: string
  text: string
  /** The id of the tapped button or list row, when they tapped one. */
  replyId?: string
}

export interface BotReply {
  messages: OutMessage[]
  /** The customer asked for a person; the route pauses the assistant. */
  handoff?: boolean
}

type Market = 'AE' | 'GB'

interface Ctx {
  phone: string
  name: string
  market: Market
}

const PERSON_RE = /^(person|human|agent|team|staff|someone|representative|support|talk to a person)$|\b(speak|talk|chat)\s+(to|with)\s+(a\s+)?(person|human|someone|agent|the team|staff)\b|\breal person\b/i
const GREETING_RE = /^(hi|hello|hey|hiya|menu|main menu|start|help|options|salam|salaam|assalam[a-z ]*|good (morning|afternoon|evening))[!. ]*$/i
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const ID = {
  faq: (id: string) => `faq:${id}`,
  product: (handle: string) => `prod:${handle}`,
  variant: (handle: string, variantId: string, qty: number) => `var:${handle}|${variantId}|${qty}`,
  person: 'act:person',
  menu: 'act:menu',
  shop: 'act:shop',
}

/** Short names for the list rows (WhatsApp allows 24 characters). */
const SHORT_LABEL: Record<string, string> = {
  'coa-what': 'Batch testing',
  'coa-find': 'Find a certificate',
  'coa-purity': 'Purity',
  'order-how': 'How to order',
  'order-payment': 'Payment methods',
  'order-bulk': 'Bulk orders',
  'order-bundles': 'Bundles & discounts',
  'shipping-times': 'Delivery times',
  'shipping-tracking': 'Tracking',
  'shipping-cold': 'Cold chain',
  'shipping-uk': 'Outside the UAE?',
  'handling-pen-clicks': 'Pen contents',
  'handling-storage': 'Storage',
  'handling-reconstitution': 'Concentration maths',
  'order-track': 'Where is my order?',
  'order-damaged': 'Damaged or wrong item',
  'order-refund': 'Returns & cancellations',
  'compliance-ruo': 'Research use only',
  'compliance-where': 'Legality & customs',
  'compliance-who': 'About PepcoLab',
  'contact-human': 'Talk to a person',
}

const ROW_PERSON = { id: ID.person, title: 'Talk to a person', description: 'Someone from the team replies here' }
const ROW_SHOP = { id: ID.shop, title: 'Browse products', description: 'What’s in stock, with prices' }

/* ── formatting ─────────────────────────────────────────────────────────── */

function fullUrl(href: string): string {
  return href.startsWith('http') ? href : `${SITE_URL}${href.startsWith('/') ? '' : '/'}${href}`
}

function money(amount: number, currency: string): string {
  const whole = Math.abs(amount - Math.round(amount)) < 0.005
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${whole ? Math.round(amount) : amount.toFixed(2)}`
  }
}

function firstName(name: string): string {
  const first = (name || '').split(/\s+/)[0]?.replace(/[^\p{L}'-]/gu, '') ?? ''
  return first.length >= 2 && first.length <= 20 ? first : ''
}

function numericId(gid: string): string | null {
  return String(gid).match(/(\d+)$/)?.[1] ?? null
}

function cartLink(variantId: string, qty: number): string {
  return `${SITE_URL}/cart?add=${variantId}:${qty}`
}

function faqRow(faq: Faq) {
  return { id: ID.faq(faq.id), title: SHORT_LABEL[faq.id] || faq.question, description: faq.question }
}

function faqsFor(ids: string[]): Faq[] {
  return ids.map((id) => FAQ_BY_ID[id]).filter(Boolean)
}

function popularIds(): string[] {
  return resolvePageContext('/').suggested
}

/** A list message; its row ids are kept so a typed "2" still works. */
async function list(
  ctx: Ctx,
  body: string,
  button: string,
  rows: { id: string; title: string; description?: string }[],
  footer?: string
): Promise<OutMessage> {
  const unique = rows.filter((r, i) => rows.findIndex((x) => x.id === r.id) === i).slice(0, 10)
  await redis.set(K.menu(ctx.phone), unique.map((r) => r.id), { ex: MENU_TTL })
  return { kind: 'list', body, button, rows: unique, footer }
}

function navButtons(body: string): OutMessage {
  return {
    kind: 'buttons',
    body,
    buttons: [
      { id: ID.menu, title: 'Main menu' },
      { id: ID.person, title: 'Talk to a person' },
    ],
  }
}

/* ── restricted products ────────────────────────────────────────────────── */

/**
 * GLP products, pens and nasal sprays are never offered on WhatsApp, in any
 * market. The catalogue lookup already leaves them out for the UAE; this is
 * the belt-and-braces check on the cards actually sent.
 */
function allowedCards(cards?: ProductCard[]): ProductCard[] {
  return (cards ?? [])
    .filter((c) => !isUaeRestrictedHandle(c.handle))
    .map((c) => ({ ...c, variants: c.variants.filter((v) => !isUaeRestrictedVariant(v.title)) }))
    .filter((c) => c.variants.length > 0)
}

const GLP_RE = /\b(glp|semaglutide|tirzepatide|retatrutide|cagrilintide|liraglutide)\b/i

const NOT_ON_WHATSAPP = 'I can’t help with that product here. For anything else — another product, an order, a certificate or storage — just ask.'

/* ── products ───────────────────────────────────────────────────────────── */

const TRUST_LINE = 'Batch-tested · certificate matched to the lot'

function variantLabel(v: ProductCardVariant): string {
  return v.title && v.title !== 'Standard' ? v.title : ''
}

function lowest(card: ProductCard): number {
  const prices = card.variants.filter((v) => v.available && v.price > 0).map((v) => v.price)
  return prices.length ? Math.min(...prices) : 0
}

function image(card: ProductCard): string | undefined {
  return card.image ? shopifyImg(card.image, 800) : undefined
}

/** The "Order now" button for one option of one product. */
function orderButton(card: ProductCard, v: ProductCardVariant, qty: number, withImage: boolean): OutMessage {
  const id = numericId(v.id)
  const label = variantLabel(v)
  const price = `${money(v.price, card.currency)}${qty > 1 ? ` × ${qty}` : ''}`
  return {
    kind: 'cta',
    imageUrl: withImage ? image(card) : undefined,
    body: [`*${card.title}*${label ? ` — ${label}` : ''}`, price, `In stock · ${TRUST_LINE.toLowerCase()}`].join('\n'),
    buttonText: 'Order now',
    url: id ? cartLink(id, qty) : fullUrl(card.href),
    footer: UK_CHECKOUT_LIVE ? 'Opens your cart — you pay on the website' : 'UAE delivery only · you pay on the website',
  }
}

async function productMessages(ctx: Ctx, card: ProductCard, qty = 1): Promise<OutMessage[]> {
  const page = fullUrl(card.href)

  if (card.paymentLinkOnly) {
    return [{
      kind: 'cta',
      imageUrl: image(card),
      body: `*${card.title}*\nOrdered from its product page — pick the strength and quantity there.`,
      buttonText: 'View product',
      url: page,
    }]
  }

  const available = card.variants.filter((v) => v.available)
  if (!card.inStock || available.length === 0) {
    return [{
      kind: 'cta',
      imageUrl: image(card),
      body: `*${card.title}* is out of stock right now.\nLeave your email on the product page and you’ll hear the day it’s back.`,
      buttonText: 'Get restock alert',
      url: page,
    }]
  }

  if (available.length === 1) return [orderButton(card, available[0], qty, true)]

  const from = lowest(card)
  const headline = `*${card.title}*\nIn stock · ${available.length} options from ${money(from, card.currency)}\n${TRUST_LINE}`
  const rows = available.map((v) => ({
    id: ID.variant(card.handle, numericId(v.id) ?? v.id, qty),
    title: variantLabel(v) || 'Standard',
    description: `${money(v.price, card.currency)}${qty > 1 ? ` × ${qty}` : ''}`,
  }))
  const img = image(card)
  if (img) {
    return [
      { kind: 'image', url: img, caption: headline },
      await list(ctx, 'Which option would you like?', 'Choose option', rows),
    ]
  }
  return [await list(ctx, `${headline}\n\nWhich option would you like?`, 'Choose option', rows)]
}

async function productChoices(ctx: Ctx, body: string, cards: ProductCard[]): Promise<OutMessage> {
  return list(
    ctx,
    body,
    'See products',
    cards.map((c) => {
      const avail = c.variants.some((v) => v.available) && c.inStock
      const from = lowest(c)
      return {
        id: ID.product(c.handle),
        title: c.title,
        description: avail ? (from ? `From ${money(from, c.currency)} · in stock` : 'In stock') : 'Out of stock',
      }
    })
  )
}

/** One product, looked up again by handle (after a tap on a list row). */
async function productByHandle(ctx: Ctx, handle: string): Promise<{ answer: LookupAnswer; card?: ProductCard }> {
  const answer = await resolveLookup('product', handle, { market: ctx.market })
  const card = allowedCards(answer.cards).find((c) => c.handle === handle) ?? allowedCards(answer.cards)[0]
  return { answer, card }
}

/* ── answers ────────────────────────────────────────────────────────────── */

/** A written answer, then the related questions as a list. */
async function answerFaq(ctx: Ctx, faq: Faq): Promise<BotReply> {
  if (faq.id === 'contact-human') return { messages: [], handoff: true }
  // GLP products are never offered on WhatsApp, so paragraphs about them are
  // left out here (the website shows them in full).
  const text = faq.answer.filter((para) => !GLP_RE.test(para)).join('\n\n') || faq.answer.join('\n\n')
  const relatedRows = [...faqsFor(faq.related ?? []).map(faqRow), ROW_PERSON]
  return { messages: await withFollowUp(ctx, text, faq.links ?? [], relatedRows) }
}

/**
 * Text + links + follow-up options, in as few messages as possible:
 *   no links      → one list message (the answer is its body)
 *   one link      → a link button, then the options
 *   several links → text with the links written out, then the options
 */
async function withFollowUp(
  ctx: Ctx,
  text: string,
  links: { label: string; href: string }[],
  rows: { id: string; title: string; description?: string }[]
): Promise<OutMessage[]> {
  const shownLinks = links.slice(0, 4)
  if (shownLinks.length === 0 && text.length <= 1000) {
    return [await list(ctx, text, 'More help', rows)]
  }
  const first: OutMessage =
    shownLinks.length === 1 && text.length <= 1000
      ? { kind: 'cta', body: text, buttonText: shownLinks[0].label, url: fullUrl(shownLinks[0].href) }
      : { kind: 'text', text: [text, shownLinks.map((l) => `${l.label}: ${fullUrl(l.href)}`).join('\n')].filter(Boolean).join('\n\n') }
  return [first, await list(ctx, 'Anything else?', 'More help', rows)]
}

async function answerLookup(ctx: Ctx, answer: LookupAnswer, quantity?: number): Promise<BotReply> {
  const qty = answer.quantity ?? quantity ?? 1

  // Several products share the name → let them pick.
  const choices = allowedCards(answer.choices)
  if (choices.length > 1) {
    return { messages: [await productChoices(ctx, 'A few products match that. Which one?', choices)] }
  }
  if (choices.length === 1) return { messages: await productMessages(ctx, choices[0], qty) }

  if (answer.cards?.length) {
    const cards = allowedCards(answer.cards)
    if (!cards.length) {
      return {
        messages: [{
          kind: 'buttons',
          body: NOT_ON_WHATSAPP,
          buttons: [{ id: ID.shop, title: 'Browse products' }, { id: ID.person, title: 'Talk to a person' }],
        }],
      }
    }
    if (cards.length === 1) return { messages: await productMessages(ctx, cards[0], qty) }
    // The catalogue's own headline counts products before the WhatsApp
    // filter, so the count is restated from what is actually listed.
    const headline = (answer.lines[0] || '').replace(/^\d+ in stock(.*?)(, showing \d+)?:$/, `${cards.length} in stock$1:`)
    const intro = [headline, 'Tap one for its photo, options and an Order button.'].filter(Boolean).join('\n')
    return { messages: [await productChoices(ctx, intro, cards)] }
  }

  const related = faqsFor((answer.related ?? []).filter((id) => id !== 'contact-human')).map(faqRow)
  return { messages: await withFollowUp(ctx, answer.lines.join('\n\n'), answer.links ?? [], [...related, ROW_SHOP, ROW_PERSON]) }
}

async function welcome(ctx: Ctx, opener?: Pick<Opener, 'intro' | 'faqIds'>): Promise<BotReply> {
  const name = firstName(ctx.name)
  const hello = `Hi${name ? ` ${name}` : ''} 👋`
  const intro = opener?.intro || `Welcome to PepcoLab. I can show prices and stock, send you a link to order, find a batch certificate or check on your order.${UK_CHECKOUT_LIVE ? '' : ' We currently deliver within the UAE only.'}`
  const ids = opener?.faqIds.length ? opener.faqIds : popularIds()
  return {
    messages: [
      await list(
        ctx,
        `${hello} ${intro}\n\nType a product name, a lot number or your order code (SOR-…) any time.`,
        'How can we help?',
        [...faqsFor(ids).map(faqRow), ROW_SHOP, ROW_PERSON]
      ),
    ],
  }
}

async function noMatch(ctx: Ctx): Promise<BotReply> {
  return {
    messages: [
      await list(
        ctx,
        'Sorry, I don’t have an answer for that one. Type a product name, a lot number or your order code — or choose below.',
        'See options',
        [...faqsFor(popularIds()).map(faqRow), ROW_SHOP, ROW_PERSON]
      ),
    ],
  }
}

async function shop(ctx: Ctx): Promise<BotReply> {
  const answer = await resolveLookup('search', '', { filters: {}, market: ctx.market })
  return answerLookup(ctx, answer)
}

/* ── openers ────────────────────────────────────────────────────────────── */
// "Hi PepcoLab, I have a question before I check out on the website." is the
// message the website's own WhatsApp buttons pre-fill (lib/whatsapp.ts), so it
// must never get "Sorry, I don't have an answer". The greeting and "I have a
// question" lead are taken off; what is left is answered, and a message that
// is only an opener gets a welcome suited to where the customer came from.
const OPENER_RE = /^(hi|hello|hey|hiya|dear|(as+)?sala+m[a-z]*(\s+(wa\s*)?[ao]?la[iy]kum)?|good\s+(morning|afternoon|evening))\b[\s,!.:-]*((pepco\s?lab|team|there|all)\b[\s,!.:-]*)?/i
const QUESTION_LEAD_RE = /^(i\s+(have|had|got)\s+(a\s+)?(quick\s+|small\s+)?(question|query|enquiry|inquiry)s?|quick question|(can|could|may)\s+i\s+ask(\s+(you|something|a question))?|i'?d\s+like\s+to\s+ask(\s+something|\s+a question)?)[\s,!.:?-]*/i

interface Opener {
  /** What is left after the greeting and question lead; '' when nothing. */
  rest: string
  intro: string
  faqIds: string[]
  /** Came from the website chat's "continue on WhatsApp" button. */
  handoff?: boolean
}

const OPENER_CONTEXTS: { test: RegExp; intro: string; faqIds: string[]; handoff?: boolean }[] = [
  {
    test: /chatting with your website assistant|continue here/i,
    intro: '',
    faqIds: [],
    handoff: true,
  },
  {
    test: /^(about\s+)?before\s+i\s+check\s*out\b.*$/i,
    intro: 'Happy to help before you check out — payment, delivery or anything in your cart.',
    faqIds: ['order-payment', 'shipping-times', 'shipping-uk', 'order-how'],
  },
  {
    test: /^about\s+(a\s+)?product.?s?\s+documentation\s+or\s+delivery\b.*$/i,
    intro: 'Happy to help with documentation or delivery. Send a lot number and I’ll find its certificate.',
    faqIds: ['coa-find', 'coa-what', 'shipping-times', 'shipping-uk'],
  },
  {
    test: /^about\s+availability\s+or\s+documentation\b.*$/i,
    intro: 'Happy to help. Type a product name for its stock and prices, or send a lot number for its certificate.',
    faqIds: ['coa-find', 'coa-what', 'shipping-times', 'order-how'],
  },
]

function parseOpener(msg: string): Opener | null {
  const normalised = msg.replace(/[’‘]/g, "'").trim()
  const greeted = normalised.match(OPENER_RE)
  let rest = greeted ? normalised.slice(greeted[0].length) : normalised
  // "I'm Sarah." after the greeting is a name, not a question.
  rest = rest.replace(/^(i'?m|i\s+am|this\s+is|my\s+name\s+is)\s+[^.,!?]{1,40}[.,!]\s*/i, '')
  const lead = rest.match(QUESTION_LEAD_RE)
  if (lead) rest = rest.slice(lead[0].length)
  if (!greeted && !lead) return null

  for (const c of OPENER_CONTEXTS) {
    if (c.test.test(rest) || (c.handoff && c.test.test(normalised))) {
      return { rest: '', intro: c.intro, faqIds: c.faqIds, handoff: c.handoff }
    }
  }
  rest = rest.replace(/^[\s,!.:?-]+|[\s.!]+$/g, '').replace(/^(about|regarding|on)\s+/i, '').trim()
  return { rest, intro: '', faqIds: [] }
}

/* ── history and handoff ────────────────────────────────────────────────── */

async function remember(phone: string, role: 'customer' | 'assistant', text: string): Promise<void> {
  const h = ((await redis.get<string[]>(K.history(phone))) ?? []).slice(-11)
  h.push(`${role === 'customer' ? 'Customer' : 'Assistant'}: ${text.slice(0, 400)}`)
  await redis.set(K.history(phone), h, { ex: HISTORY_TTL })
}

/** Alerts the owner with the recent conversation. */
export async function handOff(phone: string, name: string, reason: string): Promise<string> {
  const history = (await redis.get<string[]>(K.history(phone))) ?? []
  await alertOwner({
    title: `🙋 WhatsApp: ${name || `+${phone}`} wants a person`,
    body: `${reason}\n\nCustomer: ${name || '(no name)'} +${phone}\nReply from the Kapso inbox. The assistant stays quiet on this chat for 12 hours.\n\nConversation:\n${history.join('\n').slice(-1500)}`,
  })
  return 'Thanks — I’ve passed this to the PepcoLab team and someone will reply here shortly.'
}

/* ── entry point ────────────────────────────────────────────────────────── */

/** GBP for UK numbers only while UK selling is live (lib/pricing.ts). */
export function marketForPhone(phone: string): Market {
  return UK_CHECKOUT_LIVE && phone.replace(/\D/g, '').startsWith('44') ? 'GB' : 'AE'
}

export async function botReply(input: BotInput): Promise<BotReply> {
  const ctx: Ctx = { phone: input.phone, name: input.name, market: marketForPhone(input.phone) }
  const msg = input.text.trim()
  await remember(ctx.phone, 'customer', msg)
  const reply = await route(ctx, msg, input.replyId)
  if (reply.handoff) {
    reply.messages = [{ kind: 'text', text: await handOff(ctx.phone, ctx.name, `Last message: "${msg}"`) }]
  }
  await remember(ctx.phone, 'assistant', reply.messages.map(toPlainText).join('\n').slice(0, 400))
  return reply
}

/** A tapped button or list row (or a typed number standing in for one). */
async function routeId(ctx: Ctx, id: string): Promise<BotReply | null> {
  if (id === ID.person) return { messages: [], handoff: true }
  if (id === ID.menu) return welcome(ctx)
  if (id === ID.shop) return shop(ctx)

  if (id.startsWith('faq:')) {
    const faq = FAQ_BY_ID[id.slice(4)]
    return faq ? answerFaq(ctx, faq) : null
  }

  if (id.startsWith('prod:')) {
    const { card } = await productByHandle(ctx, id.slice(5))
    if (!card) return { messages: [navButtons('Sorry, that product isn’t available any more.')] }
    return { messages: await productMessages(ctx, card) }
  }

  if (id.startsWith('var:')) {
    const [handle, variantId, qtyRaw] = id.slice(4).split('|')
    const qty = Math.min(Math.max(parseInt(qtyRaw, 10) || 1, 1), 10)
    const { card } = await productByHandle(ctx, handle)
    const v = card?.variants.find((x) => numericId(x.id) === variantId)
    if (!card || !v) return { messages: [navButtons('Sorry, that option isn’t available any more.')] }
    if (!v.available) {
      return { messages: [navButtons(`${card.title}${variantLabel(v) ? ` ${variantLabel(v)}` : ''} has just sold out. Pick another option or ask the team.`)] }
    }
    return { messages: [orderButton(card, v, qty, false)] }
  }
  return null
}

async function route(ctx: Ctx, original: string, replyId?: string): Promise<BotReply> {
  if (replyId) {
    const byId = await routeId(ctx, replyId)
    if (byId) return byId
  }

  let msg = original

  // A number answers the last list.
  if (/^\d{1,2}$/.test(msg)) {
    const ids = (await redis.get<string[]>(K.menu(ctx.phone))) ?? []
    const id = ids[Number(msg) - 1]
    if (id) {
      const byId = await routeId(ctx, id)
      if (byId) return byId
    }
  }

  if (PERSON_RE.test(msg)) return { messages: [], handoff: true }
  if (GREETING_RE.test(msg)) return welcome(ctx)

  // "Hi PepcoLab, I have a question…" — answer what follows the opener, and
  // welcome the customer when nothing does.
  const opener = parseOpener(msg)
  if (opener) {
    if (opener.handoff) return { messages: [], handoff: true }
    if (!opener.rest) return welcome(ctx, opener)
    msg = opener.rest
    if (PERSON_RE.test(msg)) return { messages: [], handoff: true }
  }
  const unmatched = () => (opener ? welcome(ctx) : noMatch(ctx))

  // The email for an order lookup that asked for one.
  const pending = await redis.get<LookupRequest>(K.pending(ctx.phone))
  if (pending && EMAIL_RE.test(msg)) {
    await redis.del(K.pending(ctx.phone))
    const answer = await resolveLookup(pending.intent, pending.query, { providedEmail: msg.toLowerCase(), market: ctx.market })
    return answerLookup(ctx, answer)
  }

  const result = matchFaq(msg)
  switch (result.kind) {
    case 'blocked':
      return { messages: [navButtons(REFUSAL_ANSWER.join('\n\n'))] }

    case 'action': {
      const r = result.request
      if (r.kind === 'view-cart') {
        return {
          messages: [{
            kind: 'cta',
            body: 'Your cart is on the website. Tell me a product name and I’ll send a button that adds it.',
            buttonText: 'Open your cart',
            url: `${SITE_URL}/cart`,
          }],
        }
      }
      if (r.kind === 'add-to-cart' && !r.query) {
        return { messages: [{ kind: 'buttons', body: 'Which product would you like? Type its name, e.g. "tesamorelin" or "ghk-cu".', buttons: [{ id: ID.shop, title: 'Browse products' }] }] }
      }
      const answer =
        r.kind === 'search'
          ? await resolveLookup('search', '', { filters: r.filters ?? {}, market: ctx.market })
          : r.kind === 'reorder'
            ? await resolveLookup('reorder', '', { market: ctx.market })
            : await resolveLookup('add-to-cart', r.query ?? '', { quantity: r.quantity ?? 1, market: ctx.market })
      return answerLookup(ctx, answer, r.quantity)
    }

    case 'lookup': {
      const answer = await resolveLookup(result.request.intent, result.request.query, { market: ctx.market })
      if (answer.needsEmail) {
        await redis.set(K.pending(ctx.phone), result.request, { ex: PENDING_TTL })
        return { messages: [{ kind: 'text', text: 'Sure — what email address did you use for that order?' }] }
      }
      if (result.request.intent === 'product-guess' && answer.lines.join(' ') === NO_MATCH_ANSWER.join(' ')) {
        return unmatched()
      }
      return answerLookup(ctx, answer)
    }

    case 'match':
      return answerFaq(ctx, result.faq)

    case 'ambiguous':
      return { messages: [await list(ctx, 'A few things could match that. Which did you mean?', 'Choose one', [...result.faqs.map(faqRow), ROW_PERSON])] }

    case 'smalltalk':
      return { messages: [await list(ctx, result.lines.join('\n\n'), 'How can we help?', [...faqsFor(popularIds()).map(faqRow), ROW_SHOP, ROW_PERSON])] }

    default:
      return unmatched()
  }
}
