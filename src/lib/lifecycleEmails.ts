// src/lib/lifecycleEmails.ts
//
// AFTER-ORDER CARE — September 2026
// -------------------------------------------------------
// The post-purchase sequence, in order:
//
//   Day 0          Order confirmation         lib/orderEmails.ts   (webhook)
//   Dispatch       On its way                 this file            (admin clicks "Mark as dispatched")
//   +2 working d.  Arrived OK? + handling     this file            (cron: customer-care)
//   Day 10         Review request             lib/orderEmails.ts   (cron: review-requests)
//   Day 18         More from your research area  this file         (cron: customer-care)
//   Day 28         Reorder reminder           lib/accountEmails.ts (cron: reorder-reminder)
//   Day 60         Win-back, if no new order  this file            (cron: customer-care)
//
// Every email is built from what the customer actually bought (see
// lib/customerJourney.ts): handling notes per format (pen / vial / nasal
// spray / powder), a bacteriostatic-water prompt for vial buyers who didn't
// order it, and related products from the same research area.
//
// DELIVERY: couriers don't give us tracking. ~90% of orders arrive the next
// working day, so the dispatch email states that as a typical expectation —
// never a guarantee — and shows tracking only if the admin entered one.
//
// COMPLIANCE: nothing here states or implies what any compound does or how
// much to use. Copy stays on supply, storage, handling and service.
//
// The dispatch email is transactional. Everything else is non-essential:
// callers must check isMarketingSuppressed() first, and each carries an
// opt-out link.

import { sendMailSafe } from '@/lib/mailer'
import {
  emailShell, primaryButton, productRows, trustStrip, preheader, refBox,
  INK, INK_60, INK_40, BORDER, GOLD_TEXT, GOLD_TINT, GREEN, GREEN_TINT,
} from '@/lib/orderEmails'
import { productHref } from '@/lib/utils'
import type { OrderRecord } from '@/lib/orderStore'
import {
  addWorkingDays, formatDubaiDate,
  type OrderJourney, type ProductFormat, type SuggestedProduct,
} from '@/lib/customerJourney'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'
const SUPPORT_EMAIL = process.env.SMTP_FROM || 'hello@pepcolab.com'
const RUO = 'Supplied for in-vitro laboratory research use only. Not for human or veterinary consumption.'

// GLP is sold through STRABL payment links (see lib/restrictedCheckout.ts),
// so its order lines carry no Shopify variant and cannot be rebuilt in the
// cart. Those customers are sent to the product page to pick strength and
// quantity instead.
const PAYMENT_LINK_PRODUCT_HANDLE = 'retatrutide-uae'
const PAYMENT_LINK_TITLE_RE = /\b(glp|retatrutide|reta)\b/i

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function plainFirstName(customerName?: string): string {
  return (customerName || '').trim().split(/\s+/)[0] || ''
}

function greetingHtml(customerName?: string): string {
  const n = plainFirstName(customerName)
  return n ? `Hi ${escapeHtml(n)},` : 'Hi,'
}

function greetingText(customerName?: string): string {
  const n = plainFirstName(customerName)
  return n ? `Hi ${n},` : 'Hi,'
}

function safeProducts(products: OrderRecord['products']) {
  return products.map((p) => ({
    ...p,
    title: escapeHtml(p.title),
    variantOptions: (p.variantOptions ?? []).map(escapeHtml),
  }))
}

function itemsTable(order: OrderRecord, mb = 20): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:${mb}px;">
    ${productRows(safeProducts(order.products), order.currency)}
  </table>`
}

function itemsText(order: OrderRecord): string {
  return order.products
    .map((p) => {
      const opts = (p.variantOptions ?? []).filter(Boolean).join(', ')
      return `- ${p.title}${opts ? ` (${opts})` : ''}${p.quantity > 1 ? ` x${p.quantity}` : ''}`
    })
    .join('\n')
}

/** "BPC-157" / "BPC-157 and GLP" / "BPC-157, KPV and 2 more" */
function productSummary(order: OrderRecord): string {
  const titles = Array.from(new Set(order.products.map((p) => p.title)))
  if (titles.length <= 1) return titles[0] || 'your order'
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`
  return `${titles[0]}, ${titles[1]} and ${titles.length - 2} more`
}

