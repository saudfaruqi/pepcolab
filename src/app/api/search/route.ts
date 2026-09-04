// src/app/api/search/route.ts
//
// Site-wide search. Products come from Shopify; certificates, guides and
// research are compiled in, so only the product fetch can fail — and a
// failure there degrades to searching the static content rather than
// returning nothing.
import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify'
import { searchAll } from '@/lib/searchIndex'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ query: q, results: [] })

  let products: Awaited<ReturnType<typeof getProducts>> = []
  try {
    products = await getProducts(250)
  } catch (err) {
    // Partial results beat an error page: someone searching a lot number
    // doesn't need Shopify to be up.
    console.error('[search] Product fetch failed, searching static content only:', err)
  }

  return NextResponse.json({ query: q, results: searchAll(q, products) })
}