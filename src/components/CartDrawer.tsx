'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  X,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Snowflake,
  FlaskConical,
} from 'lucide-react'
import { useCart } from '@/lib/cartContext'

const FREE_SHIPPING = 75

export default function CartDrawer() {
  const {
    open,
    lines,
    subtotal,
    totalQuantity,
    loading,
    error,
    closeCart,
    removeItem,
    updateQty,
    checkout,
    clearError,
  } = useCart()

  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }

    window.addEventListener('keydown', handler)

    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [closeCart])

  const progress = Math.min(
    (subtotal / FREE_SHIPPING) * 100,
    100
  )

  return (
    <>
      {/* Backdrop */}

      <div
        onClick={closeCart}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.45)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: '.3s',
        }}
      />

      {/* Drawer */}

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(100vw,460px)',
          background:
            'linear-gradient(to bottom,#fafaf9,#f5f5f3)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          transform: open
            ? 'translateX(0)'
            : 'translateX(100%)',
          transition:
            'transform .45s cubic-bezier(.22,1,.36,1)',
        }}
      >
        {/* Header */}

        <div
          style={{
            background: '#0b0b0b',
            color: '#fff',
            padding: '28px 24px',
            borderBottom:
              '1px solid rgba(255,255,255,.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '.2em',
                  textTransform: 'uppercase',
                  opacity: .45,
                  marginBottom: 6,
                }}
              >
                Research Order
              </div>

              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 32,
                  margin: 0,
                }}
              >
                Cart
              </h2>
            </div>

            <button
              onClick={closeCart}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                border:
                  '1px solid rgba(255,255,255,.12)',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              opacity: .65,
            }}
          >
            {totalQuantity} item
            {totalQuantity !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Error */}

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              padding: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* Content */}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
          }}
        >
          {lines.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg,#eef2fd,#dbeafe)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <ShoppingBag size={40} />
              </div>

              <h3
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 24,
                }}
              >
                Research Cart Empty
              </h3>

              <p
                style={{
                  maxWidth: 260,
                  opacity: .6,
                  lineHeight: 1.7,
                }}
              >
                Add verified compounds and
                laboratory products to begin
                your order.
              </p>

              <Link
                href="/products"
                onClick={closeCart}
                style={{
                  marginTop: 20,
                  background: '#0d0d0d',
                  color: '#fff',
                  padding: '14px 24px',
                  borderRadius: 999,
                  textDecoration: 'none',
                }}
              >
                Browse Catalogue
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    padding: 16,
                    border:
                      '1px solid rgba(13,13,13,.06)',
                    boxShadow:
                      '0 8px 30px rgba(0,0,0,.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 14,
                        background: '#f7f7f5',
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '.12em',
                          opacity: .4,
                        }}
                      >
                        Research Compound
                      </div>

                      <h3
                        style={{
                          fontFamily:
                            'Georgia, serif',
                          fontSize: 18,
                          margin: '6px 0',
                        }}
                      >
                        {line.title}
                      </h3>

                      <div
                        style={{
                          fontSize: 12,
                          opacity: .5,
                        }}
                      >
                        {line.variantTitle}
                      </div>

                      <div
                        style={{
                          marginTop: 14,
                          display: 'flex',
                          justifyContent:
                            'space-between',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#f7f7f5',
                            borderRadius: 999,
                            padding: 4,
                          }}
                        >
                          <button>
                            <Minus size={12} />
                          </button>

                          <span>
                            {line.quantity}
                          </span>

                          <button>
                            <Plus size={12} />
                          </button>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              fontFamily:
                                'Georgia, serif',
                              fontWeight: 700,
                            }}
                          >
                            £
                            {(
                              line.price *
                              line.quantity
                            ).toFixed(2)}
                          </span>

                          <button
                            onClick={() =>
                              removeItem(line.id)
                            }
                          >
                            <Trash2 size={14} />
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

        {/* Footer */}

        {lines.length > 0 && (
          <div
            style={{
              background:
                'rgba(255,255,255,.88)',
              backdropFilter: 'blur(20px)',
              borderTop:
                '1px solid rgba(13,13,13,.08)',
              padding: 20,
            }}
          >

            {/* Total */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                marginBottom: 18,
              }}
            >
              <span>Subtotal</span>

              <strong
                style={{
                  fontFamily:
                    'Georgia, serif',
                  fontSize: 24,
                }}
              >
                £{subtotal.toFixed(2)}
              </strong>
            </div>

            <button
              onClick={checkout}
              style={{
                width: '100%',
                height: 58,
                borderRadius: 16,
                border: 0,
                background:
                  'linear-gradient(135deg,#0d0d0d,#222)',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              Secure Checkout
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

function TrustItem({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 10,
        background: '#fff',
        borderRadius: 12,
        fontSize: 11,
      }}
    >
      {icon}
      <div style={{ marginTop: 4 }}>
        {label}
      </div>
    </div>
  )
}