const h1 = (text: string) =>
  `<h1 style="margin:0 0 12px; font-size:24px; font-weight:700; letter-spacing:-.03em; line-height:1.15; color:${INK};">${text}</h1>`

const h2 = (text: string) =>
  `<h2 style="margin:26px 0 10px; font-size:15px; font-weight:700; letter-spacing:-.01em; color:${INK};">${text}</h2>`

const para = (text: string, mb = 20) =>
  `<p style="margin:0 0 ${mb}px; font-size:14px; line-height:1.7; color:${INK_60};">${text}</p>`

const pill = (label: string, color: string, tint: string) =>
  `<div style="display:inline-block; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${color}; background:${tint}; padding:7px 16px; border-radius:999px; margin-bottom:20px;">${label}</div>`

const footNote = (text: string) =>
  `<p style="margin:24px 0 0; font-size:11px; line-height:1.6; color:${INK_40};">${text}</p>`

const secondaryLink = (label: string, href: string) =>
  `<p style="margin:0 0 8px; text-align:center;"><a href="${href}" style="font-size:13px; font-weight:600; color:${INK}; text-decoration:underline;">${label}</a></p>`

function optOutNote(reason: string, unsubscribeUrl?: string): string {
  return footNote(
    `${reason} ${RUO}` +
    (unsubscribeUrl
      ? ` <a href="${unsubscribeUrl}" style="color:${INK_40}; text-decoration:underline;">Stop these emails</a>.`
      : '')
  )
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount)}`
  }
}

/* -------------------------------------------------------------------------- */
/* Personalised blocks                                                         */
/* -------------------------------------------------------------------------- */

const HANDLING: Record<Exclude<ProductFormat, 'supply'>, { title: string; html: string; text: string }> = {
  pen: {
    title: 'Pens',
    html: `Keep refrigerated at 2&ndash;8&nbsp;&deg;C with the cap on, away from light. <strong style="color:${INK};">Don&rsquo;t freeze a pen</strong> &mdash; the liquid inside can be damaged. To see what each click contains, open the <strong style="color:${INK};">Calculator</strong> button on any page of our site and choose <em>Pen</em>.`,
    text: `Pens: keep refrigerated at 2-8 C with the cap on, away from light. Don't freeze a pen. To see what each click contains, use the Calculator button on our site and choose Pen.`,
  },
  vial: {
    title: 'Vials',
    html: `Unopened: refrigerate at 2&ndash;8&nbsp;&deg;C, or freeze at &minus;20&nbsp;&deg;C for longer storage. Reconstitute with bacteriostatic water; once reconstituted, keep refrigerated and use within 28 days. Avoid repeated freeze&ndash;thaw. <a href="${SITE_URL}/guides/peptide-reconstitution" style="color:${INK}; font-weight:600;">Reconstitution guide</a> &middot; <a href="${SITE_URL}/tools/reconstitution-calculator" style="color:${INK}; font-weight:600;">Calculator</a>`,
    text: `Vials: unopened, refrigerate at 2-8 C or freeze at -20 C for longer storage. Reconstitute with bacteriostatic water; once reconstituted, keep refrigerated and use within 28 days. Guide: ${SITE_URL}/guides/peptide-reconstitution`,
  },
  nasal: {
    title: 'Nasal sprays',
    html: `Store upright in the fridge at 2&ndash;8&nbsp;&deg;C with the cap on, away from light. Don&rsquo;t freeze.`,
    text: `Nasal sprays: store upright in the fridge at 2-8 C with the cap on, away from light. Don't freeze.`,
  },
  powder: {
    title: 'Powders',
    html: `Keep the container sealed and refrigerated at 2&ndash;8&nbsp;&deg;C, away from moisture and light. Reseal straight after opening.`,
    text: `Powders: keep sealed and refrigerated at 2-8 C, away from moisture and light. Reseal straight after opening.`,
  },
}

