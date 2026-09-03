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
export const INK = '#0D0D0D'
const INK_HOVER = '#1a1a1a'
export const INK_60 = 'rgba(13,13,13,.6)'
const INK_55 = 'rgba(13,13,13,.55)'
export const INK_40 = 'rgba(13,13,13,.4)'
const INK_30 = 'rgba(13,13,13,.3)'
export const BORDER = 'rgba(13,13,13,.08)'
const WHITE = '#FFFFFF'
const PAPER = '#F7F5F1'
const GOLD = '#C8992A'
export const GOLD_TEXT = '#8A6A1E' // darkened gold for small-text legibility; #C8992A itself is the accent/marker color
export const GOLD_TINT = 'rgba(200,153,42,.12)'
export const GREEN = '#0A7B45'
export const GREEN_TINT = 'rgba(10,123,69,.1)'
const WHATSAPP_GREEN = '#25D366' // matches components/FloatingWhatsApp.tsx, not the success green
const RED = '#B91C1C'
const RED_TINT = 'rgba(185,28,28,.08)'

// EXPORTED (Sep 2026) so lib/accountEmails.ts reuses the exact same shell,
// pill, row and button formulas instead of forking the brand into a second
// file that slowly drifts. If you restyle, restyle here.
export function emailShell(bodyHtml: string): string {
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
export function statusPill(label: string, color: string, tint: string): string {
  return `<span style="display:inline-block; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${color}; background:${tint}; padding:7px 16px; border-radius:999px;">${label}</span>`
}

export function trustStrip(): string {
  const items = ['COA on every batch', 'Cold-chain packed', 'Independently tested']
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr><td style="font-size:11px; color:${INK_40}; text-align:center; line-height:1.8;">
      ${items.map((i) => `<span style="color:${GREEN};">&#10003;</span> ${i}`).join('&nbsp;&nbsp;&nbsp;&middot;&nbsp;&nbsp;&nbsp;')}
    </td></tr>
  </table>`
}

export function productRows(
  products: { title: string; price: number; quantity: number; variantOptions?: string[] }[],
  currency: string
): string {
  // variantOptions added Sep 2026. A confirmation that shows only "GHK-Cu"
  // is not a confirmation for this buyer — format (pen / vial / nasal spray)
  // and strength are exactly what they need to check before the parcel is
  // packed, and getting it wrong is an expensive cold-chain return. It was
  // already on the order record and simply wasn't being shown.
  return products
    .map((p) => {
      const variant = (p.variantOptions ?? []).filter(Boolean).join(' \u00b7 ')
      return `
    <tr>
      <td style="padding:10px 0; border-top:1px solid ${BORDER}; font-size:14px; color:${INK};">
        ${p.title}${p.quantity > 1 ? ` <span style="color:${INK_40};">&times; ${p.quantity}</span>` : ''}
        ${variant ? `<div style="font-size:12px; color:${INK_40}; margin-top:2px;">${variant}</div>` : ''}
      </td>
      <td style="padding:10px 0; border-top:1px solid ${BORDER}; font-size:14px; color:${INK}; text-align:right; white-space:nowrap; vertical-align:top;">
        ${currency} ${(p.price * p.quantity).toFixed(2)}
      </td>
    </tr>`
    })
    .join('')
}

// Hidden preheader — the grey line Gmail and Apple Mail show next to the
// subject in the inbox list. Without one, clients scrape the first visible
// text, which for a table-based template is usually the logo or a stray
// label. Controlling it is one of the cheapest open-rate improvements
// available and every one of these emails was missing it.
export function preheader(text: string): string {
  return `<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${text}</div>` +
    // Padding characters stop the client from pulling body copy in after the
    // preheader and appending it to the preview.
    `<div style="display:none; max-height:0; overflow:hidden;">${'&#847;&zwnj;&nbsp;'.repeat(30)}</div>`
}

// Numbered "what happens next" list. Uncertainty after paying is the single
// biggest driver of "where is my order" support messages; answering it in
// the confirmation removes most of them before they are sent.
export function nextSteps(steps: { title: string; body: string }[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    ${steps.map((step, i) => `
    <tr>
      <td width="28" valign="top" style="padding:0 0 16px;">
        <div style="width:22px; height:22px; border-radius:999px; background:${GOLD_TINT}; color:${GOLD_TEXT}; font-size:11px; font-weight:700; text-align:center; line-height:22px;">${i + 1}</div>
      </td>
      <td valign="top" style="padding:0 0 16px 10px;">
        <div style="font-size:13.5px; font-weight:700; color:${INK}; margin-bottom:2px;">${step.title}</div>
        <div style="font-size:13px; line-height:1.6; color:${INK_60};">${step.body}</div>
      </td>
    </tr>`).join('')}
  </table>`
}

// Same "white card, 1px ink-08 border, 20px radius, ink-40 uppercase
// micro-label" formula as the info box on checkout/success and
// checkout/failure — plus a monospace lot/ref code, matching how batch
// codes are set in COASection. A gold dash marks the label row, echoing
// the gold "—" bullets used for the failure-reasons list on that page.
export function refBox(labelText: string, code: string, innerHtml: string): string {
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
export function primaryButton(label: string, href: string, marginBottom = 0): string {
  return `<a href="${href}" style="display:block; text-align:center; background:${INK}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:15px; border-radius:999px; margin-bottom:${marginBottom}px;">${label}</a>`
}

/**
 * ORDER CONFIRMATION — rewritten September 2026.
 *
 * This is the most-read email the business sends: near-100% open rate, and
 * for a first-time buyer of research compounds it is the moment they decide
 * whether they bought from a real operation or a storefront. The previous
 * version was correct but thin — a total, an order number, and a track
 * button. Everything added below is either something the customer needs, or
 * something that stops them having to write to you to ask.
 *
 * WHAT CHANGED AND WHY
 *  - PREHEADER. The grey line beside the subject in the inbox. Previously
 *    unset, so clients scraped whatever text came first.
 *  - NAME. Personalised when the record has one.
 *  - FORMAT AND STRENGTH per line. Already on the record, never shown. This
 *    is the detail a research buyer checks, and a wrong strength caught here
 *    is far cheaper than a cold-chain return.
 *  - WHAT HAPPENS NEXT. Three numbered steps with real timings taken from
 *    /shipping. Post-purchase uncertainty is the main driver of "where is my
 *    order" messages.
 *  - STORAGE ON ARRIVAL. One line telling them to refrigerate on delivery
 *    and read the enclosed documentation. Genuinely useful, protects the
 *    product they just paid for, and costs nothing.
 *  - THE COA POINTER. Tells them their batch certificate is searchable by
 *    the lot number on the vial. This is the differentiator; the
 *    confirmation email is the first place a new customer will act on it.
 *  - ACCOUNT LINK. Now that accounts exist, this is where a first-time buyer
 *    learns they can reorder in one tap.
 *  - REAL SUPPORT ROUTES. WhatsApp and email, named.
 *  - FULL PLAIN-TEXT ALTERNATIVE. The old text version listed no items at
 *    all — bad for accessibility, and text/plain is what some corporate mail
 *    gateways strip HTML down to.
 *
 * COMPLIANCE: nothing here describes what any compound does. The storage
 * line is handling guidance for a laboratory material, which is the same
 * information already printed on the documentation in the box.
 */
export async function sendOrderConfirmationEmail(params: {
  to: string
  orderShortCode: string
  products: { title: string; price: number; quantity: number; variantOptions?: string[] }[]
  total: number
  currency: string
  customerName?: string
}) {
  const { to, orderShortCode, products, total, currency, customerName } = params

  const trackUrl = `${SITE_URL}/track-order?code=${encodeURIComponent(orderShortCode)}`
  const accountUrl = `${SITE_URL}/account`
  const coaUrl = `${SITE_URL}/certificates`
  const firstName = (customerName || '').trim().split(/\s+/)[0]
  const greeting = firstName ? `Thanks, ${firstName}.` : 'Thanks for your order.'

  const html = emailShell(`
    ${preheader(`Order ${orderShortCode} confirmed \u00b7 dispatched within 1 business day, cold-chain packed`)}
    <div style="margin-bottom:24px;">${statusPill('&#10003; Order Confirmed', GREEN, GREEN_TINT)}</div>
    <h1 style="font-size:26px; font-weight:700; letter-spacing:-.03em; line-height:1.1; color:${INK}; margin:0 0 12px;">${greeting}</h1>
    <p style="font-size:15px; line-height:1.65; color:${INK_55}; margin:0 0 28px;">
      Payment confirmed. We&rsquo;re preparing your order now &mdash; batch-documented and packed for cold-chain dispatch.
    </p>

    ${refBox(
      'Order Number',
      orderShortCode,
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productRows(products, currency)}
        <tr>
          <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${INK};">Total</td>
          <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${INK}; text-align:right;">${currency} ${total.toFixed(2)}</td>
        </tr>
      </table>`
    )}

    <div style="font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${INK_40}; margin:0 0 14px;">
      <span style="color:${GOLD};">&mdash;</span> What happens next
    </div>
    ${nextSteps([
      {
        title: 'Dispatch within 1 business day',
        body: 'Orders placed after hours, at weekends or on public holidays are processed on the next business day.',
      },
      {
        // Deliberately does NOT promise an automatic tracking email. Dispatch
        // isn't tracked in this system, so anything sent at that point is
        // sent by hand — and a confirmation that guarantees an email nobody
        // is systematically responsible for creates the exact support ticket
        // it was meant to prevent. This states the timing and gives a route
        // to a person instead.
        title: 'Delivery',
        body: `Delivery estimates run from dispatch, not from the time you ordered. Need a status update at any point, just reply to this email or check <a href="${SITE_URL}/track-order" style="color:${INK}; font-weight:600;">order tracking</a>.`,
      },
      {
        title: 'Certificates published per lot',
        body: `Once it arrives, take the lot number printed on the vial and look it up in the <a href="${coaUrl}" style="color:${INK}; font-weight:600;">certificate library</a>. The certificate matches your exact batch &mdash; not a generic reference document.`,
      },
    ])}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER}; border-radius:14px; margin:0 0 24px;">
      <tr><td style="padding:16px 18px;">
        <div style="font-size:12.5px; font-weight:700; color:${INK}; margin-bottom:4px;">On arrival</div>
        <div style="font-size:12.5px; line-height:1.65; color:${INK_60};">
          Refrigerate on delivery and follow the storage requirements printed on the documentation enclosed &mdash; they differ between vials, pens and sprays.
        </div>
      </td></tr>
    </table>

    ${primaryButton('Track your order', trackUrl, 10)}
    <p style="font-size:12.5px; line-height:1.6; color:${INK_60}; text-align:center; margin:0 0 4px;">
      or <a href="${accountUrl}" style="color:${INK}; font-weight:600;">sign in to your account</a> to see every order and reorder in one tap
    </p>

    ${trustStrip()}

    <p style="font-size:12px; line-height:1.7; color:${INK_40}; margin:18px 0 0; text-align:center;">
      Questions about this order? Reply to this email or message us at
      <a href="mailto:hello@pepcolab.com" style="color:${INK_60};">hello@pepcolab.com</a>.<br />
      Supplied for in-vitro laboratory research use only. Not for human or veterinary consumption.
    </p>
  `)

  const itemLines = products
    .map((p) => {
      const variant = (p.variantOptions ?? []).filter(Boolean).join(' \u00b7 ')
      return `- ${p.title}${variant ? ` (${variant})` : ''}${p.quantity > 1 ? ` x${p.quantity}` : ''}  ${currency} ${(p.price * p.quantity).toFixed(2)}`
    })
    .join('\n')

  await sendMailSafe({
    to,
    subject: `Order confirmed \u2014 ${orderShortCode}`,
    text:
      `${greeting}\n\n` +
      `Payment confirmed. We're preparing your order now, batch-documented and packed for cold-chain dispatch.\n\n` +
      `ORDER ${orderShortCode}\n${itemLines}\nTotal: ${currency} ${total.toFixed(2)}\n\n` +
      `WHAT HAPPENS NEXT\n` +
      `1. Dispatch within 1 business day (next business day if placed after hours, at weekends or on a public holiday).\n` +
      `2. Delivery estimates run from dispatch, not from when you ordered. For a status update, reply to this email or visit ${trackUrl}.\n` +
      `3. When it arrives, look up the lot number printed on the vial at ${coaUrl} for that batch's certificate.\n\n` +
      `ON ARRIVAL\nRefrigerate on delivery and follow the storage requirements printed on the enclosed documentation - they differ between vials, pens and sprays.\n\n` +
      `Track your order: ${trackUrl}\n` +
      `Your account (order history and one-tap reorder): ${accountUrl}\n\n` +
      `Questions? Reply to this email or contact hello@pepcolab.com\n\n` +
      `Supplied for in-vitro laboratory research use only. Not for human or veterinary consumption.`,
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