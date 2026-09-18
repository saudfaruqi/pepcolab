'use client'
// src/components/ChatWidget.tsx
//
// PepcoLab support assistant — visual rebuild, September 2026.
//
// VISUAL DIRECTION
// Taken from the site rather than invented: ink #0D0D0D, paper #F7F5F1, the
// gold #C8992A hairline that already runs across the emails and checkout
// pages. Messages are set as a TRANSCRIPT rather than two-colour chat
// bubbles — assistant replies sit unbubbled on paper, the visitor's own words
// sit in a small ink pill. That reads as a record of an exchange, which suits
// a brand whose whole argument is documentation.
//
// FLAT BY DESIGN — no box-shadows anywhere in this file. Depth comes from the
// ink/paper contrast, the gold rule and 1px borders. The open panel is
// separated from the page by fill, not by a blur.
//
// FIXES IN THIS PASS
//   1. FOCUS WAS STOLEN ON PAGE LOAD. The focus effect ran on first mount
//      with open=false, so the launcher grabbed focus at hydration.
//   2. NO FOCUS TRAP. Tab walked out of the open dialog. Trapped now.
//   3. LAUNCHER WAS A LOPSIDED PILL — pill padding and a gap, icon alone.
//      Circle on phones, labelled pill from 561px up.
//   4. iOS SCROLL LOCK DIDN'T LOCK. overflow:hidden doesn't stop Safari.
//   5. SINGLE-LINE COMPOSER. Auto-growing textarea, Enter sends.
//   6. INSTANT REPLIES read as a lookup table. Short typing indicator now.
//   7. CSS WAS DESKTOP-FIRST with a max-width override undoing it.
//   8. NUDGE SHOWED ONCE AND NEVER RETURNED. It now recurs on a cycle until
//      dismissed — see the constants below.
//
// All copy lives in lib/chatContent.ts. This file only renders it.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, X, ArrowLeft, ArrowUp, Headset, Mail, Check, Loader2 } from 'lucide-react'
import {
  FAQS, FAQ_BY_ID, TOPICS, resolvePageContext, matchFaq,
  REFUSAL_ANSWER, NO_MATCH_ANSWER, LOOKUP_PENDING_ANSWER, LOOKUP_ERROR_ANSWER,
  type Faq, type TopicId, type LookupRequest, type ActionRequest,
} from '@/lib/chatContent'
import type { ProductCard } from '@/lib/chatLookup'
import { whatsAppChatHandoffLink, isWhatsAppConfigured } from '@/lib/whatsapp'
import { trackChatHandoff } from '@/lib/analytics'
import { useCustomer } from '@/lib/customerContext'
import { useCart } from '@/lib/cartContext'
import { formatPrice } from '@/lib/utils'
import { claimNudgeSlot, releaseNudgeSlot } from '@/lib/nudgeCoordinator'

const HIDDEN_ON = ['/checkout/success', '/checkout/failure', '/checkout/cancel', '/admin']
const SUPPORT_EMAIL = 'hello@pepcolab.com'

/* Recurring nudge. Longer intervals than the calculator's — support is a
   fallback, not the main event, so it should ask less often. Only the × or
   opening the panel stops the cycle for the session. */
const NUDGE_DISMISS_KEY = 'plc:nudge-dismissed'
const NUDGE_FIRST_DELAY = 6000
const NUDGE_VISIBLE = 11000
const NUDGE_REPEAT = 60000
const NUDGE_MAX_SHOWS = 3

/** Identity used with nudgeCoordinator so this widget's nudge and the
 *  calculator's nudge never show at the same time. */
const NUDGE_ID = 'chat-support'

/** Assistant "thinking" beat. Long enough to read as a reply rather than a
 *  lookup, short enough that nobody waits on it. */
const TYPING_MS = 420

type Bubble = {
  id: string
  role: 'bot' | 'user'
  text: string
  links?: { label: string; href: string }[]
  /** Product cards with an Add button — see the commerce block below. */
  cards?: ProductCard[]
  /** Units the Add button will add. */
  quantity?: number
}
type Screen = 'chat' | 'topics' | 'handoff'

