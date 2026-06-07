// shopify.ts

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

// shopify.ts — update shopifyFetch signature and body
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




// shopify.ts — add this mutation + update createCart

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

export function normaliseProduct(node: ShopifyProduct) {
  const variant = node.variants.edges[0]?.node
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

    mg: variant?.title ?? '5mg',
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    tags,

    category: tags[0] ?? '',
    categorySlug: tags[0]
      ? tags[0].toLowerCase().replace(/\s+/g, '-')
      : '',
    badge: tags.includes('popular') ? 'popular' : undefined,

    variantId: variant?.id ?? '',
    price: parseFloat(variant?.price.amount ?? '0'),
    // Expose the currency code returned by the Storefront API for this variant
    currencyCode: variant?.price.currencyCode ?? 'AED',
    oldPrice: variant?.compareAtPrice
      ? parseFloat(variant.compareAtPrice.amount)
      : undefined,

    inStock: variant?.availableForSale ?? false,
    stockCount: variant?.quantityAvailable ?? 0,

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

// shopify.ts — update getProducts to use the proxy when called client-side
export async function getProducts(first = 40, buyerCountry?: string) {
  if (typeof window === 'undefined') {
    // Server: fetch without country (used only for generateStaticParams)
    const data = await shopifyFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(
      PRODUCTS_QUERY,
      { first },
      { revalidate: 60, serverSide: true }
    )
    return data.products.edges.map(({ node }) => normaliseProduct(node))
  }

  // Client: always go through proxy with country
  const { shopifyClientFetch } = await import('./shopifyClient')
  const data = await shopifyClientFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(
    PRODUCTS_QUERY,
    { first },
    buyerCountry
  )
  return data.products.edges.map(({ node }) => normaliseProduct(node))
}

// Extract the query string to reuse in both paths
const PRODUCTS_QUERY = /* GraphQL */ `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id handle title description tags
          variants(first: 1) {
            edges {
              node {
                id title
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                availableForSale
              }
            }
          }
          images(first: 1) {
            edges { node { url altText } }
          }
          metafields(identifiers: [
            { namespace: "pepcolab", key: "purity" }
            { namespace: "pepcolab", key: "lot" }
            { namespace: "pepcolab", key: "test_date" }
          ]) { key value }
        }
      }
    }
  }
`

// shopify.ts — getProductByHandle, remove @inContext from the query string
export async function getProductByHandle(handle: string, buyerCountry = 'AE') {
  const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
    /* GraphQL */ `
      query getProduct($handle: String!) {
        product(handle: $handle) {
          id handle title description descriptionHtml tags
          variants(first: 10) {
            edges {
              node {
                id title
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                availableForSale
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
          ]) { key value }
        }
      }
    `,
    { handle },
    { revalidate: 60, buyerCountry }  // country goes in the header, not the query
  )
  return data.product ? normaliseProduct(data.product) : null
}