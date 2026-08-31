// src/app/api/chat/route.ts
//
// Backend for the ChatWidget. Calls the Anthropic Messages API directly
// over fetch (no SDK dependency added) with the PepcoLab system prompt
// from lib/chatKnowledge.ts. Kept non-streaming and stateless — the full
// message history is sent by the client on every turn (see ChatWidget),
// same "no server session" approach as the rest of this app (no login
// system anywhere else either).
//
// REQUIRED ENV VAR: ANTHROPIC_API_KEY
//   Get one at https://console.anthropic.com (Settings → API Keys), set it
//   in .env.local for dev and in Vercel → Project → Settings → Environment
//   Variables for prod. Server-side only — never expose this as NEXT_PUBLIC_.
import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/chatKnowledge'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

// Keep this in one place — bump to a newer snapshot as Anthropic ships one.
// See https://docs.claude.com/en/docs/about-claude/models/overview for the
// current model list before changing this.
const CHAT_MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 600

const MAX_MESSAGES_PER_WINDOW = 30
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes — generous for a real conversation, not for scripted abuse

interface IncomingMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (isRateLimited('chat', ip, MAX_MESSAGES_PER_WINDOW, WINDOW_MS)) {
      return NextResponse.json(
        {
          error:
            "You're sending messages a little fast — please slow down, or reach us directly on WhatsApp or hello@pepcolab.com.",
        },
        { status: 429 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[chat] Missing ANTHROPIC_API_KEY')
      return NextResponse.json(
        {
          error:
            "Live chat isn't set up yet — but our team is happy to help directly. Try WhatsApp or hello@pepcolab.com.",
        },
        { status: 503 }
      )
    }

    const body = await req.json()
    const messages: IncomingMessage[] = Array.isArray(body?.messages) ? body.messages : []

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 })
    }
    // Cap history sent per request — a very long back-and-forth doesn't need
    // to resend the whole thing every time to stay coherent, and this keeps
    // per-request token cost bounded regardless of how long the chat runs.
    const trimmed = messages.slice(-24).filter((m) => typeof m?.content === 'string' && m.content.trim().length > 0)

    if (trimmed.some((m) => m.content.length > 4000)) {
      return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(),
        messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[chat] Anthropic API error:', response.status, errText)
      return NextResponse.json(
        {
          error:
            "Sorry, something went wrong on our end. Please try again, or reach us on WhatsApp / hello@pepcolab.com.",
        },
        { status: 502 }
      )
    }

    const data = await response.json()
    const reply = (data?.content ?? [])
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')
      .trim()

    if (!reply) {
      return NextResponse.json(
        { error: "Sorry, I didn't quite catch that. Could you rephrase?" },
        { status: 502 }
      )
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('[chat] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
