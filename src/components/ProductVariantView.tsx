// src/components/ProductVariantView.tsx
'use client'

import { useMemo, useState } from 'react'
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import Vial from '@/components/Vial'
import ProductActions from '@/components/ProductActions'

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
            <img
              key={activeImageUrl}
              src={activeImageUrl}
              alt={activeImageAlt}
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
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `${product.title ?? product.name} view ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }}
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

        <ProductActions
          product={product}
          selectedVariantId={selectedVariantId}
          onSelectVariant={handleSelectVariant}
        />
      </div>
    </div>
  )
}