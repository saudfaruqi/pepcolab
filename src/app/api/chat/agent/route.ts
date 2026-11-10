// src/app/api/chat/agent/route.ts
//
// Backend for the chat widget's AI agent (lib/chatAgent.ts). The widget only
// calls this for messages its written answers and lookups do not cover.
//
// REQUIRED ENV VAR: ANTHROPIC_API_KEY (server-side only).
// OPTIONAL: CHAT_AGENT_MODEL to change the model; OWNER_WHATSAPP_PHONE and
// CALLMEBOT_APIKEY for WhatsApp alerts (see lib/ownerAlert.ts).
import { NextRequest, NextResponse } from 'next/server'
import { runChatAgent, type AgentMessage } from '@/lib/chatAgent'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { verifySessionToken, CUSTOMER_COOKIE_NAME } from '@/lib/customerAuth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_PER_WINDOW = 25
const WINDOW_MS = 10 * 60 * 1000
const MAX_TURNS = 16
const MAX_CHARS = 1500

const FALLBACK = {
  lines: [
    'Sorry, I can’t answer that one right now.',
    'Our team can — use “Talk to a person” below, or email hello@pepcolab.com.',
  ],
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited('chat-agent', ip, MAX_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json(
      { answer: { lines: ['You’re sending messages quickly, so I’ve paused for a few minutes. Email hello@pepcolab.com if it’s urgent.'] } },
      { status: 429 }
    )
  }

  let body: { messages?: unknown; pageUrl?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Only well-formed turns, merged so roles alternate and the first is the
  // visitor's — the shape the Messages API requires.
  const raw = Array.isArray(body.messages) ? body.messages : []
  const messages: AgentMessage[] = []
  for (const m of raw.slice(-MAX_TURNS * 2)) {
    const role = (m as { role?: unknown })?.role === 'assistant' ? 'assistant' : (m as { role?: unknown })?.role === 'user' ? 'user' : null
    const content = String((m as { content?: unknown })?.content ?? '').trim().slice(0, MAX_CHARS)
    if (!role || !content) continue
    const prev = messages[messages.length - 1]
    if (prev && prev.role === role) prev.content = `${prev.content}\n${content}`.slice(0, MAX_CHARS * 2)
    else messages.push({ role, content })
  }
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const geo = req.headers.get('x-vercel-ip-country') || req.cookies.get('pepcolab_country')?.value || 'AE'
  let sessionEmail: string | null = null
  try {
    sessionEmail = verifySessionToken(req.cookies.get(CUSTOMER_COOKIE_NAME)?.value) ?? null
  } catch {
    sessionEmail = null
  }

  try {
    const answer = await runChatAgent(messages.slice(-MAX_TURNS), {
      market: geo === 'GB' ? 'GB' : 'AE',
      ip,
      sessionEmail,
      pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 300) : '',
    })
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[chat/agent] Failed:', err)
    return NextResponse.json({ answer: FALLBACK, fallback: true })
  }
}
