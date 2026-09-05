// src/lib/accountEmails.ts
//
// THE TWO LIFECYCLE EMAILS — September 2026
// -------------------------------------------------------
// Every primitive here is imported from lib/orderEmails.ts rather than
// redefined. That is deliberate: a second email file that forks the brand is
// a file that slowly drifts, and six months later customers are getting two
// different-looking emails from the same company. Restyle in one place.
//
// 1. SIGN-IN LINK — the account system's only auth email. Deliberately plain
//    and short: security emails that look like marketing get treated like
//    marketing, and this one has a 15-minute fuse.
//
// 2. REORDER REMINDER — the revenue one. This is a consumables business:
//    the same buyer reorders every few weeks for years, or they drift to
//    whoever emails them first. The prompt is framed around the documented
//    28-day post-reconstitution window rather than "buy more stuff", because
//    it is genuinely useful information and it earns the open. It carries a
//    one-tap reorder link.
//
// NO DISPATCH EMAIL. An earlier draft included one carrying the batch
// certificate at ship time. Removed at Mohammed's direction: there is no
// dispatch tracking in this system, so nothing reliably knows when a parcel
// leaves, and an email that fires from a state nobody maintains is an email
// that eventually goes out wrong or not at all. The certificate pointer it
// carried now lives in the order confirmation instead — same information,
// triggered by something the system genuinely knows about.
//
// COMPLIANCE: no email here states or implies what any compound does. Copy
// stays on the supply axis — documentation, batches, storage, availability.
// A reorder prompt is not a usage recommendation, and the wording is chosen
// so it cannot be read as one.

import { sendMailSafe } from '@/lib/mailer'
import {
  emailShell, primaryButton, productRows, trustStrip, preheader,
  INK, INK_60, INK_40, GOLD_TEXT, GOLD_TINT,
} from '@/lib/orderEmails'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'

const h1 = (text: string) =>
  `<h1 style="margin:0 0 12px; font-size:24px; font-weight:700; letter-spacing:-.03em; line-height:1.15; color:${INK};">${text}</h1>`

const para = (text: string, mb = 20) =>
  `<p style="margin:0 0 ${mb}px; font-size:14px; line-height:1.7; color:${INK_60};">${text}</p>`

const pill = (label: string, color: string, tint: string) =>
  `<div style="display:inline-block; font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:${color}; background:${tint}; padding:7px 16px; border-radius:999px; margin-bottom:20px;">${label}</div>`

const footNote = (text: string) =>
  `<p style="margin:24px 0 0; font-size:11px; line-height:1.6; color:${INK_40};">${text}</p>`

const RUO = 'Supplied for in-vitro laboratory research use only. Not for human or veterinary consumption.'

/* -------------------------------------------------------------------------- */
/* 1. SIGN-IN LINK                                                             */
/* -------------------------------------------------------------------------- */

export async function sendSignInEmail(params: { to: string; magicLinkUrl: string }) {
  const { to, magicLinkUrl } = params

  const html = emailShell(`
    ${pill('Sign in', GOLD_TEXT, GOLD_TINT)}
    ${h1('Your sign-in link')}
    ${para('Tap below to open your PepcoLab account. The link works once and expires in 15 minutes.')}
    ${primaryButton('Sign in to my account', magicLinkUrl, 20)}
    ${para('If you didn\u2019t request this, you can ignore it \u2014 no account changes were made and nobody can sign in without this link.', 0)}
    ${footNote('For your security, never forward this email.')}
  `)

  await sendMailSafe({
    to,
    subject: 'Your PepcoLab sign-in link',
    text: `Sign in to your PepcoLab account:\n\n${magicLinkUrl}\n\nThis link works once and expires in 15 minutes. If you didn't request it, ignore this email.`,
    html,
  })
}

/* -------------------------------------------------------------------------- */
/* 2. REORDER REMINDER                                                         */
/* -------------------------------------------------------------------------- */

