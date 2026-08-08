// src/app/products/[slug]/page.tsx
//
// CHANGES FROM YOUR VERSION:
//   1. Added generateMetadata()   — per-product title/description/canonical/OG
//   2. Replaced the soft-404      — notFound() instead of a 200 with "not found"
//   3. getProducts(100) → 250     — must match the cap in sitemap.ts
//   4. Added Product JSON-LD      — price/availability rich results
//   5. Added BreadcrumbList JSON-LD — you already render breadcrumbs visually
//   6. Added alt text fallback on thumbnails (was alt="")
// Everything else (layout, styles, components) is unchanged.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Vial from '@/components/Vial'
import ProductActions from '@/components/ProductActions'

import { ChevronRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
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
      priceCurrency: 'GBP',
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
  const shopifyProduct = await getProductByHandle(params.slug)

  // Was: return <div>Product not found</div> — which sent HTTP 200 and let
  // Google index every bad URL as a thin duplicate page. notFound() renders
  // src/app/not-found.tsx and returns a real 404.
  if (!shopifyProduct) {
    notFound()
  }

  const product = {
    ...shopifyProduct,
    id: shopifyProduct.shopifyId,
    slug: shopifyProduct.handle,
    name: shopifyProduct.title,
    shortName: shopifyProduct.title,
    category: shopifyProduct.tags?.[0] || '',
    categorySlug: shopifyProduct.tags?.[0]?.toLowerCase().replace(/\s+/g, '-') || '',
    badge: undefined as undefined,
    color: {
      bg: '#f5f7fb', accent: '#2563eb', pill: '#dbeafe', pillText: '#1d4ed8',
      purityBar: '#2563eb', btn: '#2563eb', vialFrom: '#2563eb', vialTo: '#7c3aed',
    },
  }

  const images = shopifyProduct.images ?? []
  const oneLiner = getOneLiner(shopifyProduct.description)
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

        <div className="pp-outer">

          {/* IMAGE COLUMN */}
          <div className="pp-image-col">

            {/* Square image box */}
            <div className="pp-image-box">
              {images.length > 0 ? (
                <img
                  src={images[0].url}
                  alt={images[0].alt || `${shopifyProduct.title} research vial`}
                  className="pp-main-img"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                    background: 'radial-gradient(circle,#2563eb18,transparent)', filter: 'blur(40px)',
                  }} />
                  <Vial mg={shopifyProduct.mg || '5mg'} size="xl" fromColor="#2563eb" toColor="#7c3aed" />
                </div>
              )}

              {shopifyProduct.purity && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)',
                  padding: '8px 12px', borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(0,0,0,.08)', border: '1px solid #f0f0f0',
                }}>
                  <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 1 }}>
                    Purity
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0d0d0d', lineHeight: 1 }}>
                    {shopifyProduct.purity}%
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
                {images.slice(0, 6).map((img, i) => (
                  <div key={i} style={{
                    width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
                    border: i === 0 ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    background: '#fafafa',
                  }}>
                    <img
                      src={img.url}
                      alt={img.alt || `${shopifyProduct.title} view ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Trust — desktop only */}
            <div className="pp-trust-desktop">
              {[
                { icon: <ShieldCheck size={14} />, text: 'HPLC-verified purity testing' },
                { icon: <Truck size={14} />, text: 'Cold-chain temperature-controlled' },
                { icon: <RotateCcw size={14} />, text: 'Full batch traceability & COA' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#6b7280' }}>
                  <span style={{ color: '#2563eb', flexShrink: 0 }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* INFO COLUMN */}
          <div className="pp-info-col">

            <div style={{
              display: 'inline-flex', padding: '4px 11px', borderRadius: 999,
              background: '#eff6ff', color: '#2563eb',
              fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              {shopifyProduct.tags?.[0] || 'Research Compound'}
            </div>

            <h1 style={{
              fontSize: 'clamp(24px, 5vw, 48px)',
              lineHeight: 1.08,
              marginBottom: 6,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#0d0d0d',
              wordBreak: 'break-word',
            }}>
              {shopifyProduct.title}
            </h1>

            {(shopifyProduct.lot || shopifyProduct.testDate) && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14, fontWeight: 500 }}>
                {shopifyProduct.lot && `Batch ${shopifyProduct.lot}`}
                {shopifyProduct.lot && shopifyProduct.testDate && ' · '}
                {shopifyProduct.testDate && `Tested ${shopifyProduct.testDate}`}
              </div>
            )}

            {oneLiner && (
              <p style={{ fontSize: 14, lineHeight: 1.75, color: '#6b7280', marginBottom: 18 }}>
                {oneLiner}
              </p>
            )}

            {/* Trust pills — mobile */}
            <div className="pp-trust-mobile">
              {[
                { icon: <ShieldCheck size={11} />, text: 'HPLC Verified' },
                { icon: <Truck size={11} />, text: 'Cold-Chain' },
                { icon: <RotateCcw size={11} />, text: 'COA Included' },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: 999,
                  background: '#f9fafb', border: '1px solid #e5e7eb',
                  fontSize: 11, fontWeight: 600, color: '#374151',
                }}>
                  {icon}{text}
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: '#f0f0f0', margin: '18px 0' }} />

            <ProductActions product={product} />
          </div>
        </div>

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
          }

          .pp-info-col {
            width: 100%;
            min-width: 0;
          }

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

            .pp-image-col {
              position: sticky;
              top: 80px;
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