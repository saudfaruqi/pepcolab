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