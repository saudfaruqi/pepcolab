'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cartContext'

export default function CartDrawer() {
  const { open, lines, subtotal, totalQuantity, loading, error, closeCart, removeItem, updateQty, checkout, clearError } = useCart()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) closeCart()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closeCart])

  // Focus trap
  useEffect(() => {
    if (open) {
      drawerRef.current?.focus()
    }
  }, [open])

  if (!open && lines.length === 0) return null

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13,13,13,.45)',
          zIndex: 1000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .3s ease',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* ── Drawer panel ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          /* Full-width on mobile, capped on desktop */
          width: 'min(100vw, 440px)',
          background: '#f5f5f3',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
          outline: 'none',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 18px',
            borderBottom: '1px solid rgba(13,13,13,.1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={18} style={{ color: '#0d0d0d' }} />
            <span
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-.03em',
                color: '#0d0d0d',
              }}
            >
              Cart
            </span>
            {totalQuantity > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#0d0d0d',
                  color: '#fff',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {totalQuantity}
              </span>
            )}
          </div>

          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(13,13,13,.15)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0d0d0d',
              transition: 'background .15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(13,13,13,.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div
            style={{
              background: '#FEF2F2',
              borderBottom: '1px solid rgba(220,38,38,.2)',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12.5, color: '#DC2626' }}>{error}</span>
            <button
              onClick={clearError}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 0 }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Lines ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {lines.length === 0 ? (
            /* Empty state */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 16,
                textAlign: 'center',
                padding: '40px 0',
              }}
            >
              <ShoppingBag
                size={48}
                style={{ color: 'rgba(13,13,13,.15)', strokeWidth: 1.5 }}
              />
              <div>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: '-.03em',
                    color: '#0d0d0d',
                    marginBottom: 6,
                  }}
                >
                  Your cart is empty
                </div>
                <div style={{ fontSize: 13, color: 'rgba(13,13,13,.5)', lineHeight: 1.6 }}>
                  Add research-grade peptides to get started.
                </div>
              </div>
              <Link
                href="/products"
                onClick={closeCart}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#0d0d0d',
                  color: '#fff',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  borderRadius: 40,
                  marginTop: 4,
                }}
              >
                Browse Peptides <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lines.map(line => (
                <div
                  key={line.id}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(13,13,13,.08)',
                    padding: '14px 16px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    opacity: loading ? 0.6 : 1,
                    transition: 'opacity .2s',
                  }}
                >
                  {/* Product image or placeholder */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      flexShrink: 0,
                      background: 'rgba(13,13,13,.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      overflow: 'hidden',
                    }}
                  >
                    {line.image ? (
                      <img
                        src={line.image}
                        alt={line.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      '🧪'
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={closeCart}
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: '-.02em',
                        color: '#0d0d0d',
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {line.title}
                    </Link>
                    <div style={{ fontSize: 11.5, color: 'rgba(13,13,13,.45)', marginBottom: 10 }}>
                      {line.variantTitle}
                    </div>

                    {/* Qty controls + price row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      {/* Quantity stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid rgba(13,13,13,.12)',
                          background: '#f5f5f3',
                        }}
                      >
                        <button
                          onClick={() => updateQty(line.id, line.quantity - 1)}
                          disabled={loading}
                          aria-label="Decrease quantity"
                          style={{
                            width: 30,
                            height: 30,
                            border: 'none',
                            background: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0d0d0d',
                          }}
                        >
                          <Minus size={11} />
                        </button>
                        <span
                          style={{
                            minWidth: 24,
                            textAlign: 'center',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#0d0d0d',
                          }}
                        >
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(line.id, line.quantity + 1)}
                          disabled={loading}
                          aria-label="Increase quantity"
                          style={{
                            width: 30,
                            height: 30,
                            border: 'none',
                            background: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0d0d0d',
                          }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Line total */}
                        <span
                          style={{
                            fontFamily: 'Georgia, serif',
                            fontSize: 16,
                            fontWeight: 700,
                            letterSpacing: '-.02em',
                            color: '#0d0d0d',
                          }}
                        >
                          £{(line.price * line.quantity).toFixed(2)}
                        </span>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(line.id)}
                          disabled={loading}
                          aria-label={`Remove ${line.title} from cart`}
                          style={{
                            width: 28,
                            height: 28,
                            border: 'none',
                            background: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(13,13,13,.3)',
                            transition: 'color .15s',
                            borderRadius: 4,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(13,13,13,.3)')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer: totals + checkout ── */}
        {lines.length > 0 && (
          <div
            style={{
              borderTop: '1px solid rgba(13,13,13,.1)',
              padding: '18px 20px 24px',
              flexShrink: 0,
              background: '#f5f5f3',
            }}
          >
            {/* Free dispatch threshold */}
            {subtotal < 75 && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(13,13,13,.55)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>❄️</span>
                <span>
                  Add{' '}
                  <strong style={{ color: '#0d0d0d' }}>
                    £{(75 - subtotal).toFixed(2)}
                  </strong>{' '}
                  more for free cold-chain dispatch
                </span>
              </div>
            )}

            {subtotal >= 75 && (
              <div
                style={{
                  fontSize: 12,
                  color: '#0A7B45',
                  fontWeight: 600,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>✓</span> Free cold-chain dispatch applied
              </div>
            )}

            {/* Subtotal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, color: 'rgba(13,13,13,.55)', fontWeight: 500 }}>
                Subtotal ({totalQuantity} item{totalQuantity !== 1 ? 's' : ''})
              </span>
              <span
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: '-.03em',
                  color: '#0d0d0d',
                }}
              >
                £{subtotal.toFixed(2)}
              </span>
            </div>

            {/* Checkout button */}
            <button
              onClick={checkout}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: loading ? 'rgba(13,13,13,.3)' : '#0d0d0d',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '.04em',
                padding: '16px 24px',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background .2s',
                marginBottom: 10,
              }}
            >
              {loading ? 'Processing…' : <>Checkout <ArrowRight size={15} /></>}
            </button>

            {/* Continue shopping */}
            <button
              onClick={closeCart}
              style={{
                width: '100%',
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(13,13,13,.5)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
                fontFamily: 'inherit',
                letterSpacing: '.03em',
                transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0d0d0d')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(13,13,13,.5)')}
            >
              Continue shopping
            </button>

            <p
              style={{
                fontSize: 11,
                color: 'rgba(13,13,13,.35)',
                textAlign: 'center', 
                marginTop: 12,
                lineHeight: 1.6,
              }}
            >
              Taxes calculated at checkout. For Research Use Only.
            </p>
          </div>
        )}
      </div>
    </>
  )
} 