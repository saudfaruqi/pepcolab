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

      case 0: // Overview — render Shopify descriptionHtml
        return p.descriptionHtml ? (
          <div
            className="shopify-desc"
            dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
          />
        ) : (
          <p style={{ fontSize: 13, lineHeight: 1.85, color: '#626A85' }}>
            {p.description || 'Research-grade compound manufactured to strict quality standards.'}
          </p>
        )

      case 1: // Technical Specs
        return (
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Purity',    value: p.purity ? `${p.purity}%` : 'N/A' },
              { label: 'Lot',       value: p.lot || 'N/A' },
              { label: 'Test Date', value: p.testDate || 'N/A' },
              { label: 'Amount',    value: p.mg },
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
              { label: 'Short-term',        value: 'Refrigerate at 2–8°C' },
              { label: 'Long-term',         value: 'Freeze at −20°C or below' },
              { label: 'After reconstitution', value: 'Use within 28 days, refrigerated' },
              { label: 'Avoid',             value: 'Repeated freeze-thaw cycles' },
              { label: 'Protect from',      value: 'Light and moisture' },
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
              <p key={i} style={{ fontSize: 12, lineHeight: 1.85, color: '#626A85', margin: 0 }}>
                {text}
              </p>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Price & stock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {p.oldPrice && (
            <span style={{ fontSize: 14, textDecoration: 'line-through', color: '#AAB3C8' }}>
              £{p.oldPrice.toFixed(2)}
            </span>
          )}
          <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-.04em', color: '#0D0F14', lineHeight: 1 }}>
            £{p.price.toFixed(2)}
          </span>
        </div>
        {p.inStock ? (
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
          disabled={!p.inStock}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 14, fontWeight: 600, color: '#fff',
            padding: '14px 20px', borderRadius: 12, border: 'none',
            background: added ? '#3B6D11' : 'linear-gradient(135deg,#1A56DB,#2563EB)',
            boxShadow: p.inStock && !added ? '0 4px 18px rgba(26,86,219,0.35)' : 'none',
            cursor: p.inStock ? 'pointer' : 'not-allowed',
            opacity: p.inStock ? 1 : 0.4,
            transition: 'all .2s',
          }}
        >
          {added
            ? <><CheckCircle size={16} /> Added to cart</>
            : <><ShoppingCart size={16} />{p.inStock ? 'Add to Cart' : 'Out of Stock'}</>
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
        <div style={{
          display: 'flex', gap: 0, marginBottom: 18,
          borderBottom: '1px solid #F0F0F0', overflowX: 'auto',
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
        <div style={{ minHeight: 60 }}>
          {tabContent()}
        </div>
      </div>
    </>
  )
}