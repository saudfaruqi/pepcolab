import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Vial from '@/components/Vial'
import ProductActions from '@/components/ProductActions'

import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react'

import { getProducts, getProductByHandle } from '@/lib/shopify'

interface Props {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const products = await getProducts(100)
  return products.map((product) => ({ slug: product.handle }))
}

export default async function ProductPage({ params }: Props) {
  const shopifyProduct = await getProductByHandle(params.slug)

  if (!shopifyProduct) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        Product not found
      </div>
    )
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
      bg: '#f5f7fb',
      accent: '#2563eb',
      pill: '#dbeafe',
      pillText: '#1d4ed8',
      purityBar: '#2563eb',
      btn: '#2563eb',
      vialFrom: '#2563eb',
      vialTo: '#7c3aed',
    },
  }

  // All images from Shopify for the gallery
  const images = shopifyProduct.images ?? []

  return (
    <>
      <Nav />

      <main style={{ background: '#fafafa', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px 100px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#9ca3af', marginBottom: 36 }}>
            <a href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</a>
            <ChevronRight size={12} />
            <a href="/products" style={{ color: '#9ca3af', textDecoration: 'none' }}>Products</a>
            <ChevronRight size={12} />
            <span style={{ color: '#374151' }}>{shopifyProduct.title}</span>
          </div>

          {/* Main layout */}
          <div className="product-layout">

            {/* ── LEFT: Image panel ── */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div
                style={{
                  borderRadius: 28,
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  background: images.length > 0 ? '#fff' : 'linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)',
                  minHeight: 480,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {images.length > 0 ? (
                  // Show Shopify product image
                  <img
                    src={images[0].url}
                    alt={images[0].alt || shopifyProduct.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      minHeight: 480,
                    }}
                  />
                ) : (
                  // Fallback: vial illustration
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,#2563eb20,transparent)',
                        filter: 'blur(50px)',
                      }}
                    />
                    <Vial
                      mg={shopifyProduct.mg || '5mg'}
                      size="xl"
                      fromColor="#2563eb"
                      toColor="#7c3aed"
                    />
                  </>
                )}

                {/* Purity badge overlay */}
                {shopifyProduct.purity && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      background: 'rgba(255,255,255,.95)',
                      backdropFilter: 'blur(8px)',
                      padding: '12px 16px',
                      borderRadius: 14,
                      boxShadow: '0 8px 24px rgba(0,0,0,.10)',
                      border: '1px solid rgba(255,255,255,.8)',
                    }}
                  >
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>
                      Purity
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0d0d0d', lineHeight: 1 }}>
                      {shopifyProduct.purity}%
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail row — only if multiple images */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  {images.slice(0, 5).map((img, i) => (
                    <div
                      key={i}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: i === 0 ? '2px solid #2563eb' : '1px solid #e5e7eb',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || shopifyProduct.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Product info ── */}
            <div>
              {/* Category tag */}
              <div
                style={{
                  display: 'inline-flex',
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                {shopifyProduct.tags?.[0] || 'Research Compound'}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: 'clamp(34px,5vw,58px)',
                  lineHeight: 1,
                  marginBottom: 8,
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                  color: '#0d0d0d',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {shopifyProduct.title}
              </h1>

              {/* Lot / batch */}
              {shopifyProduct.lot && (
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20, fontWeight: 500 }}>
                  Batch {shopifyProduct.lot}
                  {shopifyProduct.testDate && ` · Tested ${shopifyProduct.testDate}`}
                </div>
              )}

              {/* Short description */}
              {shopifyProduct.descriptionHtml ? (
                <div>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6b7280', marginBottom: 24, maxWidth: 480 }}>
                    {shopifyProduct.description?.split('.')[0]?.trim()}.
                  </p>
                </div>
              ) : null}
              

              {/* Trust pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                <TrustPill icon={<ShieldCheck size={13} />} text="HPLC Verified" />
                <TrustPill icon={<Truck size={13} />} text="Cold-Chain Shipping" />
                <TrustPill icon={<RotateCcw size={13} />} text="Batch Traceable" />
              </div>

              {/* Shopify cart actions + tabs */}
              <ProductActions product={product} />
            </div>
          </div>

          {/* ── Specifications ── */}
          <section style={{ marginTop: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-.03em' }}>
                Specifications
              </h2>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <div className="spec-grid">
              <Spec label="Product" value={shopifyProduct.title} />
              <Spec label="Amount" value={shopifyProduct.mg || '5mg'} />
              <Spec label="Purity" value={shopifyProduct.purity ? `${shopifyProduct.purity}%` : 'N/A'} />
              <Spec label="Lot Number" value={shopifyProduct.lot || 'N/A'} />
              <Spec label="Test Date" value={shopifyProduct.testDate || 'N/A'} />
              <Spec label="Availability" value={shopifyProduct.inStock ? 'In Stock' : 'Out of Stock'} />
              <Spec label="Grade" value="Research Use Only" />
              <Spec label="Dispatch" value="Same-day if ordered before 3pm" />
              <Spec label="Shipping" value="Cold-chain, temperature controlled" />
            </div>
          </section>
        </div>

        <style>{`
          .product-layout {
            display: grid;
            gap: 50px;
          }

          .spec-grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(2, 1fr);
          }

          @media (min-width: 1024px) {
            .product-layout {
              grid-template-columns: 1fr 1fr;
              align-items: start;
            }

            .spec-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  )
}

function TrustPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 999,
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
      }}
    >
      {icon}
      {text}
    </div>
  )
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#374151' }}>
      {icon}
      <span style={{ fontSize: 14 }}>{text}</span>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '18px 20px',
      }}
    >
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
        {value}
      </div>
    </div>
  )
}