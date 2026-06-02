import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Vial from '@/components/Vial'
import ProductActions from '@/components/ProductActions'

import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Download,
} from 'lucide-react'

import { getProducts, getProductByHandle } from '@/lib/shopify'

interface Props {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const products = await getProducts(100)

  return products.map((product) => ({
    slug: product.handle,
  }))
}

export default async function ProductPage({ params }: Props) {
  const shopifyProduct = await getProductByHandle(params.slug)

  if (!shopifyProduct) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
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
    categorySlug:
      shopifyProduct.tags?.[0]?.toLowerCase().replace(/\s+/g, '-') || '',
    badge: undefined,
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

  return (
    <>
      <Nav />

      <main
        style={{
          background: '#fff',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '24px 20px 80px',
          }}
        >
          {/* Breadcrumb */}

          <div
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              flexWrap: 'wrap',
              fontSize: 12,
              color: '#6b7280',
              marginBottom: 30,
            }}
          >
            <a href="/">Home</a>

            <ChevronRight size={12} />

            <a href="/products">Products</a>

            <ChevronRight size={12} />

            <span>{shopifyProduct.title}</span>
          </div>

          {/* Main Product Area */}

          <div className="product-layout">
            {/* LEFT */}

            <div>
              <div
                style={{
                  background:
                    'linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)',
                  borderRadius: 32,
                  minHeight: 520,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle,#2563eb25,transparent)',
                    filter: 'blur(40px)',
                  }}
                />

                <Vial
                  mg={shopifyProduct.mg || '5mg'}
                  size="xl"
                  fromColor="#2563eb"
                  toColor="#7c3aed"
                />

                {shopifyProduct.purity && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      background: '#fff',
                      padding: '14px 18px',
                      borderRadius: 16,
                      boxShadow:
                        '0 10px 30px rgba(0,0,0,.08)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280',
                        marginBottom: 4,
                      }}
                    >
                      Purity
                    </div>

                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                      }}
                    >
                      {shopifyProduct.purity}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}

            <div>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 18,
                }}
              >
                {shopifyProduct.tags?.[0] || 'Research Compound'}
              </div>

              <h1
                style={{
                  fontSize: 'clamp(34px,5vw,62px)',
                  lineHeight: 1,
                  marginBottom: 20,
                  fontWeight: 800,
                  letterSpacing: '-0.05em',
                }}
              >
                {shopifyProduct.title}
              </h1>

              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  marginBottom: 24,
                }}
              >
                £{shopifyProduct.price.toFixed(2)}
              </div>

              {/* Trust */}

              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  marginBottom: 30,
                }}
              >
                <TrustItem
                  icon={<ShieldCheck size={18} />}
                  text="Third-party verified purity testing"
                />

                <TrustItem
                  icon={<Truck size={18} />}
                  text="Temperature-controlled shipping"
                />

                <TrustItem
                  icon={<RotateCcw size={18} />}
                  text="Batch traceability & verification"
                />
              </div>

              <ProductActions product={product} />

              <section
                style={{
                  marginTop: 50,
                  background: '#fff',
                  borderRadius: 24,
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}

                <div
                  style={{
                    padding: '24px 28px',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <h2
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Product Overview
                  </h2>
                </div>

                <div
                  style={{
                    padding: '28px',
                    lineHeight: 1.9,
                    color: '#4b5563',
                    fontSize: 16,
                  }}
                >
                  {shopifyProduct.longDesc ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: shopifyProduct.longDesc,
                      }}
                    />
                  ) : (
                    <>
                      <p>
                        {shopifyProduct.description}
                      </p>

                      <p>
                        Manufactured to strict quality standards,
                        each batch is prepared to support
                        consistency and reliability across
                        research environments.
                      </p>

                      <p>
                        Suitable for academic institutions,
                        biotechnology organizations,
                        pharmaceutical research facilities,
                        and qualified laboratories.
                      </p>
                    </>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Specifications */}

          <section
            style={{
              marginTop: 80,
            }}
          >
            <h2
              style={{
                fontSize: 32,
                marginBottom: 30,
                fontWeight: 800,
              }}
            >
              Specifications
            </h2>

            <div className="spec-grid">
              <Spec
                label="Product"
                value={shopifyProduct.title}
              />

              <Spec
                label="Purity"
                value={
                  shopifyProduct.purity
                    ? `${shopifyProduct.purity}%`
                    : 'N/A'
                }
              />

              <Spec
                label="Lot Number"
                value={shopifyProduct.lot || 'N/A'}
              />

              <Spec
                label="Test Date"
                value={shopifyProduct.testDate || 'N/A'}
              />

              <Spec
                label="Stock"
                value={
                  shopifyProduct.inStock
                    ? 'In Stock'
                    : 'Out of Stock'
                }
              />

              <Spec
                label="Research Use"
                value="Laboratory Research Only"
              />
            </div>
          </section>
        </div>

        <style>{`
          .product-layout{
            display:grid;
            gap:50px;
          }

          .spec-grid{
            display:grid;
            gap:16px;
          }

          @media(min-width:1024px){
            .product-layout{
              grid-template-columns:1.1fr .9fr;
              align-items:start;
            }

            .spec-grid{
              grid-template-columns:repeat(3,1fr);
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  )
}

function TrustItem({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#374151',
      }}
    >
      {icon}
      <span>{text}</span>
    </div>
  )
}

function Spec({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e5e7eb',
        borderRadius: 18,
        padding: 22,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#6b7280',
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {value}
      </div>
    </div>
  )
}