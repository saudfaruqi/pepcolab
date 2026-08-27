// src/components/MarketGuard.tsx
'use client'

/**
 * MARKET FIX (Aug 2026): PepcoLab is UAE-only for now, and pricing.ts's
 * UK_CATALOGUE_LIVE/isInMarket are now permanently AE-only (see that file).
 * There is only one market and one catalogue, so there is nothing left for
 * this component to guard — it previously showed a "not stocked for your
 * region" notice for a second (UK) catalogue that was never actually live.
 *
 * Kept as a pass-through (rather than deleted and every product-page call
 * site updated) so re-introducing a second market later is a one-file
 * change back in pricing.ts + here, not a hunt across every page that
 * wraps its buy area in <MarketGuard>.
 */
export default function MarketGuard({
  children,
}: {
  tags: string[]
  children: React.ReactNode
}) {
  return <>{children}</>
}