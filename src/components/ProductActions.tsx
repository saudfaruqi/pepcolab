// src/components/ProductActions.tsx
'use client'
import { useState, useMemo, useEffect } from 'react'
import { ShoppingCart, Download, CheckCircle, ShieldCheck, FileText, ExternalLink, MessageCircle, CreditCard } from 'lucide-react'
import { resolveLocalCoa } from '@/lib/coaIndex'
import { useCart } from '@/lib/cartContext'
import { useCountry } from '@/lib/countryContext'
import { formatPrice } from '@/lib/utils'
import {
  isPaymentLinkOnlyProduct,
  getPaymentLinkForVariant,
  getAvailableRetaQuantities,
  getRetaTotalAED,
  isPlaceholderLink,
} from '@/lib/restrictedCheckout'
import { isWhatsAppConfigured, whatsAppProductLink } from '@/lib/whatsapp'
import NotifyMeForm from '@/components/NotifyMeForm'
import type { Product } from '@/app/data'

interface Props {
  product: Product
  // Controlled from ProductVariantView.tsx, which also owns the main
  // product image — lifted up so selecting a strength here can update the
  // displayed image there.
  selectedVariantId: string
  onSelectVariant: (variantId: string) => void
}

const TABS = ['Overview', 'Technical Specs', 'Storage', 'Certificate', 'Disclaimer']
// Index of the Certificate tab within TABS, used by the "COA" quick-action
// button to jump straight there instead of navigating off the page.
const CERT_TAB_INDEX = TABS.indexOf('Certificate')

// Upper bound for the normal cart quantity stepper.
const CART_MAX_QTY = 10