function handlingBlock(journey: OrderJourney): { html: string; text: string } {
  const formats = (['pen', 'vial', 'nasal', 'powder'] as const).filter((f) => journey.formats.has(f))
  if (formats.length === 0) {
    const html = `<p style="margin:0 0 20px; font-size:13.5px; line-height:1.7; color:${INK_60};">Refrigerate at 2&ndash;8&nbsp;&deg;C on arrival, away from light, and avoid repeated freeze&ndash;thaw. <a href="${SITE_URL}/guides/storage-conditions" style="color:${INK}; font-weight:600;">Storage guide</a></p>`
    return { html, text: `Storage: refrigerate at 2-8 C on arrival, away from light. Guide: ${SITE_URL}/guides/storage-conditions` }
  }
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; border:1px solid ${BORDER}; border-radius:14px;">
    ${formats.map((f, i) => `
    <tr><td style="padding:14px 18px; ${i > 0 ? `border-top:1px solid ${BORDER};` : ''}">
      <div style="font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${GOLD_TEXT}; margin-bottom:5px;">${HANDLING[f].title}</div>
      <div style="font-size:13px; line-height:1.65; color:${INK_60};">${HANDLING[f].html}</div>
    </td></tr>`).join('')}
  </table>`
  return { html, text: formats.map((f) => HANDLING[f].text).join('\n') }
}

function suppliesBlock(journey: OrderJourney): { html: string; text: string } {
  if (!journey.needsBacWater) return { html: '', text: '' }
  const link = journey.bacWater
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:${GOLD_TINT}; border-radius:14px;">
    <tr><td style="padding:14px 18px;">
      <div style="font-size:13.5px; font-weight:700; color:${INK}; margin-bottom:4px;">You&rsquo;ll need bacteriostatic water</div>
      <div style="font-size:13px; line-height:1.6; color:${INK_60};">Your vials are supplied as powder and need reconstituting. If you don&rsquo;t already have bacteriostatic water, ${link ? `<a href="${link.url}" style="color:${INK}; font-weight:700;">add it here</a> (${money(link.price, link.currency)})` : `<a href="${SITE_URL}/products" style="color:${INK}; font-weight:700;">find it in the catalogue</a>`}.</div>
    </td></tr>
  </table>`
  const text = `You'll need bacteriostatic water to reconstitute your vials: ${link ? link.url : `${SITE_URL}/products`}`
  return { html, text }
}

