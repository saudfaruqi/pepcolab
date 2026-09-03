'use client'
// src/components/ChatWidget.tsx
//
// PepcoLab support assistant — rebuilt September 2026.
//
// WHAT CHANGED AND WHY
// --------------------
// The previous widget was ~1,200 lines with its copy, its conversation graph,
// its matching logic and its UI all interleaved, plus a live model call to
// /api/chat. Three problems with that:
//
//   1. Editing an answer meant editing a React component, so in practice
//      answers didn't get edited. All copy now lives in lib/chatContent.ts.
//   2. A model generating customer-facing text for a research-compound
//      supplier can invent a dosage, a delivery date or a purity figure. Every
//      answer here is now pre-written. Nothing is generated. /api/chat is no
//      longer called by this component.
//   3. Reaching a human was buried at the bottom of a menu. It is now
//      permanently visible in the header, on every screen, at every step.
//
// PAGE AWARENESS
// The assistant reads the route and adapts: the greeting, the suggested
// questions, and — on a product page — the compound's own name. That context
// is also attached to the handoff, so the representative opens the
// conversation already knowing where the visitor was and what they'd asked.
//
// ACCESSIBILITY
// Labelled dialog, focus moved in on open and restored on close, Escape to
// close, full keyboard operation, an aria-live region announcing new
// messages, visible focus rings, 44px minimum touch targets, and honoured
// prefers-reduced-motion. The panel is deliberately NOT aria-modal: it is a
// support tool alongside the page, not a barrier across it, so screen-reader
// users can still reach the content they came for.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, X, ArrowLeft, Send, ExternalLink, Headset, Mail, Check } from 'lucide-react'
import {
  FAQS, FAQ_BY_ID, TOPICS, resolvePageContext, matchFaq,
  REFUSAL_ANSWER, NO_MATCH_ANSWER,
  type Faq, type TopicId,
} from '@/lib/chatContent'
import { whatsAppChatHandoffLink, isWhatsAppConfigured } from '@/lib/whatsapp'

/** Routes where a floating widget is in the way — same rule the other
 *  floating elements use, so they appear and disappear together. */
const HIDDEN_ON = ['/checkout/success', '/checkout/failure', '/checkout/cancel', '/admin']

const SUPPORT_EMAIL = 'hello@pepcolab.com'

type Bubble = {
  id: string
  role: 'bot' | 'user'
  text: string
  links?: { label: string; href: string }[]
}

type Screen = 'chat' | 'topics' | 'handoff'

let bubbleSeq = 0
const nextId = () => `b${++bubbleSeq}`

