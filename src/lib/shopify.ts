// src/lib/shopify.ts
import { convertFromAed, convertOptional, currencyFor, marketQuery } from './pricing'

const DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN

// Private token is server-only – never exposed to the browser bundle
const PRIVATE_TOKEN =
  typeof window === 'undefined'
    ? process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN
    : null

const API_VERSION = '2024-04'
const API_URL = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`

// ─── Core fetch ────────────────────────────────────────────────────────────

export async function shopifyFetch<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {},
  {
    serverSide = false,
    revalidate,
    buyerCountry,
  }: { serverSide?: boolean; revalidate?: number; buyerCountry?: string } = {}
): Promise<T> {
  const token = serverSide && PRIVATE_TOKEN ? PRIVATE_TOKEN : PUBLIC_TOKEN
  if (!token) throw new Error('Shopify access token is not configured')

  const contextualQuery = buyerCountry
    ? injectInContext(query, buyerCountry)
    : query

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query: contextualQuery, variables }),
    ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' }),
  })

  if (!res.ok) throw new Error(`Shopify API HTTP ${res.status}: ${res.statusText}`)
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL Error: ${json.errors.map((e: { message: string }) => e.message).join(', ')}`)
  }
  return json.data as T
}

/**
 * Injects @inContext(country: XX) after the query signature.
 * Handles: query Foo, query Foo($var: Type!), anonymous query, multiline.
 * Strategy: find the FIRST "{" that opens the operation body and insert before it.
 */
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

// ─── Currency / Localization ───────────────────────────────────────────────

export interface ShopifyLocalization {
  country: {
    isoCode: string
    currency: {
      isoCode: string
      symbol: string
    }
  }
}

/**
 * Detect the buyer's currency via Shopify's localization API.
 * Falls back to "AED" if the request fails or returns nothing.
 */
export async function getLocalization(buyerCountry?: string): Promise<ShopifyLocalization> {
  try {
    const data = await shopifyFetch<{ localization: ShopifyLocalization }>(
      /* GraphQL */ `
        query getLocalization {
          localization {
            country {
              isoCode
              currency {
                isoCode
                symbol
              }
            }
          }
        }
      `,
      {},
      { buyerCountry, revalidate: 3600 }
    )
    return data.localization
  } catch {
    return {
      country: {
        isoCode: 'AE',
        currency: { isoCode: 'AED', symbol: 'AED' },
      },
    }
  }
}

// Re-exported so route files import market helpers from one place.
export { isInMarket, UK_CATALOGUE_LIVE } from './pricing'
export { marketQuery }

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ShopifyMoneyV2 {
  amount: string
  currencyCode: string
}

export interface ShopifyProductVariant {
  id: string
  title: string
  price: ShopifyMoneyV2
  compareAtPrice: ShopifyMoneyV2 | null
  availableForSale: boolean
  // Per-variant image (e.g. Pen / Nasal Spray / Vial each ship a different
  // photo) — wasn't being fetched at all before, so the strength picker on
  // the product page had no way to swap the displayed image to match
  // whichever format the visitor selected. Falls back to null when a
  // variant has no image of its own; normaliseProduct/ProductVariantView
  // fall back to the product's main image in that case.
  image: ShopifyImage | null
  // Not fetched: quantityAvailable requires the
  // unauthenticated_read_product_inventory Storefront API scope, which this
  // token doesn't have. In/out of stock is derived from availableForSale
  // instead — that's all the storefront actually needs.
  quantityAvailable?: number
}

export interface ShopifyImage {
  url: string
  altText: string | null
}

export interface ShopifyMetafield {
  key: string
  value: string
}

export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml?: string
  tags: string[]
  productType: string
  variants: { edges: { node: ShopifyProductVariant }[] }
  images: { edges: { node: ShopifyImage }[] }
  metafields: (ShopifyMetafield | null)[]
}

