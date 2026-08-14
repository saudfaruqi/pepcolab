// app/products/category/[category]/page.tsx
//
// WHY THIS EXISTS
// ----------------
// /products?cat=metabolic (ProductsSection's client-side filter) was the
// only way to browse a category, and query-string routes don't reliably get
// indexed as distinct pages — sitemap.ts even has a standing TODO flagging
// this exact gap: "If you want category pages indexed, make them real
// routes ... then add them here." This is that route.
//
// Each category now has its own crawlable URL, unique <title>/description,
// a unique H1 and intro paragraph (keyword-targeted at "<category> peptides
// UK/UAE" search intent — not stuffed, just specific and honest), and
// CollectionPage + ItemList structured data. sitemap.ts should list these
// once this ships — see the note added there.
//
// Copy is deliberately kept in the same research-use register as the rest
// of the site: no therapeutic/benefit claims, no dosing claims. Same reason
// REVIEWS in data.ts strips fabricated "Dr." credentials and invented
// lab-match quotes — overclaiming here is exactly what UK ASA / ACCC-style
// regulators and Google's own health-content quality raters penalise, which
// works against the ranking goal rather than for it.

import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getProducts } from '@/lib/shopify'
import { CATEGORIES } from '@/app/data'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { category: string }
}

/**
 * Per-category SEO copy. `title`/`description` feed generateMetadata;
 * `h1`/`intro` render on the page itself. Keep `intro` to 2–3 sentences —
 * long enough to carry keyword variants naturally (compound examples,
 * "UK & UAE", "research use"), short enough that it reads as genuinely
 * useful context rather than a keyword dump above the fold.
 */
const CATEGORY_CONTENT: Record<
  string,
  { title: string; description: string; h1: string; intro: string; examples: string }
> = {
  metabolic: {
    title: 'Metabolic Peptides for Sale — Research Grade | UK & UAE',
    description:
      'Metabolic research peptides for laboratory use, shipped across the UK and UAE. GLP-1 class and related compounds, each batch supplied with a published Certificate of Analysis.',
    h1: 'Metabolic Research Peptides',
    intro:
      'Metabolic-pathway compounds for laboratory research, including GLP-1 class peptides, sourced and HPLC-tested for identity and purity before dispatch to the UK and UAE. Every lot ships with its Certificate of Analysis, searchable in our public COA library.',
    examples: 'GLP-1 class compounds, metabolic-pathway research peptides',
  },
  hormonal: {
    title: 'Hormonal Peptides for Sale — Research Grade | UK & UAE',
    description:
      'Hormonal and growth-factor research peptides for laboratory use, shipped across the UK and UAE. Purity and identity confirmed by third-party HPLC testing, COA published per batch.',
    h1: 'Hormonal Research Peptides',
    intro:
      'Growth-hormone and hormonal-pathway peptides for laboratory research, tested by Freedom Diagnostics for identity and HPLC purity before release. Available for research use across the UK and UAE, with a downloadable Certificate of Analysis for every batch.',
    examples: 'growth hormone secretagogues, hormonal-pathway research peptides',
  },
  cognitive: {
    title: 'Cognitive Peptides for Sale — Research Grade | UK & UAE',
    description:
      'Nootropic and cognitive-pathway research peptides for laboratory use, shipped across the UK and UAE. Third-party HPLC-verified purity, published Certificate of Analysis per batch.',
    h1: 'Cognitive Research Peptides',
    intro:
      'Nootropic and neuro-pathway peptides supplied for laboratory research across the UK and UAE, each batch HPLC-tested for identity and purity with the certificate published, not just asserted.',
    examples: 'nootropic peptides, neuro-pathway research compounds',
  },
  recovery: {
    title: 'Recovery Peptides for Sale — Research Grade | UK & UAE',
    description:
      'Recovery and tissue-repair research peptides for laboratory use, shipped across the UK and UAE. Independently tested purity, COA published for every lot.',
    h1: 'Recovery Research Peptides',
    intro:
      'Peptides used in tissue-repair and recovery-pathway research, including BPC-157 and related compounds, tested for identity and HPLC purity ahead of dispatch to the UK and UAE.',
    examples: 'BPC-157, tissue-repair research peptides',
  },
  'anti-ageing': {
    title: 'Anti-Ageing Peptides for Sale — Research Grade | UK & UAE',
    description:
      'Longevity and anti-ageing research peptides for laboratory use, shipped across the UK and UAE. HPLC-verified purity with a published Certificate of Analysis per batch.',
    h1: 'Anti-Ageing Research Peptides',
    intro:
      'Longevity-pathway peptides, including Epithalon and GHK-Cu, supplied for laboratory research in the UK and UAE. Purity and identity are HPLC-confirmed and published per batch, not marketing copy.',
    examples: 'Epithalon, GHK-Cu, longevity-pathway research peptides',
  },
  accessories: {
    title: 'Peptide Research Accessories — Vials, Pins & Supplies | UK & UAE',
    description:
      'Bacteriostatic water, syringes, and reconstitution supplies for peptide research, shipped across the UK and UAE.',
    h1: 'Research Accessories & Supplies',
    intro:
      'Bacteriostatic water, sterile syringes, and the reconstitution supplies used alongside our research peptides — shipped across the UK and UAE. Pair with the reconstitution calculator in our research tools for lot-specific dilution figures.',
    examples: 'bacteriostatic water, syringes, reconstitution supplies',
  },
  immune: {
    title: 'Immune Peptides for Sale — Research Grade | UK & UAE',
    description:
      'Immune-pathway research peptides for laboratory use, shipped across the UK and UAE. Third-party HPLC-tested, Certificate of Analysis published per batch.',
    h1: 'Immune Research Peptides',
    intro:
      'Immune-pathway peptides supplied for laboratory research across the UK and UAE, tested by Freedom Diagnostics for identity and HPLC purity with the certificate published for the specific lot you receive.',
    examples: 'immune-pathway research peptides',
  },
}

