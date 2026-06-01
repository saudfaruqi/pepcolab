'use client'

const ITEMS = [
  '🧪 HPLC Verified ≥98% Purity',
  '🇬🇧 UK-Based Laboratory',
  '📋 Eurofins Certified',
  '❄️ Cold-Chain Dispatch',
  '🔬 Mass-Spec Confirmed',
  '📦 Same-Day Shipping',
  '✅ COA on Every Batch',
  '🏥 Licensed Pharmacists',
  '🧪 HPLC Verified ≥98% Purity',
  '🇬🇧 UK-Based Laboratory',
  '📋 Eurofins Certified',
  '❄️ Cold-Chain Dispatch',
  '🔬 Mass-Spec Confirmed',
  '📦 Same-Day Shipping',
  '✅ COA on Every Batch',
  '🏥 Licensed Pharmacists',
]

export default function TrustBar() {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--blue-light)] overflow-hidden py-3.5">
      <div className="flex ticker-track whitespace-nowrap">
        {ITEMS.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-7 text-[12.5px] font-semibold text-[var(--blue-dark)]">
            {item}
            <span className="text-[var(--blue-mid)] text-[10px]">●</span>
          </span>
        ))}
      </div>
    </div>
  )
}