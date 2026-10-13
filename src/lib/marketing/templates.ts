// src/lib/marketing/templates.ts
//
// Starting points for "New campaign" in /admin/marketing. Each is a complete,
// sendable draft: pick one, create its discount code, send a test, send.
//
// COPY RULES (apply to anything written in the editor too):
//  - Supply-side only: testing, purity, packing, delivery, service. Never
//    what a compound does in or to a body, never dosing or "results".
//  - No links to the certificate / verify pages (Mohammed, Oct 2026).
//  - No GLP promotion: it is excluded from codes and sold by payment link.
import type { Campaign } from './types'

export type CampaignTemplate = Omit<Campaign, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'offer'> & {
  key: string
  description: string
  /** Suggested code settings; the code itself is created from the editor. */
  suggestedOffer?: { codePrefix: string; percent: number; days: number }
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    key: 'buyers-thank-you',
    description: 'Customers who have paid: a thank-you, why they can rely on us, and a code for their next order.',
    name: 'Buyers: thank you + 10%',
    audience: { segment: 'buyers' },
    subject: 'A thank-you from Pepco Lab: 10% off your next order',
    preheader: 'Independently tested, cold-chain packed, and 10% off for the next 7 days.',
    eyebrow: 'For our customers',
    heading: 'Thank you, {{firstName}}.',
    body: `You ordered from us early on, and that matters to a lab our size. So here's what you can count on every time you order:

- **Independent testing on every lot.** Identity and purity are checked by a third-party laboratory, not taken from the manufacturer's own paperwork.
- **Packed cold, dispatched fast.** Orders leave within one business day, packed for cold-chain delivery across the UAE.
- **A real team behind the inbox.** Reply to this email and a person answers.

As a thank-you, here's 10% off your next order. It's yours for the next seven days.`,
    cta: { label: 'Shop the catalogue', url: '/products' },
    secondaryCta: null,
    suggestedOffer: { codePrefix: 'THANKS', percent: 10, days: 7 },
  },
  {
    key: 'non-buyers-finish',
    description: 'People who reached checkout but never paid: reassurance, help with checkout, and a code.',
    name: 'Didn’t finish checkout: 10%',
    audience: { segment: 'non_buyers' },
    subject: 'Still deciding? Here’s 10% off this week',
    preheader: 'Independently tested, secure card checkout, and 10% off for seven days.',
    eyebrow: 'Before you order',
    heading: 'Still deciding, {{firstName}}?',
    body: `You started an order with us recently but didn't finish. That's fine. In this market, taking a moment to check a supplier is the right instinct, so here's what you'd be getting:

- **Independent testing on every lot.** Identity and purity are checked by a third-party laboratory, not taken from the manufacturer's own paperwork.
- **Secure card checkout.** Payment is handled by our payment provider's secure page. We never see your card details.
- **Packed cold, dispatched within one business day** across the UAE.

If something went wrong at checkout, just reply to this email and we'll sort it out with you.

And when you're ready, here's 10% off for the next seven days.`,
    cta: { label: 'Return to the shop', url: '/products' },
    secondaryCta: null,
    suggestedOffer: { codePrefix: 'WELCOME', percent: 10, days: 7 },
  },
  {
    key: 'lapsed-reorder',
    description: 'Paid before, nothing in 45+ days: a reorder nudge built around their last product.',
    name: 'Lapsed buyers: time to restock',
    audience: { segment: 'lapsed_buyers', lapsedDays: 45 },
    subject: 'Time to restock, {{firstName}}?',
    preheader: 'Fresh lots in stock, packed cold and dispatched within one business day.',
    eyebrow: 'Restock',
    heading: 'Running low, {{firstName}}?',
    body: `It's been a while since your last order ({{lastProduct}}). Fresh lots are in stock now, independently tested and packed cold for dispatch within one business day.

Reorder in a couple of taps from your account, or browse what's new in the catalogue.`,
    cta: { label: 'Reorder now', url: '/account' },
    secondaryCta: { label: 'browse the catalogue', url: '/products' },
  },
  {
    key: 'blank',
    description: 'Start from scratch.',
    name: 'New campaign',
    audience: { segment: 'buyers' },
    subject: '',
    preheader: '',
    eyebrow: '',
    heading: 'Hello, {{firstName}}.',
    body: '',
    cta: { label: 'Visit the shop', url: '/products' },
    secondaryCta: null,
  },
]
