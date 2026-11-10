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
// What a customer can do
//   - Ask a question in their own words; the matcher picks the written answer.
//   - Reply with a number to open one of the suggested follow-up questions.
//   - Type a product name ("tesamorelin", "price of ghk-cu") to get options,
//     prices and stock, each option with a link that opens the website cart
//     with that item in it. Payment happens on the website.
//   - Send a lot number for its certificate, or an order code (then the order
//     email) for the order's status.
//   - Type "person" to reach the team: the owner is alerted and the assistant
//     stays quiet for 12 hours so staff can reply from the Kapso inbox.
//   Refusals (doses, use, effects) are the same word-for-word refusal as the
//   website, and the catalogue it searches excludes GLP products, pens and
//   nasal sprays (lib/chatLookup.ts → lib/uaeRestrictions.ts).
import { redis } from '@/lib/redis'
import {
  matchFaq, FAQ_BY_ID, REFUSAL_ANSWER, NO_MATCH_ANSWER, resolvePageContext,
  type Faq, type LookupRequest,
} from '@/lib/chatContent'
import { resolveLookup, type LookupAnswer, type ProductCard } from '@/lib/chatLookup'
import { alertOwner } from '@/lib/ownerAlert'
import { isUaeRestrictedHandle, isUaeRestrictedVariant } from '@/lib/uaeRestrictions'

const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com').replace(/\/$/, '')
const MENU_TTL = 24 * 60 * 60
const PENDING_TTL = 60 * 60
const HISTORY_TTL = 3 * 24 * 60 * 60

const K = {
  menu: (p: string) => `wa:menu:${p}`,
  pending: (p: string) => `wa:pending:${p}`,
  history: (p: string) => `wa:hist:${p}`,
}

export interface BotReply {
  text: string
  /** The customer asked for a person; the route pauses the assistant. */
  handoff?: boolean
}

const PERSON_RE = /^(person|human|agent|team|staff|someone|representative|support)$|\b(speak|talk|chat)\s+(to|with)\s+(a\s+)?(person|human|someone|agent|the team|staff)\b|\breal person\b/i
const GREETING_RE = /^(hi|hello|hey|hiya|menu|start|help|options|salam|salaam|assalam[a-z ]*|good (morning|afternoon|evening))[!. ]*$/i
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

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
    intro: 'Hi — happy to help before you check out. Ask about payment, delivery or anything in your cart, or type a product name for its prices and stock.',
    faqIds: ['order-payment', 'shipping-times', 'shipping-uk', 'order-how'],
  },
  {
    test: /^about\s+(a\s+)?product.?s?\s+documentation\s+or\s+delivery\b.*$/i,
    intro: 'Hi — happy to help with documentation or delivery. Send a lot number for its certificate, or type a product name for its prices and stock.',
    faqIds: ['coa-find', 'coa-what', 'shipping-times', 'shipping-uk'],
  },
  {
    test: /^about\s+availability\s+or\s+documentation\b.*$/i,
    intro: 'Hi — happy to help. Type a product name for its stock and prices, or send a lot number for its certificate.',
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

  for (const ctx of OPENER_CONTEXTS) {
    if (ctx.test.test(rest) || (ctx.handoff && ctx.test.test(normalised))) {
      return { rest: '', intro: ctx.intro, faqIds: ctx.faqIds, handoff: ctx.handoff }
    }
  }
  rest = rest.replace(/^[\s,!.:?-]+|[\s.!]+$/g, '').replace(/^(about|regarding|on)\s+/i, '').trim()
  return { rest, intro: '', faqIds: [] }
}

/* ── formatting ─────────────────────────────────────────────────────────── */

