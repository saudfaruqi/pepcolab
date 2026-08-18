// src/components/WishlistButton.tsx
'use client'
import type { MouseEvent } from 'react'
import { Heart } from 'lucide-react'
import { useWishlist, type WishlistItem } from '@/lib/wishlistContext'

interface Props {
  item: Omit<WishlistItem, 'addedAt'>
  variant?: 'overlay' | 'pill' | 'icon'
  size?: number
}

/**
 * `overlay` — circular button meant to float on top of a product image
 * (ProductCard). `pill` — inline bordered button with a label, sized to
 * match the full-width CTAs in ProductActions. `icon` — same bordered
 * square as ShareButton's default so the two can sit side by side next to
 * the PDP title without one dwarfing the other.
 */
export default function WishlistButton({ item, variant = 'overlay', size = 16 }: Props) {
  const { isSaved, toggle } = useWishlist()
  const saved = isSaved(item.slug)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle(item)
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, padding: '14px 18px', borderRadius: 12,
          border: saved ? '1px solid #F3C6D3' : '1px solid #DDE3F0',
          color: saved ? '#B0224B' : '#0D0F14',
          background: saved ? '#FDF1F5' : '#fff',
          cursor: 'pointer', transition: 'all .2s',
        }}
      >
        <Heart size={size} fill={saved ? '#B0224B' : 'none'} />
        {saved ? 'Saved' : 'Save'}
      </button>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        style={{
          width: 38, height: 38, borderRadius: 10,
          border: saved ? '1px solid #F3C6D3' : '1px solid #DDE3F0',
          background: saved ? '#FDF1F5' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'all .2s',
        }}
      >
        <Heart size={size} color={saved ? '#B0224B' : '#0D0F14'} fill={saved ? '#B0224B' : 'none'} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 2,
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        transition: 'transform .15s ease, background .15s ease',
      }}
    >
      <Heart size={14} color={saved ? '#B0224B' : '#0d0d0d'} fill={saved ? '#B0224B' : 'none'} />
    </button>
  )
}