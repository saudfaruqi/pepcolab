// src/lib/chatAgent.ts
//
// WEBSITE CHAT AGENT (Nov 2026)
// -----------------------------
// The chat widget answers most messages from written FAQs and live lookups
// (lib/chatContent.ts, lib/chatLookup.ts). Anything those do not recognise
// used to get "I don't have an answer for that". It now goes to this agent: a
// Claude model with a small set of tools, so it can hold a real conversation
// while every fact it states still comes from the shop's own data.
//
// What it can do
//   - Find products, prices and stock (search_products), in the visitor's
//     currency, and show them as cards with Add buttons (show_products).
//   - Find a batch certificate by lot number or product (find_certificate).
//   - Report an order's status, given the order code AND the email it was
//     placed with (track_order) — same identity rule as the order lookup.
//   - Take a lead for bulk orders, quotes or a callback (capture_lead): saved
//     to the CRM and sent to the owner's WhatsApp and email.
//   - Hand the conversation to a person (request_human).
//
// What it can never do
//   - Put anything in the cart or take payment. Cards carry Add buttons the
//     customer presses; checkout stays on the website.
//   - Offer GLP / incretin products, pens or nasal sprays, in any market.
//     search_products leaves them out (lib/uaeRestrictions.ts lists).
//   - Talk about doses, use in people or animals, effects or outcomes. The
//     visitor's message is checked before the model sees it, and the model's
//     reply is checked before the visitor sees it (isBlocked); either hit
//     returns the standard refusal word for word.
import { buildSystemPrompt } from '@/lib/chatKnowledge'
import { getProducts } from '@/lib/shopify'
import { toCard, answerLot, resolveLookup, type ProductCard, type LookupAnswer } from '@/lib/chatLookup'
import { isBlocked, REFUSAL_ANSWER } from '@/lib/chatContent'
import { COA_BATCHES } from '@/app/coaData'
import { isUaeRestrictedBatch, isUaeRestrictedHandle, isUaeRestrictedVariant } from '@/lib/uaeRestrictions'
import { alertOwner } from '@/lib/ownerAlert'
import { upsertContact, logInteraction, type ContactInput } from '@/lib/crm/store'
import { isRateLimited } from '@/lib/rateLimit'

const MODEL = process.env.CHAT_AGENT_MODEL || 'claude-sonnet-5-5'
const MAX_TOKENS = 700
const MAX_TOOL_ROUNDS = 5
const MAX_CARDS = 3

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentContext {
  /** 'AE' or 'GB': decides currency. Restricted products are never offered in either. */
  market: 'AE' | 'GB'
  ip: string
  sessionEmail: string | null
  pageUrl: string
}

export interface AgentReply {
  lines: string[]
  links?: { label: string; href: string }[]
  cards?: ProductCard[]
  quantity?: number
  /** True once a person has been alerted (lead or handoff). */
  alerted?: boolean
}

/* ── catalogue ──────────────────────────────────────────────────────────── */

type Entry = Parameters<typeof toCard>[0]

async function loadCatalogue(market: 'AE' | 'GB'): Promise<Entry[]> {
  const products = (await getProducts(100, market)) as unknown as Entry[]
  return products
    .filter((p) => !isUaeRestrictedHandle(p.handle))
    .map((p) => ({ ...p, variants: (p.variants ?? []).filter((v) => !isUaeRestrictedVariant(v.title || '')) }))
    .filter((p) => (p.variants ?? []).length > 0)
}