export async function generateStaticParams() {
  return CATEGORIES.filter((c) => c.slug !== 'all').map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const content = CATEGORY_CONTENT[params.category]
  if (!content) {
    return { title: 'Category not found', robots: { index: false, follow: false } }
  }

  const url = `${SITE_URL}/products/category/${params.category}`

  return {
    // No brand suffix here either — same reasoning as /products/page.tsx:
    // root layout's template already appends "| PepcoLab" once.
    title: content.title.replace(' | PepcoLab', ''),
    description: content.description,
    alternates: { canonical: `/products/category/${params.category}` },
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const content = CATEGORY_CONTENT[params.category]
  const catMeta = CATEGORIES.find((c) => c.slug === params.category)
  if (!content || !catMeta) {
    // Unknown category slug — send visitors to the full catalogue rather
    // than a dead end. (Doesn't 404 mid-render for a typo'd internal link.)
    return (
      <>
        <Nav />
        <div style={{ padding: '120px 24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <p>That category doesn&apos;t exist.</p>
          <Link href="/products">Browse all products →</Link>
        </div>
        <Footer />
      </>
    )
  }

  const country = (await cookies()).get('pepcolab_country')?.value ?? 'AE'

  let products: any[] = []
  try {
    const all = await getProducts(250, country)
    products = all.filter((p: any) => p.categorySlug === params.category)
  } catch (err) {
    console.error(`[products/category/${params.category}] fetch failed:`, err)
  }

  const otherCategories = CATEGORIES.filter(
    (c) => c.slug !== 'all' && c.slug !== params.category
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: content.h1,
    description: content.description,
    url: `${SITE_URL}/products/category/${params.category}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
        {
          '@type': 'ListItem',
          position: 3,
          name: catMeta.label,
          item: `${SITE_URL}/products/category/${params.category}`,
        },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 40).map((p: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/products/${p.slug ?? p.handle}`,
        name: p.name ?? p.title,
      })),
    },
  }

  return (
    <>
      <Nav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cp-hero {
          background: #090909;
          padding: clamp(40px,6vw,72px) clamp(16px,4vw,60px) clamp(32px,5vw,56px);
        }
        .cp-hero-inner { max-width: 1400px; margin: 0 auto; }
        .cp-breadcrumb {
          font-size: 12px;
          color: rgba(255,255,255,.4);
          margin-bottom: clamp(20px,3vw,32px);
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .cp-breadcrumb a { color: rgba(255,255,255,.55); text-decoration: none; }
        .cp-breadcrumb a:hover { color: #fff; }
        .cp-eyebrow {
          font-size: 10px;
          letter-spacing: .24em;
          text-transform: uppercase;
          color: rgba(255,255,255,.4);
          font-weight: 700;
          margin-bottom: 16px;
        }
        .cp-h1 {
          font-family: Georgia, serif;
          font-size: clamp(38px,7vw,72px);
          line-height: .95;
          letter-spacing: -.05em;
          color: #fff;
          margin-bottom: 18px;
          max-width: 820px;
        }
        .cp-intro {
          font-size: clamp(14px,1.8vw,16px);
          line-height: 1.85;
          color: rgba(255,255,255,.55);
          max-width: 640px;
        }

        .cp-grid-section {
          background: #f7f7f5;
          padding: clamp(40px,5vw,64px) clamp(16px,4vw,60px);
        }
        .cp-grid-inner { max-width: 1400px; margin: 0 auto; }
        .cp-grid-empty {
          font-size: 14px;
          color: rgba(13,13,13,.5);
          padding: 40px 0;
        }
        .cp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .cp-related {
          background: #fff;
          border-top: 1px solid rgba(13,13,13,.08);
          padding: clamp(32px,4vw,48px) clamp(16px,4vw,60px);
        }
        .cp-related-inner { max-width: 1400px; margin: 0 auto; }
        .cp-related-label {
          font-size: 10px;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: rgba(13,13,13,.4);
          font-weight: 700;
          margin-bottom: 16px;
        }
        .cp-related-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .cp-related-link {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(13,13,13,.14);
          color: #0d0d0d;
          text-decoration: none;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          transition: border-color .15s, background .15s;
        }
        .cp-related-link:hover { border-color: rgba(13,13,13,.4); background: #f7f7f5; }
      `}</style>

      <section className="cp-hero">
        <div className="cp-hero-inner">
          <nav className="cp-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span>/</span>
            <Link href="/products">Products</Link><span>/</span>
            <span style={{ color: 'rgba(255,255,255,.7)' }}>{catMeta.label}</span>
          </nav>
          <div className="cp-eyebrow">Research Peptides · UK &amp; UAE</div>
          <h1 className="cp-h1">{content.h1}</h1>
          <p className="cp-intro">{content.intro}</p>
        </div>
      </section>

      <section className="cp-grid-section">
        <div className="cp-grid-inner">
          {products.length === 0 ? (
            <p className="cp-grid-empty">
              No {catMeta.label.toLowerCase()} compounds currently in stock — check{' '}
              <Link href="/products">the full catalogue</Link> or check back shortly.
            </p>
          ) : (
            <div className="cp-grid">
              {products.map((p: any) => (
                <ProductCard key={p.id ?? p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="cp-related">
        <div className="cp-related-inner">
          <div className="cp-related-label">Browse other categories</div>
          <div className="cp-related-links">
            {otherCategories.map((c) => (
              <Link key={c.slug} href={`/products/category/${c.slug}`} className="cp-related-link">
                {c.label}
              </Link>
            ))}
            <Link href="/products" className="cp-related-link">All products</Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
