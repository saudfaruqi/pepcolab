import { NextRequest, NextResponse } from 'next/server'

const DOMAIN  = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN   = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
             ?? process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
const API_URL = `https://${DOMAIN}/api/2024-04/graphql.json`

export const dynamic = 'force-dynamic'

function injectInContext(query: string, country: string): string {
  if (!query.trimStart().startsWith('query')) return query  // skip mutations
  const braceIndex = query.indexOf('{')
  if (braceIndex === -1) return query
  return (
    query.slice(0, braceIndex).trimEnd() +
    ` @inContext(country: ${country}) ` +
    query.slice(braceIndex)
  )
}

export async function POST(req: NextRequest) {
  const { query, variables, buyerCountry } = await req.json()
  console.log('[api/products] buyerCountry:', buyerCountry)

  const contextualQuery = buyerCountry
    ? injectInContext(query, buyerCountry)
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