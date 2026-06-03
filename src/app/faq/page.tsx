'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import {
  ChevronDown,
  Search,
  ShieldCheck,
  FlaskConical,
  Truck,
  FileCheck,
} from 'lucide-react'

const FAQS = [
  {
    q: 'What does "research use only" mean?',
    a: 'All peptides sold by PepcoLab are intended solely for in-vitro laboratory research and scientific study. They are not approved for human or veterinary use, consumption, or household purposes. They must only be handled by qualified researchers in appropriate laboratory settings.',
  },
  {
    q: 'How is purity tested and verified?',
    a: 'Every batch is independently tested using validated analytical methods including HPLC and Mass Spectrometry. Results are published publicly through our Certificate Library.',
  },
  {
    q: 'What is a Certificate of Analysis (COA)?',
    a: 'A COA confirms identity, purity, quality and analytical testing results for a specific batch. Each certificate contains laboratory verification data and batch-specific information.',
  },
  {
    q: 'How are peptides shipped?',
    a: 'Orders are dispatched using insulated packaging and tracked courier services. Orders placed before the daily cut-off are processed the same working day.',
  },
  {
    q: 'What is your return policy?',
    a: 'Due to the specialist nature of research products, opened products cannot be returned. Damaged or incorrect orders should be reported within 48 hours.',
  },
  {
    q: 'How should peptides be stored?',
    a: 'Store lyophilised peptides according to product-specific guidance. Most products should be kept in a cool, dry environment away from light.',
  },
  {
    q: 'Do you offer custom synthesis?',
    a: 'Custom peptide synthesis solutions may be available for qualified institutions. Contact our research team for further information.',
  },
  {
    q: 'Is PepcoLab UK registered?',
    a: 'Yes. PepcoLab operates as a registered UK business and supplies research materials intended solely for laboratory use.',
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0)
  const [search, setSearch] = useState('')

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Nav />

      <main
        style={{
          background: '#050505',
          minHeight: '100vh',
        }}
      >
        {/* HERO */}
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '80px 20px 60px',
            borderBottom: '1px solid rgba(255,255,255,.08)',
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: 'absolute',
              width: 600,
              height: 600,
              top: -250,
              right: -250,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(59,130,246,.15), transparent 70%)',
              filter: 'blur(120px)',
            }}
          />

          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.08)',
                marginBottom: 24,
              }}
            >
              <ShieldCheck size={14} color="#60A5FA" />
              <span
                style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                Knowledge Base
              </span>
            </div>

            <h1
              style={{
                color: '#fff',
                fontSize: 'clamp(42px,8vw,84px)',
                lineHeight: '.92',
                letterSpacing: '-.06em',
                fontWeight: 700,
                maxWidth: 900,
                marginBottom: 24,
              }}
            >
              Frequently Asked
              <br />
              Questions
            </h1>

            <p
              style={{
                color: 'rgba(255,255,255,.65)',
                fontSize: 18,
                lineHeight: 1.8,
                maxWidth: 700,
              }}
            >
              Everything you need to know about our research compounds,
              testing standards, laboratory documentation and shipping
              procedures.
            </p>
          </div>
        </section>

        {/* STATS */}
        <section
          style={{
            padding: '30px 20px',
            borderBottom: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
              gap: 16,
            }}
          >
            {[
              {
                icon: FlaskConical,
                title: 'Research Grade',
                text: 'Laboratory Standards',
              },
              {
                icon: FileCheck,
                title: 'COA Verified',
                text: 'Batch Documentation',
              },
              {
                icon: ShieldCheck,
                title: 'Independent Testing',
                text: 'Third-Party Verified',
              },
              {
                icon: Truck,
                title: 'Tracked Delivery',
                text: 'Fast Dispatch',
              },
            ].map((item, idx) => {
              const Icon = item.icon

              return (
                <div
                  key={idx}
                  style={{
                    padding: 20,
                    borderRadius: 20,
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(255,255,255,.08)',
                  }}
                >
                  <Icon size={20} color="#60A5FA" />
                  <div
                    style={{
                      color: '#fff',
                      marginTop: 14,
                      fontWeight: 700,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255,255,255,.55)',
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* SEARCH */}
        <section
          style={{
            padding: '40px 20px 20px',
          }}
        >
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,.4)',
              }}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              style={{
                width: '100%',
                height: 62,
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,.08)',
                background: 'rgba(255,255,255,.04)',
                color: '#fff',
                paddingLeft: 55,
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>
        </section>

        {/* FAQS */}
        <section
          style={{
            padding: '20px 20px 80px',
          }}
        >
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {filteredFaqs.map((faq, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,.03)',
                  border: '1px solid rgba(255,255,255,.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{
                    width: '100%',
                    padding: '24px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: 17,
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  {faq.q}

                  <ChevronDown
                    size={18}
                    style={{
                      transform:
                        open === i
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                      transition: '.3s',
                    }}
                  />
                </button>

                {open === i && (
                  <div
                    style={{
                      padding: '0 24px 24px',
                      color: 'rgba(255,255,255,.65)',
                      lineHeight: 1.8,
                      fontSize: 15,
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}