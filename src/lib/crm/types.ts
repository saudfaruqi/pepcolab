// src/lib/crm/types.ts
//
// CRM shapes (Oct 2026 clean-up brief, part B). Client-safe: no server
// imports, so admin client components can use these types and labels.

export type Market = 'UAE' | 'UK'
export type Channel = 'email' | 'whatsapp'
export type ConsentAction = 'granted' | 'withdrawn'

export const CONTACT_SOURCES = [
  'shopify_order',
  'strabl_link',
  'newsletter',
  'whatsapp_inbound',
  'email_inbox',
  'checkout',
  'account',
  'learn_form',
] as const
export type ContactSource = (typeof CONTACT_SOURCES)[number]

export const CAPTURE_POINTS = [
  'checkout',
  'footer_form',
  'account_page',
  'post_purchase',
  'transactional_email',
  'whatsapp_join',
  'whatsapp_stop',
  'email_unsubscribe',
  'admin_on_request',
  'learn_form',
] as const
export type CapturePoint = (typeof CAPTURE_POINTS)[number]

export interface Contact {
  id: string
  email?: string
  phoneE164?: string
  firstName?: string
  lastName?: string
  market: Market
  source: ContactSource
  shopifyCustomerId?: string
  firstOrderAt?: string
  lastOrderAt?: string
  orderCount: number
  lifetimeValueAed: number
  researchAttestedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ConsentEvidence {
  ip?: string
  userAgent?: string
  pageUrl?: string
  waMessageText?: string
  staffUser?: string
  orderShortCode?: string
  note?: string
}

export interface ConsentEvent {
  id: string
  contactId: string
  channel: Channel
  action: ConsentAction
  /** e.g. 'email-v1', 'whatsapp-v1', 'footer-legacy'. */
  wordingVersion: string
  capturePoint: CapturePoint
  evidence: ConsentEvidence
  occurredAt: string
}

export interface CurrentConsent {
  channel: Channel
  action: ConsentAction
  wordingVersion: string
  capturePoint: CapturePoint
  occurredAt: string
}

export type InteractionKind = 'service' | 'marketing'
export interface Interaction {
  id: string
  contactId: string
  channel: Channel | 'phone'
  direction: 'inbound' | 'outbound'
  kind: InteractionKind
  summary: string
  staffUser: string
  occurredAt: string
}

export type AdminRole = 'owner' | 'admin' | 'agent'

/** Consent wording, verbatim (brief B4). Shown next to each box and stored by version. */
export const CONSENT_WORDING: Record<string, string> = {
  'email-v1':
    'Email me PepcoLab research updates: new batches, certificate releases and restock notices. I can unsubscribe at any time.',
  'whatsapp-v1':
    'Message me on WhatsApp about my orders and PepcoLab research updates, no more than once a week. I can reply STOP at any time.',
  'footer-legacy': 'Research updates, new compounds & batch COA alerts. (Footer newsletter form before Oct 2026.)',
}

export const EMAIL_WORDING_VERSION = 'email-v1'
export const WHATSAPP_WORDING_VERSION = 'whatsapp-v1'

export const SOURCE_LABELS: Record<ContactSource, string> = {
  shopify_order: 'Order (cart)',
  strabl_link: 'Payment link',
  newsletter: 'Newsletter',
  whatsapp_inbound: 'WhatsApp inbound',
  email_inbox: 'Email inbox',
  checkout: 'Checkout',
  account: 'Account',
  learn_form: 'Free guide',
}

export const CAPTURE_LABELS: Record<CapturePoint, string> = {
  checkout: 'Checkout',
  footer_form: 'Footer form',
  account_page: 'Account page',
  post_purchase: 'Order confirmed page',
  transactional_email: 'Order email link',
  whatsapp_join: 'WhatsApp JOIN',
  whatsapp_stop: 'WhatsApp STOP',
  email_unsubscribe: 'Email unsubscribe',
  admin_on_request: 'Admin, on request',
  learn_form: 'Free guide form',
}
