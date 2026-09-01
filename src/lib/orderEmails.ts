// src/lib/orderEmails.ts
//
// The order-confirmation, review-request, abandoned-cart, and payment-failed
// customer emails.
//
// RESTYLE (Sep 2026), take two — see conversation history. First pass wrongly
// matched app/globals.css's blue/gray tokens, which turn out to be mostly
// vestigial (var(--blue) appears in a handful of files; almost nothing else
// references the CSS custom properties). The palette customers actually see
// — Nav, Footer, every content page, and critically the checkout
// success/failure/cancel pages this email family sits right next to — is
// inline-styled black/cream/gold: #0D0D0D ink, #F7F5F1 paper, #C8992A gold
// accent, pill-shaped black CTAs, rgba(13,13,13,X) text opacities. This
// version matches THAT — same ink/paper/gold values, same pill-badge and
// pill-button formulas, pulled directly from app/checkout/success/page.tsx
// and app/checkout/failure/page.tsx so this reads as the same product the
// customer just clicked through, not a different app. Table-based layout,
// inline styles only, stays — that's what survives Outlook/Gmail clipping.
import { sendMailSafe } from '@/lib/mailer'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'

// ── Brand tokens — lifted directly from checkout/success & checkout/failure ─
const INK = '#0D0D0D'
const INK_HOVER = '#1a1a1a'
const INK_60 = 'rgba(13,13,13,.6)'
const INK_55 = 'rgba(13,13,13,.55)'
const INK_40 = 'rgba(13,13,13,.4)'
const INK_30 = 'rgba(13,13,13,.3)'
const BORDER = 'rgba(13,13,13,.08)'
const WHITE = '#FFFFFF'
const PAPER = '#F7F5F1'
const GOLD = '#C8992A'
const GOLD_TEXT = '#8A6A1E' // darkened gold for small-text legibility; #C8992A itself is the accent/marker color
const GOLD_TINT = 'rgba(200,153,42,.12)'
const GREEN = '#0A7B45'
const GREEN_TINT = 'rgba(10,123,69,.1)'
const WHATSAPP_GREEN = '#25D366' // matches components/FloatingWhatsApp.tsx, not the success green
const RED = '#B91C1C'
const RED_TINT = 'rgba(185,28,28,.08)'

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background:${PAPER}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}; padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:${WHITE}; border:1px solid ${BORDER}; border-radius:20px; overflow:hidden;">
        <tr><td style="height:3px; line-height:3px; font-size:0; background:${GOLD};">&nbsp;</td></tr>
        <tr><td style="padding:32px 36px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="font-size:18px; font-weight:700; letter-spacing:-.02em; color:${INK};">Pepco Lab</td>
              <td align="right" style="font-family:'SF Mono',Consolas,monospace; font-size:9.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:${GOLD_TEXT};">Research Lab</td>
            </tr>
          </table>
          ${bodyHtml}
        </td></tr>
      </table>
      <div style="max-width:520px; margin:20px auto 0; font-size:11px; line-height:1.6; color:${INK_30}; text-align:center;">
        For laboratory and research purposes only. Not for human or veterinary use.<br />
        Pepco Lab · <a href="${SITE_URL}" style="color:${INK_40};">${SITE_URL.replace(/^https?:\/\//, '')}</a>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

// Same formula used for every status pill on checkout/success, /failure and
// /cancel: uppercase 11px/700/.1em tracking, full pill, colored text on a
// ~10% tint of the same color. No new pill language invented here.
function statusPill(label: string, color: string, tint: string): string {
  return `<span style="display:inline-block; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${color}; background:${tint}; padding:7px 16px; border-radius:999px;">${label}</span>`
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

// Same "white card, 1px ink-08 border, 20px radius, ink-40 uppercase
// micro-label" formula as the info box on checkout/success and
// checkout/failure — plus a monospace lot/ref code, matching how batch
// codes are set in COASection. A gold dash marks the label row, echoing
// the gold "—" bullets used for the failure-reasons list on that page.
function refBox(labelText: string, code: string, innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; background:${WHITE}; border:1px solid ${BORDER}; border-radius:16px;">
    <tr><td style="padding:20px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${innerHtml ? '10px' : '0'};">
        <tr>
          <td style="font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${INK_40};"><span style="color:${GOLD};">&mdash;</span> ${labelText}</td>
          <td align="right" style="font-family:'SF Mono',Consolas,monospace; font-size:15px; font-weight:700; letter-spacing:.01em; color:${INK};">${code}</td>
        </tr>
      </table>
      ${innerHtml}
    </td></tr>
  </table>`
}

// The pill CTA used for every primary action on checkout/success (Track
// Your Order) and checkout/failure (Try Again) — black, full pill,
// 15px vertical padding. This keeps every order-lifecycle email visually
// identical to the page the customer will land on after tapping it.
function primaryButton(label: string, href: string, marginBottom = 0): string {
  return `<a href="${href}" style="display:block; text-align:center; background:${INK}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:15px; border-radius:999px; margin-bottom:${marginBottom}px;">${label}</a>`
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
    <div style="margin-bottom:24px;">${statusPill('&#10003; Order Confirmed', GREEN, GREEN_TINT)}</div>
    <h1 style="font-size:26px; font-weight:700; letter-spacing:-.03em; line-height:1.1; color:${INK}; margin:0 0 12px;">Thanks for your order.</h1>
    <p style="font-size:15px; line-height:1.6; color:${INK_55}; margin:0 0 28px;">
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
    ${primaryButton('Track Your Order', trackUrl)}
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
    <h1 style="font-size:23px; font-weight:700; letter-spacing:-.03em; line-height:1.15; color:${INK}; margin:0 0 12px;">How was ${params.productTitle}?</h1>
    <p style="font-size:15px; line-height:1.6; color:${INK_55}; margin:0 0 28px;">
      A minute of your time helps other researchers know what to expect. Every review we publish is tied to a real order — yours included.
    </p>
    ${primaryButton('Leave a Review', trackUrl)}
    <p style="font-size:11px; font-family:'SF Mono',Consolas,monospace; color:${INK_30}; text-align:center; margin:16px 0 0;">
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
    ? statusPill('Final Hold &mdash; Closing Soon', GOLD_TEXT, GOLD_TINT)
    : statusPill('Samples Reserved', GREEN, GREEN_TINT)

  const headline = isFinal ? 'Final hold notice.' : 'Your samples are still reserved.'
  const subcopy = isFinal
    ? "This is the last reminder before these reserved batches go back into inventory. Still want them? It only takes a minute to finish up — and we're happy to help if anything's holding you up."
    : "Nothing's changed on our end — your items are held and ready whenever you are."

  const html = emailShell(`
    <div style="margin-bottom:24px;">${pill}</div>
    <h1 style="font-size:25px; font-weight:700; letter-spacing:-.03em; line-height:1.1; color:${INK}; margin:0 0 12px;">${headline}</h1>
    <p style="font-size:15px; line-height:1.6; color:${INK_55}; margin:0 0 28px;">${subcopy}</p>
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
    ${primaryButton('Complete Your Order', cartUrl, whatsappUrl ? 10 : 0)}
    ${
      whatsappUrl
        ? `<a href="${whatsappUrl}" style="display:block; text-align:center; color:${WHATSAPP_GREEN}; font-size:13px; font-weight:600; text-decoration:none; padding:6px;">
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
  const reasons = [
    'The bank declined or couldn&rsquo;t complete 3D Secure verification',
    'Insufficient funds or a card limit',
    'Incorrect card details entered',
  ]
  const html = emailShell(`
    <div style="margin-bottom:24px;">${statusPill('Payment Not Completed', RED, RED_TINT)}</div>
    <h1 style="font-size:25px; font-weight:700; letter-spacing:-.03em; line-height:1.1; color:${INK}; margin:0 0 12px;">Your payment didn't go through.</h1>
    <p style="font-size:15px; line-height:1.6; color:${INK_55}; margin:0 0 24px;">
      No charge was made. If your bank shows a pending hold, it will release automatically.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; background:${WHITE}; border:1px solid ${BORDER}; border-radius:16px;">
      <tr><td style="padding:22px;">
        <div style="font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${INK_40}; margin-bottom:12px;">This is usually one of</div>
        ${reasons
          .map(
            (r, i) => `<div style="display:flex; font-size:13.5px; line-height:1.6; color:${INK_60}; margin-bottom:${i < reasons.length - 1 ? '10px' : '0'};">
          <span style="color:${GOLD}; margin-right:10px;">&mdash;</span><span>${r}</span>
        </div>`
          )
          .join('')}
      </td></tr>
    </table>
    ${refBox('Order Number', params.orderShortCode, '')}
    ${primaryButton('Try Again', `${SITE_URL}/products`, 8)}
    <a href="${trackUrl}" style="display:block; text-align:center; color:${INK_40}; font-size:13px; font-weight:600; text-decoration:none; padding:6px;">
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