export default function ChatWidget() {
  const pathname = usePathname() || '/'
  const context = useMemo(() => resolvePageContext(pathname), [pathname])

  const [open, setOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('chat')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [suggestions, setSuggestions] = useState<Faq[]>([])
  const [input, setInput] = useState('')
  const [activeTopic, setActiveTopic] = useState<TopicId | null>(null)
  const [handoffState, setHandoffState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [contactEmail, setContactEmail] = useState('')
  const [announce, setAnnounce] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const startedRef = useRef(false)

  const hidden = HIDDEN_ON.some(p => pathname.startsWith(p))

  /* ── conversation helpers ─────────────────────────────────────────────── */

  const pushBot = useCallback((lines: string[], links?: Bubble['links']) => {
    setBubbles(prev => [
      ...prev,
      ...lines.map((text, i) => ({
        id: nextId(),
        role: 'bot' as const,
        text,
        links: i === lines.length - 1 ? links : undefined,
      })),
    ])
    setAnnounce(lines.join(' '))
  }, [])

  const pushUser = useCallback((text: string) => {
    setBubbles(prev => [...prev, { id: nextId(), role: 'user', text }])
  }, [])

  const answerFaq = useCallback((faq: Faq) => {
    if (faq.id === 'contact-human') {
      pushBot(faq.answer)
      setScreen('handoff')
      return
    }
    pushBot(faq.answer, faq.links)
    const related = (faq.related ?? []).map(id => FAQ_BY_ID[id]).filter(Boolean)
    setSuggestions(related.length ? related : context.suggested.map(id => FAQ_BY_ID[id]).filter(Boolean))
  }, [pushBot, context.suggested])

  const handleSelect = useCallback((faq: Faq) => {
    pushUser(faq.question)
    answerFaq(faq)
  }, [pushUser, answerFaq])

  const handleSubmit = useCallback((raw: string) => {
    const text = raw.trim()
    if (!text) return
    pushUser(text)
    setInput('')

    const result = matchFaq(text)
    if (result.kind === 'blocked') {
      pushBot(REFUSAL_ANSWER)
      setSuggestions([FAQ_BY_ID['coa-what'], FAQ_BY_ID['handling-storage'], FAQ_BY_ID['contact-human']].filter(Boolean))
      return
    }
    if (result.kind === 'match') {
      answerFaq(result.faq)
      return
    }
    if (result.kind === 'ambiguous') {
      pushBot(['I can answer a few things there \u2014 which did you mean?'])
      setSuggestions(result.faqs)
      return
    }
    pushBot(NO_MATCH_ANSWER)
    setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean))
  }, [pushUser, pushBot, answerFaq])

  /* ── open / close ─────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!open || startedRef.current) return
    startedRef.current = true
    pushBot([context.greeting])
    setSuggestions(context.suggested.map(id => FAQ_BY_ID[id]).filter(Boolean))
  }, [open, context, pushBot])

  // Focus into the panel on open, restore to the launcher on close.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => panelRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    launcherRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [bubbles, suggestions, screen])

  /* ── handoff ──────────────────────────────────────────────────────────── */

  const transcript = useMemo(
    () => bubbles.map(b => ({ role: b.role === 'user' ? 'user' as const : 'assistant' as const, content: b.text })),
    [bubbles]
  )

  const handoffSummary = useMemo(() => {
    const where = context.productSlug
      ? `Page: ${context.label} \u2014 ${context.productSlug}`
      : `Page: ${context.label}`
    const asked = bubbles.filter(b => b.role === 'user').slice(-3).map(b => `\u2022 ${b.text}`).join('\n')
    return [where, typeof window !== 'undefined' ? window.location.href : '', asked && `I asked about:\n${asked}`]
      .filter(Boolean).join('\n')
  }, [bubbles, context])

  /**
   * Fires the transcript email. This is what guarantees the team sees the
   * conversation even if the visitor never completes the WhatsApp step —
   * wa.me links open the visitor's own device and we get no callback.
   */
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
    } catch {
      setHandoffState('error')
    }
  }, [transcript, contactEmail])

  if (hidden) return null

  const waConfigured = isWhatsAppConfigured()
  const topicFaqs = activeTopic ? FAQS.filter(f => f.topic === activeTopic) : []

  /* ── styles ───────────────────────────────────────────────────────────── */

  const btnBase: React.CSSProperties = {
    minHeight: 44, borderRadius: 12, cursor: 'pointer', fontSize: 13.5,
    fontWeight: 600, textAlign: 'left', padding: '11px 14px', width: '100%',
    border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#101010',
    display: 'flex', alignItems: 'center', gap: 9,
  }

  return (
    <>
      <style>{`
        .pl-chat *:focus-visible { outline: 2px solid #101010; outline-offset: 2px; }
        .pl-chip:hover, .pl-btn:hover { background: #F2F2EF; }
        .pl-panel { animation: plIn .18s ease-out; }
        @keyframes plIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) {
          .pl-panel { animation: none }
          .pl-chat * { transition: none !important }
        }
        @media (max-width: 480px) {
          .pl-panel { inset: 0 !important; width: 100% !important; height: 100% !important;
                      max-height: 100% !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Launcher */}
      {!open && (
        <button
          ref={launcherRef}
          className="pl-chat"
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 900,
            height: 56, minWidth: 56, borderRadius: 999, border: 'none',
            background: '#101010', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px',
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 8px 28px rgba(0,0,0,.28)',
          }}
        >
          <MessageCircle size={19} aria-hidden="true" />
          Help
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          className="pl-chat pl-panel"
          role="dialog"
          aria-label="PepcoLab support assistant"
          tabIndex={-1}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 950,
            width: 390, maxWidth: 'calc(100vw - 32px)',
            height: 580, maxHeight: 'calc(100vh - 48px)',
            background: '#FAFAF8', borderRadius: 20,
            border: '1px solid rgba(0,0,0,.1)',
            boxShadow: '0 24px 70px rgba(0,0,0,.24)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Header — the human route lives here, permanently, on every screen */}
          <div style={{ background: '#101010', color: '#fff', padding: '14px 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {screen !== 'chat' && (
                <button
                  onClick={() => { setScreen('chat'); setActiveTopic(null) }}
                  aria-label="Back to chat"
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-.01em' }}>PepcoLab support</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>
                  {screen === 'handoff' ? 'Connecting you to a person' : context.label}
                </div>
              </div>
              {screen !== 'handoff' && (
                <button
                  onClick={() => setScreen('handoff')}
                  style={{
                    minHeight: 34, padding: '0 12px', borderRadius: 999,
                    border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)',
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  }}
                >
                  <Headset size={14} aria-hidden="true" />
                  Talk to us
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close support chat"
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.75)', cursor: 'pointer', padding: 4, display: 'flex' }}
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
              {announce}
            </p>

            {screen === 'handoff' ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#101010', margin: 0 }}>
                  Pick whichever is easiest. We&apos;ll already have the page you&apos;re on and
                  what you&apos;ve asked so far, so you won&apos;t have to explain it twice.
                </p>

                {waConfigured ? (
                  <a
                    href={whatsAppChatHandoffLink(handoffSummary)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sendTranscript('whatsapp_handoff')}
                    className="pl-btn"
                    style={{ ...btnBase, background: '#101010', color: '#fff', border: 'none', textDecoration: 'none', justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <MessageCircle size={16} aria-hidden="true" />
                      WhatsApp — usually fastest
                    </span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : null}

                <a href={`mailto:${SUPPORT_EMAIL}`} className="pl-btn" style={{ ...btnBase, textDecoration: 'none' }}>
                  <Mail size={16} aria-hidden="true" />
                  Email {SUPPORT_EMAIL}
                </a>

                <div style={{ borderTop: '1px solid rgba(0,0,0,.08)', paddingTop: 14, marginTop: 2 }}>
                  <label htmlFor="pl-email" style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Or leave your email and we&apos;ll come to you
                  </label>
                  {handoffState === 'sent' ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                      color: '#3B6D11', background: '#EAF3DE', border: '0.5px solid #D3E8BE',
                      borderRadius: 12, padding: '12px 14px',
                    }}>
                      <Check size={15} aria-hidden="true" />
                      Sent. A person will pick this up.
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          id="pl-email"
                          type="email"
                          value={contactEmail}
                          onChange={e => setContactEmail(e.target.value)}
                          placeholder="your@email.com"
                          style={{
                            flex: 1, minHeight: 44, padding: '0 12px', fontSize: 14,
                            border: '1px solid rgba(0,0,0,.15)', borderRadius: 12, background: '#fff', color: '#101010',
                          }}
                        />
                        <button
                          onClick={() => sendTranscript('requested_callback')}
                          disabled={handoffState === 'sending' || !contactEmail.trim()}
                          style={{
                            minHeight: 44, padding: '0 16px', borderRadius: 12, border: 'none',
                            background: contactEmail.trim() ? '#101010' : 'rgba(0,0,0,.15)',
                            color: '#fff', fontWeight: 700, fontSize: 13,
                            cursor: contactEmail.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <Send size={15} aria-hidden="true" />
                        </button>
                      </div>
                      {handoffState === 'error' && (
                        <p style={{ fontSize: 12.5, color: '#B3261E', margin: '8px 0 0' }}>
                          That didn&apos;t send. Please use WhatsApp or email us directly.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : screen === 'topics' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {!activeTopic ? TOPICS.map(t => (
                  <button key={t.id} className="pl-btn" onClick={() => setActiveTopic(t.id)}
                          style={{ ...btnBase, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <span style={{ fontWeight: 700 }}>{t.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,.55)' }}>{t.blurb}</span>
                  </button>
                )) : topicFaqs.map(f => (
                  <button key={f.id} className="pl-btn" onClick={() => { handleSelect(f); setScreen('chat'); setActiveTopic(null) }} style={btnBase}>
                    {f.question}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gap: 10 }}>
                  {bubbles.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: b.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '88%', padding: '10px 13px', borderRadius: 14, fontSize: 13.8, lineHeight: 1.6,
                        background: b.role === 'user' ? '#101010' : '#fff',
                        color: b.role === 'user' ? '#fff' : '#101010',
                        border: b.role === 'user' ? 'none' : '1px solid rgba(0,0,0,.08)',
                      }}>
                        {b.text}
                        {b.links && b.links.length > 0 && (
                          <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                            {b.links.map(l => (
                              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                      minHeight: 40, padding: '0 12px', borderRadius: 10, fontSize: 12.8, fontWeight: 600,
                                      border: '1px solid rgba(0,0,0,.12)', color: '#101010', textDecoration: 'none',
                                    }}>
                                {l.label}
                                <ExternalLink size={13} aria-hidden="true" />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {suggestions.length > 0 && (
                  <div style={{ display: 'grid', gap: 7, marginTop: 14 }}>
                    {suggestions.map(f => (
                      <button key={f.id} className="pl-chip" onClick={() => handleSelect(f)}
                              style={{ ...btnBase, minHeight: 40, padding: '9px 13px', fontSize: 13 }}>
                        {f.question}
                      </button>
                    ))}
                    <button className="pl-chip" onClick={() => setScreen('topics')}
                            style={{ ...btnBase, minHeight: 40, padding: '9px 13px', fontSize: 13, color: 'rgba(0,0,0,.6)' }}>
                      Browse all topics
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Composer */}
          {screen === 'chat' && (
            <form
              onSubmit={e => { e.preventDefault(); handleSubmit(input) }}
              style={{ borderTop: '1px solid rgba(0,0,0,.08)', padding: 12, display: 'flex', gap: 8, background: '#fff', flexShrink: 0 }}
            >
              <label htmlFor="pl-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                Type your question
              </label>
              <input
                id="pl-input"
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a question…"
                autoComplete="off"
                style={{
                  flex: 1, minHeight: 44, padding: '0 13px', fontSize: 14,
                  border: '1px solid rgba(0,0,0,.14)', borderRadius: 12, background: '#FAFAF8', color: '#101010',
                }}
              />
              <button type="submit" aria-label="Send question" disabled={!input.trim()}
                      style={{
                        minWidth: 44, minHeight: 44, borderRadius: 12, border: 'none',
                        background: input.trim() ? '#101010' : 'rgba(0,0,0,.15)', color: '#fff',
                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}