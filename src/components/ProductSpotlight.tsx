'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ShieldCheck,
  FlaskConical,
  FileCheck,
  Sparkles,
} from 'lucide-react'

import { getProducts } from '@/lib/shopify'
import Vial from '@/components/Vial'

export default function ProductSpotlight() {
  const [featured, setFeatured] = useState<any>(null)
  const [purity, setPurity] = useState(99)

  useEffect(() => {
    getProducts().then((products) => {
      const prod = products[0]
      setFeatured(prod)
      setPurity(prod?.purity ?? 99)
    })
  }, [])

  if (!featured) return null

  return (
    <section
      style={{
        background: '#f7f7f5',
        borderBottom: '1px solid rgba(0,0,0,.08)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding:
            'clamp(60px,8vw,120px) clamp(20px,4vw,64px)',
        }}
      >
        {/* Eyebrow */}

        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: featured.color.accent,
            marginBottom: 28,
          }}
        >
          Featured Research Compound
        </div>

        {/* Main Layout */}

        <div className="spotlight-grid">
          {/* LEFT */}

          <div>
            {featured.badge && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: featured.color.bg,
                  color: featured.color.accent,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  marginBottom: 24,
                }}
              >
                <Sparkles size={12} />
                {featured.badge}
              </div>
            )}

            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(44px,6vw,88px)',
                lineHeight: '.95',
                letterSpacing: '-.06em',
                fontWeight: 700,
                color: '#0d0d0d',
              }}
            >
              {featured.shortName}
            </h2>

            <div
              style={{
                marginTop: 10,
                fontSize: 20,
                color: 'rgba(13,13,13,.45)',
                fontWeight: 500,
              }}
            >
              {featured.mg}
            </div>

            <p
              style={{
                marginTop: 28,
                maxWidth: 600,
                fontSize: 16,
                lineHeight: 1.9,
                color: 'rgba(13,13,13,.68)',
              }}
            >
              {featured.longDesc ??
                featured.description}
            </p>

            {/* Scientific data */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2,minmax(0,1fr))',
                gap: 14,
                marginTop: 34,
                maxWidth: 620,
              }}
            >
              <MetricCard
                label="Purity"
                value={`${purity}%`}
              />

              <MetricCard
                label="Batch"
                value={featured.lot ?? 'N/A'}
              />

              <MetricCard
                label="Category"
                value={featured.category}
              />

              <MetricCard
                label="Tested"
                value={featured.testDate}
              />
            </div>

            {/* Trust Row */}

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 32,
              }}
            >
              <TrustPill
                icon={<ShieldCheck size={14} />}
                text="HPLC Verified"
              />

              <TrustPill
                icon={<FileCheck size={14} />}
                text="COA Available"
              />

              <TrustPill
                icon={<FlaskConical size={14} />}
                text="Research Grade"
              />
            </div>

            {/* CTA */}

            <div
              style={{
                marginTop: 42,
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                flexWrap: 'wrap',
              }}
            >
              <div>
                {featured.oldPrice && (
                  <div
                    style={{
                      fontSize: 15,
                      color:
                        'rgba(13,13,13,.35)',
                      textDecoration:
                        'line-through',
                    }}
                  >
                    £
                    {featured.oldPrice.toFixed(
                      2
                    )}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 52,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing:
                      '-.05em',
                    color: '#0d0d0d',
                  }}
                >
                  £
                  {featured.price.toFixed(
                    2
                  )}
                </div>
              </div>

              <Link
                href={`/products/${featured.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding:
                    '16px 28px',
                  borderRadius: 999,
                  textDecoration:
                    'none',
                  background:
                    featured.color.accent,
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                View Compound
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* RIGHT */}

          <div
            style={{
              position: 'relative',
              minHeight: 650,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* background glow */}

            <div
              style={{
                position: 'absolute',
                width: 500,
                height: 500,
                borderRadius: '50%',
                background: `radial-gradient(circle,
                  ${featured.color.vialTo}55 0%,
                  transparent 70%)`,
                filter: 'blur(70px)',
              }}
            />

            {/* data card */}

            <div
              style={{
                position: 'absolute',
                top: 40,
                right: 0,
                width: 220,
                background: '#fff',
                border:
                  '1px solid rgba(0,0,0,.08)',
                borderRadius: 24,
                padding: 24,
                zIndex: 5,
                boxShadow:
                  '0 30px 80px rgba(0,0,0,.08)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing:
                    '.12em',
                  textTransform:
                    'uppercase',
                  color:
                    'rgba(13,13,13,.4)',
                }}
              >
                Purity Analysis
              </div>

              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  marginTop: 8,
                  lineHeight: 1,
                }}
              >
                {purity}%
              </div>

              <div
                style={{
                  marginTop: 16,
                  height: 6,
                  background:
                    'rgba(0,0,0,.08)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${purity}%`,
                    height: '100%',
                    background:
                      featured.color.accent,
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color:
                    'rgba(13,13,13,.5)',
                }}
              >
                Lot {featured.lot}
              </div>
            </div>

            {/* vials */}

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 30,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  opacity: 0.55,
                  transform:
                    'translateY(25px)',
                }}
              >
                <Vial
                  size="lg"
                  mg={featured.mg}
                  fromColor={
                    featured.color.vialFrom
                  }
                  toColor={
                    featured.color.vialTo
                  }
                />
              </div>

              <Vial
                size="xl"
                mg={featured.mg}
                fromColor={
                  featured.color.vialFrom
                }
                toColor={
                  featured.color.vialTo
                }
              />

              <div
                style={{
                  opacity: 0.55,
                  transform:
                    'translateY(10px)',
                }}
              >
                <Vial
                  size="lg"
                  mg={featured.mg}
                  fromColor={
                    featured.color.vialFrom
                  }
                  toColor={
                    featured.color.vialTo
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spotlight-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
        }

        @media (max-width: 980px) {
          .spotlight-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  )
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,.08)',
        padding: 18,
        borderRadius: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          color: 'rgba(13,13,13,.4)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#0d0d0d',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function TrustPill({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 999,
        background: '#fff',
        border: '1px solid rgba(0,0,0,.08)',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {icon}
      {text}
    </div>
  )
}