// src/components/ChatWidget.tsx
//
// Manual / scripted chatbot — NOT AI-powered. The conversation is a fixed
// decision tree (see lib/chatFlow.ts): every bot message and every button
// the visitor can tap comes straight from that file. There is no call to
// /api/chat or any LLM here. Typing in the textbox still works — it's
// matched against each node's keyword list (lib/chatFlow.ts#routeFreeText,
// plain substring matching) and routed to the closest scripted answer, or
// to a "didn't find that" fallback with the main menu + human handoff.
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { 
  MessageSquare, 
  X, 
  Send, 
  ArrowUpRight, 
  ChevronLeft,
  AlertCircle,
  ShieldCheck
} from 'lucide-react'
import { whatsAppChatHandoffLink, isWhatsAppConfigured } from '@/lib/whatsapp'
import { CHAT_NODES, START_NODE_ID, routeFreeText, type ChatOption } from '@/lib/chatFlow'

/** Same rule as FloatingWhatsApp/FloatingCalculator — stay out of the way
 *  of the STRABL checkout UI. */
const HIDDEN_PREFIXES = ['/checkout']

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isDisclaimer?: boolean
}

// Small delay between bot bubbles so a multi-message node doesn't dump
// everything on screen at once — mimics "typing" without needing a
// network round trip, since none of this touches an API.
const BOT_MESSAGE_DELAY_MS = 450

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export default function ChatWidget() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentNodeId, setCurrentNodeId] = useState(START_NODE_ID)
  const [currentOptions, setCurrentOptions] = useState<ChatOption[]>(CHAT_NODES[START_NODE_ID].options)
  const [input, setInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const [showHandoff, setShowHandoff] = useState(false)
  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [handoffSent, setHandoffSent] = useState(false)
  const [handoffSending, setHandoffSending] = useState(false)

  // Track if transcript has been sent already (per session)
  const transcriptSentRef = useRef(false)
  // Track if user has had meaningful interaction (more than just opening chat)
  const hasMeaningfulInteraction = useRef(false)
  // Track if user explicitly requested human help
  const explicitHandoffRequested = useRef(false)
  
  const bodyRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 250)
      setShowDisclaimer(true)
    }
  }, [open])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, botTyping])

  // Outside click + Escape, same pattern as FloatingCalculator.
  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Push a node's bot message(s) onto the transcript, one bubble at a time
  // with a short stagger, then activate that node's options. This is the
  // one place that "moves" the scripted conversation forward.
  const playNode = useCallback((nodeId: string) => {
    const node = CHAT_NODES[nodeId] ?? CHAT_NODES.not_found
    setCurrentNodeId(node.id)
    setCurrentOptions([])
    setBotTyping(true)

    const bubbles = Array.isArray(node.message) ? node.message : [node.message]

    bubbles.forEach((text, i) => {
      const isLast = i === bubbles.length - 1
      const isDisclaimerText = text.toLowerCase().includes('research use only') || 
                               text.toLowerCase().includes('not for human')
      
      setTimeout(
        () => {
          const msg: ChatMessage = { 
            id: uid(), 
            role: 'assistant', 
            content: text,
            isDisclaimer: isDisclaimerText
          }
          setMessages((prev) => [...prev, msg])
          
          if (isLast) {
            setBotTyping(false)
            setCurrentOptions(node.options)
          }
        },
        (i + 1) * BOT_MESSAGE_DELAY_MS
      )
    })

    if (node.id === 'human') {
      explicitHandoffRequested.current = true
      setTimeout(() => setShowHandoff(true), bubbles.length * BOT_MESSAGE_DELAY_MS)
    }
  }, [])

  // Play the opening node's message(s) the first time the widget actually
  // opens, rather than on mount — keeps the panel empty/lightweight until
  // a visitor engages.
  useEffect(() => {
    if (!open || initialized) return
    setInitialized(true)
    playNode(START_NODE_ID)
  }, [open, initialized, playNode])

  // Send transcript only when there's meaningful interaction and either:
  // 1. User explicitly requested human help (clicked "Talk to a human")
  // 2. User completed the handoff form
  // 3. User has had a real conversation (at least 3 messages exchanged)
  const shouldSendTranscript = useCallback(() => {
    // Don't send if already sent
    if (transcriptSentRef.current) return false
    
    // Get real messages (excluding greeting)
    const realMessages = messages.filter((m) => 
      m.id !== 'greeting' && 
      m.role === 'user' &&
      m.content.length > 5 // Ignore very short messages
    )
    
    // Send if user explicitly requested human help
    if (explicitHandoffRequested.current) return true
    
    // Send if user has had a meaningful conversation (at least 2 substantive messages)
    if (realMessages.length >= 2) return true
    
    // Send if handoff form was submitted
    if (handoffSent) return true
    
    return false
  }, [messages, handoffSent])

  const sendTranscript = useCallback(
    (reason: string) => {
      if (transcriptSentRef.current) return
      if (messages.length === 0) return
      
      // Check if we should send based on interaction
      if (!shouldSendTranscript()) {
        console.log('[Chat] Transcript not sent - insufficient interaction')
        return
      }
      
      transcriptSentRef.current = true
      
      // Best-effort, fire-and-forget — never block the UI on this.
      fetch('/api/chat/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
          contact,
          reason,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      }).catch(() => {})
    },
    [messages, contact, shouldSendTranscript]
  )

  // Send transcript when handoff is completed
  useEffect(() => {
    if (handoffSent && !transcriptSentRef.current) {
      sendTranscript('handoff_completed')
    }
  }, [handoffSent, sendTranscript])

  function handleOptionClick(option: ChatOption) {
    if (botTyping) return

    setMessages((prev) => [...prev, { id: uid(), role: 'user', content: option.label }])

    if (option.href && typeof window !== 'undefined') {
      window.open(option.href, '_blank', 'noopener,noreferrer')
    }

    if (option.action === 'handoff') {
      playNode('human')
      return
    }

    if (option.next) {
      playNode(option.next)
      return
    }

    // href-only option (e.g. a category link) — stay on the same node,
    // just re-show its options so the visitor can pick something else.
    setCurrentOptions(CHAT_NODES[currentNodeId]?.options ?? [])
  }

  function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || botTyping) return

    setMessages((prev) => [...prev, { id: uid(), role: 'user', content: text }])
    setInput('')

    const nodeId = routeFreeText(text)
    setTimeout(() => playNode(nodeId), BOT_MESSAGE_DELAY_MS)
  }

  async function handleWhatsAppHandoff() {
    setHandoffSending(true)
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content
    const summary = lastUserMsg
      ? `Last thing I asked: "${lastUserMsg.slice(0, 200)}"`
      : "I'd like some help getting started."

    await sendTranscript('whatsapp_handoff')
    setHandoffSent(true)
    setHandoffSending(false)

    const link = whatsAppChatHandoffLink(summary, contact.name || undefined)
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  async function handleEmailHandoff() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return
    setHandoffSending(true)
    await sendTranscript('email_handoff')
    setHandoffSent(true)
    setHandoffSending(false)
  }

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null

  return (
    <>
      {/* Toggle button - positioned at right edge with peek indicator */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Pepco Chat'}
        aria-expanded={open}
        className={`cw-fab${mounted ? ' cw-in' : ''}${open ? ' cw-fab-open' : ''}`}
      >
        {open ? (
          <X size={20} />
        ) : (
          <>
            <MessageSquare size={20} />
            <span className="cw-peek-indicator">
              <ChevronLeft size={14} />
            </span>
          </>
        )}
      </button>

      {/* Panel - slides in from right edge */}
      {open && (
        <div ref={panelRef} className="cw-panel" role="dialog" aria-label="PepcoLab chat assistant">
          {/* Pull tab / handle at the left edge */}
          <div className="cw-pull-tab" onClick={() => setOpen(false)}>
            <ChevronLeft size={18} />
            <span>Close</span>
          </div>

          <div className="cw-header">
            <div className="cw-header-info">
              <div className="cw-avatar">PL</div>
              <div>
                <div className="cw-title">PepcoLab Assistant</div>
                <div className="cw-status">
                  <span className="cw-dot" /> Research-grade compounds · Typically replies instantly
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="cw-close">
              <X size={18} />
            </button>
          </div>

          <div ref={bodyRef} className="cw-body">
            {/* Persistent research-use-only disclaimer banner at top of chat */}
            {showDisclaimer && messages.length <= 2 && (
              <div className="cw-disclaimer-banner">
                <div className="cw-disclaimer-icon">
                  <AlertCircle size={14} />
                </div>
                <div className="cw-disclaimer-text">
                  <strong>Research Use Only</strong> — All products are for in-vitro laboratory research, not for human or veterinary use.
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`cw-msg-row ${m.role === 'user' ? 'cw-row-user' : 'cw-row-bot'}`}>
                <div className={`cw-bubble ${m.role === 'user' ? 'cw-bubble-user' : 'cw-bubble-bot'} ${m.isDisclaimer ? 'cw-bubble-disclaimer' : ''}`}>
                  {m.isDisclaimer && (
                    <span className="cw-disclaimer-tag">⚠️ Research Use Only</span>
                  )}
                  <div className="cw-message-content">{m.content}</div>
                </div>
              </div>
            ))}

            {botTyping && (
              <div className="cw-msg-row cw-row-bot">
                <div className="cw-bubble cw-bubble-bot cw-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {!botTyping && currentOptions.length > 0 && (
              <div className="cw-quick-replies">
                {currentOptions.map((opt) => (
                  <button key={opt.label} type="button" className="cw-chip" onClick={() => handleOptionClick(opt)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {showHandoff && (
              <div className="cw-handoff">
                <div className="cw-handoff-title">Connect with our research team</div>
                <p className="cw-handoff-sub">
                  Our team includes analytical chemists and researchers who understand your work. Leave your details (optional) and we'll follow up, or reach us directly on WhatsApp or email.
                </p>
                <input
                  className="cw-input-field"
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                />
                <input
                  className="cw-input-field"
                  placeholder="Email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                />
                <input
                  className="cw-input-field"
                  placeholder="WhatsApp / phone (optional)"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                />
                <div className="cw-handoff-actions">
                  {isWhatsAppConfigured() && (
                    <button type="button" className="cw-handoff-btn cw-handoff-whatsapp" onClick={handleWhatsAppHandoff} disabled={handoffSending}>
                      <ArrowUpRight size={14} /> Continue on WhatsApp
                    </button>
                  )}
                  <button
                    type="button"
                    className="cw-handoff-btn cw-handoff-email"
                    onClick={handleEmailHandoff}
                    disabled={handoffSending || !contact.email}
                  >
                    Email our team
                  </button>
                </div>
                {handoffSent && <div className="cw-handoff-confirm">✓ Sent — our team has your conversation.</div>}
              </div>
            )}
          </div>

          <div className="cw-footer">
            <div className="cw-footer-top">
              <button type="button" className="cw-human-link" onClick={() => setShowHandoff((v) => !v)}>
                👨‍🔬 Talk to a research specialist →
              </button>
              <button 
                type="button" 
                className="cw-disclaimer-toggle"
                onClick={() => setShowDisclaimer(!showDisclaimer)}
                aria-label="Toggle research use disclaimer"
              >
                <ShieldCheck size={12} />
                <span>RUO</span>
              </button>
            </div>
            <div className="cw-input-row">
              <textarea
                ref={inputRef}
                className="cw-textarea"
                placeholder="Ask about research compounds, COAs, protocols..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <button
                type="button"
                className="cw-send"
                onClick={() => handleSend()}
                disabled={botTyping || !input.trim()}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .cw-fab {
            position: fixed;
            right: 0;
            bottom: calc(20px + env(safe-area-inset-bottom) + var(--cw-offset, 0px));
            z-index: 47;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            height: 48px;
            padding: 0 14px 0 14px;
            border: none;
            border-radius: 999px 0 0 999px;
            background: #1A56DB;
            color: #fff;
            font-size: 13.5px;
            font-weight: 700;
            letter-spacing: -.01em;
            cursor: pointer;
            box-shadow: -4px 4px 14px rgba(26,86,219,.35);
            opacity: 0;
            transform: translateX(12px) scale(.96);
            transition: opacity .35s ease, transform .35s ease, box-shadow .25s ease, background .2s ease, right .3s ease;
          }
          .cw-fab.cw-in { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
          }
          .cw-fab:hover { 
            box-shadow: -8px 8px 20px rgba(26,86,219,.45); 
            background: #1240B0;
            padding-right: 20px;
          }
          .cw-fab-open { 
            background: #0D0F14;
            right: 0;
            border-radius: 999px 0 0 999px;
          }
          .cw-fab-open:hover {
            background: #1a1a1a;
            padding-right: 16px;
          }
          .cw-fab-label {
            font-size: 13px;
            font-weight: 600;
          }
          .cw-peek-indicator {
            display: inline-flex;
            align-items: center;
            margin-left: 2px;
            opacity: 0.7;
            animation: cw-peek-pulse 2s ease-in-out infinite;
          }
          @keyframes cw-peek-pulse {
            0%, 100% { opacity: 0.5; transform: translateX(0); }
            50% { opacity: 1; transform: translateX(-3px); }
          }
          @media (max-width: 640px) {
            .cw-fab {
              right: 0;
              width: 48px;
              height: 48px;
              padding: 0;
              justify-content: center;
              bottom: calc(20px + env(safe-area-inset-bottom) + var(--cw-offset, 0px));
              border-radius: 999px 0 0 999px;
            }
            .cw-fab-label { display: none; }
            .cw-peek-indicator { display: none; }
            .cw-fab:hover { padding-right: 0; }
            .cw-fab-open { border-radius: 999px 0 0 999px; }
          }
          .cw-panel {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%) translateX(0);
            z-index: 48;
            width: min(420px, calc(100vw - 20px));
            height: min(640px, calc(100vh - 60px));
            background: #fff;
            border-radius: 20px 0 0 20px;
            box-shadow: -20px 20px 60px rgba(13,15,20,.22), -1px 0 0 1px rgba(13,15,20,.06);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: var(--font-base, Inter, sans-serif);
            animation: cw-slide-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          }
          @keyframes cw-slide-in {
            0% { transform: translateY(-50%) translateX(100%); opacity: 0; }
            100% { transform: translateY(-50%) translateX(0); opacity: 1; }
          }
          @media (max-width: 640px) {
            .cw-panel {
              right: 0;
              left: 0;
              width: 100%;
              top: auto;
              bottom: 0;
              transform: translateY(0) translateX(0);
              height: min(85vh, 600px);
              border-radius: 20px 20px 0 0;
              animation: cw-slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            }
            @keyframes cw-slide-up {
              0% { transform: translateY(100%); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
          }
          .cw-pull-tab {
            display: flex;
            align-items: center;
            gap: 6px;
            position: absolute;
            left: -32px;
            top: 50%;
            transform: translateY(-50%) rotate(0deg);
            background: #0D0F14;
            color: #fff;
            padding: 12px 10px 12px 14px;
            border-radius: 10px 0 0 10px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.3px;
            box-shadow: -4px 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, background 0.2s ease;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            letter-spacing: 2px;
          }
          .cw-pull-tab span {
            writing-mode: vertical-rl;
            text-orientation: mixed;
          }
          .cw-pull-tab:hover {
            background: #1A1A1A;
            transform: translateY(-50%) scale(1.05);
          }
          .cw-pull-tab svg {
            transform: rotate(90deg);
          }
          @media (max-width: 640px) {
            .cw-pull-tab {
              display: none;
            }
          }
          .cw-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px 14px 20px;
            background: #0D0F14;
            flex-shrink: 0;
          }
          .cw-header-info { display: flex; align-items: center; gap: 10px; }
          .cw-avatar {
            width: 34px; height: 34px; border-radius: 10px;
            background: #1A56DB; color: #fff; font-size: 12px; font-weight: 800;
            display: flex; align-items: center; justify-content: center; letter-spacing: -.02em;
          }
          .cw-title { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: -.01em; }
          .cw-status { font-size: 11.5px; color: rgba(255,255,255,.55); display: flex; align-items: center; gap: 5px; margin-top: 1px; }
          .cw-dot { width: 6px; height: 6px; border-radius: 999px; background: #34D399; display: inline-block; }
          .cw-close {
            background: rgba(255,255,255,.08); border: none; border-radius: 8px; width: 30px; height: 30px;
            display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer;
          }
          .cw-close:hover { background: rgba(255,255,255,.16); }
          .cw-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: #F7F8FA;
          }
          .cw-disclaimer-banner {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: #FFF8E1;
            border: 1px solid #FFE082;
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 6px;
            font-size: 11.5px;
            line-height: 1.5;
            color: #6D4C00;
          }
          .cw-disclaimer-icon {
            flex-shrink: 0;
            margin-top: 1px;
            color: #FF8F00;
          }
          .cw-disclaimer-text strong {
            display: block;
            font-weight: 700;
            margin-bottom: 1px;
          }
          .cw-bubble-disclaimer {
            background: #FFF8E1 !important;
            border: 1px solid #FFE082 !important;
            border-bottom-left-radius: 4px !important;
          }
          .cw-bubble-disclaimer .cw-disclaimer-tag {
            display: block;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6D4C00;
            margin-bottom: 4px;
            padding-bottom: 4px;
            border-bottom: 1px solid #FFE082;
          }
          .cw-message-content {
            white-space: pre-wrap;
          }
          .cw-msg-row { display: flex; }
          .cw-row-user { justify-content: flex-end; }
          .cw-row-bot { justify-content: flex-start; }
          .cw-bubble {
            max-width: 85%;
            padding: 10px 13px;
            border-radius: 14px;
            font-size: 13.5px;
            line-height: 1.55;
            white-space: pre-wrap;
          }
          .cw-bubble-bot { background: #fff; color: #0D0F14; border: 1px solid rgba(13,15,20,.07); border-bottom-left-radius: 4px; }
          .cw-bubble-user { background: #1A56DB; color: #fff; border-bottom-right-radius: 4px; }
          .cw-typing { display: flex; gap: 4px; padding: 13px 14px; }
          .cw-typing span { width: 6px; height: 6px; border-radius: 999px; background: rgba(13,15,20,.35); animation: cw-bounce 1.1s infinite ease-in-out; }
          .cw-typing span:nth-child(2) { animation-delay: .15s; }
          .cw-typing span:nth-child(3) { animation-delay: .3s; }
          @keyframes cw-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-4px); opacity: 1; } }
          .cw-quick-replies { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
          .cw-chip {
            text-align: left;
            font-size: 12.5px;
            padding: 9px 12px;
            border-radius: 10px;
            border: 1px solid rgba(26,86,219,.25);
            background: #EBF2FF;
            color: #1240B0;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.15s ease, transform 0.1s ease;
          }
          .cw-chip:hover { background: #D4E4FF; transform: translateX(4px); }
          .cw-chip:active { transform: scale(0.97); }
          .cw-handoff {
            background: #fff;
            border: 1px solid rgba(13,15,20,.08);
            border-radius: 14px;
            padding: 14px;
            margin-top: 4px;
          }
          .cw-handoff-title { font-size: 13px; font-weight: 700; color: #0D0F14; }
          .cw-handoff-sub { font-size: 12px; color: rgba(13,15,20,.55); margin: 3px 0 10px; line-height: 1.5; }
          .cw-input-field {
            width: 100%; font-size: 13px; padding: 9px 11px; margin-bottom: 7px;
            border-radius: 9px; border: 1px solid rgba(13,15,20,.15); background: #F7F8FA; color: #0D0F14;
          }
          .cw-input-field:focus { outline: none; border-color: #1A56DB; background: #fff; }
          .cw-handoff-actions { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
          .cw-handoff-btn {
            flex: 1;
            min-width: 120px;
            display: flex; align-items: center; justify-content: center; gap: 5px;
            font-size: 12.5px; font-weight: 700; padding: 9px 10px; border-radius: 9px; border: none; cursor: pointer;
          }
          .cw-handoff-btn:disabled { opacity: .55; cursor: not-allowed; }
          .cw-handoff-whatsapp { background: #25D366; color: #fff; }
          .cw-handoff-email { background: #0D0F14; color: #fff; }
          .cw-handoff-confirm { font-size: 12px; color: #0A7B45; margin-top: 9px; font-weight: 600; }
          .cw-footer { 
            border-top: 1px solid rgba(13,15,20,.07); 
            padding: 8px 16px 12px; 
            flex-shrink: 0; 
            background: #fff; 
          }
          .cw-footer-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .cw-human-link {
            background: none; border: none; color: #1A56DB; font-size: 11.5px; font-weight: 700;
            cursor: pointer; padding: 0;
            transition: opacity 0.15s ease;
          }
          .cw-human-link:hover { opacity: 0.7; }
          .cw-disclaimer-toggle {
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: 1px solid rgba(13,15,20,.12);
            border-radius: 6px;
            padding: 2px 8px;
            font-size: 9px;
            font-weight: 700;
            color: rgba(13,15,20,.5);
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .cw-disclaimer-toggle:hover {
            border-color: rgba(13,15,20,.25);
            color: #0D0F14;
          }
          .cw-input-row { display: flex; align-items: flex-end; gap: 8px; }
          .cw-textarea {
            flex: 1;
            resize: none;
            max-height: 90px;
            font-size: 13.5px;
            font-family: inherit;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid rgba(13,15,20,.14);
            background: #F7F8FA;
            color: #0D0F14;
          }
          .cw-textarea:focus { outline: none; border-color: #1A56DB; background: #fff; }
          .cw-textarea::placeholder {
            color: rgba(13,15,20,.35);
            font-style: italic;
          }
          .cw-send {
            flex-shrink: 0;
            width: 38px; height: 38px;
            border-radius: 10px;
            border: none;
            background: #1A56DB;
            color: #fff;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: background 0.15s ease, transform 0.1s ease;
          }
          .cw-send:disabled { opacity: .4; cursor: not-allowed; }
          .cw-send:not(:disabled):hover { background: #1240B0; transform: scale(1.05); }
          .cw-send:not(:disabled):active { transform: scale(0.95); }
          @media (prefers-reduced-motion: reduce) {
            .cw-fab { transition: none; opacity: 1; transform: none; }
            .cw-panel { animation: none; }
            .cw-chip, .cw-send { transition: none; transform: none !important; }
          }
          @media print { .cw-fab, .cw-panel { display: none !important; } }
        `
      }} />
    </>
  )
}