'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  X, Minus, Plus, ArrowRight, ShoppingBag, Trash2,
} from 'lucide-react'
import { useCart } from '@/lib/cartContext'
import { formatPrice } from '@/lib/utils'

const FREE_SHIPPING_THRESHOLD = 75

export default function CartDrawer() {
  const {
    open, lines, subtotal, totalQuantity, currencyCode,
    loading, error, closeCart, removeItem, updateQty, checkout, clearError,
  } = useCart()

  const drawerRef   = useRef<HTMLDivElement>(null)
  const [checkingOut, setCheckingOut] = useState(false)

  /* lock scroll */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* esc to close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [closeCart])

  /* shipping progress (based on AED threshold — adjust per currency) */
  const progress  = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0)

  const handleCheckout = async () => {
    setCheckingOut(true)
    try { await checkout() } finally { setCheckingOut(false) }
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.5)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .3s ease',
        }}
      />

      {/* ── Drawer ── */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(100vw, 440px)',
          background: '#fafaf9',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .45s cubic-bezier(.22,1,.36,1)',
          boxShadow: open ? '-24px 0 80px rgba(0,0,0,.18)' : 'none',
        }}
      >

        {/* ── Header ── */}
        <div style={{
          background: '#0b0b0b',
          color: '#fff',
          padding: '22px 22px 20px',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,.35)', marginBottom: 5, fontWeight: 600,
              }}>
                Research Order
              </div>
              <h2 style={{
                fontFamily: 'Georgia, serif', fontSize: 26,
                margin: 0, letterSpacing: '-.03em', lineHeight: 1,
              }}>
                Cart
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {totalQuantity > 0 && (
                <span style={{
                  background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.12)',
                  color: 'rgba(255,255,255,.7)',
                  fontSize: 11, fontWeight: 700,
                  padding: '4px 10px', borderRadius: 999,
                }}>
                  {totalQuantity} item{totalQuantity !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={closeCart}
                aria-label="Close cart"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,.12)',
                  background: 'rgba(255,255,255,.05)',
                  color: 'rgba(255,255,255,.7)', cursor: 'pointer',
                  transition: 'background .15s',
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Free shipping progress */}
          {totalQuantity > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,.38)',
                marginBottom: 7, display: 'flex', justifyContent: 'space-between',
              }}>
                <span>
                  {progress >= 100
                    ? '✓ Free shipping unlocked'
                    : `${formatPrice(remaining, currencyCode)} away from free shipping`}
                </span>
                <span style={{ color: 'rgba(255,255,255,.25)' }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={{
                height: 3, background: 'rgba(255,255,255,.08)',
                borderRadius: 999, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${progress}%`,
                  background: progress >= 100
                    ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                    : 'rgba(255,255,255,.35)',
                  transition: 'width .4s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            background: '#FEF2F2',
            borderBottom: '1px solid rgba(220,38,38,.12)',
            padding: '11px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 12.5, color: '#b91c1c' }}>{error}</span>
            </div>
            <button
              onClick={clearError}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
          {lines.length === 0 ? (
            /* ── Empty state ── */
            <div style={{
              height: '100%', minHeight: 320,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              padding: '40px 24px',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg,#f0f4ff,#e8ecfa)',
                border: '1px solid rgba(26,86,219,.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <ShoppingBag size={32} strokeWidth={1.5} color="rgba(26,86,219,.5)" />
              </div>
              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: 20,
                color: '#0d0d0d', margin: '0 0 8px', letterSpacing: '-.02em',
              }}>
                Your cart is empty
              </h3>
              <p style={{
                fontSize: 13, color: 'rgba(13,13,13,.45)',
                lineHeight: 1.7, maxWidth: 240, margin: '0 0 24px',
              }}>
                Add research-grade compounds to begin your order.
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                style={{
                  background: '#0d0d0d', color: '#fff',
                  padding: '12px 24px', borderRadius: 999,
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                Browse catalogue
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            /* ── Line items ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
              {lines.map((line) => (
                <div
                  key={line.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '14px',
                    border: '1px solid rgba(13,13,13,.06)',
                    boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                    transition: 'box-shadow .2s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    {/* Product image */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 12,
                      background: 'linear-gradient(135deg,#f0f4ff,#e8ecfa)',
                      border: '1px solid rgba(26,86,219,.08)',
                      overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {line.image ? (
                        <img
                          src={line.image} alt={line.title}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
                        />
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(26,86,219,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                        </svg>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Label */}
                      <div style={{
                        fontSize: 9, textTransform: 'uppercase',
                        letterSpacing: '.14em', color: 'rgba(13,13,13,.32)',
                        fontWeight: 700, marginBottom: 4,
                      }}>
                        Research Compound
                      </div>
                      {/* Title */}
                      <div style={{
                        fontFamily: 'Georgia, serif', fontSize: 15,
                        color: '#0d0d0d', lineHeight: 1.25,
                        marginBottom: 2, letterSpacing: '-.01em',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {line.title}
                      </div>
                      {/* Variant */}
                      <div style={{ fontSize: 11, color: 'rgba(13,13,13,.4)', marginBottom: 12 }}>
                        {line.variantTitle}
                      </div>

                      {/* Controls row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Qty stepper */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 0,
                          background: '#f4f3f0', borderRadius: 999,
                          border: '1px solid rgba(13,13,13,.07)',
                          overflow: 'hidden',
                        }}>
                          <button
                            onClick={() => updateQty(line.id, line.quantity - 1)}
                            disabled={loading}
                            aria-label="Decrease quantity"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              width: 30, height: 30, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              color: 'rgba(13,13,13,.6)', transition: 'background .12s',
                            }}
                          >
                            <Minus size={11} strokeWidth={2.5} />
                          </button>
                          <span style={{
                            minWidth: 24, textAlign: 'center',
                            fontSize: 12, fontWeight: 700, color: '#0d0d0d',
                          }}>
                            {line.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(line.id, line.quantity + 1)}
                            disabled={loading}
                            aria-label="Increase quantity"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              width: 30, height: 30, display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              color: 'rgba(13,13,13,.6)', transition: 'background .12s',
                            }}
                          >
                            <Plus size={11} strokeWidth={2.5} />
                          </button>
                        </div>

                        {/* Price + remove */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            fontFamily: 'Georgia, serif', fontSize: 16,
                            fontWeight: 700, color: '#0d0d0d', letterSpacing: '-.02em',
                          }}>
                            {formatPrice(line.price * line.quantity, currencyCode)}
                          </span>
                          <button
                            onClick={() => removeItem(line.id)}
                            aria-label="Remove item"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: 8,
                              color: 'rgba(13,13,13,.28)',
                              transition: 'color .15s, background .15s',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {lines.length > 0 && (
          <div style={{
            background: 'rgba(250,250,249,.96)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(13,13,13,.08)',
            padding: '18px 16px 20px',
            flexShrink: 0,
          }}>
            {/* Subtotal */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: 14,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(13,13,13,.35)', marginBottom: 2 }}>
                  Subtotal
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(13,13,13,.35)' }}>
                  Shipping calculated at checkout
                </div>
              </div>
              <strong style={{
                fontFamily: 'Georgia, serif',
                fontSize: 26, color: '#0d0d0d', letterSpacing: '-.04em',
              }}>
                {formatPrice(subtotal, currencyCode)}
              </strong>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={checkingOut || loading}
              style={{
                width: '100%', height: 54, borderRadius: 14, border: 0,
                background: checkingOut || loading
                  ? 'rgba(13,13,13,.25)'
                  : 'linear-gradient(135deg,#0d0d0d 0%,#1e1e1e 100%)',
                color: checkingOut || loading ? 'rgba(255,255,255,.5)' : '#fff',
                fontWeight: 700, fontSize: 14, letterSpacing: '.02em',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9,
                cursor: checkingOut || loading ? 'not-allowed' : 'pointer',
                boxShadow: checkingOut || loading ? 'none' : '0 4px 20px rgba(13,13,13,.22)',
                transition: 'all .2s',
                marginBottom: 12,
              }}
            >
              {checkingOut ? (
                <>
                  <span style={{
                    width: 15, height: 15, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff',
                    animation: 'cart-spin .65s linear infinite',
                    flexShrink: 0,
                  }} />
                  Processing…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Secure Checkout
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Trust row */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              {[
                { icon: '🔒', label: '256-bit SSL' },
                { icon: '🧾', label: 'COA Verified' },
                { icon: '❄️', label: 'Cold-Chain' },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10.5, color: 'rgba(13,13,13,.32)', fontWeight: 600,
                }}>
                  <span style={{ fontSize: 11 }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: 12,
              fontSize: 9.5, color: 'rgba(13,13,13,.22)',
              textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic',
            }}>
              For research use only · Not for human consumption
            </div>
          </div>
        )}
      </aside>

      <style>{`
        @keyframes cart-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}