function norm(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function searchCatalogue(catalogue: Entry[], query: string): Entry[] {
  const q = norm(query)
  if (!q) return catalogue.slice(0, 12)
  const words = query.toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length > 1)
  const scored = catalogue
    .map((p) => {
      const hay = norm(`${p.title} ${p.handle} ${(p.tags ?? []).join(' ')} ${p.format ?? ''}`)
      let score = 0
      if (norm(p.title) === q || norm(p.handle) === q) score += 10
      if (hay.includes(q)) score += 5
      for (const w of words) if (hay.includes(norm(w))) score += 1
      return { p, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, 8).map((x) => x.p)
}

function describeForModel(p: Entry) {
  return {
    handle: p.handle,
    title: p.title,
    url: `/products/${p.handle.replace(/-uae$/i, '')}`,
    in_stock: p.inStock,
    currency: p.currencyCode,
    variants: (p.variants ?? []).map((v) => ({
      option: v.title && v.title.toLowerCase() !== 'default title' ? v.title : 'Standard',
      price: v.price,
      available: v.availableForSale,
    })),
  }
}

/* ── tools ──────────────────────────────────────────────────────────────── */

const TOOLS = [
  {
    name: 'search_products',
    description:
      'Search the live PepcoLab catalogue. Returns matching products with options, prices (in the visitor\'s currency) and stock. Use before stating any price, stock level or option. An empty query returns a selection of the catalogue.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Product name, compound or class, e.g. "GHK-Cu", "copper peptides", "bacteriostatic water". Empty for a general selection.' } },
      required: ['query'],
    },
  },
  {
    name: 'show_products',
    description:
      'Show product cards under your reply, each with an Add to cart button the customer presses. Use when the customer wants to buy or see specific products. Pass handles exactly as returned by search_products. You cannot add to the cart yourself.',
    input_schema: {
      type: 'object',
      properties: {
        handles: { type: 'array', items: { type: 'string' }, maxItems: MAX_CARDS },
        quantity: { type: 'integer', minimum: 1, maximum: 5, description: 'Units the Add button adds, if the customer asked for a number.' },
      },
      required: ['handles'],
    },
  },
  {
    name: 'find_certificate',
    description: 'Find a published batch certificate of analysis by lot number (e.g. PAL-TES5-2605-01) or product name.',
    input_schema: { type: 'object', properties: { lot_or_product: { type: 'string' } }, required: ['lot_or_product'] },
  },
  {
    name: 'track_order',
    description:
      'Look up an order\'s status. Needs the order code (e.g. SOR-ABC123) AND the email the order was placed with. Ask the customer for both if missing. Never guess either.',
    input_schema: {
      type: 'object',
      properties: { order_code: { type: 'string' }, email: { type: 'string' } },
      required: ['order_code'],
    },
  },
  {
    name: 'capture_lead',
    description:
      'Pass a customer\'s request to the PepcoLab team for a reply: bulk or institutional orders, quotes, a callback, or anything you cannot complete. Only call after the customer has given a name plus an email or phone AND agreed that the team may contact them about this request.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        request: { type: 'string', description: 'What they want, in one or two sentences, including products and quantities.' },
      },
      required: ['name', 'request'],
    },
  },
  {
    name: 'request_human',
    description:
      'Alert the team that this visitor needs a person now (complaint, problem with an order, payment issue, or the customer asks for a human). Include a short summary. If the visitor gave contact details, include them.',
    input_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
      },
      required: ['summary'],
    },
  },
] as const

interface ToolState {
  catalogue: Entry[] | null
  cards: ProductCard[]
  quantity?: number
  links: { label: string; href: string }[]
  alerted: boolean
}

