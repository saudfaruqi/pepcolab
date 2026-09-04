'use client'
// src/components/ChatWidget.tsx
//
// PepcoLab support assistant — visual rebuild, September 2026.
//
// WHAT WAS WRONG WITH THE PREVIOUS VERSION
// It worked and it was accessible, but it looked like a generic support
// widget bolted onto the site, and on a phone it was worse than that. Six
// concrete faults, all fixed here:
//
//   1. iOS ZOOM BUG. The composer input was 14px. Safari zooms the entire
//      page when a focused input is under 16px, so tapping the field threw
//      the layout off-centre on every iPhone. Now 16px.
//   2. height:100% ON MOBILE. When the keyboard opened, the composer went
//      off-screen — you could not see what you were typing. Now 100dvh,
//      which tracks the visual viewport.
//   3. NO SAFE-AREA INSETS. Full-screen on a notched phone put the header
//      under the status bar and the composer under the home indicator.
//   4. FOUR CONTROLS IN THE HEADER at 380px wide: back, title, "Talk to us",
//      close. Cramped and unreadable. The human route is now its own bar
//      under the header — more prominent AND less crowded.
//   5. BACKGROUND SCROLLED behind the open sheet on mobile.
//   6. EVERY SUGGESTION A FULL-WIDTH BUTTON, which read as a form rather
//      than a conversation. They are inline chips now.
//
// VISUAL DIRECTION
// Taken from the site rather than invented: ink #0D0D0D, paper #F7F5F1, the
// gold #C8992A hairline that already runs across the emails and checkout
// pages. Messages are set as a TRANSCRIPT rather than two-colour chat
// bubbles — assistant replies sit unbubbled on paper, the visitor's own words
// sit in a small ink pill. That reads as a record of an exchange, which suits
// a brand whose whole argument is documentation, and it avoids the generic
// messaging-app look the previous version had.
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

type Bubble = { id: string; role: 'bot' | 'user'; text: string; links?: { label: string; href: string }[] }
type Screen = 'chat' | 'topics' | 'handoff'