function relatedBlock(items: SuggestedProduct[], heading: string): { html: string; text: string } {
  if (items.length === 0) return { html: '', text: '' }
  const cells = items.map((p) => `
      <td width="${Math.floor(100 / items.length)}%" valign="top" style="padding:0 5px;">
        <a href="${p.url}" style="text-decoration:none; color:${INK}; display:block;">
          <div style="border:1px solid ${BORDER}; border-radius:14px; padding:12px; text-align:center;">
            ${p.image
              ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" width="110" style="display:block; width:100%; max-width:110px; height:auto; margin:0 auto 10px; border-radius:8px;" />`
              : ''}
            <div style="font-size:13px; font-weight:700; line-height:1.3; color:${INK};">${escapeHtml(p.title)}</div>
            ${p.category ? `<div style="font-size:11px; color:${INK_40}; margin-top:2px;">${escapeHtml(p.category)}</div>` : ''}
            <div style="font-size:12.5px; color:${INK_60}; margin-top:6px;">from ${money(p.price, p.currency)}</div>
          </div>
        </a>
      </td>`).join('')
  const html = `${h2(heading)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      <tr>${cells}</tr>
    </table>`
  const text = `${heading}:\n${items.map((p) => `- ${p.title} (from ${money(p.price, p.currency)}): ${p.url}`).join('\n')}`
  return { html, text }
}

/** Related-products block for other email files (e.g. the reorder reminder). */
export function relatedProductsSection(journey: OrderJourney | null, heading = 'You might also like') {
  return relatedBlock(journey?.related ?? [], heading)
}

/**
 * Where an "order again" button should send this customer.
 *  - Lines with a Shopify variant → the cart, rebuilt via ?restore=
 *  - GLP payment-link orders      → the GLP product page (choose strength + qty)
 *  - Anything else                → the catalogue
 */
export function buildOrderAgainUrl(order: Pick<OrderRecord, 'orderShortCode' | 'products'>): {
  url: string
  kind: 'cart' | 'product' | 'catalogue'
} {
  if (order.products.some((p) => p.variantId)) {
    return { url: `${SITE_URL}/cart?restore=${encodeURIComponent(order.orderShortCode)}`, kind: 'cart' }
  }
  if (order.products.some((p) => PAYMENT_LINK_TITLE_RE.test(p.title))) {
    return { url: `${SITE_URL}${productHref(PAYMENT_LINK_PRODUCT_HANDLE)}`, kind: 'product' }
  }
  return { url: `${SITE_URL}/products`, kind: 'catalogue' }
}

function trackOrderUrl(order: Pick<OrderRecord, 'orderShortCode' | 'email'>): string {
  return `${SITE_URL}/track-order?code=${encodeURIComponent(order.orderShortCode)}&email=${encodeURIComponent(order.email)}`
}

/* -------------------------------------------------------------------------- */
/* 1. ON ITS WAY — transactional, sent when the admin marks it dispatched      */
/* -------------------------------------------------------------------------- */

export async function sendShippedEmail(order: OrderRecord, journey: OrderJourney): Promise<void> {
  const dispatched = order.shippedAt ? new Date(order.shippedAt) : new Date()
  const expected = formatDubaiDate(addWorkingDays(dispatched, 1))
  const chaseBy = formatDubaiDate(addWorkingDays(dispatched, 2))
  const hasTracking = Boolean(order.trackingNumber)
  const carrier = order.carrier ? escapeHtml(order.carrier) : ''
  const handling = handlingBlock(journey)
  const supplies = suppliesBlock(journey)

  const trackingInner = hasTracking
    ? `<div style="font-size:13px; line-height:1.7; color:${INK_60};">
        ${carrier ? `Carrier: <strong style="color:${INK};">${carrier}</strong><br />` : ''}
        Tracking number: <strong style="color:${INK}; font-family:'SF Mono',Consolas,monospace;">${escapeHtml(order.trackingNumber || '')}</strong>
      </div>`
    : `<div style="font-size:13px; line-height:1.7; color:${INK_60};">
        Typical delivery: <strong style="color:${INK};">next working day</strong><br />
        Expect it around <strong style="color:${INK};">${expected}</strong>
      </div>`

  const html = emailShell(`
    ${preheader(`Order ${order.orderShortCode} is on its way — most orders arrive the next working day`)}
    ${pill('Dispatched', GREEN, GREEN_TINT)}
    ${h1('Your order is on its way')}
    ${para(`${greetingHtml(order.customerName)} your order has left us, cold-chain packed. Most orders arrive the <strong style="color:${INK};">next working day</strong>, so expect yours around <strong style="color:${INK};">${expected}</strong>. Please keep your phone nearby in case the courier calls.`)}
    ${refBox('Order', escapeHtml(order.orderShortCode), trackingInner)}
    ${hasTracking && order.trackingUrl ? primaryButton('Track with the courier', order.trackingUrl, 16) : ''}
    ${itemsTable(order)}
    ${h2('When it arrives')}
    ${handling.html}
    ${supplies.html}
    ${para(`Not arrived by <strong style="color:${INK};">${chaseBy}</strong>, or something not right &mdash; damaged packaging, a warm pack, a missing item? Reply to this email (a photo helps) and we&rsquo;ll sort it straight away.`, 0)}
    ${trustStrip()}
    ${footNote(RUO)}
  `)

  await sendMailSafe({
    to: order.email,
    replyTo: SUPPORT_EMAIL,
    subject: `On its way — ${order.orderShortCode}`,
    text:
      `${greetingText(order.customerName)}\n\n` +
      `Your order ${order.orderShortCode} has left us, cold-chain packed. Most orders arrive the next working day, so expect yours around ${expected}. Please keep your phone nearby in case the courier calls.\n\n` +
      (hasTracking
        ? `${order.carrier ? `Carrier: ${order.carrier}\n` : ''}Tracking number: ${order.trackingNumber}\n${order.trackingUrl ? `Track it: ${order.trackingUrl}\n` : ''}\n`
        : '') +
      `Items:\n${itemsText(order)}\n\n` +
      `When it arrives:\n${handling.text}\n` +
      (supplies.text ? `\n${supplies.text}\n` : '') +
      `\nNot arrived by ${chaseBy}, or something not right? Reply to this email and we'll sort it.\n\n${RUO}`,
    html,
  })
}

