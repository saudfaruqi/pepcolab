// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'



const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN  = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
         ?? process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
const API_URL = `https://${DOMAIN}/api/2024-04/graphql.json`


export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { query, variables, buyerCountry } = await req.json()

  const contextualQuery = buyerCountry
    ? query.replace(/^(\s*query\b)/, `$1 @inContext(country: ${buyerCountry})`)
    : query

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN!,
    },
    body: JSON.stringify({ query: contextualQuery, variables }),
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data)
}