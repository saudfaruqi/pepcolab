// src/lib/marketing/render.ts
//
// Builds a campaign email from the SAME branded parts as the order emails
// (lib/orderEmails.ts): near-white canvas, white card with the gold top rule,
// "Pepco Lab / Research Lab" header, uppercase pills, the bordered code box,
// black pill button, trust strip and the research-use footer. Restyle there,
// not here, and every email family stays identical.
//
// Body markup (kept deliberately small so anyone can write it in the admin):
//   blank line      → new paragraph
//   "- " at start   → bullet
//   **text**        → bold
//   [text](url)     → link (https:// or a /path on the site)
//   {{firstName}}   → first name; when unknown, ", {{firstName}}" is dropped
//   {{lastProduct}} → their most recent paid product (falls back to "your last order")
import {
  emailShell,
  preheader as preheaderHtml,
  statusPill,
  refBox,
  primaryButton,
  trustStrip,
  INK,
  INK_60,
  INK_40,
  GOLD_TEXT,
  GOLD_TINT,
  BORDER,
} from '@/lib/orderEmails'
import { signUnsubscribeToken } from '@/lib/unsubscribeToken'
import type { Campaign, Recipient } from './types'

const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com').replace(/\/$/, '')
const SUPPORT_EMAIL = process.env.SMTP_FROM || 'hello@pepcolab.com'

function esc(v: string): string {
  return (v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function slug(v: string): string {
  return (v || 'campaign').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'campaign'
}

/** Fills merge fields. Applied to raw text BEFORE escaping. */
export function mergeFields(text: string, r: Pick<Recipient, 'firstName' | 'lastProduct'>): string {
  let out = text || ''
  if (r.firstName) {
    out = out.replace(/\{\{\s*firstName\s*\}\}/g, r.firstName)
  } else {
    out = out.replace(/,\s*\{\{\s*firstName\s*\}\}/g, '').replace(/\s*\{\{\s*firstName\s*\}\}/g, '')
  }
  out = out.replace(/\{\{\s*lastProduct\s*\}\}/g, r.lastProduct || 'your last order')
  return out
}

/** Absolute URL with campaign tracking, and the offer code for site links. */
export function campaignUrl(rawUrl: string, campaign: Pick<Campaign, 'name' | 'offer'>, content: string): string {
  const trimmed = (rawUrl || '/').trim()
  let url: URL
  try {
    url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, SITE_URL)
  } catch {
    url = new URL('/', SITE_URL)
  }
  const onSite = url.hostname.replace(/^www\./, '') === new URL(SITE_URL).hostname.replace(/^www\./, '')
  if (onSite) {
    url.searchParams.set('utm_source', 'email')
    url.searchParams.set('utm_medium', 'marketing')
    url.searchParams.set('utm_campaign', slug(campaign.name))
    url.searchParams.set('utm_content', content)
    // Pre-fills the cart's discount box (components/AffiliateCapture.tsx).
    // The customer still presses Apply, and the code is printed in the email.
    if (campaign.offer?.code) url.searchParams.set('ref', campaign.offer.code)
  }
  return url.toString()
}

function inline(text: string, campaign: Campaign): string {
  // Escape first, then add the two pieces of markup we allow.
  let html = esc(text)
  html = html.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${INK};">$1</strong>`)
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const decoded = href.replace(/&amp;/g, '&')
    if (!/^https:\/\//i.test(decoded) && !decoded.startsWith('/')) return label
    return `<a href="${esc(campaignUrl(decoded, campaign, 'body-link'))}" style="color:${INK}; font-weight:600;">${label}</a>`
  })
  return html
}

function bodyHtml(body: string, campaign: Campaign): string {
  const blocks = (body || '').replace(/\r\n/g, '\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return blocks
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.every((l) => /^[-•]\s+/.test(l))) {
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
          ${lines
            .map(
              (l) => `<tr>
            <td width="22" valign="top" style="padding:0 0 12px; font-size:14px; line-height:1.65; color:${GOLD_TEXT};">&mdash;</td>
            <td valign="top" style="padding:0 0 12px; font-size:14.5px; line-height:1.65; color:${INK_60};">${inline(l.replace(/^[-•]\s+/, ''), campaign)}</td>
          </tr>`
            )
            .join('')}
        </table>`
      }
      return `<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${INK_60};">${lines.map((l) => inline(l, campaign)).join('<br />')}</p>`
    })
    .join('')
}

function formatExpiry(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' })
}

