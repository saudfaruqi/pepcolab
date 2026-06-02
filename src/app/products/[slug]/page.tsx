import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Vial from '@/components/Vial'
import {
  ShoppingCart,
  Download,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
} from 'lucide-react'

import { getProductByHandle, getProducts } from '@/lib/shopify'
import ProductActions from '@/components/ProductActions'

interface Props {
  params: { slug: string }
}

/**
 * Build static routes from Shopify (not local data)
 */
export async function generateStaticParams() {
  const products = await getProducts(100)

  return products.map((p) => ({
    slug: p.handle,
  }))
}

export default async function ProductPage({ params }: Props) {
  const shopifyProduct = await getProductByHandle(params.slug)

  if (!shopifyProduct) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
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
    color: {
      bg: '#f5f5f5',
      accent: '#3b82f6',
      pill: '#e0e7ff',
      pillText: '#3b82f6',
      purityBar: '#8b5cf6',
      btn: '#3b82f6',
      vialFrom: '#3b82f6',
      vialTo: '#8b5cf6',
    },
  }

  return (
    <>
      <Nav />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 24, opacity: 0.6 }}>
          <a href="/">Home</a>
          <ChevronRight size={12} />
          <a href="/products">Products</a>
          <ChevronRight size={12} />
          <span style={{ color: '#000', opacity: 1 }}>{shopifyProduct.title}</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 56,
          }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                background: '#f5f5f5',
                borderRadius: 20,
                minHeight: 420,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Vial mg={shopifyProduct.mg} size="xl" fromColor="#3b82f6" toColor="#8b5cf6" />

              {shopifyProduct.purity && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'white',
                    padding: '10px 14px',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.5 }}>Purity</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>
                    {shopifyProduct.purity}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>
              {shopifyProduct.tags?.[0]}
            </div>

            <h1 style={{ fontSize: 42, margin: '10px 0', fontFamily: 'Georgia' }}>
              {shopifyProduct.title}
            </h1>

            <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.7 }}>
              {shopifyProduct.description}
            </p>

            {/* Shopify-powered actions */}
            <ProductActions product={product} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}