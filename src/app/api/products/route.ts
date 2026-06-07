// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const TOKEN  = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
         ?? process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
const API_URL = `https://${DOMAIN}/api/2024-04/graphql.json`

export async function POST(req: NextRequest) {
  const { query, variables, buyerCountry } = await req.json()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': TOKEN!,
  }

  // Safe to add here — this is a server-to-server request, no CORS preflight
  if (buyerCountry) {
    headers['Shopify-Storefront-Buyer-Country'] = buyerCountry
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  const data = await res.json()
  return NextResponse.json(data)
}