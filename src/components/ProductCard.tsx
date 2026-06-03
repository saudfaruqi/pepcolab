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
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        overflow: 'hidden',
        border: '1px solid rgba(13,13,13,.07)',
        transition: 'transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 48px rgba(0,0,0,.10)'
          : '0 2px 8px rgba(0,0,0,.04)',
      }}
    >
      {/* ── Image / Vial area ── */}
      <Link href={`/products/${p.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: p.image
              ? '#f7f5f1'
              : `linear-gradient(145deg, ${p.color.bg ?? '#eef2fd'}, #f0f0f8)`,
          }}
        >
          {p.image ? (
            <img
              src={p.image}
              alt={p.imageAlt ?? p.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '12px',
                display: 'block',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
              }}
            />
          ) : (
            /* Vial fallback — centered, constrained, no watermark bleed */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                transform: hovered ? 'translateY(-4px) scale(1.04)' : 'translateY(0) scale(1)',
                transition: 'transform .55s cubic-bezier(.22,1,.36,1)',
              }}
            >
              {/* subtle glow behind vial */}
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '60%',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${p.color.vialFrom ?? '#3b82f6'}30, transparent 70%)`,
                filter: 'blur(20px)',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Vial
                  fromColor={p.color.vialFrom}
                  toColor={p.color.vialTo}
                  mg={p.mg}
                  size="xl"
                />
              </div>
            </div>
          )}

          {/* Badge */}
          {p.badge && (
            <div style={{
              position: 'absolute',
              top: 10, right: 10,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'rgba(13,13,13,.55)',
              backdropFilter: 'blur(6px)',
              padding: '3px 9px',
              borderRadius: 6,
            }}>
              {p.badge}
            </div>
          )}

          {/* Purity chip */}
          {p.purity && (
            <div style={{
              position: 'absolute',
              bottom: 10, left: 10,
              fontSize: 10,
              fontWeight: 700,
              color: '#0d0d0d',
              background: 'rgba(255,255,255,.9)',
              backdropFilter: 'blur(8px)',
              padding: '4px 9px',
              borderRadius: 8,
              letterSpacing: '.04em',
              border: '1px solid rgba(13,13,13,.06)',
            }}>
              {p.purity}% pure
            </div>
          )}

          {/* Out of stock overlay */}
          {!p.inStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(245,245,243,.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                letterSpacing: '.12em', textTransform: 'uppercase',
                color: 'rgba(13,13,13,.5)',
                background: 'rgba(255,255,255,.9)',
                padding: '5px 14px',
                borderRadius: 6,
              }}>
                Out of stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Content ── */}
      <div style={{ padding: '12px 6px 14px' }}>

        {/* Category */}
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'rgba(13,13,13,.32)',
          marginBottom: 6,
        }}>
          {p.category}
        </div>

        {/* Name */}
        <Link href={`/products/${p.slug}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontSize: 'clamp(16px, 3.5vw, 22px)',
            lineHeight: 1.1,
            letterSpacing: '-.03em',
            color: '#0d0d0d',
            margin: '0 0 14px',
          }}>
            {p.name}
          </h3>
        </Link>

        {/* Description — hidden on mobile via CSS */}
        <p className="product-card-desc" style={{
          fontSize: 12,
          lineHeight: 1.65,
          color: 'rgba(13,13,13,.5)',
          margin: '0 0 14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {p.description}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}>
          <div>
            {p.oldPrice && (
              <span style={{
                fontSize: 11,
                color: 'rgba(13,13,13,.28)',
                textDecoration: 'line-through',
                display: 'block',
                marginBottom: 1,
              }}>
                AED {p.oldPrice.toFixed(2)}
              </span>
            )}
            <span style={{
              fontSize: 'clamp(18px, 3w, 20px)',
              fontWeight: 700,
              lineHeight: 1,
              color: '#0d0d0d',
            }}>
              AED {p.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={!p.inStock}
            aria-label={added ? 'Added to cart' : `Add ${p.name} to cart`}
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: '50%',
              border: 'none',
              background: added
                ? '#0A7B45'
                : !p.inStock
                ? 'rgba(13,13,13,.08)'
                : '#0d0d0d',
              color: !p.inStock ? 'rgba(13,13,13,.25)' : '#fff',
              cursor: !p.inStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background .2s ease, transform .2s ease',
              transform: hovered && p.inStock && !added ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {added ? <CheckCircle size={13} /> : <ShoppingCart size={13} />}
          </button>
        </div>
      </div>
    </article>
  )
}