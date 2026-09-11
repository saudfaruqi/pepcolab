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
import CertificateIndex from '@/components/CertificateIndex'

export default async function CertificatesPage() {
  const country = (await cookies()).get('pepcolab_country')?.value ?? 'AE'

  let initialProducts: any[] = []
  try {
    initialProducts = await getProducts(250, country)
  } catch (err) {
    console.error('[certificates] Server-side product fetch failed:', err)
  }

  return (
    <>
      <CertificatesClient initialProducts={initialProducts} />
      {/* INDEXABILITY (Sep 2026): Google reported this page as "Crawled —
          currently not indexed", which is a value judgement rather than a
          crawl failure. Read as a crawler sees it, the page was a search box
          and a product grid: the certificate records themselves — lot
          numbers, accession numbers, measured purity, test dates — were never
          rendered. This puts them in the HTML as text, which is both what
          makes the page worth indexing and what matches the "kpv coa",
          "epithalon coa" and "ahk-cu coa" queries already showing in Search
          Console. */}
      <CertificateIndex />
    </>
  )
}