// app/certificates/page.tsx
//
// SEO FIX (Aug 2026 audit): converted from a client component that fetched
// its entire product/COA list inside a useEffect (see CertificatesClient.tsx
// for the full history) to a Server Component that fetches the catalogue
// up front — same pattern already used in app/products/page.tsx and
// app/products/category/[category]/page.tsx. This is what actually gets
// the published COA content into the first HTML response instead of an
// empty shell that only fills in after client JS runs.
//
// Metadata for this route still lives in certificates/layout.tsx (unchanged).

import { cookies } from 'next/headers'
import { getProducts } from '@/lib/shopify'
import CertificatesClient from './CertificatesClient'

export default async function CertificatesPage() {
  const country = (await cookies()).get('pepcolab_country')?.value ?? 'AE'

  let initialProducts: any[] = []
  try {
    initialProducts = await getProducts(250, country)
  } catch (err) {
    console.error('[certificates] Server-side product fetch failed:', err)
  }

  return <CertificatesClient initialProducts={initialProducts} />
}
