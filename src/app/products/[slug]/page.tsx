// src/app/products/[slug]/page.tsx

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductVariantView from '@/components/ProductVariantView'

import { ChevronRight } from 'lucide-react'
import { getProducts, getProductByHandle } from '@/lib/shopify'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { slug: string }
}

/**
 * CURRENCY & MARKET
 * -----------------
 * Built with AED prices. ProductActions re-fetches with the visitor's country
 * once useCountry() resolves and normaliseProduct() converts at that point, so
 * the page stays statically rendered — no cookie read on the server.
 *
 * Market gating is client-side for the same reason. While UK_CATALOGUE_LIVE is
 * false (pricing.ts) every product is sold in both markets and MarketGuard is
 * inert. Once it's true, a visitor who lands on a product from the other
 * catalogue gets a notice instead of a buy button.
 *
 * Deliberately NOT a server-side cookie read + notFound(): that would make
 * every product page dynamic, and it would 404 the page for Googlebot, which
 * crawls from US IPs with no market cookie. See isInMarket() in pricing.ts.
 */
export const revalidate = 60

export async function generateStaticParams() {
  // No country argument -> unfiltered, so BOTH catalogues get enumerated.
  // Keep this cap in sync with sitemap.ts.
  const products = await getProducts(250)
  return products.map((product) => ({ slug: product.handle }))
}

/* -------------------------------------------------------------------------- */
/* METADATA                                                                    */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Generated without a market so Googlebot always gets a full, indexable
  // page regardless of which catalogue the product belongs to.
  const product = await getProductByHandle(params.slug)

  if (!product) {
    return { title: 'Product not found', robots: { index: false, follow: false } }
  }

  const canonical = `/products/${product.handle}`

  // Factual and compound-focused. No effects, benefits, outcomes or
  // indications — the meta description is the most screenshotted surface on
  // the site and the easiest thing for a regulator to quote back.
  const description =
    `${product.title} — research-grade compound with published certificate of analysis` +
    (product.purity ? `, ${product.purity}% HPLC-verified purity` : '') +
    (product.lot ? `, batch ${product.lot}` : '') +
    '. Cold-chain dispatch. For in-vitro research use only.'

  const ogImage = product.images?.[0]?.url

  return {
    title: `${product.title} | Research Grade, COA Published`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${product.title} | PepcoLab`,
      description,
      url: `${SITE_URL}${canonical}`,
      type: 'website',
      images: ogImage ? [{ url: ogImage, alt: product.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | PepcoLab`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

/** ProductVariantView renders `product.oneLiner`, so it's derived here. */
function getOneLiner(description?: string): string {
  if (!description) return ''
  const sentences = description.split(/(?<=[.!?])\s+/)
  for (const s of sentences) {
    const clean = s.trim()
    if (clean.length < 40) continue
    if (clean.includes(' – ') || clean.includes(' - ')) continue
    return clean.endsWith('.') || clean.endsWith('!') || clean.endsWith('?') ? clean : clean + '.'
  }
  return description.slice(0, 120).trim() + '…'
}

function buildJsonLd(product: any) {
  const url = `${SITE_URL}/products/${product.handle}`

  const productLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    sku: product.lot ?? product.handle,
    url,
    image: product.images?.map((i: any) => i.url).filter(Boolean) ?? [],
    brand: { '@type': 'Brand', name: 'PepcoLab' },
    // Deliberately NO aggregateRating / review. Marking up invented reviews is
    // a Google structured-data policy violation and, in the UK, a banned
    // practice under the DMCC Act 2024.
  }

  // Structured data always advertises the CHARGED currency (AED), never the
  // GBP display conversion — Google surfaces this price in search results and
  // it has to match what the customer is actually billed.
  if (product.price != null) {
    productLd.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: product.currencyCode ?? 'AED',
      price: String(product.price),
      availability: product.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'PepcoLab' },
    }
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: product.title, item: url },
    ],
  }

  return [productLd, breadcrumbLd]
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                        */
/* -------------------------------------------------------------------------- */

