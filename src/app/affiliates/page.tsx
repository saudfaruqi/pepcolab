// src/app/affiliates/page.tsx
//
// The affiliate programme.
//
// WHY THIS PAGE EXISTS, beyond "competitors have one"
//
// In a market where almost nobody has social reach, the affiliates are the
// distribution. The September 2026 competitor audit found the largest
// verified audience anywhere in the UK or UAE field was 826 Telegram
// subscribers, and most competitor social accounts were dormant. Four of
// seven suppliers run an affiliate programme; that, not organic social, is
// how this category actually acquires customers.
//
// The terms below are read from lib/affiliateStore.ts rather than written
// into the copy, so the page can never disagree with what the system
// actually pays.

import type { Metadata } from 'next'
import AffiliateClient from './AffiliateClient'
import {
  AFFILIATE_COMMISSION_PERCENT,
  AFFILIATE_AUDIENCE_DISCOUNT_PERCENT,
  AFFILIATE_HOLD_DAYS,
  AFFILIATE_MIN_PAYOUT_AED,
} from '@/lib/affiliateStore'

const INK = '#0D0D0D'
const BORDER = 'rgba(13,13,13,.08)'
const SITE_ORIGIN = 'https://www.pepcolab.com'

export const metadata: Metadata = {
  title: 'Affiliate Programme — Earn on Every Order You Send',
  description: `Earn ${AFFILIATE_COMMISSION_PERCENT}% commission on every order placed with your code, and give your audience ${AFFILIATE_AUDIENCE_DISCOUNT_PERCENT}% off. Paid in cash, not credit. Research use only.`,
  alternates: { canonical: '/affiliates' },
  openGraph: {
    title: 'Affiliate Programme | PepcoLab',
    description: `Earn ${AFFILIATE_COMMISSION_PERCENT}% on every order placed with your code.`,
    type: 'website',
  },
}

export default function AffiliatesPage() {
  const terms: [string, string][] = [
    ['You earn', `${AFFILIATE_COMMISSION_PERCENT}% of the order subtotal, every order, for as long as the code is live`],
    ['They save', `${AFFILIATE_AUDIENCE_DISCOUNT_PERCENT}% off with your code`],
    ['Paid in', 'Money, not store credit'],
    ['Held for', `${AFFILIATE_HOLD_DAYS} days after the order, to cover refunds`],
    ['Minimum payout', `AED ${AFFILIATE_MIN_PAYOUT_AED}`],
    ['Cookie window', 'None — commission follows the code, not a browser'],
  ]

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(36px,6vw,72px) clamp(20px,5vw,48px)' }}>
      <h1 style={{ fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 800, letterSpacing: '-.035em', color: INK, margin: '0 0 16px' }}>
        Affiliate programme
      </h1>

      <p style={{ fontSize: 17, lineHeight: 1.75, color: 'rgba(13,13,13,.7)', maxWidth: 680, margin: '0 0 12px' }}>
        If you write, film or speak to people who buy research compounds, we
        will pay you {AFFILIATE_COMMISSION_PERCENT}% of every order placed with
        your code — in money, not store credit — and your audience gets{' '}
        {AFFILIATE_AUDIENCE_DISCOUNT_PERCENT}% off for using it.
      </p>

      <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(13,13,13,.55)', maxWidth: 680, margin: '0 0 36px' }}>
        This is separate from our customer referral offer. That one rewards
        people who buy from us for bringing a friend, and pays in discounts off
        their next order. This one is for people promoting us who may never
        order at all.
      </p>

      <section style={{ marginBottom: 48 }}>
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <caption style={{ captionSide: 'top', textAlign: 'left', padding: '16px 18px 6px', fontSize: 12.5, color: 'rgba(13,13,13,.5)' }}>
              The terms, in full
            </caption>
            <tbody>
              {terms.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row" style={{ padding: '13px 18px', fontSize: 12.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'rgba(13,13,13,.45)', borderBottom: `1px solid ${BORDER}`, textAlign: 'left', width: '38%', verticalAlign: 'top' }}>
                    {label}
                  </th>
                  <td style={{ padding: '13px 18px', fontSize: 14.5, color: INK, borderBottom: `1px solid ${BORDER}` }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'rgba(13,13,13,.5)', marginTop: 16, maxWidth: 700 }}>
          There is no tracking cookie, deliberately. Commission is attached to
          the discount code used at checkout, which means it works when someone
          hears your code on a podcast and buys three weeks later on a different
          device — and it means we are not dropping a tracker on your audience
          to pay you.
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: '0 0 14px' }}>
          What we ask
        </h2>
        <ul style={{ margin: 0, padding: '0 0 0 20px', maxWidth: 700 }}>
          {[
            'Everything we sell is for in-vitro research use only. Promote it that way. No dosing advice, no protocols, no before-and-afters, no claims about what any compound does in a person.',
            'Do not describe our products as safe, approved, or fit for human use. They are not, and saying so puts you at risk as much as us.',
            'Say that you earn a commission. Your audience is entitled to know, and in most places you are legally required to tell them.',
            'No paid search on our brand name, and no posting your code to coupon aggregators.',
          ].map(rule => (
            <li key={rule} style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(13,13,13,.7)', marginBottom: 10 }}>
              {rule}
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(13,13,13,.55)', marginTop: 14, maxWidth: 700 }}>
          Break the first two and we will close the account and withhold unpaid
          commission. We are not being precious — a compliance problem created
          in your content becomes ours the moment your code is attached to it.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-.03em', color: INK, margin: '0 0 20px' }}>
          Apply
        </h2>
        <AffiliateClient siteOrigin={SITE_ORIGIN} />
      </section>
    </main>
  )
}