export default function ProductActions({ product: initialProduct, selectedVariantId, onSelectVariant }: Props) {
  const [added,     setAdded]     = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [quantity,  setQuantity]  = useState(1)
  const { addItem } = useCart()
  const { ready } = useCountry()

  const p = initialProduct

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

  // ── RETA (GLP) — payment-link-only product ─────────────────────────────
  // Sold via fixed-amount STRABL payment links (one link per strength AND
  // quantity) instead of the cart. See lib/restrictedCheckout.ts.
  const paymentLinkOnly = isPaymentLinkOnlyProduct(p.slug)

  // Quantities that currently have a live, correctly-priced link for the
  // selected strength. The stepper only moves between these values.
  const retaQuantities = useMemo(
    () => (paymentLinkOnly ? getAvailableRetaQuantities(selectedVariant.title) : []),
    [paymentLinkOnly, selectedVariant.title]
  )

  // Never trust `quantity` blindly for RETA: if it isn't one of the linked
  // quantities (e.g. just switched strength), use the first one that is.
  const retaQty = retaQuantities.includes(quantity) ? quantity : (retaQuantities[0] ?? 1)
  const retaQtyIndex = retaQuantities.indexOf(retaQty)

  const paymentLink = paymentLinkOnly ? getPaymentLinkForVariant(selectedVariant.title, retaQty) : null
  const paymentLinkIsPlaceholder = paymentLink ? isPlaceholderLink(paymentLink) : false
  const retaTotal = paymentLinkOnly ? getRetaTotalAED(selectedVariant.title, retaQty) : null

  // Guard against Shopify and the STRABL link amounts drifting apart.
  useEffect(() => {
    if (!paymentLinkOnly || retaTotal == null || process.env.NODE_ENV === 'production') return
    const shopifyTotal = Number(selectedVariant.price) * retaQty
    if (Math.abs(shopifyTotal - retaTotal) > 0.01) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ProductActions] RETA price mismatch for "${selectedVariant.title}" × ${retaQty}: Shopify ${shopifyTotal} vs payment link ${retaTotal}. Update RETA_UNIT_PRICE_AED and the STRABL links.`
      )
    }
  }, [paymentLinkOnly, retaTotal, retaQty, selectedVariant.price, selectedVariant.title])

  // Re-syncs the selected variant if it's ever missing from p.variants
  // (e.g. a stale variant id from a previous render of this product).
  useEffect(() => {
    const stillValid = p.variants?.some((v) => v.id === selectedVariantId)
    if (!stillValid) {
      onSelectVariant(p.variantId ?? p.variants?.[0]?.id ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p])

  // Reset scroll position on the tab body whenever the active tab changes.
  useEffect(() => {
    const el = document.getElementById('pp-tab-panel')
    if (el) el.scrollTop = 0
  }, [activeTab])

  // Quantity shouldn't carry over when switching strength/format. For RETA
  // it resets to the lowest quantity that has a payment link.
  useEffect(() => {
    setQuantity(paymentLinkOnly ? (retaQuantities[0] ?? 1) : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId])

  const whatsAppEnabled = isWhatsAppConfigured()
  const whatsAppHref = whatsAppEnabled ? whatsAppProductLink(p.name, selectedVariant.title) : undefined

  // ── Quantity stepper (shared by cart + RETA) ───────────────────────────
  const qtyValue    = paymentLinkOnly ? retaQty : quantity
  const canDecrease = paymentLinkOnly ? retaQtyIndex > 0 : quantity > 1
  const canIncrease = paymentLinkOnly
    ? retaQtyIndex >= 0 && retaQtyIndex < retaQuantities.length - 1
    : quantity < CART_MAX_QTY
  const showQuantity = paymentLinkOnly ? retaQuantities.length > 0 : selectedVariant.availableForSale

  const decreaseQty = () => {
    if (!canDecrease) return
    if (paymentLinkOnly) setQuantity(retaQuantities[retaQtyIndex - 1])
    else setQuantity((q) => Math.max(1, q - 1))
  }

  const increaseQty = () => {
    if (!canIncrease) return
    if (paymentLinkOnly) setQuantity(retaQuantities[retaQtyIndex + 1])
    else setQuantity((q) => Math.min(CART_MAX_QTY, q + 1))
  }

  const handleAdd = async () => {
    if (paymentLinkOnly || !selectedVariant.availableForSale || added) return
    setAdded(true)
    // cartContext.addItem always adds exactly 1 unit, incrementing the
    // existing line if the variant's already in the cart — looping N times
    // reuses that proven logic rather than adding a second code path.
    for (let i = 0; i < quantity; i++) {
      await addItem(
        selectedVariant.id || `gid://shopify/ProductVariant/${p.id}`,
        p.name,
        selectedVariant.title,
        selectedVariant.price,
        p.slug
      )
    }
    setQuantity(1)
    setTimeout(() => setAdded(false), 2200)
  }

  const tabContent = () => {
    switch (activeTab) {

      case 0: // Overview — Shopify descriptionHtml, then the `long_desc` metafield.
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

      case 3: { // Certificate — batch purity/lot/test-date plus the COA document.
        // Shopify metafield wins if set; otherwise the local COA resolved
        // against the currently selected strength.
        const localCoa = p.coaUrl ? undefined : resolveLocalCoa(p.name, selectedVariant.title)
        const coaHref = p.coaUrl || localCoa?.url || `/certificates?lot=${encodeURIComponent(p.lot ?? '')}`
        const hasDirectCoa = Boolean(p.coaUrl || localCoa)
        return (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10,
              background: '#EAF3DE', border: '0.5px solid #D3E8BE',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={15} color="#3B6D11" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3B6D11' }}>
                  Independently verified — Pass
                </span>
              </div>
              {p.purity && (
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3B6D11' }}>{p.purity}% pure</span>
              )}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { label: 'Lot number',   value: p.lot || 'N/A' },
                { label: 'Test date',    value: p.testDate || 'N/A' },
                { label: 'Testing lab',  value: 'Freedom Diagnostics (3rd party)' },
                { label: 'Document',     value: hasDirectCoa ? 'Full COA available' : 'Search certificate library' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 12px', background: '#F8F9FC', borderRadius: 9,
                  border: '0.5px solid #E5EAF5', gap: 12,
                }}>
                  <span style={{ fontSize: 12, color: '#AAB3C8', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#0D0F14', fontWeight: 700, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>

            <a
              href={coaHref}
              target={hasDirectCoa ? '_blank' : undefined}
              rel={hasDirectCoa ? 'noopener noreferrer' : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, fontWeight: 600, padding: '13px 18px', borderRadius: 12,
                border: '1px solid #DDE3F0', color: '#0D0F14', textDecoration: 'none',
                background: '#fff',
              }}
            >
              {hasDirectCoa ? <FileText size={15} /> : <ExternalLink size={15} />}
              {hasDirectCoa ? 'View full Certificate of Analysis' : 'Find this batch in the Certificate Library'}
            </a>

            <p style={{ fontSize: 11, lineHeight: 1.7, color: '#AAB3C8', margin: 0 }}>
              Testing conducted by Freedom Diagnostics, an independent third-party laboratory. PepcoLab has no influence over test results.
            </p>
          </div>
        )
      }

      case 4: // Disclaimer
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
          {paymentLinkOnly && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#AAB3C8' }}>each</span>
          )}
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

      {/* Quantity — normal cart products step 1–10. RETA steps only through
          quantities that have their own STRABL payment link. */}
      {showQuantity && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#AAB3C8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Qty
            </span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #DDE3F0', borderRadius: 10, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={decreaseQty}
                disabled={!canDecrease}
                aria-label="Decrease quantity"
                style={{
                  width: 34, height: 34, border: 'none', background: '#fff',
                  fontSize: 16, fontWeight: 600, color: canDecrease ? '#0D0F14' : '#DDE3F0',
                  cursor: canDecrease ? 'pointer' : 'default',
                }}
              >
                −
              </button>
              <span
                aria-live="polite"
                style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0D0F14' }}
              >
                {qtyValue}
              </span>
              <button
                type="button"
                onClick={increaseQty}
                disabled={!canIncrease}
                aria-label="Increase quantity"
                style={{
                  width: 34, height: 34, border: 'none', background: '#fff',
                  fontSize: 16, fontWeight: 600, color: canIncrease ? '#0D0F14' : '#DDE3F0',
                  cursor: canIncrease ? 'pointer' : 'default',
                }}
              >
                +
              </button>
            </div>
            {paymentLinkOnly && retaTotal != null && (
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0F14' }}>
                Total {formatPrice(retaTotal, currencyCode)}
              </span>
            )}
          </div>
          {paymentLinkOnly && retaQuantities[0] > 1 && (
            <p style={{ fontSize: 11.5, color: '#AAB3C8', margin: '8px 0 0' }}>
              This strength is currently available in quantities of {retaQuantities[0]}
              {retaQuantities.length > 1 ? `–${retaQuantities[retaQuantities.length - 1]}` : ''}.
            </p>
          )}
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: whatsAppEnabled ? 12 : 24, flexWrap: 'wrap' }}>
        {paymentLinkOnly ? (
          // RETA — payment-link-only ordering, no cart involved.
          <a
            href={paymentLinkIsPlaceholder ? undefined : paymentLink!}
            target={paymentLinkIsPlaceholder ? undefined : '_blank'}
            rel={paymentLinkIsPlaceholder ? undefined : 'noopener noreferrer'}
            aria-disabled={paymentLinkIsPlaceholder}
            onClick={(e) => { if (paymentLinkIsPlaceholder) e.preventDefault() }}
            style={{
              flex: 1,
              minWidth: 180,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none',
              padding: '14px 20px', borderRadius: 12, border: 'none',
              background: paymentLinkIsPlaceholder ? '#C5CBDA' : 'linear-gradient(135deg,#1A56DB,#2563EB)',
              boxShadow: paymentLinkIsPlaceholder ? 'none' : '0 4px 18px rgba(26,86,219,0.35)',
              cursor: paymentLinkIsPlaceholder ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
            }}
          >
            <CreditCard size={16} />
            {paymentLinkIsPlaceholder
              ? 'Payment link coming soon'
              : retaTotal != null
                ? `Pay ${formatPrice(retaTotal, currencyCode)}`
                : 'Order via Payment Link'}
          </a>
        ) : (
          <button
            onClick={handleAdd}
            disabled={!selectedVariant.availableForSale}
            style={{
              flex: 1,
              minWidth: 180,
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
              : <><ShoppingCart size={16} />{selectedVariant.availableForSale ? `Add to Cart${quantity > 1 ? ` (${quantity})` : ''}` : 'Out of Stock'}</>
            }
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab(CERT_TAB_INDEX)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, padding: '14px 18px', borderRadius: 12,
            border: '1px solid #DDE3F0', color: '#0D0F14',
            background: '#fff', cursor: 'pointer', transition: 'all .2s',
          }}
        >
          <Download size={15} />
          COA
        </button>
      </div>

      {/* Back-in-stock capture for unavailable cart products. */}
      {!paymentLinkOnly && !selectedVariant.availableForSale && (
        <NotifyMeForm productSlug={p.slug} productName={`${p.name} (${selectedVariant.title})`} />
      )}

      {/* WhatsApp ordering — renders nothing if no number is configured. */}
      {whatsAppEnabled && (
        <a
          href={whatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13.5, fontWeight: 600, padding: '13px 18px', borderRadius: 12,
            border: '1px solid #C7ECD3', color: '#128C4A',
            background: '#F0FDF4', textDecoration: 'none', marginBottom: 24,
            transition: 'all .2s',
          }}
        >
          <MessageCircle size={16} />
          Order via WhatsApp
        </a>
      )}

      {/* Tabs */}
      <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 20 }}>
        {/* Tab bar scrolls horizontally on narrow screens instead of wrapping. */}
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

        {/* Tab panel sizes to its content so the page, not the panel, scrolls. */}
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