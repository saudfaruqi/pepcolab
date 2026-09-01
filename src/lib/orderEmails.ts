// src/lib/orderEmails.ts
//
// The order-confirmation, review-request, abandoned-cart, and payment-failed
// customer emails.
//
// RESTYLE (Sep 2026): the previous version of this file used its own
// one-off palette (black / gold / off-white "PAPER") that didn't match the
// actual site design tokens in app/globals.css (--ink, --blue, --gray-50,
// etc — see referralEmails.ts, which already used the correct tokens).
// This version pulls from the real brand palette and leans into PepcoLab's
// "research lab" visual language already used across the site — the COA
// terminal card, batch/lot labelling, purity/status pills, monospace
// reference codes — instead of a generic e-commerce look. Table-based
// layout, inline styles only, still — that part was correct and stays,
// since it's what survives Outlook/Gmail clipping without a build step.
import { sendMailSafe } from '@/lib/mailer'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'

// ── Brand tokens — mirrors :root in app/globals.css ────────────────────
const INK = '#0D0F14'
const INK_60 = 'rgba(13,15,20,.60)'
const INK_40 = 'rgba(13,15,20,.40)'
const INK_35 = 'rgba(13,15,20,.35)'
const WHITE = '#FFFFFF'
const GRAY_50 = '#F7F8FA'
const BORDER = 'rgba(13,15,20,.09)'
const BLUE = '#1A56DB'
const BLUE_DEEP = '#0B2C78'
const BLUE_LIGHT = '#EBF2FF'
const BLUE_MID = '#BFCFF8'
const GREEN = '#0A7B45'
const GREEN_LIGHT = '#E6F5EE'
const AMBER = '#A86000'
const AMBER_LIGHT = '#FEF4E0'
const RED = '#B91C1C'

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background:${GRAY_50}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50}; background-image:linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px); background-size:28px 28px; padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:${WHITE}; border:1px solid ${BORDER}; border-radius:20px; overflow:hidden;">
        <tr><td style="height:4px; line-height:4px; font-size:0; background:${BLUE};">&nbsp;</td></tr>
        <tr><td style="padding:28px 36px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td style="font-size:16px; font-weight:800; letter-spacing:-.01em; color:${INK};">PepcoLab</td>
              <td align="right" style="font-family:'SF Mono',Consolas,monospace; font-size:9.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:${BLUE};">Research Lab</td>
            </tr>
          </table>
          <div style="height:1px; background:${BORDER}; margin-bottom:24px;"></div>
          ${bodyHtml}
        </td></tr>
      </table>
      <div style="max-width:560px; margin:20px auto 0; font-size:11px; line-height:1.6; color:${INK_35}; text-align:center;">
        For laboratory and research purposes only. Not for human or veterinary use.<br />
        Pepco Lab · <a href="${SITE_URL}" style="color:${INK_40};">${SITE_URL.replace(/^https?:\/\//, '')}</a>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

function statusPill(label: string, fg: string, bg: string, border: string): string {
  return `<span style="display:inline-flex; align-items:center; gap:6px; font-family:'SF Mono',Consolas,monospace; font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:${fg}; background:${bg}; border:1px solid ${border}; padding:6px 12px; border-radius:6px;">&#9679; ${label}</span>`
}

function trustStrip(): string {
  const items = ['COA on every batch', 'Cold-chain packed', 'Independently tested']
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr><td style="font-size:11px; color:${INK_40}; text-align:center; line-height:1.8;">
      ${items.map((i) => `<span style="color:${GREEN};">&#10003;</span> ${i}`).join('&nbsp;&nbsp;&nbsp;&middot;&nbsp;&nbsp;&nbsp;')}
    </td></tr>
  </table>`
}

function productRows(products: { title: string; price: number; quantity: number }[], currency: string): string {
  return products
    .map(
      (p) => `
    <tr>
      <td style="padding:10px 0; border-top:1px solid ${BORDER}; font-size:14px; color:${INK};">
        ${p.title}${p.quantity > 1 ? ` <span style="color:${INK_40};">&times; ${p.quantity}</span>` : ''}
      </td>
      <td style="padding:10px 0; border-top:1px solid ${BORDER}; font-size:14px; color:${INK}; text-align:right; white-space:nowrap;">
        ${currency} ${(p.price * p.quantity).toFixed(2)}
      </td>
    </tr>`
    )
    .join('')
}

// Specimen-label-style recap box used for the order/cart reference — the
// same visual idea as the COA terminal card on the site (monospace code,
// dashed frame, blue accent stub) instead of a plain grey box.
function refBox(labelText: string, code: string, innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; border:1px solid ${BORDER}; border-left:3px solid ${BLUE}; border-radius:12px; background:#FBFCFF;">
    <tr><td style="padding:16px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
        <tr>
          <td style="font-family:'SF Mono',Consolas,monospace; font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${BLUE_DEEP};">${labelText}</td>
          <td align="right" style="font-family:'SF Mono',Consolas,monospace; font-size:15px; font-weight:700; letter-spacing:.02em; color:${INK};">${code}</td>
        </tr>
      </table>
      ${innerHtml}
    </td></tr>
  </table>`
}

export async function sendOrderConfirmationEmail(params: {
  to: string
  orderShortCode: string
  products: { title: string; price: number; quantity: number }[]
  total: number
  currency: string
}) {
  const trackUrl = `${SITE_URL}/track-order`
  const html = emailShell(`
    <div style="margin-bottom:20px;">${statusPill('Order Confirmed', GREEN, GREEN_LIGHT, 'rgba(10,123,69,.2)')}</div>
    <h1 style="font-size:24px; font-weight:800; letter-spacing:-.02em; color:${INK}; margin:0 0 8px;">Thanks for your order.</h1>
    <p style="font-size:14px; line-height:1.6; color:${INK_60}; margin:0 0 24px;">
      We're preparing it now — batch-documented and cold-chain dispatched.
    </p>
    ${refBox(
      'Order Number',
      params.orderShortCode,
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productRows(params.products, params.currency)}
        <tr>
          <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${INK};">Total</td>
          <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${INK}; text-align:right;">${params.currency} ${params.total.toFixed(2)}</td>
        </tr>
      </table>`
    )}
    <a href="${trackUrl}" style="display:block; text-align:center; background:${BLUE}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px; border-radius:12px;">
      Track Your Order
    </a>
    ${trustStrip()}
    <p style="font-size:12px; line-height:1.6; color:${INK_40}; margin:16px 0 0; text-align:center;">
      Keep this order number — you'll need it plus this email address to check status at any time.
    </p>
  `)

  await sendMailSafe({
    to: params.to,
    subject: `Order confirmed — ${params.orderShortCode}`,
    text: `Thanks for your order.\n\nOrder number: ${params.orderShortCode}\nTotal: ${params.currency} ${params.total.toFixed(2)}\n\nTrack your order any time at ${trackUrl} using this order number and the email address you checked out with.`,
    html,
  })
}

export async function sendReviewRequestEmail(params: {
  to: string
  orderShortCode: string
  productTitle: string
}) {
  const trackUrl = `${SITE_URL}/track-order?code=${encodeURIComponent(params.orderShortCode)}&email=${encodeURIComponent(params.to)}`
  const html = emailShell(`
    <h1 style="font-size:22px; font-weight:800; letter-spacing:-.02em; color:${INK}; margin:0 0 8px;">How was ${params.productTitle}?</h1>
    <p style="font-size:14px; line-height:1.6; color:${INK_60}; margin:0 0 28px;">
      A minute of your time helps other researchers know what to expect. Every review we publish is tied to a real order — yours included.
    </p>
    <a href="${trackUrl}" style="display:block; text-align:center; background:${BLUE}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px; border-radius:12px;">
      Leave a Review
    </a>
    <p style="font-size:11px; font-family:'SF Mono',Consolas,monospace; color:${INK_35}; text-align:center; margin:16px 0 0;">
      Order ${params.orderShortCode}
    </p>
  `)

  await sendMailSafe({
    to: params.to,
    subject: `How was your order? — ${params.orderShortCode}`,
    text: `How was ${params.productTitle}?\n\nA minute of your time helps other researchers know what to expect.\n\nLeave a review: ${trackUrl}\n\nOrder ${params.orderShortCode}`,
    html,
  })
}

export async function sendAbandonedCartEmail(params: {
  to: string
  orderShortCode: string
  products: { title: string; price: number; quantity: number }[]
  total: number
  currency: string
  stage: 1 | 2
}) {
  const cartUrl = `${SITE_URL}/cart?restore=${encodeURIComponent(params.orderShortCode)}`
  const isFinal = params.stage === 2

  // WhatsApp CTA reuses the same ordering number as the rest of the site
  // (see lib/whatsapp.ts) — built directly here rather than importing
  // whatsAppCartLink, since that helper expects the client-side CartLine
  // type and this runs server-side off the stored order record instead.
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const itemsText = params.products.map((p) => `${p.title} x${p.quantity}`).join(', ')
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi PepcoLab, I'd like to complete my order — ${itemsText} (${params.currency} ${params.total.toFixed(2)}), order ref ${params.orderShortCode}.`
      )}`
    : null

  const pill = isFinal
    ? statusPill('Final Hold &mdash; Closing Soon', AMBER, AMBER_LIGHT, 'rgba(168,96,0,.2)')
    : statusPill('Samples Reserved', BLUE_DEEP, BLUE_LIGHT, BLUE_MID)

  const headline = isFinal ? 'Final hold notice.' : 'Your samples are still reserved.'
  const subcopy = isFinal
    ? "This is the last reminder before these reserved batches go back into inventory. Still want them? It only takes a minute to finish up — and we're happy to help if anything's holding you up."
    : "Nothing's changed on our end &mdash; your items are held and ready whenever you are."

  const html = emailShell(`
    <div style="margin-bottom:20px;">${pill}</div>
    <h1 style="font-size:23px; font-weight:800; letter-spacing:-.02em; color:${INK}; margin:0 0 8px;">${headline}</h1>
    <p style="font-size:14px; line-height:1.6; color:${INK_60}; margin:0 0 24px;">${subcopy}</p>
    ${refBox(
      'Cart Ref',
      params.orderShortCode,
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productRows(params.products, params.currency)}
        <tr>
          <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${INK};">Total</td>
          <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${INK}; text-align:right;">${params.currency} ${params.total.toFixed(2)}</td>
        </tr>
      </table>`
    )}
    <a href="${cartUrl}" style="display:block; text-align:center; background:${BLUE}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px; border-radius:12px; margin-bottom:${whatsappUrl ? '10px' : '0'};">
      Complete Your Order &rarr;
    </a>
    ${
      whatsappUrl
        ? `<a href="${whatsappUrl}" style="display:block; text-align:center; color:${GREEN}; font-size:13px; font-weight:600; text-decoration:none; padding:6px;">
      Or finish it over WhatsApp
    </a>`
        : ''
    }
    ${trustStrip()}
  `)

  const text =
    `${headline}\n\n${subcopy}\n\n` +
    params.products.map((p) => `${p.title} x${p.quantity} — ${params.currency} ${(p.price * p.quantity).toFixed(2)}`).join('\n') +
    `\n\nTotal: ${params.currency} ${params.total.toFixed(2)}\n\n` +
    `Complete your order: ${cartUrl}` +
    (whatsappUrl ? `\nOr on WhatsApp: ${whatsappUrl}` : '') +
    `\n\nCart ref ${params.orderShortCode}`

  await sendMailSafe({
    to: params.to,
    subject: isFinal ? `Final hold &mdash; your reserved samples (${params.orderShortCode})` : `Your samples are still reserved`,
    text,
    html,
  })
}

