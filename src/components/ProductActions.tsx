'use client'
import { useState } from 'react'
import { ShoppingCart, Download, CheckCircle } from 'lucide-react'
import { useCart } from '@/lib/cartContext'
import type { Product } from '@/app/data'

interface Props { product: Product }

const TABS = ['Overview', 'Technical Specs', 'Storage', 'Disclaimer']

export default function ProductActions({ product: p }: Props) {
  const [added, setAdded] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const { addItem } = useCart()

  const handleAdd = async () => {
    if (!p.inStock || added) return
    setAdded(true)
    await addItem(p.variantId ?? `gid://shopify/ProductVariant/${p.id}`, p.name, p.mg, p.price, p.slug)
    setTimeout(() => setAdded(false), 2200)
  }

  const tabContent = () => {
    switch (activeTab) {
      
    case 0: // Overview
      return (
        <div
          dangerouslySetInnerHTML={{ __html: p.descriptionHtml ?? p.description ?? '' }}
          className="shopify-desc"
        />
      )

      case 1: // Technical Specs
        return (
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Purity', value: p.purity ? `${p.purity}%` : 'N/A' },
              { label: 'Lot Number', value: p.lot || 'N/A' },
              { label: 'Test Date', value: p.testDate || 'N/A' },
              { label: 'Amount', value: p.mg },
              { label: 'Category', value: p.category || 'Research Compound' },
              { label: 'Grade', value: 'Research Use Only' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#F8F9FC',
                  borderRadius: 10,
                  border: '0.5px solid #E5EAF5',
                }}
              >
                <span style={{ fontSize: 12, color: '#AAB3C8', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0D0F14', fontWeight: 700 }}>{value}</span>
              </div>
            ))}
            {p.sequence && (
              <div
                style={{
                  marginTop: 8,
                  background: '#F3F5FB',
                  border: '0.5px solid #E5EAF5',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#AAB3C8', marginBottom: 6 }}>
                  Sequence
                </div>
                <code style={{ fontFamily: 'monospace', fontSize: 12, color: '#0D0F14', wordBreak: 'break-all', lineHeight: 1.7 }}>
                  {p.sequence}
                </code>
              </div>
            )}
          </div>
        )

      case 2: // Storage
        return (
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Short-term storage', value: 'Refrigerate at 2–8°C' },
              { label: 'Long-term storage', value: 'Freeze at −20°C or below' },
              { label: 'After reconstitution', value: 'Use within 28 days, keep refrigerated' },
              { label: 'Avoid', value: 'Repeated freeze-thaw cycles' },
              { label: 'Protect from', value: 'Light and moisture' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#F8F9FC',
                  borderRadius: 10,
                  border: '0.5px solid #E5EAF5',
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 12, color: '#AAB3C8', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0D0F14', fontWeight: 600, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        )

      case 3: // Disclaimer
        return (
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ fontSize: 12, lineHeight: 1.85, color: '#626A85' }}>
              This product is intended for <strong style={{ color: '#0D0F14' }}>laboratory and research purposes only</strong>. It is not intended for human or veterinary use, and must not be used as a drug, food additive, or household chemical.
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.85, color: '#626A85' }}>
              By purchasing this product, you confirm that you are a qualified researcher or laboratory professional and that the product will be used in compliance with all applicable laws and regulations.
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.85, color: '#626A85' }}>
              PepcoLab accepts no liability for misuse of this compound. All handling should be performed by trained personnel using appropriate safety equipment.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Price & stock */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-baseline gap-2">
          {p.oldPrice && (
            <span className="text-[14px] line-through" style={{ color: '#AAB3C8' }}>
              £{p.oldPrice.toFixed(2)}
            </span>
          )}
          <span
            className="text-[36px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#0D0F14' }}
          >
            £{p.price.toFixed(2)}
          </span>
        </div>
        {p.inStock ? (
          <span
            className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
            style={{ background: '#EAF3DE', color: '#3B6D11' }}
          >
            ✓ In stock
          </span>
        ) : (
          <span
            className="text-[12px] font-semibold px-3 py-1.5 rounded-full"
            style={{ background: '#FCEBEB', color: '#A32D2D' }}
          >
            Out of stock
          </span>
        )}
      </div>

      {/* CTAs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleAdd}
          disabled={!p.inStock}
          className="flex-1 flex items-center justify-center gap-2 text-[14px] font-semibold text-white py-3.5 rounded-[12px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: added ? '#3B6D11' : 'linear-gradient(135deg,#1A56DB,#2563EB)',
            boxShadow: p.inStock && !added ? '0 4px 18px rgba(26,86,219,0.38)' : 'none',
          }}
        >
          {added
            ? <><CheckCircle size={16} /> Added to cart</>
            : <><ShoppingCart size={16} />{p.inStock ? 'Add to Cart' : 'Out of Stock'}</>
          }
        </button>
        <a
          href={`/certificates?lot=${p.lot ?? ''}`}
          className="flex items-center justify-center gap-2 text-[14px] font-semibold px-5 py-3.5 rounded-[12px] border transition-all duration-200 hover:bg-[#F3F5FB] hover:border-[#A8BADE]"
          style={{ borderColor: '#DDE3F0', color: '#0D0F14' }}
        >
          <Download size={16} />
          COA
        </a>
      </div>

      {/* Tabs */}
      <div style={{ borderTop: '1px solid #E5EAF5', paddingTop: 24 }}>
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 20,
            borderBottom: '1px solid #E5EAF5',
            overflowX: 'auto',
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'color .15s',
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

        <div style={{ minHeight: 80 }}>
          {tabContent()}
        </div>
      </div>
    </>
  )
}