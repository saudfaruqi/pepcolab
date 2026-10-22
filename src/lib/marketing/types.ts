// src/lib/marketing/types.ts
//
// Shared shapes for marketing campaigns. Kept free of server imports so the
// admin editor (a client component) can import them too.

export type AudienceSegment =
  | 'buyers'          // at least one paid order
  | 'non_buyers'      // reached checkout, never completed a payment
  | 'all_customers'   // everyone with any order record
  | 'lapsed_buyers'   // paid before, nothing paid in the last N days
  | 'bought_product'  // paid for a product whose title contains `productQuery`
  | 'newsletter'      // newsletter sign-ups (footer / homepage form)
  | 'leads'           // /learn guide requests who ticked the follow-up opt-in
  | 'all_opted_in'    // every contact with current email consent

export interface AudienceSpec {
  segment: AudienceSegment
  /** lapsed_buyers: days since their last paid order. */
  lapsedDays?: number
  /** bought_product: case-insensitive text matched against product titles. */
  productQuery?: string
  /** Addresses removed from THIS campaign only (on top of the global list). */
  excludeEmails?: string[]
}

export interface CampaignOffer {
  code: string
  percent: number
  /** ISO date the code stops working. Shown in the email. */
  expiresAt: string
}

export interface CampaignCta {
  label: string
  /** Path on pepcolab.com (e.g. /products) or a full https:// URL. */
  url: string
}

export type CampaignStatus = 'draft' | 'sending' | 'sent'

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  audience: AudienceSpec
  subject: string
  preheader: string
  /** Small uppercase pill above the heading, e.g. "For returning customers". */
  eyebrow: string
  heading: string
  /**
   * Body copy. Blank line = new paragraph; lines starting "- " = bullet list;
   * **bold**; [text](url). Merge fields: {{firstName}}, {{lastProduct}}.
   */
  body: string
  offer?: CampaignOffer | null
  cta: CampaignCta
  /** Optional smaller link under the button. */
  secondaryCta?: CampaignCta | null
  createdAt: string
  updatedAt: string
  sendStartedAt?: string
  sentAt?: string
  stats?: CampaignStats
}

export interface CampaignStats {
  recipients: number
  sent: number
  failed: number
  skippedUnsubscribed: number
  skippedRecentlyMailed: number
  skippedExcluded: number
}

export interface Recipient {
  email: string
  name: string
  firstName: string
  paidOrders: number
  totalSpent: number
  currency: string
  lastOrderAt: string | null
  lastPaidAt: string | null
  lastProduct: string
}

export interface RecipientResult {
  email: string
  status: 'sent' | 'failed' | 'skipped_unsubscribed' | 'skipped_recent' | 'skipped_excluded'
  detail?: string
  at: string
}

export const SEGMENT_LABELS: Record<AudienceSegment, string> = {
  buyers: 'Customers who have paid',
  non_buyers: 'Started checkout, never paid',
  all_customers: 'Everyone who has ordered or started checkout',
  lapsed_buyers: 'Paid before, nothing recently',
  bought_product: 'Bought a specific product',
  newsletter: 'Newsletter sign-ups',
  leads: 'Guide leads (opted in)',
  all_opted_in: 'Everyone opted in to email',
}
