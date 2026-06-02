'use client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ToolsSection from '@/components/ToolsSection'

import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  Brain,
  Activity,
  ShieldCheck,
  Microscope,
  FileText,
  ExternalLink,
} from 'lucide-react'

const ARTICLES = [
  {
    title: 'BPC-157: Mechanisms of Action and Research Applications',
    date: 'May 2025',
    tag: 'Recovery',
    readTime: '8 min',
  },
  {
    title: 'Understanding GLP-1 Receptor Agonists in Metabolic Research',
    date: 'Apr 2025',
    tag: 'Metabolic',
    readTime: '12 min',
  },
  {
    title: 'Peptide Storage: Best Practices for Research Integrity',
    date: 'Apr 2025',
    tag: 'Guide',
    readTime: '5 min',
  },
  {
    title: 'Epithalon and Telomere Biology: A Research Overview',
    date: 'Mar 2025',
    tag: 'Longevity',
    readTime: '10 min',
  },
  {
    title: 'Semax and Cognitive Enhancement Research',
    date: 'Mar 2025',
    tag: 'Cognitive',
    readTime: '9 min',
  },
  {
    title: 'Peptide Reconstitution Guide',
    date: 'Feb 2025',
    tag: 'Guide',
    readTime: '6 min',
  },
]

const categories = [
  {
    title: 'Recovery',
    icon: Activity,
    count: 18,
  },
  {
    title: 'Metabolic',
    icon: FlaskConical,
    count: 24,
  },
  {
    title: 'Cognitive',
    icon: Brain,
    count: 12,
  },
  {
    title: 'Longevity',
    icon: ShieldCheck,
    count: 15,
  },
]

export default function ResearchPage() {
  return (
    <>
      <Nav />

      <main
        style={{
          background: '#f7f7f5',
          minHeight: '100vh',
        }}
      >
        {/* HERO */}

        <section
          style={{
            borderBottom: '1px solid rgba(13,13,13,.08)',
            background:
              'linear-gradient(to bottom,#fff 0%,#f7f7f5 100%)',
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '80px 14px',
            }}
          >
            <div
              style={{
                maxWidth: 760,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 20,
                  color: '#2563EB',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                }}
              >
                <Microscope size={14} />
                Knowledge Base
              </div>

              <h1
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(48px,7vw,84px)',
                  lineHeight: 0.92,
                  letterSpacing: '-.07em',
                  margin: '0 0 20px',
                  color: '#0d0d0d',
                }}
              >
                Research
                <br />
                Hub
              </h1>

              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.8,
                  color: 'rgba(13,13,13,.58)',
                  maxWidth: 620,
                  marginBottom: 40,
                }}
              >
                Research articles, peptide protocols, laboratory
                methodologies, storage guides and scientific resources
                curated for serious researchers.
              </p>
            </div>

            {/* Stats */}

            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(220px,1fr))',
              }}
            >
              {[
                ['42+', 'Research Articles'],
                ['18', 'Protocols & Guides'],
                ['99%', 'Evidence-Based'],
                ['24/7', 'Open Access'],
              ].map(([value, label]) => (
                <div
                  key={label}
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid rgba(13,13,13,.08)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      letterSpacing: '-.05em',
                      marginBottom: 6,
                    }}
                  >
                    {value}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(13,13,13,.55)',
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED ARTICLE */}

        <section>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '48px 14px',
            }}
          >
            <div
              style={{
                background: '#0d0d0d',
                borderRadius: 28,
                padding: '48px 24px',
                color: '#fff',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                  marginBottom: 16,
                }}
              >
                Featured Publication
              </div>

              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(32px,5vw,56px)',
                  lineHeight: 1,
                  letterSpacing: '-.05em',
                  marginBottom: 20,
                }}
              >
                Understanding GLP-1
                <br />
                Receptor Agonists
              </h2>

              <p
                style={{
                  maxWidth: 650,
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: 'rgba(255,255,255,.65)',
                  marginBottom: 32,
                }}
              >
                A comprehensive review of receptor signalling,
                metabolic pathways and emerging research directions
                involving GLP-1 analogues.
              </p>

              <button
                style={{
                  height: 52,
                  padding: '0 24px',
                  borderRadius: 999,
                  border: 'none',
                  background: '#fff',
                  color: '#0d0d0d',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                Read Publication
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}

        <section>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 14px 56px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 34,
                marginBottom: 24,
                letterSpacing: '-.05em',
              }}
            >
              Research Categories
            </h2>

            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(240px,1fr))',
              }}
            >
              {categories.map(category => (
                <div
                  key={category.title}
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: 24,
                    border: '1px solid rgba(13,13,13,.08)',
                  }}
                >
                  <category.icon
                    size={22}
                    style={{
                      marginBottom: 18,
                    }}
                  />

                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    {category.title}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(13,13,13,.55)',
                    }}
                  >
                    {category.count} publications
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ARTICLES */}

        <section>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 14px 72px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 34,
                marginBottom: 24,
                letterSpacing: '-.05em',
              }}
            >
              Latest Research
            </h2>

            <div
              style={{
                display: 'grid',
                gap: 18,
                gridTemplateColumns:
                  'repeat(auto-fill,minmax(320px,1fr))',
              }}
            >
              {ARTICLES.map(article => (
                <article
                  key={article.title}
                  style={{
                    background: '#fff',
                    borderRadius: 22,
                    padding: 24,
                    border: '1px solid rgba(13,13,13,.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 220,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 20,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#2563EB',
                      }}
                    >
                      {article.tag}
                    </span>

                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(13,13,13,.4)',
                      }}
                    >
                      {article.readTime}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 20,
                      lineHeight: 1.35,
                      marginBottom: 18,
                    }}
                  >
                    {article.title}
                  </h3>

                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(13,13,13,.45)',
                      }}
                    >
                      {article.date}
                    </span>

                    <ExternalLink size={16} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SCIENTIFIC RESOURCES */}

        <section>
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 14px 72px',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 28,
                padding: 20,
                border: '1px solid rgba(13,13,13,.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <BookOpen size={20} />
                <h3
                  style={{
                    fontSize: 24,
                    margin: 0,
                  }}
                >
                  Scientific Resources
                </h3>
              </div>

              <p
                style={{
                  maxWidth: 700,
                  lineHeight: 1.8,
                  color: 'rgba(13,13,13,.6)',
                  marginBottom: 24,
                }}
              >
                Access storage protocols, reconstitution guides,
                peptide handling standards, and peer-reviewed
                literature references.
              </p>

              <button
                style={{
                  height: 50,
                  padding: '0 22px',
                  borderRadius: 999,
                  border: '1px solid rgba(13,13,13,.12)',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Browse Resources
              </button>
            </div>
          </div>
        </section>

        <ToolsSection />
      </main>

      <Footer />
    </>
  )
}