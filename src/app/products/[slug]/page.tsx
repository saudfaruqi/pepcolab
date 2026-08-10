// src/app/products/[slug]/page.tsx

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductVariantView from '@/components/ProductVariantView'
import RelatedProducts from '@/components/RelatedProducts'

import { ChevronRight } from 'lucide-react'
import { getProducts, getProductByHandle } from '@/lib/shopify'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { slug: string }
}

// NOTE: if you upgrade to Next 15, `params` becomes a Promise and this
// signature changes to `{ params }: { params: Promise<{ slug: string }> }`
// with `const { slug } = await params`. On Next 14 the below is correct.

export async function generateStaticParams() {
  // Keep this cap in sync with sitemap.ts. If they drift, you get sitemap
  // entries with no pre-rendered page (or pages absent from the sitemap).
  const products = await getProducts(250)
  return products.map((product) => ({ slug: product.handle }))
}

/* -------------------------------------------------------------------------- */
/* METADATA                                                                    */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductByHandle(params.slug)

  if (!product) {
    return {
      title: 'Product not found',
      robots: { index: false, follow: false },
    }
  }

  const canonical = `/products/${product.handle}`

  // Factual and compound-focused. No effects, benefits, outcomes or
  // indications — the meta description is the most screenshotted surface
  // on the site and the easiest thing for a regulator to quote back.
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
    // a Google structured-data policy violation (manual action risk) and, in
    // the UK, a banned practice under the DMCC Act 2024. Add these only once
    // real verified-purchase reviews exist.
  }

  // Only emit offers if we actually have a price — an Offer with a null price
  // fails validation and can suppress the whole block.
  if (product.price != null) {
    productLd.offers = {
      '@type': 'Offer',
      url,
      // FIX: was hardcoded 'GBP' regardless of which market the page was
      // built/served for. Every AE-priced product was declaring GBP prices
      // in its structured data — a real mismatch for Google Merchant/rich
      // results, independent of the on-page display currency bug. Falls
      // back to GBP only if normaliseProduct() genuinely didn't set one.
      priceCurrency: product.currencyCode ?? 'GBP',
      price: String(product.price),
      availability:
        product.inStock === false
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
  const [shopifyProduct, allProducts] = await Promise.all([
    getProductByHandle(params.slug),
    getProducts(100),
  ])

  // Was: return <div>Product not found</div> — which sent HTTP 200 and let
  // Google index every bad URL as a thin duplicate page. notFound() renders
  // src/app/not-found.tsx and returns a real 404.
  if (!shopifyProduct) {
    notFound()
  }

  // `oneLiner` now lives on the merged product object (rather than being a
  // separate variable page.tsx rendered inline) because ProductVariantView
  // — the new client component that owns the image/strength sync — needs it
  // too, and it's simplest to compute it once here and pass one object down.
  const product = {
    ...shopifyProduct,
    id: shopifyProduct.shopifyId,
    slug: shopifyProduct.handle,
    name: shopifyProduct.title,
    shortName: shopifyProduct.title,
    category: shopifyProduct.tags?.[0] || '',
    categorySlug: shopifyProduct.tags?.[0]?.toLowerCase().replace(/\s+/g, '-') || '',
    badge: undefined as undefined,
    oneLiner: getOneLiner(shopifyProduct.description),
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

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#9ca3af' }}>
            <a href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</a>
            <ChevronRight size={12} />
            <a href="/products" style={{ color: '#9ca3af', textDecoration: 'none' }}>Products</a>
            <ChevronRight size={12} />
            <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{shopifyProduct.title}</span>
          </div>
        </div>

        {/*
          Image column + strength picker + price/CTA/tabs used to be laid
          out here directly, split across a server-rendered image block and
          the client-rendered <ProductActions>. Moved into one client
          component (ProductVariantView) because selecting a strength
          (Pen/Nasal Spray/Vial) needs to update the displayed image, and
          that requires shared state — which a server component can't hold.
        */}
        <ProductVariantView product={product} />

        {/*
          Recommended Products — RelatedProducts is a client component that
          re-fetches `allProducts` once the visitor's country resolves to
          something other than AE, the same pattern ProductActions already
          uses for the main price. It also owns its own "no related items"
          empty state, so the heading/"Browse all" link never renders over
          an empty grid if the GB-refetched product set doesn't have a match
          (see comment in RelatedProducts.tsx).
        */}
        <RelatedProducts
          initialProducts={allProducts}
          currentHandle={shopifyProduct.handle}
          currentTag={shopifyProduct.tags?.[0]}
        />

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

          .pp-image-col {
            width: 100%;
            min-width: 0;
          }

          /* Square image container — uses padding-top trick for reliable square on all devices */
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
            /* Small crossfade so swapping images on variant/thumbnail change
               doesn't pop jarringly — matched to the ~250ms range used
               elsewhere on the site (nav dropdowns, cards). */
            animation: pp-img-fade .25s ease;
          }

          @keyframes pp-img-fade {
            from { opacity: 0; }
            to   { opacity: 1; }
          }

          .pp-info-col {
            width: 100%;
            min-width: 0;
            /* Explicit auto height so this grid item never stretches to
               match the sticky image column's box and clip its own
               content (the root cause of the tab panel's internal
               scrollbar — see ProductActions.tsx). */
            height: auto;
          }

          .pp-trust-desktop { display: none; }

          .pp-trust-mobile {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-bottom: 4px;
          }

          .pp-related {
            background: #f7f7f5;
            padding: clamp(40px,6vw,72px) 0;
            margin-top: clamp(24px,4vw,40px);
          }

          .pp-related-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          @media (min-width: 768px) {
            .pp-related-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
          }
          @media (min-width: 1200px) {
            .pp-related-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
          }

          @media (min-width: 900px) {
            .pp-outer {
              grid-template-columns: 1fr 1fr;
              gap: 60px;
              align-items: start;
              padding: 28px 32px 100px;
            }

            .pp-image-col {
              position: sticky;
              top: 80px;
              align-self: start;
            }

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