export default async function ProductPage({ params }: Props) {
  // Built in AED. ProductActions swaps in the visitor's currency client-side.
  const shopifyProduct = await getProductByHandle(params.slug, 'AE')

  // Real 404 (renders src/app/not-found.tsx) rather than a 200 with a
  // "not found" message, which Google indexes as a thin duplicate page.
  if (!shopifyProduct) {
    notFound()
  }

  // ProductVariantView owns the whole two-column layout and passes
  // selectedVariantId / onSelectVariant down to ProductActions, so the format
  // picker can drive the main image. It reads `oneLiner` off the product, so
  // that gets derived here on the server.
  const product = {
    ...shopifyProduct,
    id: shopifyProduct.shopifyId,
    slug: shopifyProduct.handle,
    name: shopifyProduct.title,
    shortName: shopifyProduct.title,
    oneLiner: getOneLiner(shopifyProduct.description),
    category: shopifyProduct.tags?.[0] || '',
    categorySlug: shopifyProduct.tags?.[0]?.toLowerCase().replace(/\s+/g, '-') || '',
    badge: undefined as undefined,
    color: {
      bg: '#f5f7fb', accent: '#2563eb', pill: '#dbeafe', pillText: '#1d4ed8',
      purityBar: '#2563eb', btn: '#2563eb', vialFrom: '#2563eb', vialTo: '#7c3aed',
    },
  }

  const jsonLd = buildJsonLd(shopifyProduct)


  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <Nav />

      <main style={{ background: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* Breadcrumb */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#9ca3af' }}>
            <a href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</a>
            <ChevronRight size={12} />
            <a href="/products" style={{ color: '#9ca3af', textDecoration: 'none' }}>Products</a>
            <ChevronRight size={12} />
            <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {shopifyProduct.title}
            </span>
          </div>
        </div>



        <ProductVariantView product={product} />

        {/* Layout classes used by ProductVariantView live here so the grid
            stays with the route rather than being duplicated per component. */}
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          .pp-outer {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px 16px 80px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .pp-image-col { width: 100%; min-width: 0; }

          /* Square image container — padding-top trick for a reliable square
             on all devices. */
          .pp-image-box {
            position: relative;
            width: 100%;
            padding-top: 100%;
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid #f0f0f0;
            background: #fafafa;
          }

          .pp-main-img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 20px;
          }

          .pp-info-col { width: 100%; min-width: 0; }

          .pp-trust-desktop { display: none; }

          .pp-trust-mobile {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-bottom: 4px;
          }

          @media (min-width: 900px) {
            .pp-outer {
              grid-template-columns: 1fr 1fr;
              gap: 60px;
              align-items: start;
              padding: 28px 32px 100px;
            }

            .pp-image-col { position: sticky; top: 80px; }

            .pp-trust-desktop {
              display: flex;
              flex-direction: column;
              gap: 11px;
              margin-top: 22px;
            }

            .pp-trust-mobile { display: none; }
          }

          /* Shopify HTML description */
          .shopify-desc { font-size: 13px; line-height: 1.85; color: #626A85; }
          .shopify-desc p { margin-bottom: 1em; }
          .shopify-desc strong { font-weight: 700; color: #0D0F14; }
          .shopify-desc h2 { font-size: 14px; font-weight: 700; color: #0D0F14; margin: 1.2em 0 0.4em; }
          .shopify-desc h3 { font-size: 13px; font-weight: 700; color: #0D0F14; margin: 1em 0 0.4em; }
          .shopify-desc ul, .shopify-desc ol { padding-left: 1.3em; margin-bottom: 1em; }
          .shopify-desc li { margin-bottom: 0.3em; }
          .shopify-desc table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px; border: 1px solid #E5EAF5; border-radius: 10px; overflow: hidden; }
          .shopify-desc th { text-align: left; padding: 9px 12px; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #AAB3C8; background: #F8F9FC; border-bottom: 1px solid #E5EAF5; }
          .shopify-desc td { padding: 9px 12px; color: #626A85; border-bottom: 1px solid #F3F5FB; vertical-align: top; line-height: 1.6; }
          .shopify-desc td:first-child { font-weight: 600; color: #0D0F14; width: 36%; }
          .shopify-desc tr:last-child td { border-bottom: none; }
        `}</style>
      </main>

      <Footer />
    </>
  )
}