export interface ShopifyCartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    price: ShopifyMoneyV2
    image?: { url: string }
    product: {
      title: string
      handle: string
    }
  }
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    totalAmount: ShopifyMoneyV2
    subtotalAmount: ShopifyMoneyV2
  }
  lines: { edges: { node: ShopifyCartLine }[] }
}

// ─── Cart mutations ────────────────────────────────────────────────────────

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount { amount currencyCode }
      subtotalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              image { url }
              product { title handle }
            }
          }
        }
      }
    }
  }
`

export async function updateCartBuyerIdentity(
  cartId: string,
  countryCode: string
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: { cart: ShopifyCart; userErrors: { message: string }[] }
  }>(
    /* GraphQL */ `
      ${CART_FIELDS}
      mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
        cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `,
    { cartId, buyerIdentity: { countryCode } }
  )
  if (data.cartBuyerIdentityUpdate.userErrors.length) {
    throw new Error(data.cartBuyerIdentityUpdate.userErrors[0].message)
  }
  return data.cartBuyerIdentityUpdate.cart
}

// Update createCart to accept country at creation time
export async function createCart(countryCode = 'AE'): Promise<string> {
  const data = await shopifyFetch<{
    cartCreate: { cart: { id: string }; userErrors: { message: string }[] }
  }>(
    /* GraphQL */ `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { id }
          userErrors { field message }
        }
      }
    `,
    { input: { buyerIdentity: { countryCode } } }
  )
  if (data.cartCreate.userErrors.length) {
    throw new Error(data.cartCreate.userErrors[0].message)
  }
  return data.cartCreate.cart.id
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity = 1
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesAdd: { cart: ShopifyCart; userErrors: { message: string }[] }
  }>(
    /* GraphQL */ `
      ${CART_FIELDS}
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] }
  )

  if (data.cartLinesAdd.userErrors.length) {
    throw new Error(data.cartLinesAdd.userErrors[0].message)
  }

  return data.cartLinesAdd.cart
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: ShopifyCart; userErrors: { message: string }[] }
  }>(
    /* GraphQL */ `
      ${CART_FIELDS}
      mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `,
    { cartId, lineIds }
  )

  if (data.cartLinesRemove.userErrors.length) {
    throw new Error(data.cartLinesRemove.userErrors[0].message)
  }

  return data.cartLinesRemove.cart
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: ShopifyCart; userErrors: { message: string }[] }
  }>(
    /* GraphQL */ `
      ${CART_FIELDS}
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { field message }
        }
      }
    `,
    { cartId, lines: [{ id: lineId, quantity }] }
  )

  if (data.cartLinesUpdate.userErrors.length) {
    throw new Error(data.cartLinesUpdate.userErrors[0].message)
  }

  return data.cartLinesUpdate.cart
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const data = await shopifyFetch<{ cart: ShopifyCart | null }>(
      /* GraphQL */ `
        ${CART_FIELDS}
        query getCart($cartId: ID!) {
          cart(id: $cartId) { ...CartFields }
        }
      `,
      { cartId }
    )
    return data.cart
  } catch {
    return null
  }
}

export async function getCartCheckoutUrl(cartId: string): Promise<string> {
  const data = await shopifyFetch<{ cart: { checkoutUrl: string } | null }>(
    /* GraphQL */ `
      query getCartCheckoutUrl($cartId: ID!) {
        cart(id: $cartId) { checkoutUrl }
      }
    `,
    { cartId }
  )

  if (!data.cart) throw new Error('Cart not found')
  return data.cart.checkoutUrl
}

// ─── Product queries ───────────────────────────────────────────────────────

/**
 * Picks which variant a product card/detail view should represent.
 * Fixes the old behaviour of always using edges[0], which meant a product
 * could show "Out of stock" or the wrong price just because its FIRST
 * variant (e.g. lowest mg) happened to be unavailable while others weren't.
 *
 * Strategy: prefer the cheapest AVAILABLE variant. If none are available,
 * fall back to the cheapest variant overall (still shown, but inStock:false).
 */
