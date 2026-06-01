'use client'
import { useState } from 'react'
import { ShoppingCart, Download, CheckCircle } from 'lucide-react'
import { useCart } from '@/lib/cartContext'
import type { Product } from '@/app/data'

interface Props { product: Product }

const TABS = ['Overview', 'Technical Specs', 'COA', 'Storage', 'Disclaimer']

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
            ✓ In stock · {p.stockCount} units
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
          {added ? <><CheckCircle size={16} /> Added to cart</> : <><ShoppingCart size={16} />{p.inStock ? 'Add to Cart' : 'Out of Stock'}</>}
        </button>
        <a
          href={`/certificates?lot=${p.lot}`}
          className="flex items-center justify-center gap-2 text-[14px] font-semibold px-5 py-3.5 rounded-[12px] border transition-all duration-200 hover:bg-[#F3F5FB] hover:border-[#A8BADE]"
          style={{ borderColor: '#DDE3F0', color: '#0D0F14' }}
        >
          <Download size={16} />
          COA
        </a>
      </div>

      {/* Tabs */}
      <div style={{ borderTop: '1px solid #E5EAF5' }} className="pt-6">
        <div className="flex gap-6 text-[13px] font-medium mb-4 overflow-x-auto" style={{ borderBottom: '1px solid #E5EAF5' }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className="pb-3 whitespace-nowrap transition-colors duration-150 flex-shrink-0"
              style={
                activeTab === i
                  ? { borderBottom: '2px solid #1A56DB', color: '#0D0F14', marginBottom: '-1px' }
                  : { color: '#AAB3C8' }
              }
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="text-[13px] leading-[1.8] font-light" style={{ color: '#626A85' }}>
          {p.longDesc}
        </p>
        {activeTab === 1 && p.sequence && (
          <div
            className="mt-4 rounded-[10px] px-4 py-3"
            style={{ background: '#F3F5FB', border: '0.5px solid #E5EAF5' }}
          >
            <div className="text-[10px] uppercase tracking-[0.08em] font-bold mb-1" style={{ color: '#AAB3C8' }}>
              Sequence
            </div>
            <div className="font-mono text-[12px]" style={{ color: '#0D0F14' }}>
              {p.sequence}
            </div>
          </div>
        )}
        {activeTab === 0 && p.sequence && (
          <div
            className="mt-4 rounded-[10px] px-4 py-3"
            style={{ background: '#F3F5FB', border: '0.5px solid #E5EAF5' }}
          >
            <div className="text-[10px] uppercase tracking-[0.08em] font-bold mb-1" style={{ color: '#AAB3C8' }}>
              Sequence
            </div>
            <div className="font-mono text-[12px]" style={{ color: '#0D0F14' }}>
              {p.sequence}
            </div>
          </div>
        )}
      </div>
    </>
  )
}