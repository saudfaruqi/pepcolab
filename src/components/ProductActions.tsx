// src/components/ProductActions.tsx
'use client'
import { useState, useMemo, useEffect } from 'react'
import { ShoppingCart, Download, CheckCircle } from 'lucide-react'
import { useCart } from '@/lib/cartContext'
import { useCountry } from '@/lib/countryContext'
import { getProductByHandle } from '@/lib/shopify'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/app/data'

interface Props {
  product: Product
  // Controlled from ProductVariantView.tsx, which also owns the main
  // product image — lifted up so selecting a strength here can update the
  // displayed image there. Previously this component managed
  // selectedVariantId entirely on its own, which is why the image never
  // changed when you picked Pen / Nasal Spray / Vial: nothing outside this
  // component could see that the selection had changed.
  selectedVariantId: string
  onSelectVariant: (variantId: string) => void
}

const TABS = ['Overview', 'Technical Specs', 'Storage', 'Disclaimer']

export default function ProductActions({ product: initialProduct, selectedVariantId, onSelectVariant }: Props) {
  const [added,     setAdded]     = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const { addItem } = useCart()
  const { country, ready } = useCountry()

  // The page is statically built for AE. Once we know the visitor is
  // actually GB, re-fetch this product's live GB pricing/variants and
  // swap it in. Falls back silently to the AE-built data on any error.
  const [liveProduct, setLiveProduct] = useState<Product>(initialProduct)

  useEffect(() => {
    if (!ready || country === 'AE') return // AE data is already correct
    let cancelled = false
    getProductByHandle(initialProduct.slug, country)
      .then((fresh) => {
        if (!cancelled && fresh) setLiveProduct(fresh as unknown as Product)
      })
      .catch(() => {
        // Keep showing the AE-built data — never leave the UI blank.
      })
    return () => { cancelled = true }
  }, [ready, country, initialProduct.slug])

  const p = liveProduct

  // Currency code embedded by normaliseProduct; fall back to "AED"
  const currencyCode: string = (p as any).currencyCode ?? 'AED'

  // ── Variant / strength picker ──────────────────────────────────────────
  const hasMultipleVariants = (p.variants?.length ?? 0) > 1

  const selectedVariant = useMemo(() => {
    return p.variants?.find(v => v.id === selectedVariantId) ?? {
      id: p.variantId ?? '',
      title: p.mg,
      price: p.price,
      compareAtPrice: p.oldPrice,
      currencyCode,
      availableForSale: p.inStock,
    }
  }, [p, selectedVariantId, currencyCode])

  // Re-sync the selected variant whenever live country-swapped data lands
  // (AE → GB) — only if the current selection no longer exists on the new
  // variant list. Shopify variant IDs are stable across markets, so this
  // avoids resetting (and re-triggering ProductVariantView's image sync)
  // on every currency refresh when the same variant is still valid.
  useEffect(() => {
    const stillValid = p.variants?.some((v) => v.id === selectedVariantId)
    if (!stillValid) {
      onSelectVariant(p.variantId ?? p.variants?.[0]?.id ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p])

  // Reset scroll position on the tab body whenever the active tab changes,
  // so switching tabs never leaves you mid-scroll on the new content.
  useEffect(() => {
    const el = document.getElementById('pp-tab-panel')
    if (el) el.scrollTop = 0
  }, [activeTab])

  const handleAdd = async () => {
    if (!selectedVariant.availableForSale || added) return
    setAdded(true)
    await addItem(
      selectedVariant.id || `gid://shopify/ProductVariant/${p.id}`,
      p.name,
      selectedVariant.title,
      selectedVariant.price,
      p.slug
    )
    setTimeout(() => setAdded(false), 2200)
  }

  const tabContent = () => {
    switch (activeTab) {

      case 0: // Overview — render Shopify descriptionHtml, then the
              // `long_desc` metafield underneath. normaliseProduct() in
              // shopify.ts was already pulling this metafield into
              // `longDesc` on every product — it just wasn't being
              // rendered anywhere. This is the field to write real,
              // unique, keyword-relevant per-product copy into (research
              // context, what the COA verifies, etc.) for long-tail
              // ranking on individual compound names — far more
              // SEO-valuable than the short Shopify `description` field
              // most storefronts default to.
        return (
          <>
            {p.descriptionHtml ? (
              <div
                className="shopify-desc"
                dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
              />
            ) : (
              <p style={{ fontSize: 13, lineHeight: 1.85, color: '#626A85' }}>
                {p.description || 'Research-grade compound manufactured to strict quality standards.'}
              </p>
            )}
            {p.longDesc && (
              <div style={{ marginTop: p.descriptionHtml || p.description ? 18 : 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#AAB3C8', marginBottom: 8 }}>
                  Research Overview
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.85, color: '#626A85', whiteSpace: 'pre-line' }}>
                  {p.longDesc}
                </p>
              </div>
            )}
          </>
        )

      case 1: // Technical Specs
        return (
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Purity',    value: p.purity ? `${p.purity}%` : 'N/A' },
              { label: 'Lot',       value: p.lot || 'N/A' },
              { label: 'Test Date', value: p.testDate || 'N/A' },
              { label: 'Amount',    value: selectedVariant.title },
              { label: 'Category',  value: p.category || 'Research Compound' },
              { label: 'Grade',     value: 'Research Use Only' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 12px',
                background: '#F8F9FC',
                borderRadius: 9,
                border: '0.5px solid #E5EAF5',
                gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#AAB3C8', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#0D0F14', fontWeight: 700, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
            {p.sequence && (
              <div style={{
                marginTop: 8, background: '#F3F5FB',
                border: '0.5px solid #E5EAF5', borderRadius: 9, padding: '10px 12px',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#AAB3C8', marginBottom: 6 }}>
                  Sequence
                </div>
                <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#0D0F14', wordBreak: 'break-all', lineHeight: 1.7 }}>
                  {p.sequence}
                </code>
              </div>
            )}
          </div>
        )

      case 2: // Storage
        return (
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Short-term',           value: 'Refrigerate at 2–8°C' },
              { label: 'Long-term',            value: 'Freeze at −20°C or below' },
              { label: 'After reconstitution', value: 'Use within 28 days, refrigerated' },
              { label: 'Avoid',                value: 'Repeated freeze-thaw cycles' },
              { label: 'Protect from',         value: 'Light and moisture' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 12px',
                background: '#F8F9FC',
                borderRadius: 9,
                border: '0.5px solid #E5EAF5',
                gap: 12,
              }}>
                <span style={{ fontSize: 12, color: '#AAB3C8', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#0D0F14', fontWeight: 600, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        )

      case 3: // Disclaimer
        return (
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              'This product is intended for laboratory and research purposes only. It is not for human or veterinary use.',
              'By purchasing, you confirm you are a qualified researcher and will use the product in compliance with all applicable laws.',
              'PepcoLab accepts no liability for misuse. All handling should be by trained personnel using appropriate safety equipment.',
            ].map((text, i) => (
              <p key={i} style={{ fontSize: 12, lineHeight: 1.85, color: '#626A85', margin: 0 }}>{text}</p>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Strength / dose picker — only shown when there's more than one variant */}
      {hasMultipleVariants && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#626A85', marginBottom: 8 }}>
            Strength
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {p.variants!.map((v) => {
              const isSelected = v.id === selectedVariantId
              return (
                <button
                  key={v.id}
                  onClick={() => onSelectVariant(v.id)}
                  disabled={!v.availableForSale}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: v.availableForSale ? 'pointer' : 'not-allowed',
                    border: isSelected ? '1.5px solid #1A56DB' : '1px solid #DDE3F0',
                    background: isSelected ? '#EFF6FF' : '#fff',
                    color: !v.availableForSale ? '#C5CBDA' : isSelected ? '#1A56DB' : '#0D0F14',
                    textDecoration: !v.availableForSale ? 'line-through' : 'none',
                    transition: 'all .15s',
                  }}
                >
                  {v.title}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price & stock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {selectedVariant.compareAtPrice && (
            <span style={{ fontSize: 14, textDecoration: 'line-through', color: '#AAB3C8' }}>
              {formatPrice(selectedVariant.compareAtPrice, selectedVariant.currencyCode ?? currencyCode)}
            </span>
          )}
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.04em', color: '#0D0F14', lineHeight: 1 }}>
            {formatPrice(selectedVariant.price, selectedVariant.currencyCode ?? currencyCode)}
          </span>
        </div>
        {selectedVariant.availableForSale ? (
          <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999, background: '#EAF3DE', color: '#3B6D11' }}>
            ✓ In stock
          </span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999, background: '#FCEBEB', color: '#A32D2D' }}>
            Out of stock
          </span>
        )}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          onClick={handleAdd}
          disabled={!selectedVariant.availableForSale}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 14, fontWeight: 600, color: '#fff',
            padding: '14px 20px', borderRadius: 12, border: 'none',
            background: added ? '#3B6D11' : 'linear-gradient(135deg,#1A56DB,#2563EB)',
            boxShadow: selectedVariant.availableForSale && !added ? '0 4px 18px rgba(26,86,219,0.35)' : 'none',
            cursor: selectedVariant.availableForSale ? 'pointer' : 'not-allowed',
            opacity: selectedVariant.availableForSale ? 1 : 0.4,
            transition: 'all .2s',
          }}
        >
          {added
            ? <><CheckCircle size={16} /> Added to cart</>
            : <><ShoppingCart size={16} />{selectedVariant.availableForSale ? 'Add to Cart' : 'Out of Stock'}</>
          }
        </button>
        <a

          href={`/certificates?lot=${p.lot ?? ''}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, padding: '14px 18px', borderRadius: 12,
            border: '1px solid #DDE3F0', color: '#0D0F14', textDecoration: 'none',
            background: '#fff', transition: 'all .2s',
          }}
        >
          <Download size={15} />
          COA
        </a>
      </div>

      {/* Tabs */}
      <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 20 }}>
        {/*
          Tab bar: this row itself scrolls HORIZONTALLY on narrow screens
          (overflowX: auto) if there isn't room for all 4 labels — that's
          intentional and is likely what was reading as "overflow-y
          scrolling" if the labels wrapped onto a second line instead.
          `whiteSpace: nowrap` + `flexShrink: 0` on each tab button below
          stops that wrap so the row scrolls sideways instead of growing
          taller.
        */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 18,
          borderBottom: '1px solid #F0F0F0',
          overflowX: 'auto', overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '9px 14px',
                fontSize: 12, fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                marginBottom: -1, transition: 'color .15s',
                ...(activeTab === i
                  ? { borderBottom: '2px solid #1A56DB', color: '#0D0F14' }
                  : { borderBottom: '2px solid transparent', color: '#AAB3C8' }
                ),
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/*
          Tab panel: previously `minHeight: 60` with no explicit height or
          overflow rule. That's normally fine, but if this component ever
          renders inside a flex/grid ancestor with a fixed or percentage
          height (it does — .pp-info-col sits in a CSS grid row next to a
          `position: sticky` image column), a bare block with no `height:
          auto` can inherit a stretched, size-constrained box from the
          grid and clip its own content, producing an internal vertical
          scrollbar around the Overview/Specs/Storage/Disclaimer copy
          instead of letting the page itself grow and scroll normally.
          Making height/overflow explicit here forces this panel to size
          to its content and pushes any scrolling back up to the page.
        */}
        <div
          id="pp-tab-panel"
          style={{
            minHeight: 60,
            height: 'auto',
            maxHeight: 'none',
            overflowY: 'visible',
          }}
        >
          {tabContent()}
        </div>
      </div>
    </>
  )
}