export async function sendPaymentFailedEmail(params: {
  to: string
  orderShortCode: string
  failureReason?: string
}) {
  const trackUrl = `${SITE_URL}/track-order`
  const html = emailShell(`
    <div style="margin-bottom:20px;">${statusPill('Payment Not Completed', RED, '#FEEDED', 'rgba(185,28,28,.2)')}</div>
    <h1 style="font-size:24px; font-weight:800; letter-spacing:-.02em; color:${INK}; margin:0 0 8px;">Your payment didn't go through.</h1>
    <p style="font-size:14px; line-height:1.6; color:${INK_60}; margin:0 0 24px;">
      No charge was made — if your bank shows a pending hold, it will release automatically. You're welcome to try again with the same or a different card.
    </p>
    ${refBox('Order Number', params.orderShortCode, '')}
    <a href="${SITE_URL}/products" style="display:block; text-align:center; background:${BLUE}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px; border-radius:12px; margin-bottom:12px;">
      Try Again
    </a>
    <a href="${trackUrl}" style="display:block; text-align:center; color:${INK_40}; font-size:13px; text-decoration:underline; padding:6px;">
      Check order status
    </a>
  `)

  await sendMailSafe({
    to: params.to,
    subject: `Payment not completed — ${params.orderShortCode}`,
    text: `Your payment didn't go through — no charge was made.\n\nOrder number: ${params.orderShortCode}\n\nYou're welcome to try again: ${SITE_URL}/products\nOr check status any time: ${trackUrl}`,
    html,
  })
}