function pickRepresentativeVariant(
  edges: { node: ShopifyProductVariant }[]
): ShopifyProductVariant | undefined {
  const variants = edges.map((e) => e.node)
  if (variants.length === 0) return undefined

  const available = variants.filter((v) => v.availableForSale)
  const pool = available.length > 0 ? available : variants

  return pool.reduce((cheapest, v) =>
    parseFloat(v.price.amount) < parseFloat(cheapest.price.amount) ? v : cheapest
  )
}

/**
 * `market` converts AED (the only currency Shopify can return on this store —
 * the gateway is single-currency) into the visitor's display currency. This is
 * one of only TWO conversion points in the app; the other is applyCart() in
 * cartContext.tsx. Everything downstream keeps calling
 * formatPrice(amount, currencyCode) and needs no change. Do not convert again
 * in a component or the rate gets applied twice.
 *
 * Omitting `market` leaves prices in AED untouched, which is what
 * generateStaticParams and sitemap.ts want.
 */
export function normaliseProduct(node: ShopifyProduct, market?: string) {
  const variant = pickRepresentativeVariant(node.variants.edges)
  const anyVariantAvailable = node.variants.edges.some((e) => e.node.availableForSale)
  const image = node.images.edges[0]?.node

  const meta = Object.fromEntries(
    (node.metafields ?? [])
      .filter(Boolean)
      .map((m) => [m!.key, m!.value])
  )

  const tags = node.tags ?? []

  return {
    shopifyId: node.id,
    id: node.id,
    handle: node.handle,
    slug: node.handle,
    title: node.title,
    name: node.title,
    shortName: node.title,
    // Real per-product freshness signal for sitemap.ts — previously the
    // sitemap stamped every product with `new Date()` on every hourly
    // regeneration, which tells Google "everything changed" every hour and
    // gets discounted as a freshness signal rather than trusted.
    updatedAt: (node as any).updatedAt as string | undefined,

    mg: variant?.title ?? '5mg',
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    tags,

    category: tags[0] ?? '',
    categorySlug: tags[0]
      ? tags[0].toLowerCase().replace(/\s+/g, '-')
      : '',
    badge: tags.includes('popular') ? 'popular' : undefined,

    // Format (Pen / Vial / Powder / Supply) — comes from Shopify's
    // productType field, separate from the body-system category tags
    // above. Not previously fetched at all, so "vials/pens" had no data
    // source anywhere in the app.
    format: node.productType ?? '',
    formatSlug: node.productType
      ? node.productType.toLowerCase().replace(/\s+/g, '-')
      : '',

    variantId: variant?.id ?? '',
    price: convertFromAed(parseFloat(variant?.price.amount ?? '0'), market),
    // The display currency, NOT what Shopify returned — Shopify always says
    // AED here. formatPrice() renders whatever code it's given, so setting it
    // correctly at this one point switches every price on the site.
    currencyCode: currencyFor(market),
    oldPrice: convertOptional(
      variant?.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : undefined,
      market
    ),

    // A product is in stock if ANY variant is available, not just the
    // one we're displaying — the displayed variant/price is just the
    // cheapest available option.
    inStock: anyVariantAvailable,
    // Not available on the public storefront token (see ShopifyProductVariant
    // above) — kept as a field for compatibility, always 0 for now.
    stockCount: 0,
    variantCount: node.variants.edges.length,

    // Full variant list so the UI can offer a strength/dose picker instead
    // of being stuck with whichever single variant got auto-selected above.
    // `image` is the new field — each variant (Pen/Nasal Spray/Vial etc.)
    // can carry its own photo now that the query below fetches it.
    variants: node.variants.edges.map(({ node: v }) => ({
      id: v.id,
      title: v.title,
      price: convertFromAed(parseFloat(v.price.amount), market),
      compareAtPrice: convertOptional(
        v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : undefined,
        market
      ),
      currencyCode: currencyFor(market),
      availableForSale: v.availableForSale,
      image: v.image ? { url: v.image.url, alt: v.image.altText ?? '' } : undefined,
    })),

    images: node.images.edges.map(({ node }) => ({
      url: node.url,
      alt: node.altText ?? '',
    })),

    image: node.images.edges[0]?.node?.url,
    imageAlt: node.images.edges[0]?.node?.altText ?? node.title,

    purity: meta['purity'] ? parseFloat(meta['purity']) : undefined,
    lot: meta['lot'] ?? undefined,
    testDate: meta['test_date'] ?? undefined,
    sequence: meta['sequence'] ?? undefined,
    longDesc: meta['long_desc'] ?? undefined,
    // Direct link to this batch's published Certificate of Analysis (PDF),
    // set as a "pepcolab.coa_url" metafield per product in Shopify. Falls
    // back to undefined when a product hasn't had one attached yet — the
    // UI falls back to the searchable /certificates library in that case.
    coaUrl: meta['coa_url'] ?? undefined,

    color: {
      bg: '#f0f4ff',
      accent: '#1A56DB',
      pill: '#e0e7ff',
      pillText: '#3b82f6',
      purityBar: '#8b5cf6',
      btn: '#1A56DB',
      vialFrom: '#3b82f6',
      vialTo: '#8b5cf6',
    },
  }
}

