// app/api/country/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { shopifyFetch } from '@/lib/shopify'

export const dynamic = 'force-dynamic'  // ← add this

export async function GET(req: NextRequest) {
  const vercelCountry = req.headers.get('x-vercel-ip-country')
  if (vercelCountry) {
    return NextResponse.json({ country: vercelCountry })
  }
  try {
    const data = await shopifyFetch<{
      localization: { country: { isoCode: string } }
    }>(
      `query { localization { country { isoCode } } }`,
      {},
      { revalidate: 0 }
    )
    return NextResponse.json({ country: data.localization.country.isoCode })
  } catch {
    return NextResponse.json({ country: 'AE' })
  }
}