function transcriptText(messages: AgentMessage[]): string {
  return messages
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`)
    .join('\n')
    .slice(-2500)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function runTool(
  name: string,
  input: Record<string, unknown>,
  state: ToolState,
  ctx: AgentContext,
  messages: AgentMessage[]
): Promise<string> {
  const str = (k: string, max = 200) => String(input[k] ?? '').trim().slice(0, max)

  if (name === 'search_products') {
    state.catalogue ??= await loadCatalogue(ctx.market)
    const found = searchCatalogue(state.catalogue, str('query', 80))
    if (!found.length) return JSON.stringify({ results: [], note: 'Nothing in the catalogue matches. Do not suggest products that are not listed.' })
    return JSON.stringify({ results: found.map(describeForModel) })
  }

  if (name === 'show_products') {
    state.catalogue ??= await loadCatalogue(ctx.market)
    const handles = Array.isArray(input.handles) ? input.handles.map((h) => String(h)).slice(0, MAX_CARDS) : []
    const shown: string[] = []
    for (const h of handles) {
      const p = state.catalogue.find((x) => x.handle === h || x.handle.replace(/-uae$/i, '') === h)
      if (p && !state.cards.some((c) => c.handle === p.handle)) {
        state.cards.push(toCard(p))
        shown.push(p.title)
      }
    }
    const q = Number(input.quantity)
    if (q >= 1 && q <= 5) state.quantity = Math.round(q)
    if (!state.links.some((l) => l.href === '/cart')) state.links.push({ label: 'Open cart', href: '/cart' })
    return shown.length
      ? JSON.stringify({ shown, note: 'Cards with Add buttons will appear under your reply. The customer presses Add, then checks out at /cart.' })
      : JSON.stringify({ shown: [], note: 'None of those handles exist. Search first.' })
  }

  if (name === 'find_certificate') {
    const batches = (COA_BATCHES as unknown as { lot: string; product: string; identity?: string }[])
      .filter((b) => ctx.market !== 'AE' || !isUaeRestrictedBatch(b))
    const answer: LookupAnswer = answerLot(str('lot_or_product', 80), batches as never)
    for (const l of answer.links ?? []) if (!state.links.some((x) => x.href === l.href)) state.links.push(l)
    return JSON.stringify({ answer: answer.lines.join(' ') })
  }

  if (name === 'track_order') {
    if (isRateLimited('chat-agent-order', ctx.ip, 8, 10 * 60 * 1000)) {
      return JSON.stringify({ answer: 'Too many order lookups just now. Ask the customer to try again in a few minutes or use /track-order.' })
    }
    const code = str('order_code', 30).replace(/^#/, '').toUpperCase()
    const email = str('email', 254).toLowerCase()
    if (!code) return JSON.stringify({ answer: 'Ask for the order code (it starts SOR- and is in the confirmation email).' })
    const answer = await resolveLookup('order', code, {
      providedEmail: EMAIL_RE.test(email) ? email : null,
      sessionEmail: ctx.sessionEmail,
    })
    for (const l of answer.links ?? []) if (!state.links.some((x) => x.href === l.href)) state.links.push(l)
    return JSON.stringify({ answer: answer.lines.join(' '), needs_email: Boolean(answer.needsEmail) })
  }

  if (name === 'capture_lead' || name === 'request_human') {
    if (isRateLimited('chat-agent-alert', ctx.ip, 3, 60 * 60 * 1000)) {
      return JSON.stringify({ ok: false, note: 'The team has already been alerted for this visitor. Tell them someone will be in touch.' })
    }
    const contactName = str('name', 80)
    const email = str('email', 254).toLowerCase()
    const phone = str('phone', 30)
    const text = name === 'capture_lead' ? str('request', 600) : str('summary', 600)
    const validEmail = EMAIL_RE.test(email) ? email : ''

    if (name === 'capture_lead' && !validEmail && !phone) {
      return JSON.stringify({ ok: false, note: 'Ask for an email address or phone number first.' })
    }

    // CRM: the contact and what they asked for. No marketing consent is
    // recorded here — agreeing to be contacted about a request is not that.
    if (validEmail || phone) {
      try {
        const [firstName, ...rest] = contactName.split(/\s+/).filter(Boolean)
        const input: ContactInput = {
          email: validEmail || null,
          phone: phone || null,
          firstName: firstName || null,
          lastName: rest.join(' ') || null,
          market: ctx.market === 'GB' ? 'UK' : 'UAE',
          source: 'website_chat',
        }
        const contact = await upsertContact(input)
        if (contact) {
          await logInteraction({
            contactId: contact.id,
            channel: validEmail ? 'email' : 'phone',
            direction: 'inbound',
            kind: 'service',
            summary: `Website chat ${name === 'capture_lead' ? 'request' : 'handoff'}: ${text}`.slice(0, 500),
            staffUser: 'chat-agent',
          })
        }
      } catch (err) {
        console.error('[chatAgent] CRM write failed:', err)
      }
    }

    const who = [contactName, validEmail, phone].filter(Boolean).join(' · ') || 'anonymous visitor'
    const { whatsapp } = await alertOwner({
      title: `${name === 'capture_lead' ? '🟢 New chat lead' : '🙋 Chat needs a person'}: ${contactName || 'website visitor'}`,
      body: `${text}\n\nContact: ${who}\nMarket: ${ctx.market === 'GB' ? 'UK' : 'UAE'}\nPage: ${ctx.pageUrl || '(unknown)'}\n\nConversation:\n${transcriptText(messages)}`,
      replyTo: validEmail || undefined,
    })
    state.alerted = true
    console.info(`[chatAgent] ${name} alert sent (whatsapp: ${whatsapp})`)
    return JSON.stringify({
      ok: true,
      note: validEmail || phone
        ? 'The team has been alerted and will reply by email or phone, usually within a few hours.'
        : 'The team has been alerted. The visitor gave no contact details, so suggest they leave an email or use the contact form so the team can reply.',
    })
  }

  return JSON.stringify({ error: `Unknown tool ${name}` })
}

/* ── system prompt ──────────────────────────────────────────────────────── */

function agentPrompt(ctx: AgentContext): string {
  return `${buildSystemPrompt()}

# Tools and how to use them (this overrides anything above that conflicts)
- Never state a price, stock level, product option or lot detail without getting it from a tool in this conversation. If a tool returns nothing, say so; never invent a product.
- Only offer products that search_products returns. If asked for something it does not return, say it is not in the current catalogue.
- The "Not supplied" list above is not offered through this chat. If a visitor asks about one of those products, do not say PepcoLab does not supply it; say only: "I can't help with that product in this chat. For anything else — an order, a certificate or storage — I'm happy to help." Never discuss what those products do.
- Selling: when the customer wants something, find it with search_products, then call show_products so they get Add to cart buttons. Then tell them to press Add and check out from the cart. You cannot add items, take payment or place an order yourself, so never say you have.
- Order status: call track_order. It needs the order code and the email the order was placed with; ask for whichever is missing.
- Bulk, institutional, quotes or callbacks: collect a name and an email or phone, ask whether the team may contact them about this request, and only then call capture_lead.
- If the customer is unhappy, has a problem with an order or payment, or asks for a person, call request_human with a short summary.
- Prices are in ${ctx.market === 'GB' ? 'pounds (GBP) for this visitor; payment is processed in UAE dirhams and the cart shows the exact AED amount' : 'UAE dirhams (AED)'}.
- You may ask for an email, phone or order code only for order tracking, a lead or a handoff. Never ask for card or payment details.

# Reply format
Plain text for a small chat window: at most three short paragraphs, no headings, no markdown tables, no bold. A short list with "- " is fine. Refer to pages by path, e.g. /cart, /bulk-orders, /certificates.`
}

/* ── loop ───────────────────────────────────────────────────────────────── */

const PAGE_LABELS: Record<string, string> = {
  '/cart': 'Open cart',
  '/products': 'Browse the catalogue',
  '/certificates': 'Certificates',
  '/verify': 'Verify a batch',
  '/track-order': 'Track an order',
  '/bulk-orders': 'Bulk orders',
  '/shipping': 'Shipping',
  '/refund-policy': 'Refunds',
  '/tools': 'Calculators',
  '/contact': 'Contact us',
  '/bundles': 'Bundles',
  '/guides': 'Guides',
}

function linksFromText(text: string): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = []
  for (const m of text.matchAll(/(?:^|\s|\()(\/[a-z-]+)(?=[\s.,)!?]|$)/gi)) {
    const path = m[1].toLowerCase()
    if (PAGE_LABELS[path] && !out.some((l) => l.href === path)) out.push({ label: PAGE_LABELS[path], href: path })
  }
  return out
}

/**
 * isBlocked() for the model's own reply. The standard research-use
 * disclaimers ("not for human consumption", the refusal sentence) and
 * product names (e.g. one containing "Stack") are removed first, so they do
 * not trip the check; what remains must contain no dosing, use or outcome
 * language.
 */
function replyBlocked(text: string, catalogue: Entry[] | null): boolean {
  let t = text
  t = t.replace(/not (intended )?for (human|animal|veterinary)( or (human|animal|veterinary))? (use|consumption)( or (use|consumption))?/gi, ' ')
  t = t.replace(/\b(for )?(in-vitro )?(laboratory )?research use only\b/gi, ' ')
  t = t.replace(/we don.t give guidance on use in or on people or animals/gi, ' ')
  t = t.replace(/for anything about your own health, please speak to a doctor or pharmacist/gi, ' ')
  for (const p of catalogue ?? []) {
    if (p.title) t = t.split(p.title).join(' ')
  }
  return isBlocked(t)
}

function toLines(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4)
}

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }

export async function runChatAgent(messages: AgentMessage[], ctx: AgentContext): Promise<AgentReply> {
  const last = messages[messages.length - 1]?.content ?? ''
  if (isBlocked(last)) return { lines: [...REFUSAL_ANSWER] }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const state: ToolState = { catalogue: null, cards: [], links: [], alerted: false }
  const convo: { role: 'user' | 'assistant'; content: unknown }[] = messages.map((m) => ({ role: m.role, content: m.content }))

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: agentPrompt(ctx),
        tools: TOOLS,
        // Last round: force a text answer so the loop always ends.
        ...(round === MAX_TOOL_ROUNDS ? { tool_choice: { type: 'none' } } : {}),
        messages: convo,
      }),
    })
    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)
    }
    const data = (await res.json()) as { content: ContentBlock[]; stop_reason: string }
    const blocks = data.content ?? []
    const toolUses = blocks.filter((b): b is Extract<ContentBlock, { type: 'tool_use' }> => b.type === 'tool_use')

    if (data.stop_reason === 'tool_use' && toolUses.length) {
      convo.push({ role: 'assistant', content: blocks })
      const results = []
      for (const t of toolUses) {
        let output: string
        try {
          output = await runTool(t.name, t.input ?? {}, state, ctx, messages)
        } catch (err) {
          console.error(`[chatAgent] tool ${t.name} failed:`, err)
          output = JSON.stringify({ error: 'That lookup failed. Tell the customer and offer to pass them to the team.' })
        }
        results.push({ type: 'tool_result', tool_use_id: t.id, content: output })
      }
      convo.push({ role: 'user', content: results })
      continue
    }

    const text = blocks
      .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    // The reply is checked with the same rules as the visitor's message: a
    // model that drifts into dosing, use or outcome language is replaced by
    // the standard refusal rather than shown.
    if (!text || replyBlocked(text, state.catalogue)) {
      return { lines: [...REFUSAL_ANSWER], alerted: state.alerted }
    }

    const links = [...state.links]
    for (const l of linksFromText(text)) if (!links.some((x) => x.href === l.href)) links.push(l)
    return {
      lines: toLines(text),
      links: links.slice(0, 4),
      cards: state.cards.length ? state.cards : undefined,
      quantity: state.quantity,
      alerted: state.alerted,
    }
  }
  throw new Error('Agent did not finish')
}