// shopify.ts — server branch now passes buyerCountry through instead of
// silently dropping it. Previously only the client branch (via the proxy)
// applied @inContext(country: ...) pricing — a Server Component calling
// getProducts(40, 'AE') got GB/default pricing regardless, which is why the
// homepage couldn't be safely server-rendered with correct prices without
// this fix landing first. generateStaticParams-style callers that don't
// care about country still work identically (buyerCountry stays undefined).
export async function getProducts(first = 40, buyerCountry?: string) {
  // buyerCountry does two things: picks the display currency (always), and
  // picks the catalogue (only once UK_CATALOGUE_LIVE is true in pricing.ts —
  // until then marketQuery returns undefined and every market sees everything).
  //
  // Callers with no country — sitemap.ts and generateStaticParams — get the
  // unfiltered catalogue in AED, which is what they need: one URL per product,
  // every product pre-rendered and indexable regardless of market.
  const query = marketQuery(buyerCountry)

  if (typeof window === 'undefined') {
    const data = await shopifyFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(
      PRODUCTS_QUERY,
      { first, query },
      { revalidate: 60, serverSide: true, buyerCountry }
    )
    return data.products.edges.map(({ node }) => normaliseProduct(node, buyerCountry))
  }

  // Client: always go through proxy with country
  const { shopifyClientFetch } = await import('./shopifyClient')
  const data = await shopifyClientFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(
    PRODUCTS_QUERY,
    { first, query },
    buyerCountry
  )
  return data.products.edges.map(({ node }) => normaliseProduct(node, buyerCountry))
}

// Extract the query string to reuse in both paths
// NOTE: variants(first: 1) → variants(first: 10). Most PepcoLab products
// have 2-7 variants (different mg strengths); fetching only the first
// meant stock/price were checked against a single, arbitrary variant.
const PRODUCTS_QUERY = /* GraphQL */ `
  query getProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id handle title description tags updatedAt productType
          variants(first: 10) {
            edges {
              node {
                id title
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                availableForSale
                image { url altText }
              }
            }
          }
          images(first: 2) {
            edges { node { url altText } }
          }
          metafields(identifiers: [
            { namespace: "pepcolab", key: "purity" }
            { namespace: "pepcolab", key: "lot" }
            { namespace: "pepcolab", key: "test_date" }
            { namespace: "pepcolab", key: "coa_url" }
          ]) { key value }
        }
      }
    }
  }
`

