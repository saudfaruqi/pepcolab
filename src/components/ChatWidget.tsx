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
// CHANGES IN THIS PASS
//   1. FOCUS WAS STOLEN ON PAGE LOAD. The focus effect ran on first mount
//      with open=false, so the launcher grabbed focus the moment the page
//      hydrated — jumping the viewport to the bottom-right corner. It now
//      only restores focus on an actual close.
//   2. NO FOCUS TRAP. Tab walked straight out of an open dialog into the
//      page behind it. Trapped now, with aria-modal set.
//   3. LAUNCHER WAS A LOPSIDED PILL. It carried pill padding, a font size
//      and a gap but rendered an icon alone. It's a circle on phones and a
//      labelled pill from 561px up, which also makes it far easier to spot.
//   4. iOS SCROLL LOCK DIDN'T LOCK. overflow:hidden on body does not stop
//      Safari rubber-banding. Position-fixed with scroll restore does.
//   5. SINGLE-LINE COMPOSER. Long questions scrolled sideways inside a
//      44px box. Auto-growing textarea, Enter sends, Shift+Enter newlines.
//      (.plc-foot was already align-items:flex-end for exactly this.)
//   6. INSTANT REPLIES read as a lookup table rather than a conversation.
//      Short typing indicator before each assistant turn.
//   7. CSS WAS DESKTOP-FIRST with a max-width override undoing it. Base is
//      the phone layout now; 561px+ layers the corner panel on top.
//
// All copy lives in lib/chatContent.ts. This file only renders it.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, X, ArrowLeft, ArrowUp, Headset, Mail, Check, Loader2 } from 'lucide-react'
import {
  FAQS, FAQ_BY_ID, TOPICS, resolvePageContext, matchFaq,
  REFUSAL_ANSWER, NO_MATCH_ANSWER,
  type Faq, type TopicId,
} from '@/lib/chatContent'
import { whatsAppChatHandoffLink, isWhatsAppConfigured } from '@/lib/whatsapp'
import { trackChatHandoff } from '@/lib/analytics'
import { useCustomer } from '@/lib/customerContext'

const HIDDEN_ON = ['/checkout/success', '/checkout/failure', '/checkout/cancel', '/admin']
const SUPPORT_EMAIL = 'hello@pepcolab.com'

/** Proactive nudge — once per session, never on a repeat page view. */
const NUDGE_KEY = 'plc:nudged'
const NUDGE_DELAY = 6000
const NUDGE_LIFETIME = 12000

/** Assistant "thinking" beat. Long enough to read as a reply rather than a
 *  lookup, short enough that nobody waits on it. */
const TYPING_MS = 420

type Bubble = { id: string; role: 'bot' | 'user'; text: string; links?: { label: string; href: string }[] }
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
  const [announce, setAnnounce] = useState('')
  const [nudge, setNudge] = useState(false)

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

  const pushBot = useCallback((lines: string[], links?: Bubble['links'], after?: () => void) => {
    setTyping(true)
    later(() => {
      setTyping(false)
      setBubbles(prev => [...prev, ...lines.map((text, i) => ({
        id: nextId(), role: 'bot' as const, text,
        links: i === lines.length - 1 ? links : undefined,
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

  const handleSelect = useCallback((faq: Faq) => { pushUser(faq.question); answerFaq(faq) }, [pushUser, answerFaq])

  const handleSubmit = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text) return
    pushUser(text)
    setInput('')
    setSuggestions([])
    if (composerRef.current) composerRef.current.style.height = 'auto'

    const result = matchFaq(text)
    if (result.kind === 'blocked') {
      pushBot(REFUSAL_ANSWER, undefined, () =>
        setSuggestions([FAQ_BY_ID['coa-what'], FAQ_BY_ID['handling-storage'], FAQ_BY_ID['contact-human']].filter(Boolean)))
      return
    }
    if (result.kind === 'match') { answerFaq(result.faq); return }
    if (result.kind === 'ambiguous') {
      pushBot(['A few things could match that — which did you mean?'], undefined, () => setSuggestions(result.faqs))
      return
    }
    pushBot(NO_MATCH_ANSWER, undefined, () => setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean)))
  }, [pushUser, pushBot, answerFaq])

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

  // Proactive nudge. Held until the visitor has actually settled on a page,
  // dismissible, and capped at once per session so it never nags.
  const dismissNudge = useCallback(() => {
    setNudge(false)
    try { sessionStorage.setItem(NUDGE_KEY, '1') } catch { /* private mode */ }
  }, [])

  useEffect(() => {
    if (hidden) return
    let seen = true
    try { seen = sessionStorage.getItem(NUDGE_KEY) === '1' } catch { seen = false }
    if (seen) return
    const show = later(() => setNudge(true), NUDGE_DELAY)
    const hide = later(() => setNudge(false), NUDGE_DELAY + NUDGE_LIFETIME)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [hidden, later])

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
          border: none; border-radius: 999px; cursor: pointer;
          background: var(--ink); color: #fff;
          font-family: inherit; font-size: 14.5px; font-weight: 600; letter-spacing: -.01em;
          box-shadow: 0 8px 28px rgba(13,13,13,.3);
          transition: transform .15s ease, box-shadow .15s ease;
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
          border-radius: 13px; box-shadow: 0 12px 34px rgba(13,13,13,.3);
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
        .plc-action-primary:hover { background: #1c1c1c; border-color: #1c1c1c; }

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
          .plc-launcher:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(13,13,13,.34); }

          .plc-nudge { right: 20px; bottom: 84px; max-width: 280px; }

          .plc-panel {
            inset: auto; right: 20px; bottom: 20px;
            width: 384px; height: min(620px, calc(100vh - 40px));
            border: 1px solid var(--line); border-radius: 18px;
            box-shadow: 0 20px 60px rgba(13,13,13,.22);
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