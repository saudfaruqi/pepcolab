// src/lib/whatsapp.ts
//
// Central place for the WhatsApp number + link building, so every WhatsApp
// link on the site is built from ONE environment variable (brief C1/C9):
// NEXT_PUBLIC_WHATSAPP_NUMBER, full international format, digits only, no
// "+" or spaces. A number change is a one-line env change and a redeploy.
// When it is unset, every WhatsApp CTA renders nothing.
//
// WHATSAPP IS A SERVICE CHANNEL (brief C5, Oct 2026). Pre-filled messages
// ask about an order, delivery or documentation. They never list products,
// prices or totals, and never read as an order being placed: Meta's
// commerce policy prohibits selling these products over WhatsApp, and the
// number staying alive depends on it. Prices and offers go by email only.
import type { CartLine } from '@/lib/cartContext'
import type { WishlistItem } from '@/lib/wishlistContext'

export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '')

export function isWhatsAppConfigured(): boolean {
  return WHATSAPP_NUMBER.trim().length > 0
}

// FIX (Aug 2026): every consumer (FloatingWhatsApp, product page, cart)
// already degrades gracefully when the number is unset — buttons just
// render nothing instead of a broken wa.me/undefined link. That's the
// right runtime behavior, but it also means a missing
// NEXT_PUBLIC_WHATSAPP_NUMBER in production is completely silent: no
// error, no broken-looking UI, just buttons that never appear. This
// module-load warning (dev only, and only server/build-time — it won't
// spam browser consoles) is the one place that actually surfaces it.
// Confirm NEXT_PUBLIC_WHATSAPP_NUMBER is set in Vercel prod, not just
// .env.local, since this is easy to miss at deploy time.
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined' && !isWhatsAppConfigured()) {
  console.warn(
    '[whatsapp] NEXT_PUBLIC_WHATSAPP_NUMBER is not set — all WhatsApp CTAs will render as nothing (not an error, just invisible). ' +
    'Set it in .env.local for dev and in Vercel env vars for prod, full international format, digits only (e.g. "9715XXXXXXXX").'
  )
}

function buildLink(message: string): string {
  const text = encodeURIComponent(message)
  // wa.me works whether or not the visitor has WhatsApp installed (falls
  // back to WhatsApp Web), unlike the api.whatsapp.com/send variant.
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}

/**
 * The opt-in join link (brief C4). The customer's own "JOIN PepcoLab updates"
 * message is the consent; staff record it in the admin when it arrives.
 * Used on the order-confirmed page, in transactional-email opt-in blocks and
 * on the account page. Never used in ads.
 */
export function whatsAppJoinLink(): string {
  return buildLink('JOIN PepcoLab updates')
}

export function whatsAppGeneralLink(): string {
  return buildLink('Hi PepcoLab, I have a question.')
}

/**
 * Kept for the product page. The message is a question, not an order: it
 * does not name a strength, a price or a quantity.
 */
export function whatsAppProductLink(_productName: string, _variantTitle?: string): string {
  return buildLink('Hi PepcoLab, I have a question about a product’s documentation or delivery.')
}

/** Kept for the cart. Never lists items or a subtotal (brief C5). */
export function whatsAppCartLink(_lines: CartLine[], _currencyCode: string): string {
  return buildLink('Hi PepcoLab, I have a question before I check out on the website.')
}

/** Kept for the wishlist. Never lists items or prices (brief C5). */
export function whatsAppWishlistLink(_items: WishlistItem[]): string {
  return buildLink('Hi PepcoLab, I have a question about availability or documentation.')
}

// ChatWidget → WhatsApp handoff. Same "list + ask" pattern as the cart/
// wishlist links above: the visitor's own WhatsApp app opens with a
// condensed, pre-filled summary addressed to PepcoLab's number, so a human
// picks up the conversation with real context instead of starting cold.
// Kept short (WhatsApp's wa.me text param has practical length limits in
// some clients) — this is a handoff summary, not the full transcript; the
// full transcript goes to the team by email via /api/chat/transcript.
export function whatsAppChatHandoffLink(summary: string, contactName?: string): string {
  const greeting = contactName ? `Hi PepcoLab, I'm ${contactName}.` : 'Hi PepcoLab,'
  const message = `${greeting} I was chatting with your website assistant and would like to continue here.\n\n${summary}`
  return buildLink(message.slice(0, 900))
}

// Affiliate link → WhatsApp share. Deliberately NOT using buildLink() above
// — that always addresses PepcoLab's own number, which is right for
// "customer contacts us" CTAs but wrong here: an affiliate sharing their
// link needs to message THEIR audience, not us. Omitting the number from
// wa.me opens WhatsApp's own contact picker instead.
//
// Renamed from whatsAppReferralShareLink (Sep 2026) when the referral
// programme was retired. The wording is the affiliate's to send, so it
// stays plain and makes no claim about the compounds themselves.
export function whatsAppAffiliateShareLink(affiliateUrl: string, discountPercent: number): string {
  const message = `PepcoLab supply research-grade peptides with a published certificate of analysis for every batch. Here's ${discountPercent}% off with my link: ${affiliateUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}