// src/lib/marketingGate.ts
//
// MARKETING EMAIL GATE (Oct 2026 clean-up brief, part B).
//
// One rule for the UK and UAE: marketing goes only to contacts whose LATEST
// email consent event is "granted" (an explicit opt-in recorded with
// evidence — lib/crm/store.ts), who are not on the suppression list, and who
// have had fewer than 2 marketing emails in the last 7 days (brief B8).
// There is no soft opt-in for past customers.
//
// Every marketing send asks marketingBlockFor(email) first and calls
// recordMarketingSend(email) after it sends:
//   - Marketing tab campaigns (lib/marketing/send.ts)
//   - cross-sell and win-back (cron: customer-care)
//   - reorder reminders (cron: reorder-reminder)
//   - abandoned-cart reminders (cron: abandoned-cart)
//   - the /learn follow-up series (cron: lead-nurture)
//
// Service messages — order confirmation, dispatch, the "did it arrive?"
// check-in, payment-failed notices, the guide a visitor asked for — are not
// marketing and are not gated or counted.
//
// MARKETING_SENDS_PAUSED is the emergency stop: set it to true to halt every
// marketing send in one deploy, whatever consent says.
export { marketingBlockFor, recordMarketingSend, MAX_MARKETING_PER_WEEK } from '@/lib/crm/cadence'

export const MARKETING_SENDS_PAUSED = false

export const MARKETING_PAUSED_REASON =
  'Marketing emails are paused (MARKETING_SENDS_PAUSED in lib/marketingGate.ts). Only service emails are being sent.'
