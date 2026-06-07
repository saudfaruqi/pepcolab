// app/api/country/route.ts
import { shopifyFetch } from '@/lib/shopify'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Vercel sets this header automatically in production
  const vercelCountry = req.headers.get('x-vercel-ip-country')
  
  if (vercelCountry) {
    return NextResponse.json({ country: vercelCountry })
  }

  // Fallback: ask Shopify what country it detects for this IP
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