export async function sendReorderReminderEmail(params: {
  to: string
  customerName?: string
  orderShortCode: string
  products: { title: string; price: number; quantity: number }[]
  currency: string
  reorderUrl: string
  unsubscribeUrl?: string
}) {
  const { to, customerName, orderShortCode, products, currency, reorderUrl, unsubscribeUrl } = params
  const greeting = customerName ? `Hi ${customerName},` : 'Hi,'

  const html = emailShell(`
    ${pill('Reorder', GOLD_TEXT, GOLD_TINT)}
    ${h1('Running low?')}
    ${para(`${greeting} it has been about four weeks since your last order. Reconstituted material is documented for use within 28 days at 2\u20138\u00a0\u00b0C, so this is roughly when researchers tend to need the next batch.`)}
    ${para('One tap rebuilds your last order in the cart \u2014 same compounds, same formats. The batch you receive will be a current lot with its own certificate.')}
    ${productRows(products, currency)}
    ${primaryButton('Reorder these items', reorderUrl, 16)}
    ${trustStrip()}
    ${footNote(
      `Sent because you ordered from us (${orderShortCode}). ${RUO}` +
      (unsubscribeUrl ? ` <a href="${unsubscribeUrl}" style="color:${INK_40}; text-decoration:underline;">Stop reorder reminders</a>.` : '')
    )}
  `)

  await sendMailSafe({
    to,
    subject: 'Time for a fresh batch?',
    text:
      `${greeting}\n\nIt has been about four weeks since order ${orderShortCode}. Reconstituted material is documented for use within 28 days at 2-8 C, so this is roughly when a next batch tends to be needed.\n\n` +
      `Reorder the same items in one tap: ${reorderUrl}\n\n${RUO}` +
      (unsubscribeUrl ? `\n\nStop reorder reminders: ${unsubscribeUrl}` : ''),
    html,
  })
}

/* -------------------------------------------------------------------------- */
/* 3. CHECKOUT HELP — for abandoned checkouts with no captured cart            */
/* -------------------------------------------------------------------------- */

/**
 * "Something go wrong at checkout?"
 *
 * WHY THIS EXISTS SEPARATELY FROM sendAbandonedCartEmail
 * That template renders the items and the total, which is the right email for
 * a normal abandoned cart. But every abandoned record in this system has an
 * EMPTY products array — STRABL writes the record when checkout opens, before
 * a cart is attached — so that email would show an empty basket worth nothing.
 *
 * This one doesn't reference a cart at all. It asks a question instead, which
 * is both the only honest thing we can say and, at this volume, the more
 * useful one: someone who reached checkout and stopped had a reason, and the
 * reason is worth more than the recovered order.
 *
 * Deliberately short and plain. It reads as a person noticing, because that
 * is what it is — it is sent by hand from the admin screen, one at a time.
 */
export async function sendCheckoutHelpEmail(params: {
  to: string
  customerName?: string
  attempts?: number
}) {
  const { to, customerName, attempts = 1 } = params
  const firstName = (customerName || '').trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,'

  // More than one attempt in a session almost always means a payment that
  // kept failing rather than a change of mind — worth naming, because being
  // told "we noticed" is what makes someone reply.
  // Lower-cased because it follows "Hi Name," — otherwise it reads
  // "Hi Saoud, We noticed", which is the sort of seam that tells someone
  // they're reading a template.
  const opener = attempts > 1
    ? 'we noticed you tried to check out a few times and it didn&rsquo;t go through.'
    : 'we noticed you got as far as checkout and didn&rsquo;t complete the order.'

  const html = emailShell(`
    ${preheader('Did something go wrong at checkout? We can help.')}
    ${h1('Did something go wrong?')}
    ${para(`${greeting} ${opener} If it was a payment that wouldn&rsquo;t go through, or a question you wanted answered first, just reply to this email &mdash; a person reads it.`)}
    ${para('If you simply changed your mind, no problem at all, and you can ignore this. We&rsquo;re not going to chase you.')}
    ${primaryButton('Back to the catalogue', `${SITE_URL}/products`, 16)}
    ${trustStrip()}
    ${footNote(`Sent once because a checkout was started with this address. ${RUO}`)}
  `)

  await sendMailSafe({
    to,
    subject: 'Did something go wrong at checkout?',
    text:
      `${greeting}\n\n` +
      (attempts > 1
        ? "we noticed you tried to check out a few times and it didn't go through."
        : "we noticed you got as far as checkout and didn't complete the order.") +
      ` If it was a payment that wouldn't go through, or a question you wanted answered first, just reply to this email — a person reads it.\n\n` +
      `If you simply changed your mind, no problem at all. We're not going to chase you.\n\n` +
      `${SITE_URL}/products\n\n${RUO}`,
    html,
  })
}