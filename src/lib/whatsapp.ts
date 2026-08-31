// src/lib/whatsapp.ts
//
// Central place for the WhatsApp ordering number + link building, so the
// floating button, product page, and cart/cart-drawer all stay in sync
// instead of each hardcoding their own wa.me URL.
//
// TODO: set NEXT_PUBLIC_WHATSAPP_NUMBER in your env (Vercel + .env.local),
// full international format, digits only, no leading "+" or "00"
// (e.g. UAE mobile => "9715XXXXXXXX", UK mobile => "447XXXXXXXXX").
// Until it's set, WhatsApp CTAs render disabled with a "coming soon" style
// instead of linking to a broken wa.me/undefined URL.
import type { CartLine } from '@/lib/cartContext'
import type { WishlistItem } from '@/lib/wishlistContext'

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

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

export function whatsAppGeneralLink(): string {
  return buildLink("Hi PepcoLab, I'd like to place an order.")
}

export function whatsAppProductLink(productName: string, variantTitle?: string): string {
  const strength = variantTitle ? ` (${variantTitle})` : ''
  return buildLink(`Hi PepcoLab, I'd like to order ${productName}${strength}.`)
}

export function whatsAppCartLink(lines: CartLine[], currencyCode: string): string {
  if (lines.length === 0) return whatsAppGeneralLink()

  const itemLines = lines
    .map((l) => `• ${l.title}${l.variantTitle ? ` (${l.variantTitle})` : ''} x${l.quantity}`)
    .join('\n')

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)

  const message =
    `Hi PepcoLab, I'd like to order:\n${itemLines}\n\n` +
    `Subtotal: ${currencyCode} ${subtotal.toFixed(2)}`

  return buildLink(message)
}

// Wishlist → WhatsApp: same "list + ask" pattern as whatsAppCartLink, kept
// as its own function (rather than reusing CartLine) because wishlist
// items aren't cart lines — no quantity, and the currency can vary per
// item since it's read straight from each product's own currencyCode
// rather than a single cart-wide one.
export function whatsAppWishlistLink(items: WishlistItem[]): string {
  if (items.length === 0) return whatsAppGeneralLink()

  const itemLines = items
    .map((i) => `• ${i.name}${i.mg ? ` (${i.mg})` : ''} — ${i.currencyCode ?? 'AED'} ${i.price.toFixed(2)}`)
    .join('\n')

  const message = `Hi PepcoLab, I'd like to ask about the items on my wishlist:\n${itemLines}`

  return buildLink(message)
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

// Referral program → WhatsApp share. Deliberately NOT using buildLink()
// above — that always addresses PepcoLab's own number, which is right for
// "customer contacts us" CTAs but wrong here: a referrer sharing their code
// needs to message THEIR friends, not us. Omitting the number from wa.me
// opens WhatsApp's own contact picker instead.
export function whatsAppReferralShareLink(referralUrl: string, discountPercent: number): string {
  const message = `Hey! I've been ordering research peptides from PepcoLab — here's ${discountPercent}% off your first order with my link: ${referralUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}