let seq = 0
const nextId = () => `b${++seq}`

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
  const { email: customerEmail, firstName } = useCustomer()
  const [announce, setAnnounce] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const startedRef = useRef(false)

  const hidden = HIDDEN_ON.some(p => pathname.startsWith(p))

  /* ── conversation ─────────────────────────────────────────────────────── */

  const pushBot = useCallback((lines: string[], links?: Bubble['links']) => {
    setBubbles(prev => [...prev, ...lines.map((text, i) => ({
      id: nextId(), role: 'bot' as const, text,
      links: i === lines.length - 1 ? links : undefined,
    }))])
    setAnnounce(lines.join(' '))
  }, [])

  const pushUser = useCallback((text: string) => {
    setBubbles(prev => [...prev, { id: nextId(), role: 'user', text }])
  }, [])

  const answerFaq = useCallback((faq: Faq) => {
    if (faq.id === 'contact-human') { pushBot(faq.answer); setScreen('handoff'); return }
    pushBot(faq.answer, faq.links)
    const related = (faq.related ?? []).map(id => FAQ_BY_ID[id]).filter(Boolean)
    setSuggestions(related.length ? related : context.suggested.map(id => FAQ_BY_ID[id]).filter(Boolean))
  }, [pushBot, context.suggested])

  const handleSelect = useCallback((faq: Faq) => { pushUser(faq.question); answerFaq(faq) }, [pushUser, answerFaq])

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
    if (result.kind === 'match') { answerFaq(result.faq); return }
    if (result.kind === 'ambiguous') {
      pushBot(['A few things could match that — which did you mean?'])
      setSuggestions(result.faqs)
      return
    }
    pushBot(NO_MATCH_ANSWER)
    setSuggestions([FAQ_BY_ID['contact-human']].filter(Boolean))
  }, [pushUser, pushBot, answerFaq])

  /* ── open / close ─────────────────────────────────────────────────────── */

  // AUTOFILL (Sep 2026): a signed-in customer should never retype the
  // address we emailed their order to. Only fills an untouched field, so it
  // can't stamp over something they typed.
  useEffect(() => {
    if (customerEmail && !contactEmail) setContactEmail(customerEmail)
  }, [customerEmail, contactEmail])

  useEffect(() => {
    if (!open || startedRef.current) return
    startedRef.current = true
    // Greet a known customer by name — the assistant should not act like a
    // stranger to someone whose orders it can already see.
    pushBot([firstName ? `${firstName} — ${context.greeting.charAt(0).toLowerCase()}${context.greeting.slice(1)}` : context.greeting])
    setSuggestions(context.suggested.map(id => FAQ_BY_ID[id]).filter(Boolean))
  }, [open, context, pushBot])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => panelRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    launcherRef.current?.focus()
  }, [open])

  // Lock the page behind the sheet on mobile only. On desktop the panel is a
  // corner overlay and locking the page would be obstructive.
  useEffect(() => {
    if (!open) return
    if (!window.matchMedia('(max-width: 560px)').matches) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
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
        .plc-launcher {
          position: fixed; right: 20px; z-index: 900;
          bottom: calc(20px + env(safe-area-inset-bottom, 0px));
          display: flex; align-items: center; gap: 9px;
          height: 52px; padding: 0 20px 0 17px;
          border: none; border-radius: 999px; cursor: pointer;
          background: var(--ink); color: #fff;
          font-size: 14.5px; font-weight: 600; letter-spacing: -.01em;
          box-shadow: 0 6px 24px rgba(13,13,13,.26);
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .plc-launcher:hover { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(13,13,13,.3); }
        .plc-launcher:active { transform: translateY(0); }

        .plc-panel {
          position: fixed; right: 20px; bottom: 20px; z-index: 950;
          width: 384px; height: min(600px, calc(100vh - 40px));
          display: flex; flex-direction: column; overflow: hidden;
          background: var(--paper);
          border: 1px solid var(--line); border-radius: 18px;
          box-shadow: 0 20px 60px rgba(13,13,13,.22);
          animation: plcIn .2s cubic-bezier(.2,.8,.3,1);
        }
        @keyframes plcIn { from { opacity: 0; transform: translateY(10px) scale(.99) } to { opacity: 1; transform: none } }

        .plc-head { flex-shrink: 0; background: var(--ink); color: #fff; padding: 14px 14px 13px 16px; }
        .plc-head-row { display: flex; align-items: center; gap: 10px; }
        .plc-title { font-size: 15px; font-weight: 600; letter-spacing: -.015em; line-height: 1.2; }
        .plc-where { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 1px;
                     white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .plc-rule { height: 2px; background: var(--gold); flex-shrink: 0; }

        .plc-icon { display: flex; align-items: center; justify-content: center;
                    width: 34px; height: 34px; flex-shrink: 0;
                    background: none; border: none; border-radius: 9px;
                    color: rgba(255,255,255,.7); cursor: pointer; transition: background .15s, color .15s; }
        .plc-icon:hover { background: rgba(255,255,255,.1); color: #fff; }

        /* The route to a person gets its own bar, so it never competes with
           the title for width on a narrow screen. */
        .plc-human { flex-shrink: 0; display: flex; align-items: center; gap: 8px; width: 100%;
                     padding: 11px 16px; border: none; border-bottom: 1px solid var(--line);
                     background: #fff; color: var(--ink); cursor: pointer;
                     font-size: 13.5px; font-weight: 600; text-align: left; transition: background .15s; }
        .plc-human:hover { background: #FBFAF7; }
        .plc-human span { color: var(--muted); font-weight: 400; }

        .plc-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 18px 16px 20px; }

        /* Transcript, not chat bubbles. */
        .plc-bot { font-size: 14.5px; line-height: 1.6; color: var(--ink);
                   margin: 0 0 14px; max-width: 92%; letter-spacing: -.005em; }
        .plc-user { display: block; margin: 0 0 16px auto; width: fit-content; max-width: 85%;
                    padding: 9px 14px; border-radius: 16px 16px 4px 16px;
                    background: var(--ink); color: #fff; font-size: 14px; line-height: 1.5; }

        .plc-links { display: flex; flex-direction: column; gap: 6px; margin: -6px 0 16px; }
        .plc-link { display: flex; align-items: center; justify-content: space-between; gap: 10px;
                    min-height: 42px; padding: 0 14px; border-radius: 11px;
                    border: 1px solid var(--line); background: #fff;
                    font-size: 13.5px; font-weight: 600; color: var(--ink); text-decoration: none;
                    transition: border-color .15s; }
        .plc-link:hover { border-color: rgba(13,13,13,.3); }

        /* Suggestions as inline chips, not stacked form buttons. */
        .plc-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 4px; }
        .plc-chip { min-height: 36px; padding: 8px 14px; border-radius: 999px;
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
                    padding: 12px; border-top: 1px solid var(--line); background: #fff; }
        /* 16px is not a style choice: Safari zooms the whole page when a
           focused input is smaller, which was throwing the layout off-centre
           on every iPhone. */
        .plc-input { flex: 1; min-height: 44px; padding: 11px 14px; font-size: 16px;
                     font-family: inherit; color: var(--ink);
                     border: 1px solid var(--line); border-radius: 12px; background: var(--paper);
                     outline: none; transition: border-color .15s; }
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

        /* Mobile: a full-height sheet. dvh tracks the visual viewport, so the
           composer stays visible when the keyboard opens — height:100% pushed
           it off-screen. */
        @media (max-width: 560px) {
          .plc-panel { inset: 0; width: 100%; height: 100dvh; max-height: none;
                       border: none; border-radius: 0; animation: plcUp .22s cubic-bezier(.2,.8,.3,1); }
          .plc-head { padding-top: calc(14px + env(safe-area-inset-top, 0px)); }
          .plc-body { padding: 18px 18px 24px; }
          .plc-bot { font-size: 15px; max-width: 100%; }
          .plc-foot { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
          .plc-launcher { right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); }
        }
        @keyframes plcUp { from { transform: translateY(100%) } to { transform: none } }

        @media (prefers-reduced-motion: reduce) {
          .plc-panel { animation: none }
          .plc * { transition: none !important }
        }
      `}</style>

      {!open && (
        <button ref={launcherRef} className="plc plc-launcher" onClick={() => setOpen(true)} aria-label="Open support chat">
          <MessageCircle size={18} aria-hidden="true" />
        </button>
      )}

      {open && (
        <div ref={panelRef} className="plc plc-panel" role="dialog" aria-label="PepcoLab support" tabIndex={-1}>
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

                {suggestions.length > 0 && (
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
              <input id="plc-input" className="plc-input" value={input} autoComplete="off"
                     onChange={e => setInput(e.target.value)} placeholder="Ask a question…" />
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