

// ProductCard.tsx

'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, CheckCircle } from 'lucide-react'
import Vial from '@/components/Vial'
import { useCart } from '@/lib/cartContext'
import type { Product } from '@/app/data'

interface Props {
  product: Product
  featured?: boolean
}

export default function ProductCard({ product: p, featured = false }: Props) {
  const [added, setAdded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { addItem } = useCart()

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!p.inStock || added) return
    setAdded(true)
    try {
      await addItem(
        p.variantId ?? `gid://shopify/ProductVariant/${p.id}`,
        p.name,
        p.mg,
        p.price,
        p.slug
      )
    } catch (err) {
      console.error('Add to cart failed:', err)
    }
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#f7f5f1',
        borderRadius: 16,
        width: '100%',
        overflow: 'hidden',
        transition: 'transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0px)',
        boxShadow: hovered
          ? '0 16px 40px rgba(0,0,0,.09)'
          : '0 2px 12px rgba(0,0,0,.04)',
      }}
    >
      {/* ── Image / Vial area ── */}
      <Link href={`/products/${p.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div
          style={{
            position: 'relative',
            /* Fluid height: taller on desktop, compact on mobile */
            height: 'clamp(160px, 30vw, 240px)',
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `
              radial-gradient(circle at top, rgba(255,255,255,.9), transparent 45%),
              linear-gradient(to bottom, ${p.color.bg}, #f7f5f1)
            `,
          }}
        >
          {/* faint product number */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 14,
              fontSize: 'clamp(28px, 6vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-.08em',
              color: 'rgba(13,13,13,.04)',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            0{p.id}
          </div>

          {/* Vial – adapts to available space */}
          <div
            style={{
              transform: hovered ? 'translateY(-6px) scale(1.04)' : 'translateY(0) scale(1)',
              transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
            }}
          >
            <Vial
              fromColor={p.color.vialFrom}
              toColor={p.color.vialTo}
              mg={p.mg}
              size="lg"
            />
          </div>

          {/* badge */}
          {p.badge && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'rgba(13,13,13,.42)',
              }}
            >
              {p.badge}
            </div>
          )}

          {/* out of stock overlay */}
          {!p.inStock && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(245,245,243,.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(13,13,13,.45)',
                  background: 'rgba(255,255,255,.85)',
                  padding: '5px 14px',
                }}
              >
                Out of stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Content ── */}
      <div style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
        {/* category */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'rgba(13,13,13,.34)',
            marginBottom: 8,
          }}
        >
          {p.category}
        </div>

        {/* name */}
        <Link href={`/products/${p.slug}`} style={{ textDecoration: 'none' }}>
          <h3
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(18px, 4vw, 24px)',
              lineHeight: 1.05,
              letterSpacing: '-.04em',
              color: '#0d0d0d',
              margin: '0 0 6px',
            }}
          >
            {p.name}
          </h3>
        </Link>

        {/* description – hidden on very small cards */}
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.6,
            color: 'rgba(13,13,13,.52)',
            margin: '0 0 16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {p.description}
        </p>

        {/* footer row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* price */}
          <div>
            {p.oldPrice && (
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(13,13,13,.3)',
                  textDecoration: 'line-through',
                  display: 'block',
                  marginBottom: 2,
                }}
              >
                £{p.oldPrice.toFixed(2)}
              </span>
            )}
            <span
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(22px, 5vw, 28px)',
                fontWeight: 700,
                lineHeight: 1,
                color: '#0d0d0d',
              }}
            >
              £{p.price.toFixed(2)}
            </span>
          </div>

          {/* add to cart button */}
          <button
            onClick={handleAdd}
            disabled={!p.inStock}
            aria-label={added ? 'Added to cart' : `Add ${p.name} to cart`}
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: '50%',
              border: 'none',
              background: added ? '#0A7B45' : !p.inStock ? 'rgba(13,13,13,.1)' : '#0d0d0d',
              color: !p.inStock ? 'rgba(13,13,13,.3)' : '#fff',
              cursor: !p.inStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background .2s, transform .15s',
              transform: hovered && p.inStock ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            {added ? <CheckCircle size={16} /> : <ShoppingCart size={16} />}
          </button>
        </div>
      </div>
    </article>
  )
}