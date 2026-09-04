// src/app/api/chat/transcript/route.ts
//
// Fires when ChatWidget hands a conversation off to a human — either the
// visitor clicks "Continue on WhatsApp", closes a chat that had real
// content, or explicitly asks to be contacted. Emails the full transcript
// plus whatever contact details were captured to the team (ORDER_ALERT_EMAIL,
// same admin address used for order/review/newsletter alerts elsewhere in
// this codebase), and — if the visitor gave an email — sends them a short
// confirmation so they know a human is picking this up.
//
// There's no server-side WhatsApp Business API integration in this codebase
// (only wa.me deep links, which are visitor-initiated from their own
// device — see lib/whatsapp.ts). So "get the transcript on WhatsApp" here
// means: the visitor's own WhatsApp opens pre-filled with a summary
// (whatsAppChatHandoffLink, fired client-side), while this route is what
// guarantees the team also gets the FULL transcript, reliably, over email,
// regardless of whether the visitor actually completes the WhatsApp step.
import { NextRequest, NextResponse } from 'next/server'
import { sendMailSafe } from '@/lib/mailer'
import { emailShell, primaryButton, INK, INK_60, INK_40 } from '@/lib/orderEmails'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const ADMIN_EMAIL = process.env.ORDER_ALERT_EMAIL || 'hello@pepcolab.com'
const MAX_SUBMISSIONS = 10
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

interface TranscriptMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (isRateLimited('chat-transcript', ip, MAX_SUBMISSIONS, WINDOW_MS)) {
      return NextResponse.json({ success: false, message: 'Too many requests.' }, { status: 429 })
    }

    const body = await req.json()
    const messages: TranscriptMessage[] = Array.isArray(body?.messages) ? body.messages : []
    const contact = {
      name: typeof body?.contact?.name === 'string' ? body.contact.name.trim() : '',
      email: typeof body?.contact?.email === 'string' ? body.contact.email.trim() : '',
      phone: typeof body?.contact?.phone === 'string' ? body.contact.phone.trim() : '',
    }
    const reason = typeof body?.reason === 'string' ? body.reason : 'chat_ended'
    const pageUrl = typeof body?.pageUrl === 'string' ? body.pageUrl : ''

    if (messages.length === 0) {
      return NextResponse.json({ success: false, message: 'No transcript to send.' }, { status: 400 })
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
      console.error('[chat-transcript] Missing SMTP configuration')
      return NextResponse.json({ success: false, message: 'Email is not configured.' }, { status: 500 })
    }

    const plainTranscript = messages
      .map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    const htmlTranscript = messages
      .map((m) => {
        const isUser = m.role === 'user'
        return `
          <div style="margin-bottom:14px; text-align:${isUser ? 'right' : 'left'};">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:${isUser ? '#8A6A1E' : 'rgba(13,13,13,.4)'}; margin-bottom:3px;">
              ${isUser ? 'Visitor' : 'Assistant'}
            </div>
            <div style="display:inline-block; max-width:85%; text-align:left; padding:10px 14px; border-radius:12px; font-size:14px; line-height:1.55; background:${isUser ? 'rgba(200,153,42,.10)' : '#F4F3F0'}; color:#0D0F14;">
              ${escapeHtml(m.content).replace(/\n/g, '<br />')}
            </div>
          </div>`
      })
      .join('')

    const contactLine = [
      contact.name && `Name: ${contact.name}`,
      contact.email && `Email: ${contact.email}`,
      contact.phone && `Phone/WhatsApp: ${contact.phone}`,
    ]
      .filter(Boolean)
      .join('\n')

    await sendMailSafe({
      to: ADMIN_EMAIL,
      replyTo: contact.email || undefined,
      subject: `💬 New chat transcript${contact.name ? ` — ${contact.name}` : ''}`,
      text: `New website chat transcript (${reason})\n${pageUrl ? `Page: ${pageUrl}\n` : ''}\n${contactLine || 'No contact details captured.'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${plainTranscript}\n━━━━━━━━━━━━━━━━━━━━━━━━━`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; max-width:640px; margin:0 auto;">
          <h2 style="font-size:18px; color:#0D0F14;">New website chat transcript</h2>
          <p style="font-size:13px; color:rgba(13,15,20,.5); margin-top:-8px;">Reason: ${escapeHtml(reason)}${pageUrl ? ` · Page: ${escapeHtml(pageUrl)}` : ''}</p>
          <div style="background:#F4F3F0; border-radius:10px; padding:14px 16px; margin:16px 0; font-size:14px;">
            ${contactLine ? escapeHtml(contactLine).replace(/\n/g, '<br />') : '<em>No contact details captured — visitor was anonymous.</em>'}
          </div>
          <div style="border-top:1px solid rgba(13,15,20,.08); padding-top:16px; margin-top:16px;">
            ${htmlTranscript}
          </div>
        </div>`,
    })

    // Visitor confirmation — best-effort, only if they gave an email.
    if (contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      await sendMailSafe({
        to: contact.email,
        subject: "We've got your chat — PepcoLab",
        text: `Hi ${contact.name || 'there'},\n\nThanks for chatting with us. A member of the PepcoLab team has your conversation and will follow up shortly${contact.phone ? ' on WhatsApp or email' : ' by email'}.\n\nIn the meantime: https://www.pepcolab.com/products\n\n— PepcoLab Team`,
        // Was a bare <div> with no HTML document around it, no light-only
        // declaration, and a #1A56DB link that appears nowhere else in the
        // brand. Routed through emailShell so it is light-locked and looks
        // like the rest of what PepcoLab sends.
        html: emailShell(`
          <h1 style="font-size:22px; font-weight:700; letter-spacing:-.03em; line-height:1.2; color:${INK}; margin:0 0 12px;">
            Thanks for getting in touch${contact.name ? `, ${escapeHtml(contact.name.split(' ')[0])}` : ''}.
          </h1>
          <p style="font-size:14px; line-height:1.7; color:${INK_60}; margin:0 0 24px;">
            Someone on the team has your full conversation and will follow up shortly${contact.phone ? ' on WhatsApp or by email' : ' by email'}. You don&rsquo;t need to repeat anything.
          </p>
          ${primaryButton('Browse the catalogue', 'https://www.pepcolab.com/products', 16)}
          <p style="font-size:11px; line-height:1.6; color:${INK_40}; margin:20px 0 0; text-align:center;">
            Supplied for in-vitro laboratory research use only.
          </p>
        `),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[chat-transcript] Error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send transcript.' }, { status: 500 })
  }
}