function fullUrl(href: string): string {
  return href.startsWith('http') ? href : `${SITE_URL}${href.startsWith('/') ? '' : '/'}${href}`
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

/** Product cards become options, each with its own add-to-cart link. */
function formatCards(cards: ProductCard[], quantity = 1): string {
  return cards
    .slice(0, 4)
    .map((card) => {
      if (card.paymentLinkOnly) return `*${card.title}*\nOrder from the product page: ${fullUrl(card.href)}`
      const rows = card.variants.map((v) => {
        if (!v.available) return `- ${v.title} — ${money(v.price, card.currency)} (out of stock)`
        const id = String(v.id).match(/(\d+)$/)?.[1]
        const link = id ? `${SITE_URL}/cart?add=${id}:${quantity}` : fullUrl(card.href)
        return `- ${v.title} — ${money(v.price, card.currency)}${quantity > 1 ? ` × ${quantity}` : ''}\n  Order: ${link}`
      })
      return `*${card.title}*\n${rows.join('\n')}`
    })
    .join('\n\n')
}

function formatLinks(links?: { label: string; href: string }[]): string {
  return (links ?? []).slice(0, 4).map((l) => `${l.label}: ${fullUrl(l.href)}`).join('\n')
}

/** A numbered follow-up menu; the ids are kept so "2" opens the second. */
async function menu(phone: string, faqs: Faq[], heading = 'Reply with a number:'): Promise<string> {
  const list = faqs.filter(Boolean).slice(0, 8)
  if (!list.length) return ''
  await redis.set(K.menu(phone), list.map((f) => f.id), { ex: MENU_TTL })
  return `${heading}\n${list.map((f, i) => `${i + 1}. ${f.question}`).join('\n')}`
}

function join(...parts: (string | undefined | null)[]): string {
  return parts.filter((p) => p && p.trim()).join('\n\n')
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

async function answerFaq(phone: string, faq: Faq): Promise<BotReply> {
  if (faq.id === 'contact-human') return { text: '', handoff: true }
  const related = (faq.related ?? []).map((id) => FAQ_BY_ID[id]).filter(Boolean)
  return {
    text: join(
      faq.answer.join('\n\n'),
      formatLinks(faq.links),
      await menu(phone, related, 'Related — reply with a number:'),
      'Or type "person" to reach the team.'
    ),
  }
}

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

const NOT_ON_WHATSAPP = 'I can’t help with that product here. For anything else — another product, an order, a certificate or storage — just ask.'

async function answerLookup(phone: string, answer: LookupAnswer, quantity?: number): Promise<BotReply> {
  const cards = allowedCards(answer.cards)
  if (answer.cards?.length && !cards.length) return { text: NOT_ON_WHATSAPP }
  // The option list already shows each price; drop the "Priced …" summary.
  const lines = cards.length ? answer.lines.map((l) => l.replace(/\s*Priced .*?\.(?=\s|$)/, '')) : answer.lines
  answer = { ...answer, cards, lines }
  const related = (answer.related ?? []).map((id) => FAQ_BY_ID[id]).filter(Boolean)
  return {
    text: join(
      answer.lines.join('\n\n'),
      answer.cards?.length ? formatCards(answer.cards, answer.quantity ?? quantity ?? 1) : '',
      formatLinks(answer.links),
      answer.cards?.length ? 'Tap an Order link: it opens the PepcoLab cart with that item in it, and you pay on the website.' : '',
      await menu(phone, related)
    ),
  }
}

async function welcome(phone: string, opener?: Pick<Opener, 'intro' | 'faqIds'>): Promise<BotReply> {
  const ids = opener?.faqIds.length ? opener.faqIds : resolvePageContext('/').suggested
  const faqs = ids.map((id) => FAQ_BY_ID[id]).filter(Boolean)
  return {
    text: join(
      opener?.intro || 'Hi — this is PepcoLab. I can show prices and stock, send you a link to order, find a batch certificate, or check where your order is.',
      'Type a product name (e.g. "tesamorelin"), a lot number, or your order code (SOR-…).',
      await menu(phone, faqs, 'Or reply with a number:'),
      'Type "person" at any time to reach the team.'
    ),
  }
}

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

export async function botReply(phone: string, name: string, text: string): Promise<BotReply> {
  const msg = text.trim()
  await remember(phone, 'customer', msg)
  const reply = await route(phone, name, msg)
  if (reply.handoff) reply.text = await handOff(phone, name, `Last message: "${msg}"`)
  await remember(phone, 'assistant', reply.text)
  return reply
}

async function route(phone: string, name: string, original: string): Promise<BotReply> {
  let msg = original
  // A number answers the last menu.
  if (/^\d{1,2}$/.test(msg)) {
    const ids = (await redis.get<string[]>(K.menu(phone))) ?? []
    const faq = FAQ_BY_ID[ids[Number(msg) - 1]]
    if (faq) return answerFaq(phone, faq)
  }

  if (PERSON_RE.test(msg)) return { text: '', handoff: true }
  if (GREETING_RE.test(msg)) return welcome(phone)

  // "Hi PepcoLab, I have a question…" — answer what follows the opener, and
  // welcome the customer when nothing does.
  const opener = parseOpener(msg)
  if (opener) {
    if (opener.handoff) return { text: '', handoff: true }
    if (!opener.rest) return welcome(phone, opener)
    msg = opener.rest
    if (PERSON_RE.test(msg)) return { text: '', handoff: true }
  }
  const unmatched = () => (opener ? welcome(phone) : noMatch(phone))

  // The email for an order lookup that asked for one.
  const pending = await redis.get<LookupRequest>(K.pending(phone))
  if (pending && EMAIL_RE.test(msg)) {
    await redis.del(K.pending(phone))
    const answer = await resolveLookup(pending.intent, pending.query, { providedEmail: msg.toLowerCase() })
    return answerLookup(phone, answer)
  }

  const result = matchFaq(msg)
  switch (result.kind) {
    case 'blocked':
      return { text: REFUSAL_ANSWER.join('\n\n') }

    case 'action': {
      const r = result.request
      if (r.kind === 'view-cart') {
        return { text: `Your cart is on the website: ${SITE_URL}/cart\nTell me a product name and I’ll send you a link that adds it.` }
      }
      if (r.kind === 'add-to-cart' && !r.query) {
        return { text: 'Which product would you like? Type its name, e.g. "tesamorelin" or "ghk-cu".' }
      }
      const answer =
        r.kind === 'search'
          ? await resolveLookup('search', '', { filters: r.filters ?? {} })
          : r.kind === 'reorder'
            ? await resolveLookup('reorder', '', {})
            : await resolveLookup('add-to-cart', r.query ?? '', { quantity: r.quantity ?? 1 })
      return answerLookup(phone, answer, r.quantity)
    }

    case 'lookup': {
      const answer = await resolveLookup(result.request.intent, result.request.query, {})
      if (answer.needsEmail) {
        await redis.set(K.pending(phone), result.request, { ex: PENDING_TTL })
      }
      if (result.request.intent === 'product-guess' && answer.lines.join(' ') === NO_MATCH_ANSWER.join(' ')) {
        return unmatched()
      }
      return answerLookup(phone, answer)
    }

    case 'match':
      return answerFaq(phone, result.faq)

    case 'ambiguous':
      return { text: join('A few things could match that.', await menu(phone, result.faqs, 'Which did you mean? Reply with a number:')) }

    case 'smalltalk': {
      const ctx = resolvePageContext('/')
      return { text: join(result.lines.join('\n\n'), await menu(phone, ctx.suggested.map((id) => FAQ_BY_ID[id]).filter(Boolean))) }
    }

    default:
      return unmatched()
  }
}

async function noMatch(phone: string): Promise<BotReply> {
  const ctx = resolvePageContext('/')
  return {
    text: join(
      'Sorry, I don’t have an answer for that one.',
      'Type a product name, a lot number or your order code — or type "person" and the team will reply here.',
      await menu(phone, ctx.suggested.map((id) => FAQ_BY_ID[id]).filter(Boolean), 'Popular questions — reply with a number:')
    ),
  }
}