/* -------------------------------------------------------------------------- */
/* 2. ARRIVED OK? — non-essential, cron: customer-care                         */
/* -------------------------------------------------------------------------- */

export async function sendAftercareEmail(order: OrderRecord, journey: OrderJourney, unsubscribeUrl?: string): Promise<void> {
  const summary = productSummary(order)
  const handling = handlingBlock(journey)
  const supplies = suppliesBlock(journey)
  const related = relatedBlock(journey.related, journey.categories[0] ? `More in ${journey.categories[0]}` : 'You might also like')

  const html = emailShell(`
    ${preheader(`Checking your ${summary} arrived safely, plus handling notes`)}
    ${pill('Quick check', GOLD_TEXT, GOLD_TINT)}
    ${h1(`Did your ${escapeHtml(summary)} arrive safely?`)}
    ${para(`${greetingHtml(order.customerName)} your order ${escapeHtml(order.orderShortCode)} should be with you now. If anything wasn&rsquo;t right &mdash; packaging, temperature, a missing or wrong item &mdash; just reply. A person reads every reply, and problems get fixed first.`)}
    ${h2('Handling what you ordered')}
    ${handling.html}
    ${supplies.html}
    ${primaryButton('Storage & handling guide', `${SITE_URL}/guides/storage-conditions`, 12)}
    ${secondaryLink('Check order status', trackOrderUrl(order))}
    ${related.html}
    ${trustStrip()}
    ${optOutNote(`Sent once, a few days after your order ${escapeHtml(order.orderShortCode)}.`, unsubscribeUrl)}
  `)

  await sendMailSafe({
    to: order.email,
    replyTo: SUPPORT_EMAIL,
    subject: `Did your ${summary} arrive safely?`,
    text:
      `${greetingText(order.customerName)}\n\n` +
      `Your order ${order.orderShortCode} should be with you now. If anything wasn't right (packaging, temperature, a missing or wrong item), just reply. A person reads every reply.\n\n` +
      `Handling what you ordered:\n${handling.text}\n` +
      (supplies.text ? `\n${supplies.text}\n` : '') +
      `\nStorage & handling guide: ${SITE_URL}/guides/storage-conditions\n` +
      `Order status: ${trackOrderUrl(order)}\n` +
      (related.text ? `\n${related.text}\n` : '') +
      `\n${RUO}` +
      (unsubscribeUrl ? `\n\nStop these emails: ${unsubscribeUrl}` : ''),
    html,
  })
}

/* -------------------------------------------------------------------------- */
/* 3. MORE FROM YOUR RESEARCH AREA — non-essential, cron: customer-care        */
/* -------------------------------------------------------------------------- */