// shopify.ts — getProductByHandle, remove @inContext from the query string
const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id handle title description descriptionHtml tags updatedAt productType
      variants(first: 10) {
        edges {
          node {
            id title
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            availableForSale
            image { url altText }
          }
        }
      }
      images(first: 6) {
        edges { node { url altText } }
      }
      metafields(identifiers: [
        { namespace: "pepcolab", key: "purity" }
        { namespace: "pepcolab", key: "lot" }
        { namespace: "pepcolab", key: "test_date" }
        { namespace: "pepcolab", key: "sequence" }
        { namespace: "pepcolab", key: "long_desc" }
        { namespace: "pepcolab", key: "coa_url" }
      ]) { key value }
    }
  }
`

// ─── Reorder support ────────────────────────────────────────────────────
// Resolves a list of bare numeric Shopify variant IDs (as saved on
// OrderRecord.products by the STRABL webhook route) back to their current
// price, stock, and parent product slug — used by /track-order's "Reorder"
// action so it adds the *current* price/availability to cart rather than
// silently reusing a stale price from months ago. Uses Shopify's standard
// `nodes(ids: [...])` batch lookup so this is one request regardless of
// how many line items the order had.
//
// NOTE: built following the exact same shopifyFetch/shopifyClientFetch
// pattern as getProducts/getProductByHandle above, but hasn't been
// exercised against a live store — worth a manual test against a real
// order once deployed (a variant that's been deleted/renamed since the
// order was placed should just be silently omitted from the result, not
// throw).
const VARIANTS_BY_ID_QUERY = /* GraphQL */ `
  query getVariantsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        availableForSale
        price { amount currencyCode }
        image { url altText }
        product { id handle title }
      }
    }
  }
`

export interface ReorderVariant {
  variantId: string
  slug: string
  title: string
  variantTitle: string
  price: number
  image?: string
  availableForSale: boolean
}

export async function getVariantsByIds(
  numericIds: string[],
  buyerCountry?: string
): Promise<ReorderVariant[]> {
  const ids = numericIds
    .filter(Boolean)
    .map((id) => `gid://shopify/ProductVariant/${id}`)
  if (ids.length === 0) return []

  const run = async () => {
    if (typeof window === 'undefined') {
      return shopifyFetch<{ nodes: (any | null)[] }>(
        VARIANTS_BY_ID_QUERY,
        { ids },
        { serverSide: true, buyerCountry }
      )
    }
    const { shopifyClientFetch } = await import('./shopifyClient')
    return shopifyClientFetch<{ nodes: (any | null)[] }>(
      VARIANTS_BY_ID_QUERY,
      { ids },
      buyerCountry
    )
  }

  const data = await run()

  return data.nodes
    .filter((n): n is NonNullable<typeof n> => Boolean(n?.product))
    .map((n) => ({
      variantId: n.id.match(/(\d+)$/)?.[0] ?? n.id,
      slug: n.product.handle,
      title: n.product.title,
      variantTitle: n.title === 'Default Title' ? '' : n.title,
      price: convertFromAed(parseFloat(n.price?.amount ?? '0'), buyerCountry),
      image: n.image?.url,
      availableForSale: Boolean(n.availableForSale),
    }))
}

export async function getProductByHandle(handle: string, buyerCountry = 'AE') {
  if (typeof window === 'undefined') {
    // Server: used at build time via generateStaticParams/generateMetadata,
    // always AE — matches getProducts' server branch.
    const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle },
      { revalidate: 60, serverSide: true, buyerCountry }
    )
    return data.product ? normaliseProduct(data.product, buyerCountry) : null
  }

  // Client: was calling shopifyFetch directly, which hits Shopify's GraphQL
  // API straight from the browser instead of going through /api/products —
  // unlike getProducts, which already proxies. That's why the product
  // detail page kept showing AE/AED pricing for GB visitors while every
  // other page (which uses getProducts) correctly switched to GBP: this
  // direct client call was failing silently and falling back to the
  // build-time AE data. Route through the same proxy getProducts uses.
  const { shopifyClientFetch } = await import('./shopifyClient')
  const data = await shopifyClientFetch<{ product: ShopifyProduct | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle },
    buyerCountry
  )
  return data.product ? normaliseProduct(data.product, buyerCountry) : null
}