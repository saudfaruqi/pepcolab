'use client'
import { X } from 'lucide-react'
import { useState } from 'react'

// MARKET FIX (Aug 2026): removed "Next day delivery available in the UK" —
// PepcoLab is UAE-only right now (see countryContext.tsx/middleware.ts),
// so this was an active false-advertising claim on every page, not just a
// stale one. The prior comment here already flagged the UK delivery timing
// itself as unconfirmed even under the old dual-market plan; moot now that
// there's no UK fulfilment to advertise at all. Also still doesn't include
// "GLP-2 (Tera) now in stock" — no such product exists in the catalogue.
const ITEMS = [
  '✦ Free shipping on all orders',
  '✦ Same-day dispatch on orders before 2 pm',
  '✦ Cold-chain verified packaging on every order',
  '✦ Freedom Diagnostics–verified COA for every batch',
  '✦ Research grade — ≥98% purity guaranteed',
  '✦ Free shipping on all orders',
  '✦ Same-day dispatch on orders before 2 pm',
  '✦ Cold-chain verified packaging on every order',
  '✦ Freedom Diagnostics–verified COA for every batch',
  '✦ Research grade — ≥98% purity guaranteed',
]

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="relative bg-[#0A0A0A] text-white py-[9px] overflow-hidden flex items-center">
      <div className="ticker-track flex items-center gap-0 whitespace-nowrap select-none">
        {ITEMS.map((item, i) => (
          <span key={i} className="inline-flex items-center text-[11.5px] font-light tracking-wide px-8" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {item}
          </span>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-80 transition-opacity"
        aria-label="Close announcement"
      >
        <X size={13} />
      </button>
    </div>
  )
}