let seq = 0
const nextId = () => `b${++seq}`

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ChatWidget() {
  const pathname = usePathname() || '/'
  const context = useMemo(() => resolvePageContext(pathname), [pathname])

  const [open, setOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('chat')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [suggestions, setSuggestions] = useState<Faq[]>([])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [activeTopic, setActiveTopic] = useState<TopicId | null>(null)
  const [handoffState, setHandoffState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [contactEmail, setContactEmail] = useState('')
  const { email: customerEmail, firstName } = useCustomer()
  const { addItem, openCart, lines: cartLines, subtotal, currencyCode, totalQuantity } = useCart()
  const [announce, setAnnounce] = useState('')
  const [nudge, setNudge] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const startedRef = useRef(false)
  const wasOpenRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const hidden = HIDDEN_ON.some(p => pathname.startsWith(p))

  // Every deferred reply is tracked so navigating away or closing mid-"typing"
  // can't push a bubble into an unmounted tree.
  useEffect(() => () => { timersRef.current.forEach(clearTimeout) }, [])

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms)
    timersRef.current.push(t)
    return t
  }, [])

  /* ── conversation ─────────────────────────────────────────────────────── */

  const pushBot = useCallback((
    lines: string[],
    links?: Bubble['links'],
    after?: () => void,
    extras?: { cards?: ProductCard[]; quantity?: number },
  ) => {
    setTyping(true)
    later(() => {
      setTyping(false)
      setBubbles(prev => [...prev, ...lines.map((text, i) => ({
        id: nextId(), role: 'bot' as const, text,
        // Links and cards hang off the LAST line so they read as the reply's
        // conclusion rather than interrupting it.
        links: i === lines.length - 1 ? links : undefined,
        cards: i === lines.length - 1 ? extras?.cards : undefined,
        quantity: i === lines.length - 1 ? extras?.quantity : undefined,
      }))])
      setAnnounce(lines.join(' '))
      after?.()
    }, prefersReducedMotion() ? 0 : TYPING_MS)
  }, [later])

  const pushUser = useCallback((text: string) => {
    setBubbles(prev => [...prev, { id: nextId(), role: 'user', text }])
  }, [])

  const answerFaq = useCallback((faq: Faq) => {
    // Clear stale chips immediately — leaving the previous answer's
    // suggestions on screen while a new reply types out is confusing.
    setSuggestions([])

    if (faq.id === 'contact-human') {
      pushBot(faq.answer, undefined, () => setScreen('handoff'))
      return
    }
    pushBot(faq.answer, faq.links, () => {
      const related = (faq.related ?? []).map(id => FAQ_BY_ID[id]).filter(Boolean)
      setSuggestions(related.length ? related : context.suggested.map(id => FAQ_BY_ID[id]).filter(Boolean))
    })
  }, [pushBot, context.suggested])

  /**
   * LIVE LOOKUPS (Sep 2026).
   *
   * Stock, price, batch certificates and order status come from the server
   * rather than from written copy — see lib/chatLookup.ts. The answer is
   * still a fixed template; only the values in it are live.
   *
   * An order lookup that needs an email parks the request here, so the next
   * thing the customer types can be just the address rather than the whole
   * question again.
   */
  const [pendingLookup, setPendingLookup] = useState<LookupRequest | null>(null)

  const runLookup = useCallback(async (request: LookupRequest, email?: string) => {
    pushBot([LOOKUP_PENDING_ANSWER])
    try {
      const res = await fetch('/api/chat/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: request.intent, query: request.query, email: email ?? null }),
      })
      const data = await res.json().catch(() => null)
      const answer = data?.answer as
        | {
            lines?: string[]
            links?: { label: string; href: string }[]
            related?: string[]
            needsEmail?: boolean
            cards?: ProductCard[]
            quantity?: number
          }
        | undefined

      if (!answer?.lines?.length) {
        setPendingLookup(null)
        pushBot(LOOKUP_ERROR_ANSWER, undefined, () =>
          setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean)))
        return
      }

      setPendingLookup(answer.needsEmail ? request : null)
      pushBot(
        answer.lines,
        answer.links,
        () => setSuggestions((answer.related ?? []).map(id => FAQ_BY_ID[id]).filter(Boolean)),
        { cards: answer.cards, quantity: answer.quantity },
      )
    } catch {
      setPendingLookup(null)
      pushBot(LOOKUP_ERROR_ANSWER, undefined, () =>
        setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean)))
    }
  }, [pushBot])

  /* ── COMMERCE ACTIONS (Sep 2026) ──────────────────────────────────────
   *
   * The assistant can now search the catalogue, put things in the cart, show
   * what is in it, and pull up a previous order.
   *
   * NOTHING IS ADDED WITHOUT A CLICK. A typed sentence only ever produces a
   * product card; the Add button on that card is the confirmation, and the
   * customer presses it. And the assistant never checks out — it can fill a
   * basket and open it, but paying stays a deliberate act on the checkout
   * page. See the rules at the top of lib/chatActions.ts.
   */
  const [adding, setAdding] = useState<string | null>(null)

  const addVariant = useCallback(async (card: ProductCard, variantId: string, qty: number) => {
    const variant = card.variants.find(v => v.id === variantId)
    if (!variant || !variant.available || adding) return
    setAdding(variantId)
    const units = Math.min(Math.max(qty || 1, 1), 5)
    try {
      // addItem adds a single unit and increments an existing line, so N
      // sequential calls reuse that proven path rather than adding a second
      // quantity-aware branch to the cart context.
      for (let i = 0; i < units; i++) {
        await addItem(variant.id, card.title, variant.title, variant.price, card.handle.replace(/-uae$/i, ''), card.image)
      }
      pushUser(`Add ${card.title} \u00b7 ${variant.title}${units > 1 ? ` \u00d7 ${units}` : ''}`)
      pushBot(
        [
          `Added \u2014 ${card.title}, ${variant.title}${units > 1 ? `, \u00d7${units}` : ''}.`,
          'Anything else, or shall I open your cart?',
        ],
        [{ label: 'View cart', href: '/cart' }],
        () => setSuggestions([FAQ_BY_ID['order-bundles'], FAQ_BY_ID['shipping-times'], FAQ_BY_ID['contact-human']].filter(Boolean)),
      )
    } catch {
      pushBot([
        'That didn\u2019t go into the cart \u2014 which is on us, not you.',
        `You can add it from the ${card.title} page, or I\u2019ll get a person to take the order directly.`,
      ], [{ label: `Open ${card.title}`, href: card.href }],
        () => setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean)))
    } finally {
      setAdding(null)
    }
  }, [addItem, adding, pushBot, pushUser])

  const describeCart = useCallback(() => {
    if (!cartLines || cartLines.length === 0) {
      pushBot(
        ['Your cart is empty at the moment.', 'Tell me what you\u2019re after \u2014 a compound name, or something like "show me recovery pens" \u2014 and I\u2019ll pull it up.'],
        [{ label: 'Browse the catalogue', href: '/products' }],
        () => setSuggestions([FAQ_BY_ID['order-bundles'], FAQ_BY_ID['coa-what']].filter(Boolean)),
      )
      return
    }
    const items = cartLines.map(l => `${l.title}${l.variantTitle && l.variantTitle !== 'Default Title' ? ` \u00b7 ${l.variantTitle}` : ''}${l.quantity > 1 ? ` \u00d7 ${l.quantity}` : ''}`)
    pushBot(
      [
        `${totalQuantity} item${totalQuantity === 1 ? '' : 's'} in your cart: ${items.join(', ')}.`,
        `Subtotal ${formatPrice(subtotal, currencyCode || 'AED')}. Bundle savings, if any, are applied in the cart itself.`,
      ],
      [{ label: 'Open cart', href: '/cart' }],
      () => setSuggestions([FAQ_BY_ID['order-bundles'], FAQ_BY_ID['shipping-times'], FAQ_BY_ID['order-payment']].filter(Boolean)),
    )
  }, [cartLines, totalQuantity, subtotal, currencyCode, pushBot])

  const runAction = useCallback(async (request: ActionRequest) => {
    if (request.kind === 'view-cart') { describeCart(); openCart(); return }

    // "add" with nothing after it. Asking what to add keeps the conversation
    // going; sending an empty query to the server would only earn a 400.
    if (request.kind === 'add-to-cart' && !request.query) {
      pushBot(
        [
          'Happy to — what would you like me to add?',
          'Give me a name and I’ll pull up the options, or browse the catalogue and I’ll add whatever you pick.',
        ],
        [{ label: 'Browse the catalogue', href: '/products' }],
        () => setSuggestions((['order-bundles', 'contact-human'] as const)
          .map(id => FAQ_BY_ID[id]).filter(Boolean)),
      )
      return
    }

    const payload =
      request.kind === 'search'
        ? { intent: 'search', query: '', filters: request.filters ?? {} }
        : request.kind === 'reorder'
          ? { intent: 'reorder', query: '', email: customerEmail || null }
          : { intent: 'add-to-cart', query: request.query, quantity: request.quantity ?? 1 }

    pushBot([LOOKUP_PENDING_ANSWER])
    try {
      const res = await fetch('/api/chat/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      const answer = data?.answer as
        | { lines?: string[]; links?: { label: string; href: string }[]; related?: string[]; cards?: ProductCard[]; quantity?: number }
        | undefined
      if (!answer?.lines?.length) {
        pushBot(LOOKUP_ERROR_ANSWER, undefined, () =>
          setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean)))
        return
      }
      pushBot(
        answer.lines,
        answer.links,
        () => setSuggestions((answer.related ?? []).map(id => FAQ_BY_ID[id]).filter(Boolean)),
        { cards: answer.cards, quantity: answer.quantity ?? request.quantity },
      )
    } catch {
      pushBot(LOOKUP_ERROR_ANSWER, undefined, () =>
        setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean)))
    }
  }, [describeCart, openCart, customerEmail, pushBot, setSuggestions])

  const handleSelect = useCallback((faq: Faq) => { pushUser(faq.question); answerFaq(faq) }, [pushUser, answerFaq])

  const handleSubmit = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text) return
    pushUser(text)
    setInput('')
    setSuggestions([])
    if (composerRef.current) composerRef.current.style.height = 'auto'

    // Answering the "what email was it placed with?" question — retry the
    // parked lookup instead of treating the address as a fresh question.
    if (pendingLookup && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text)) {
      void runLookup(pendingLookup, text)
      return
    }

    const result = matchFaq(text)
    if (result.kind === 'blocked') {
      pushBot(REFUSAL_ANSWER, undefined, () =>
        setSuggestions([FAQ_BY_ID['coa-what'], FAQ_BY_ID['handling-storage'], FAQ_BY_ID['contact-human']].filter(Boolean)))
      return
    }
    if (result.kind === 'action') { void runAction(result.request); return }
    if (result.kind === 'lookup') { void runLookup(result.request, customerEmail || undefined); return }
    if (result.kind === 'smalltalk') {
      pushBot(result.lines, undefined, () =>
        setSuggestions([FAQ_BY_ID['order-how'], FAQ_BY_ID['coa-what'], FAQ_BY_ID['shipping-times']].filter(Boolean)))
      return
    }
    if (result.kind === 'match') { answerFaq(result.faq); return }
    if (result.kind === 'ambiguous') {
      pushBot(['A few things could match that — which did you mean?'], undefined, () => setSuggestions(result.faqs))
      return
    }
    pushBot(NO_MATCH_ANSWER, undefined, () => setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean)))
  }, [pushUser, pushBot, answerFaq, pendingLookup, runLookup, runAction, customerEmail])

  /* ── open / close ─────────────────────────────────────────────────────── */

  // AUTOFILL: a signed-in customer should never retype the address we emailed
  // their order to. Only fills an untouched field.
  useEffect(() => {
    if (customerEmail && !contactEmail) setContactEmail(customerEmail)
  }, [customerEmail, contactEmail])

  useEffect(() => {
    if (!open || startedRef.current) return
    startedRef.current = true
    // Greet a known customer by name — the assistant should not act like a
    // stranger to someone whose orders it can already see.
    pushBot([firstName
      ? `${firstName} — ${context.greeting.charAt(0).toLowerCase()}${context.greeting.slice(1)}`
      : context.greeting],
      undefined,
      () => setSuggestions(context.suggested.map(id => FAQ_BY_ID[id]).filter(Boolean)))
  }, [open, context, firstName, pushBot])

  const dismissNudge = useCallback(() => {
    setNudge(false)
    setNudgeDismissed(true)
    releaseNudgeSlot(NUDGE_ID)
    try { sessionStorage.setItem(NUDGE_DISMISS_KEY, '1') } catch { /* private mode */ }
  }, [])

  useEffect(() => {
    try {
      if (sessionStorage.getItem(NUDGE_DISMISS_KEY) === '1') setNudgeDismissed(true)
    } catch { /* ignore */ }
  }, [])

  // Recurring cycle: wait → show → hide → wait → show … Guarded by
  // nudgeCoordinator so this bubble and the calculator's bubble never land on
  // screen in the same moment — if the slot is taken, this widget backs off
  // and retries a few times before giving up on that cycle entirely (rather
  // than showing very late, out of step with its own schedule).
  useEffect(() => {
    if (hidden || nudgeDismissed) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let shows = 0

    const cycle = (delay: number) => {
      timer = setTimeout(() => attemptShow(4), delay)
    }

    const attemptShow = (retriesLeft: number) => {
      if (cancelled) return
      if (!claimNudgeSlot(NUDGE_ID)) {
        if (retriesLeft > 0) {
          timer = setTimeout(() => attemptShow(retriesLeft - 1), 1500)
        } else if (shows < NUDGE_MAX_SHOWS) {
          cycle(NUDGE_REPEAT)
        }
        return
      }
      shows += 1
      setNudge(true)
      timer = setTimeout(() => {
        releaseNudgeSlot(NUDGE_ID)
        if (cancelled) return
        setNudge(false)
        if (shows < NUDGE_MAX_SHOWS) cycle(NUDGE_REPEAT)
      }, NUDGE_VISIBLE)
    }

    cycle(NUDGE_FIRST_DELAY)
    return () => {
      cancelled = true
      clearTimeout(timer)
      setNudge(false)
      releaseNudgeSlot(NUDGE_ID)
    }
  }, [hidden, nudgeDismissed])

  // Focus into the panel on open; return focus to the launcher only on a real
  // close. Previously this ran on first mount and stole focus at hydration.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      const t = setTimeout(() => panelRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false
      launcherRef.current?.focus()
    }
  }, [open])

  // Keep Tab inside the dialog while it's open.
  useEffect(() => {
    if (!open) return
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onTab)
    return () => document.removeEventListener('keydown', onTab)
  }, [open])

  // Lock the page behind the sheet on mobile only. overflow:hidden alone does
  // not stop iOS Safari — position-fixed with a scroll restore does.
  useEffect(() => {
    if (!open) return
    if (!window.matchMedia('(max-width: 560px)').matches) return
    const y = window.scrollY
    const { overflow, position, top, width } = document.body.style
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = overflow
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.width = width
      window.scrollTo(0, y)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (screen !== 'chat') { setScreen('chat'); setActiveTopic(null) } else setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, screen])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [bubbles, suggestions, typing, screen])

  /* ── handoff ──────────────────────────────────────────────────────────── */

  const transcript = useMemo(
    () => bubbles.map(b => ({ role: b.role === 'user' ? 'user' as const : 'assistant' as const, content: b.text })),
    [bubbles]
  )

  const handoffSummary = useMemo(() => {
    const where = context.productSlug ? `Page: ${context.label} — ${context.productSlug}` : `Page: ${context.label}`
    const asked = bubbles.filter(b => b.role === 'user').slice(-3).map(b => `• ${b.text}`).join('\n')
    return [where, typeof window !== 'undefined' ? window.location.href : '', asked && `I asked about:\n${asked}`]
      .filter(Boolean).join('\n')
  }, [bubbles, context])

  const sendTranscript = useCallback(async (reason: string) => {
    if (transcript.length === 0) return
    setHandoffState('sending')
    try {
      const res = await fetch('/api/chat/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: transcript,
          contact: { email: contactEmail.trim() },
          reason,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      })
      setHandoffState(res.ok ? 'sent' : 'error')
    } catch { setHandoffState('error') }
  }, [transcript, contactEmail])

  if (hidden) return null

  const waConfigured = isWhatsAppConfigured()
  const topicFaqs = activeTopic ? FAQS.filter(f => f.topic === activeTopic) : []

  const openPanel = () => { dismissNudge(); setOpen(true) }

  return (
    <>
      <style>{`
        .plc, .plc * { box-sizing: border-box; }
        .plc {
          --ink: #0D0D0D;
          --paper: #F7F5F1;
          --gold: #C8992A;
          --line: rgba(13,13,13,.10);
          --muted: rgba(13,13,13,.55);
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        /* ---------- MOBILE FIRST: base = phone ---------- */

        .plc-launcher {
          position: fixed; right: 16px; z-index: 900;
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          display: flex; align-items: center; justify-content: center;
          width: 58px; height: 58px; padding: 0;
          border: 1px solid var(--ink); border-radius: 999px; cursor: pointer;
          background: var(--ink); color: #fff;
          font-family: inherit; font-size: 14.5px; font-weight: 600; letter-spacing: -.01em;
          transition: transform .15s ease, background .15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .plc-launcher:active { transform: scale(.94); }
        .plc-launcher-label { display: none; }

        /* Attention ring, shown only while the nudge is up. */
        .plc-launcher.plc-attn::after {
          content: ''; position: absolute; inset: -4px; border-radius: 999px;
          border: 2px solid rgba(200,153,42,.6); pointer-events: none;
          animation: plcRing 2s ease-out infinite;
        }
        @keyframes plcRing {
          0% { transform: scale(.95); opacity: .9 }
          70%, 100% { transform: scale(1.22); opacity: 0 }
        }

        .plc-nudge {
          position: fixed; right: 16px; z-index: 900;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          display: flex; align-items: stretch; overflow: hidden;
          max-width: calc(100vw - 32px);
          background: var(--ink); color: #fff;
          border: 1px solid var(--ink); border-radius: 13px;
          opacity: 0; transform: translateY(8px);
          animation: plcNudgeIn .28s ease forwards;
        }
        @keyframes plcNudgeIn { to { opacity: 1; transform: none } }
        .plc-nudge-body {
          background: none; border: none; color: inherit; cursor: pointer;
          font-family: inherit; font-size: 13.5px; font-weight: 600; line-height: 1.35;
          text-align: left; padding: 11px 12px 11px 14px;
        }
        .plc-nudge-x {
          background: none; border: none; border-left: 1px solid rgba(255,255,255,.14);
          color: rgba(255,255,255,.6); padding: 0 10px; cursor: pointer;
          display: grid; place-items: center;
        }

        /* Full-height sheet. dvh tracks the visual viewport, so the composer
           stays visible when the keyboard opens — height:100% pushed it off. */
        .plc-panel {
          position: fixed; inset: 0; z-index: 950;
          width: 100%; height: 100dvh;
          display: flex; flex-direction: column; overflow: hidden;
          background: var(--paper);
          animation: plcUp .22s cubic-bezier(.2,.8,.3,1);
        }
        @keyframes plcUp { from { transform: translateY(100%) } to { transform: none } }

        .plc-head { flex-shrink: 0; background: var(--ink); color: #fff;
                    padding: calc(14px + env(safe-area-inset-top, 0px)) 14px 13px 16px; }
        .plc-head-row { display: flex; align-items: center; gap: 10px; }
        .plc-title { font-size: 15px; font-weight: 600; letter-spacing: -.015em; line-height: 1.2; }
        .plc-where { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 1px;
                     white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .plc-rule { height: 2px; background: var(--gold); flex-shrink: 0; }

        .plc-icon { display: flex; align-items: center; justify-content: center;
                    width: 38px; height: 38px; flex-shrink: 0;
                    background: none; border: none; border-radius: 9px;
                    color: rgba(255,255,255,.7); cursor: pointer; transition: background .15s, color .15s; }
        .plc-icon:hover { background: rgba(255,255,255,.1); color: #fff; }

        /* The route to a person gets its own bar, so it never competes with
           the title for width on a narrow screen. */
        .plc-human { flex-shrink: 0; display: flex; align-items: center; gap: 8px; width: 100%;
                     padding: 12px 16px; border: none; border-bottom: 1px solid var(--line);
                     background: #fff; color: var(--ink); cursor: pointer;
                     font-family: inherit; font-size: 13.5px; font-weight: 600;
                     text-align: left; transition: background .15s; }
        .plc-human:hover { background: #FBFAF7; }
        .plc-human span { color: var(--muted); font-weight: 400; }

        .plc-body { flex: 1; overflow-y: auto; overscroll-behavior: contain;
                    -webkit-overflow-scrolling: touch; padding: 18px 18px 24px; }

        /* Transcript, not chat bubbles. */
        .plc-bot { font-size: 15px; line-height: 1.6; color: var(--ink);
                   margin: 0 0 14px; max-width: 100%; letter-spacing: -.005em; }
        .plc-user { display: block; margin: 0 0 16px auto; width: fit-content; max-width: 85%;
                    padding: 9px 14px; border-radius: 16px 16px 4px 16px;
                    background: var(--ink); color: #fff; font-size: 14px; line-height: 1.5;
                    overflow-wrap: anywhere; }

        .plc-typing { display: flex; gap: 4px; align-items: center; height: 22px; margin: 0 0 14px; }
        .plc-typing i { width: 6px; height: 6px; border-radius: 50%; background: rgba(13,13,13,.3);
                        animation: plcDot 1.1s ease-in-out infinite; }
        .plc-typing i:nth-child(2) { animation-delay: .15s }
        .plc-typing i:nth-child(3) { animation-delay: .3s }
        @keyframes plcDot { 0%, 60%, 100% { opacity: .25; transform: none }
                            30% { opacity: 1; transform: translateY(-3px) } }

        .plc-links { display: flex; flex-direction: column; gap: 6px; margin: -6px 0 16px; }
        .plc-link { display: flex; align-items: center; justify-content: space-between; gap: 10px;
                    min-height: 44px; padding: 0 14px; border-radius: 11px;
                    border: 1px solid var(--line); background: #fff;
                    font-size: 13.5px; font-weight: 600; color: var(--ink); text-decoration: none;
                    transition: border-color .15s; }
        .plc-link:hover { border-color: rgba(13,13,13,.3); }

        /* Product cards — the surface that turns an answer into an order. */
        .plc-cards { display: flex; flex-direction: column; gap: 8px; margin: -4px 0 16px; }
        .plc-card { border: 1px solid var(--line); border-radius: 13px; background: #fff; padding: 10px 12px; }
        .plc-card-top { display: flex; align-items: center; gap: 10px; }
        .plc-card-img { width: 40px; height: 40px; border-radius: 8px; background: var(--paper);
                        object-fit: contain; flex-shrink: 0; }
        .plc-card-name { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 700; color: var(--ink);
                         text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .plc-card-price { font-size: 12.5px; color: var(--muted); white-space: nowrap; }
        .plc-card-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
        .plc-add { min-height: 36px; padding: 7px 13px; border-radius: 999px; border: 1px solid var(--ink);
                   background: var(--ink); color: #fff; font-family: inherit; font-size: 12.5px;
                   font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
                   transition: opacity .15s; }
        .plc-add:hover { opacity: .86; }
        .plc-add[disabled] { opacity: .45; cursor: not-allowed; }
        .plc-add-quiet { background: transparent; color: var(--ink); border-color: rgba(13,13,13,.2); font-weight: 600; }
        .plc-card-note { margin: 8px 0 0; font-size: 11.5px; line-height: 1.5; color: var(--muted); }
        .plc-spin { animation: plcSpin .9s linear infinite; }
        @keyframes plcSpin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .plc-spin { animation: none; } }

        /* Suggestions as inline chips, not stacked form buttons. */
        .plc-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 4px; }
        .plc-chip { min-height: 38px; padding: 8px 14px; border-radius: 999px;
                    border: 1px solid rgba(13,13,13,.16); background: transparent;
                    font-family: inherit; font-size: 13.5px; line-height: 1.35; color: var(--ink);
                    cursor: pointer; text-align: left; transition: background .15s, border-color .15s; }
        .plc-chip:hover { background: #fff; border-color: var(--ink); }
        .plc-chip-quiet { color: var(--muted); border-style: dashed; }

        .plc-topic { display: block; width: 100%; text-align: left; cursor: pointer;
                     padding: 14px 16px; margin-bottom: 8px; border-radius: 13px;
                     font-family: inherit;
                     border: 1px solid var(--line); background: #fff; transition: border-color .15s; }
        .plc-topic:hover { border-color: rgba(13,13,13,.35); }
        .plc-topic b { display: block; font-size: 14.5px; font-weight: 600; color: var(--ink); }
        .plc-topic span { display: block; font-size: 12.5px; color: var(--muted); line-height: 1.45; margin-top: 2px; }

        .plc-foot { flex-shrink: 0; display: flex; gap: 8px; align-items: flex-end;
                    padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
                    border-top: 1px solid var(--line); background: #fff; }
        /* 16px is not a style choice: Safari zooms the whole page when a
           focused input is smaller, which threw the layout off-centre on
           every iPhone. */
        .plc-input { flex: 1; min-height: 44px; max-height: 120px; padding: 11px 14px;
                     font-size: 16px; font-family: inherit; line-height: 1.4; color: var(--ink);
                     border: 1px solid var(--line); border-radius: 12px; background: var(--paper);
                     outline: none; resize: none; transition: border-color .15s; }
        .plc-input:focus { border-color: rgba(13,13,13,.4); }
        .plc-send { display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                    width: 44px; height: 44px; border: none; border-radius: 12px;
                    background: var(--ink); color: #fff; cursor: pointer; }
        .plc-send:disabled { background: rgba(13,13,13,.12); color: rgba(13,13,13,.35); cursor: not-allowed; }

        .plc-note { font-size: 13px; line-height: 1.65; color: var(--muted); margin: 0 0 16px; }
        .plc-ok { display: flex; align-items: center; gap: 9px; padding: 13px 16px;
                  border-radius: 12px; background: rgba(10,123,69,.09);
                  border: 1px solid rgba(10,123,69,.2); color: #0A7B45;
                  font-size: 13.5px; font-weight: 600; }
        .plc-err { font-size: 12.5px; color: #B91C1C; margin: 8px 0 0; }
        .plc-action { display: flex; align-items: center; gap: 10px; width: 100%;
                      min-height: 48px; padding: 0 16px; margin-bottom: 9px;
                      border-radius: 13px; border: 1px solid var(--line); background: #fff;
                      font-family: inherit; font-size: 14px; font-weight: 600; color: var(--ink);
                      text-decoration: none; cursor: pointer; transition: border-color .15s, background .15s; }
        .plc-action:hover { border-color: rgba(13,13,13,.35); }
        .plc-action-primary { background: var(--ink); color: #fff; border-color: var(--ink); }
        .plc-action-primary:hover { background: #262626; border-color: #262626; }

        .plc-label { font-size: 13px; font-weight: 600; color: var(--ink); display: block; margin: 20px 0 8px; }
        .plc-sr { position: absolute; width: 1px; height: 1px; overflow: hidden;
                  clip: rect(0 0 0 0); white-space: nowrap; }

        .plc :focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
        .plc-head :focus-visible, .plc-action-primary:focus-visible { outline-color: #fff; }

        /* ---------- DESKTOP layered on top ---------- */

        @media (min-width: 561px) {
          .plc-launcher {
            right: 20px; bottom: calc(20px + env(safe-area-inset-bottom, 0px));
            width: auto; height: 52px; gap: 9px; padding: 0 20px 0 17px;
          }
          .plc-launcher-label { display: inline; }
          .plc-launcher:hover { background: #262626; border-color: #262626; }

          .plc-nudge { right: 20px; bottom: 84px; max-width: 280px; }

          /* Corner panel. A 1px line and the paper fill do the separating —
             the 60px drop shadow this replaced was the heaviest thing on the
             page and read as a stock support widget. */
          .plc-panel {
            inset: auto; right: 20px; bottom: 20px;
            width: 384px; height: min(620px, calc(100vh - 40px));
            border: 1px solid rgba(13,13,13,.18); border-radius: 18px;
            animation: plcIn .2s cubic-bezier(.2,.8,.3,1);
          }
          @keyframes plcIn { from { opacity: 0; transform: translateY(10px) scale(.99) } to { opacity: 1; transform: none } }
          .plc-head { padding-top: 14px; }
          .plc-body { padding: 18px 16px 20px; }
          .plc-bot { font-size: 14.5px; max-width: 92%; }
          .plc-foot { padding-bottom: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .plc-panel, .plc-nudge, .plc-launcher::after, .plc-typing i { animation: none !important }
          .plc-nudge { opacity: 1; transform: none }
          .plc * { transition: none !important }
        }
      `}</style>

      {!open && nudge && (
        <div className="plc plc-nudge" role="status">
          <button className="plc-nudge-body" onClick={openPanel}>
            Questions about COAs, shipping or an order? Ask here.
          </button>
          <button className="plc-nudge-x" onClick={dismissNudge} aria-label="Dismiss">
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      {!open && (
        <button
          ref={launcherRef}
          className={`plc plc-launcher${nudge ? ' plc-attn' : ''}`}
          onClick={openPanel}
          aria-label="Open support chat"
        >
          <MessageCircle size={20} aria-hidden="true" />
          <span className="plc-launcher-label">Support</span>
        </button>
      )}

      {open && (
        <div ref={panelRef} className="plc plc-panel" role="dialog" aria-modal="true"
             aria-label="PepcoLab support" tabIndex={-1}>
          <div className="plc-head">
            <div className="plc-head-row">
              {screen !== 'chat' && (
                <button className="plc-icon" onClick={() => { setScreen('chat'); setActiveTopic(null) }} aria-label="Back">
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="plc-title">PepcoLab support</div>
                <div className="plc-where">
                  {screen === 'handoff' ? 'Getting you to a person' : context.label}
                </div>
              </div>
              <button className="plc-icon" onClick={() => setOpen(false)} aria-label="Close support chat">
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="plc-rule" />

          {screen !== 'handoff' && (
            <button className="plc-human" onClick={() => setScreen('handoff')}>
              <Headset size={16} aria-hidden="true" />
              Talk to a person <span>— usually within a few minutes</span>
            </button>
          )}

          <div className="plc-body" ref={scrollRef}>
            <p aria-live="polite" className="plc-sr">{announce}</p>

            {screen === 'handoff' ? (
              <>
                <p className="plc-note">
                  Whichever is easiest. We&apos;ll already have the page you&apos;re on and what
                  you&apos;ve asked, so you won&apos;t explain it twice.
                </p>

                {waConfigured && (
                  <a
                    className="plc-action plc-action-primary"
                    href={whatsAppChatHandoffLink(handoffSummary)}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => { trackChatHandoff('whatsapp', pathname); sendTranscript('whatsapp_handoff') }}
                  >
                    <MessageCircle size={17} aria-hidden="true" />
                    Message us on WhatsApp
                  </a>
                )}

                <a className="plc-action" href={`mailto:${SUPPORT_EMAIL}`}
                   onClick={() => trackChatHandoff('email', pathname)}>
                  <Mail size={17} aria-hidden="true" />
                  {SUPPORT_EMAIL}
                </a>

                <label className="plc-label" htmlFor="plc-email">Or leave your email and we&apos;ll come to you</label>
                {handoffState === 'sent' ? (
                  <div className="plc-ok"><Check size={16} aria-hidden="true" /> Sent. A person will pick this up.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input id="plc-email" className="plc-input" type="email" value={contactEmail}
                             inputMode="email" autoComplete="email"
                             style={{ maxHeight: 44 }}
                             onChange={e => setContactEmail(e.target.value)} placeholder="you@lab.com" />
                      <button className="plc-send" aria-label="Send"
                              onClick={() => { trackChatHandoff('callback', pathname); sendTranscript('requested_callback') }}
                              disabled={handoffState === 'sending' || !contactEmail.trim()}>
                        {handoffState === 'sending'
                          ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                          : <ArrowUp size={17} aria-hidden="true" />}
                      </button>
                    </div>
                    {handoffState === 'error' && (
                      <p className="plc-err">That didn&apos;t send. Use WhatsApp or email us directly.</p>
                    )}
                  </>
                )}
              </>
            ) : screen === 'topics' ? (
              !activeTopic ? TOPICS.map(t => (
                <button key={t.id} className="plc-topic" onClick={() => setActiveTopic(t.id)}>
                  <b>{t.label}</b><span>{t.blurb}</span>
                </button>
              )) : topicFaqs.map(f => (
                <button key={f.id} className="plc-topic"
                        onClick={() => { handleSelect(f); setScreen('chat'); setActiveTopic(null) }}>
                  <b>{f.question}</b>
                </button>
              ))
            ) : (
              <>
                {bubbles.map(b => (
                  b.role === 'user'
                    ? <span key={b.id} className="plc-user">{b.text}</span>
                    : (
                      <div key={b.id}>
                        <p className="plc-bot">{b.text}</p>
                        {b.cards && b.cards.length > 0 && (
                          <div className="plc-cards">
                            {b.cards.map(card => {
                              const sellable = card.variants.filter(v => v.available)
                              const qty = b.quantity ?? 1
                              return (
                                <div key={card.handle} className="plc-card">
                                  <div className="plc-card-top">
                                    {card.image && (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img className="plc-card-img" src={card.image} alt="" aria-hidden="true" />
                                    )}
                                    <Link className="plc-card-name" href={card.href} onClick={() => setOpen(false)}>
                                      {card.title}
                                    </Link>
                                    {sellable.length > 0 && (
                                      <span className="plc-card-price">
                                        {sellable.length > 1 ? 'from ' : ''}
                                        {formatPrice(Math.min(...sellable.map(v => v.price)), card.currency)}
                                      </span>
                                    )}
                                  </div>

                                  {card.paymentLinkOnly ? (
                                    <>
                                      <div className="plc-card-actions">
                                        <Link className="plc-add plc-add-quiet" href={card.href} onClick={() => setOpen(false)}>
                                          Choose strength &amp; quantity
                                        </Link>
                                      </div>
                                      <p className="plc-card-note">
                                        Sold on a fixed payment link, so it can&rsquo;t go through the cart.
                                      </p>
                                    </>
                                  ) : !card.inStock || sellable.length === 0 ? (
                                    <>
                                      <div className="plc-card-actions">
                                        <Link className="plc-add plc-add-quiet" href={card.href} onClick={() => setOpen(false)}>
                                          Notify me when back
                                        </Link>
                                      </div>
                                      <p className="plc-card-note">Out of stock at the moment.</p>
                                    </>
                                  ) : (
                                    <div className="plc-card-actions">
                                      {sellable.map(v => (
                                        <button
                                          key={v.id}
                                          className="plc-add"
                                          disabled={adding === v.id}
                                          onClick={() => addVariant(card, v.id, qty)}
                                        >
                                          {adding === v.id
                                            ? <Loader2 size={13} className="plc-spin" aria-hidden="true" />
                                            : <Check size={13} aria-hidden="true" />}
                                          {sellable.length > 1
                                            ? `${v.title}${qty > 1 ? ` \u00d7${qty}` : ''}`
                                            : `Add to cart${qty > 1 ? ` \u00d7${qty}` : ''}`}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {b.links && b.links.length > 0 && (
                          <div className="plc-links">
                            {b.links.map(l => (
                              <Link key={l.href} className="plc-link" href={l.href} onClick={() => setOpen(false)}>
                                {l.label}
                                <ArrowUp size={14} style={{ transform: 'rotate(45deg)', opacity: .45 }} aria-hidden="true" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                ))}

                {typing && (
                  <div className="plc-typing" aria-hidden="true"><i /><i /><i /></div>
                )}

                {suggestions.length > 0 && !typing && (
                  <div className="plc-chips">
                    {suggestions.map(f => (
                      <button key={f.id} className="plc-chip" onClick={() => handleSelect(f)}>{f.question}</button>
                    ))}
                    <button className="plc-chip plc-chip-quiet" onClick={() => setScreen('topics')}>All topics</button>
                  </div>
                )}
              </>
            )}
          </div>

          {screen === 'chat' && (
            <form className="plc-foot" onSubmit={e => { e.preventDefault(); handleSubmit(input) }}>
              <label htmlFor="plc-input" className="plc-sr">Type your question</label>
              <textarea
                id="plc-input" ref={composerRef} className="plc-input" rows={1}
                value={input} autoComplete="off" placeholder="Ask a question…"
                onChange={e => {
                  setInput(e.target.value)
                  // Auto-grow to the CSS max-height, then scroll internally.
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(input) }
                }}
              />
              <button type="submit" className="plc-send" aria-label="Send question" disabled={!input.trim()}>
                <ArrowUp size={18} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}