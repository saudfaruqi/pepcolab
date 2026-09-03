// src/components/ProductVariantView.tsx
'use client'

import { trackViewItem } from '@/lib/analytics'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import Vial from '@/components/Vial'
import ProductActions from '@/components/ProductActions'
import MarketGuard from '@/components/MarketGuard'
import WishlistButton from '@/components/WishlistButton'
import ShareButton from '@/components/ShareButton'
import { useRecordRecentlyViewed } from '@/lib/recentlyViewedContext'

interface Props {
  // Loosely typed to match the rest of the codebase's pragmatic handling of
  // the merged shopifyProduct + display-fields object built in page.tsx —
  // see the `product` variable there.
  product: any
}

/**
 * Owns the image column + info column together, because they need to share
 * state: selecting a strength (Pen / Nasal Spray / Vial) in ProductActions
 * has to update the big image above it. That wasn't possible before because
 * the image lived in the server-rendered page.tsx while the variant picker
 * lived inside ProductActions — two separate places with no way to talk to
 * each other. This component is the shared client boundary between them.
 */
export default function ProductVariantView({ product }: Props) {
  const images: { url: string; alt: string }[] = product.images ?? []

  // ANALYTICS: view_item. Keyed on the handle so navigating between products
  // in a single session reports each one, while re-renders from variant or
  // thumbnail selection on the same product do not fire duplicates.
  useEffect(() => {
    if (!product?.handle) return
    trackViewItem({
      item_id: product.handle,
      item_name: product.title,
      item_category: (product.tags ?? []).find((t: string) => !['uae', 'uk'].includes(t.toLowerCase())),
      price: Number(product.price) || 0,
      quantity: 1,
    })
  }, [product?.handle, product?.title, product?.price, product?.tags])

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variantId ?? product.variants?.[0]?.id ?? ''
  )

  // Manual thumbnail clicks temporarily override the variant-driven image.
  // Selecting a different strength in ProductActions clears this override
  // so the image goes back to following the variant — otherwise picking a
  // thumbnail once would "stick" and silently stop the sync the strength
  // picker is supposed to provide.
  const [manualImageUrl, setManualImageUrl] = useState<string | null>(null)

  const selectedVariant = useMemo(
    () => product.variants?.find((v: any) => v.id === selectedVariantId),
    [product.variants, selectedVariantId]
  )

  const activeImageUrl: string | undefined =
    manualImageUrl ?? selectedVariant?.image?.url ?? images[0]?.url

  const activeImageAlt: string =
    (manualImageUrl && images.find((i) => i.url === manualImageUrl)?.alt) ||
    selectedVariant?.image?.alt ||
    images[0]?.alt ||
    `${product.title ?? product.name} research vial`

  // Records this page in the Recently Viewed rail (see
  // lib/recentlyViewedContext.tsx). Keyed off product.slug/handle so a
  // repeat visit moves it back to the front instead of duplicating it.
  useRecordRecentlyViewed({
    slug: product.slug ?? product.handle,
    name: product.title ?? product.name,
    mg: product.mg,
    price: selectedVariant?.price ?? product.price,
    oldPrice: product.oldPrice,
    currencyCode: (product as any).currencyCode ?? selectedVariant?.currencyCode,
    image: activeImageUrl,
    imageAlt: activeImageAlt,
    category: product.category,
  })

  function handleSelectVariant(variantId: string) {
    setSelectedVariantId(variantId)
    setManualImageUrl(null) // resume following the variant's own image
  }

  return (
    <div className="pp-outer">

      {/* IMAGE COLUMN */}
      <div className="pp-image-col">

        {/* Square image box */}
        <div className="pp-image-box">
          {activeImageUrl ? (
            // SEO/CWV FIX: this is the largest above-the-fold image on
            // every product page, so it's very likely the LCP element —
            // `priority` skips lazy-loading and gets it into the initial
            // preload scan instead of waiting on hydration. `.pp-image-box`
            // (page.tsx) is already the position:relative/aspect-ratio box
            // `fill` needs; `.pp-main-img` already has the absolute-fill +
            // object-fit rules next/image's fill mode expects, so the
            // className carries over unchanged.
            <Image
              key={activeImageUrl}
              src={activeImageUrl}
              alt={activeImageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
              className="pp-main-img"
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
              <div style={{
                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle,#2563eb18,transparent)', filter: 'blur(40px)',
              }} />
              <Vial mg={product.mg || '5mg'} size="xl" fromColor="#2563eb" toColor="#7c3aed" />
            </div>
          )}

          {product.purity && (
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
                {product.purity}%
              </div>
            </div>
          )}
        </div>

        {/* Thumbnails — clicking one is a manual override; selecting a
            strength in ProductActions below clears it again. */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
            {images.slice(0, 6).map((img, i) => {
              const isActive = img.url === activeImageUrl
              return (
                <button
                  key={i}
                  onClick={() => setManualImageUrl(img.url)}
                  aria-label={`View image ${i + 1}`}
                  style={{
                    width: 56, height: 56, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
                    border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    background: '#fafafa', padding: 0, cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${product.title ?? product.name} view ${i + 1}`}
                    fill
                    sizes="56px"
                    style={{ objectFit: 'contain', padding: 3 }}
                  />
                </button>
              )
            })}
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
          {product.tags?.[0] || 'Research Compound'}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 48px)',
            lineHeight: 1.08,
            marginBottom: 6,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#0d0d0d',
            wordBreak: 'break-word',
          }}>
            {product.title ?? product.name}
          </h1>

          {/* Wishlist + Share — kept as a pair next to the title (rather
              than down in the CTA row) so they read as "about this page",
              not as competing with Add to Cart / WhatsApp for attention. */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
            <WishlistButton
              variant="icon"
              item={{
                slug: product.slug ?? product.handle,
                name: product.title ?? product.name,
                mg: product.mg,
                price: selectedVariant?.price ?? product.price,
                oldPrice: product.oldPrice,
                currencyCode: (product as any).currencyCode ?? selectedVariant?.currencyCode,
                image: activeImageUrl,
                imageAlt: activeImageAlt,
                category: product.category,
                purity: product.purity,
                inStock: selectedVariant?.availableForSale ?? product.inStock,
                variantId: selectedVariantId,
              }}
            />
            <ShareButton
              title={`${product.title ?? product.name} — PepcoLab`}
              text={product.oneLiner || product.description}
            />
          </div>
        </div>

        {(product.lot || product.testDate) && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14, fontWeight: 500 }}>
            {product.lot && `Batch ${product.lot}`}
            {product.lot && product.testDate && ' · '}
            {product.testDate && `Tested ${product.testDate}`}
          </div>
        )}

        {product.oneLiner && (
          <p style={{ fontSize: 14, lineHeight: 1.75, color: '#6b7280', marginBottom: 18 }}>
            {product.oneLiner}
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

        {/* MarketGuard is a real guard again (Sep 2026): UAE visitors get the
            buy controls, UK visitors get a launch-list capture in their place
            while the rest of the page — description, COA, purity, schema —
            stays fully visible and indexable.

            productSlug/productName are passed so UK interest is recorded per
            compound rather than as one undifferentiated list. That turns the
            pre-launch period into demand data: the admin notify view will show
            which compounds UK researchers actually asked for, which is the
            input you want when placing a UK opening order. */}
        <MarketGuard
          tags={product.tags ?? []}
          productSlug={product.handle}
          productName={product.title}
        >
          <ProductActions
            product={product}
            selectedVariantId={selectedVariantId}
            onSelectVariant={handleSelectVariant}
          />
        </MarketGuard>
      </div>
    </div>
  )
}