/** Returns false (and sends nothing) when there's nothing worth suggesting. */
export async function sendCrossSellEmail(order: OrderRecord, journey: OrderJourney, unsubscribeUrl?: string): Promise<boolean> {
  if (journey.related.length === 0) return false

  const area = journey.categories[0]
  const summary = productSummary(order)
  const related = relatedBlock(journey.related, area ? `Also in ${area}` : 'Picked for you')
  const supplies = suppliesBlock(journey)

  const html = emailShell(`
    ${preheader(`${area ? `More ${area.toLowerCase()} compounds` : 'Compounds'} to sit alongside your ${summary}`)}
    ${pill(area ? `${escapeHtml(area)} research` : 'For your research', GOLD_TEXT, GOLD_TINT)}
    ${h1('Building on your last order')}
    ${para(`${greetingHtml(order.customerName)} since you ordered ${escapeHtml(summary)}, here are ${area ? `other compounds from the same research area` : 'a few compounds'} we stock. Every one ships as a current batch with its own published certificate, cold-chain packed.`)}
    ${related.html}
    ${supplies.html}
    ${primaryButton('Browse the full catalogue', `${SITE_URL}/products?utm_source=email&utm_medium=lifecycle&utm_campaign=cross-sell`, 12)}
    ${secondaryLink('Ordering for a lab? Ask about bulk supply', `${SITE_URL}/bulk-orders`)}
    ${trustStrip()}
    ${optOutNote(`Sent because you ordered from us (${escapeHtml(order.orderShortCode)}).`, unsubscribeUrl)}
  `)

  await sendMailSafe({
    to: order.email,
    replyTo: SUPPORT_EMAIL,
    subject: area ? `More from ${area} research` : 'Picked for your next order',
    text:
      `${greetingText(order.customerName)}\n\n` +
      `Since you ordered ${summary}, here are ${area ? 'other compounds from the same research area' : 'a few compounds'} we stock.\n\n` +
      `${related.text}\n` +
      (supplies.text ? `\n${supplies.text}\n` : '') +
      `\nFull catalogue: ${SITE_URL}/products\nBulk supply for labs: ${SITE_URL}/bulk-orders\n\n${RUO}` +
      (unsubscribeUrl ? `\n\nStop these emails: ${unsubscribeUrl}` : ''),
    html,
  })
  return true
}

/* -------------------------------------------------------------------------- */
/* 4. WIN-BACK — non-essential, cron: customer-care                            */
/* -------------------------------------------------------------------------- */

export async function sendWinbackEmail(order: OrderRecord, journey: OrderJourney, unsubscribeUrl?: string): Promise<void> {
  const again = buildOrderAgainUrl(order)
  const buttonLabel =
    again.kind === 'cart' ? 'Order the same again' :
    again.kind === 'product' ? 'Choose strength & quantity' :
    'Browse the catalogue'
  const related = relatedBlock(journey.related, 'New to try')

  const html = emailShell(`
    ${preheader('Two minutes of feedback, and what’s in stock now')}
    ${pill('From the team', GOLD_TEXT, GOLD_TINT)}
    ${h1('Anything we could do better?')}
    ${para(`${greetingHtml(order.customerName)} it&rsquo;s been a couple of months since your last order. If something fell short &mdash; price, delivery, a product we don&rsquo;t stock &mdash; reply and tell us. It goes straight to the founder and it genuinely shapes what we do next.`)}
    ${para('Ready for your next batch? Here&rsquo;s what you ordered last time. Every shipment is a current lot with its own published certificate.')}
    ${itemsTable(order)}
    ${primaryButton(buttonLabel, again.url, 12)}
    ${related.html}
    ${secondaryLink('Ordering for a lab? Ask about bulk supply', `${SITE_URL}/bulk-orders`)}
    ${trustStrip()}
    ${optOutNote(`Sent once because you ordered from us (${escapeHtml(order.orderShortCode)}).`, unsubscribeUrl)}
  `)

  await sendMailSafe({
    to: order.email,
    replyTo: SUPPORT_EMAIL,
    subject: 'Anything we could do better?',
    text:
      `${greetingText(order.customerName)}\n\n` +
      `It's been a couple of months since your last order. If something fell short (price, delivery, a product we don't stock), reply and tell us. It goes straight to the founder.\n\n` +
      `Your last order (${order.orderShortCode}):\n${itemsText(order)}\n\n` +
      `${buttonLabel}: ${again.url}\n` +
      (related.text ? `\n${related.text}\n` : '') +
      `\nBulk supply for labs: ${SITE_URL}/bulk-orders\n\n${RUO}` +
      (unsubscribeUrl ? `\n\nStop these emails: ${unsubscribeUrl}` : ''),
    html,
  })
}