// src/app/recovery/page.tsx
//
// RETIRED (Oct 2026). This was a health-goal hub ("Recovery research").
// The catalogue is now organised by compound class (lib/productClasses.ts),
// and goal-led landing pages are the implied-claim pattern the MHRA, the Abu
// Dhabi DoH and Meta's ad review all flag. Permanently redirected to the
// nearest compound class; next.config.js carries the same 301 so it applies
// before this page is ever rendered.
import { permanentRedirect } from 'next/navigation'

export default function RetiredRecoveryHub() {
  permanentRedirect('/products/category/bioregulator-peptides')
}
