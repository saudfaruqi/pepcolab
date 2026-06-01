'use client'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, FileText, Zap } from 'lucide-react'
import Vial from '@/components/Vial'
import { PRODUCTS } from '@/app/data'

const IMG = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80&auto=format&fit=crop'

export default function ProductSpotlight() {
  // Spotlight the first "new" product, or fallback to PRODUCTS[0]
  const featured =
    PRODUCTS.find(p => p.badge === 'new') ?? PRODUCTS[0]

  return (
    <section
      style={{
        borderBottom: '1px solid rgba(13,13,13,.1)',
        background: '#f5f5f3',
        padding: '0 0 0',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 64px' }}>
        {/* Eyebrow */}
        <div
          style={{
            padding: '48px 0 24px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'rgba(13,13,13,.4)',
          }}
        >
          Featured this month
        </div>

        {/* Spotlight card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#0d0d0d',
            marginBottom: 48,
            overflow: 'hidden',
            minHeight: 460,
          }}
        >
          {/* ── Left: text ── */}
          <div
            style={{
              padding: '56px 56px 56px 56px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.45)',
                background: 'rgba(255,255,255,.08)',
                padding: '5px 14px',
                borderRadius: 40,
                width: 'fit-content',
                marginBottom: 24,
              }}
            >
              Most researched
            </span>

            <h3
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(36px,4vw,56px)',
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: '-.05em',
                color: '#fff',
                margin: '0 0 16px',
              }}
            >
              {featured.name}
              <br />
              <span style={{ color: 'rgba(255,255,255,.35)' }}>{featured.mg}</span>
            </h3>

            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,.5)',
                lineHeight: 1.8,
                maxWidth: 360,
                margin: '0 0 28px',
              }}
            >
              {featured.longDesc ?? featured.description} Independently tested
              to {featured.purity ?? 99}% purity. HPLC and mass-spec verified.
              Lot {featured.lot ?? 'N/A'}.
            </p>

            {/* Data pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              {[
                { Icon: ShieldCheck, label: `${featured.purity ?? 99}% purity` },
                { Icon: FileText,    label: 'COA published' },
                {
                  Icon: Zap,
                  label: featured.inStock
                    ? `In stock · ${featured.stockCount ?? '—'} units`
                    : 'Out of stock',
                },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#fff',
                    background: 'rgba(255,255,255,.1)',
                    padding: '7px 14px',
                    borderRadius: 40,
                  }}
                >
                  <Icon size={11} style={{ opacity: 0.7 }} />
                  {label}
                </span>
              ))}
            </div>

            {/* Price + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                {featured.oldPrice && (
                  <div
                    style={{
                      fontSize: 13,
                      textDecoration: 'line-through',
                      color: 'rgba(255,255,255,.25)',
                      marginBottom: 2,
                    }}
                  >
                    £{featured.oldPrice.toFixed(2)}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 38,
                    fontWeight: 700,
                    letterSpacing: '-.04em',
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  £{featured.price.toFixed(2)}
                </div>
                <div
                  style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}
                >
                  + free dispatch over £75
                </div>
              </div>
              <Link
                href={`/products/${featured.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fff',
                  color: '#0d0d0d',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '.04em',
                  padding: '14px 28px',
                  textDecoration: 'none',
                  borderRadius: 40,
                  flexShrink: 0,
                  transition: 'opacity .15s',
                }}
              >
                View product <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* ── Right: visual ── */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: 400,
            }}
          >
            {/* Lab photo backdrop */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${IMG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.2,
              }}
            />
            {/* Gradient overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${featured.color.vialTo}44, transparent 60%)`,
              }}
            />
            {/* Glow orb */}
            <div
              style={{
                position: 'absolute',
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${featured.color.vialTo}33 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
            />

            {/* Vials */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 24,
              }}
            >
              <div style={{ opacity: 0.6, transform: 'translateY(-20px)' }}>
                <Vial
                  fromColor={featured.color.vialFrom}
                  toColor={featured.color.vialTo}
                  mg={featured.mg}
                  size="lg"
                />
              </div>
              <Vial
                fromColor={featured.color.vialFrom}
                toColor={featured.color.vialTo}
                mg={featured.mg}
                size="xl"
              />
              <div style={{ opacity: 0.6, transform: 'translateY(10px)' }}>
                <Vial
                  fromColor={featured.color.vialFrom}
                  toColor={featured.color.vialTo}
                  mg={featured.mg}
                  size="lg"
                />
              </div>
            </div>

            {/* Floating purity card */}
            <div
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                background: 'rgba(255,255,255,.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,.15)',
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                  marginBottom: 6,
                }}
              >
                Purity Analysis
              </div>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-.04em',
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {featured.purity ?? 99}%
              </div>
              <div
                style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 4 }}
              >
                HPLC verified · Lot {featured.lot ?? 'N/A'}
              </div>
              {/* Purity bar */}
              <div
                style={{
                  marginTop: 10,
                  height: 2,
                  background: 'rgba(255,255,255,.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${featured.purity ?? 99}%`,
                    background: '#fff',
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}