export function unsubscribeLinks(email: string): { page: string; oneClick: string } {
  const token = signUnsubscribeToken(email)
  const q = `email=${encodeURIComponent(email)}&token=${token}`
  return {
    page: `${SITE_URL}/unsubscribe?${q}`,
    oneClick: `${SITE_URL}/api/marketing/unsubscribe?${q}`,
  }
}

export interface RenderedCampaign {
  subject: string
  html: string
  text: string
  headers: Record<string, string>
}

export function renderCampaign(campaign: Campaign, recipient: Recipient): RenderedCampaign {
  const subject = mergeFields(campaign.subject, recipient).trim()
  const heading = mergeFields(campaign.heading, recipient).trim()
  const body = mergeFields(campaign.body, recipient)
  const pre = mergeFields(campaign.preheader, recipient).trim()
  const links = unsubscribeLinks(recipient.email)
  const ctaHref = campaignUrl(campaign.cta.url, campaign, 'button')
  const secondary = campaign.secondaryCta?.label && campaign.secondaryCta?.url ? campaign.secondaryCta : null
  const secondaryHref = secondary ? campaignUrl(secondary.url, campaign, 'secondary') : ''
  const offer = campaign.offer?.code ? campaign.offer : null
  const expiry = offer ? formatExpiry(offer.expiresAt) : ''

  const offerBox = offer
    ? refBox(
        'Your code',
        esc(offer.code),
        `<div style="font-size:14px; line-height:1.6; color:${INK};"><strong>${offer.percent}% off</strong>${expiry ? ` &middot; use by ${esc(expiry)}` : ''}</div>
         <div style="font-size:12.5px; line-height:1.6; color:${INK_40}; margin-top:4px;">Enter it in your cart at checkout on pepcolab.com. Not valid on GLP, which is sold by fixed-price payment link.</div>`
      )
    : ''

  const html = emailShell(`
    ${pre ? preheaderHtml(esc(pre)) : ''}
    ${campaign.eyebrow ? `<div style="margin-bottom:20px;">${statusPill(esc(campaign.eyebrow), GOLD_TEXT, GOLD_TINT)}</div>` : ''}
    <h1 style="margin:0 0 16px; font-size:30px; line-height:1.15; font-weight:700; letter-spacing:-.025em; color:${INK};">${esc(heading)}</h1>
    ${bodyHtml(body, campaign)}
    ${offerBox}
    ${primaryButton(esc(campaign.cta.label || 'Visit the shop'), esc(ctaHref), secondary ? 14 : 0)}
    ${secondary ? `<p style="margin:0; text-align:center; font-size:13.5px; color:${INK_60};">or <a href="${esc(secondaryHref)}" style="color:${INK}; font-weight:600;">${esc(secondary.label)}</a></p>` : ''}
    ${trustStrip()}
    <div style="margin-top:24px; padding-top:18px; border-top:1px solid ${BORDER}; font-size:11.5px; line-height:1.7; color:${INK_40}; text-align:center;">
      Questions? Just reply, or write to <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:${INK_40};">${esc(SUPPORT_EMAIL)}</a>.<br />
      You&rsquo;re receiving this because you ordered from, or started an order with, Pepco Lab.
      <a href="${esc(links.page)}" style="color:${INK_40};">Unsubscribe</a>.
    </div>
  `)

  const textBody = body
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => `${label} (${campaignUrl(href, campaign, 'body-link')})`)
    .replace(/^[-•]\s+/gm, '- ')
  const text = [
    heading,
    '',
    textBody.trim(),
    '',
    offer ? `YOUR CODE: ${offer.code} — ${offer.percent}% off${expiry ? `, use by ${expiry}` : ''}. Enter it in your cart at checkout on pepcolab.com. Not valid on GLP.` : '',
    offer ? '' : '',
    `${campaign.cta.label || 'Visit the shop'}: ${ctaHref}`,
    secondary ? `${secondary.label}: ${secondaryHref}` : '',
    '',
    `Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`,
    'For laboratory and research purposes only. Not for human or veterinary use.',
    `Unsubscribe: ${links.page}`,
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')

  return {
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${links.oneClick}>, <mailto:${SUPPORT_EMAIL}?subject=unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}

/** A plausible recipient for previews and test sends. */
export function sampleRecipient(email = 'preview@pepcolab.com'): Recipient {
  return {
    email,
    name: 'Sara Ahmed',
    firstName: 'Sara',
    paidOrders: 1,
    totalSpent: 830,
    currency: 'AED',
    lastOrderAt: new Date().toISOString(),
    lastPaidAt: new Date().toISOString(),
    lastProduct: 'GHK-Cu 100mg Vial',
  }
}
