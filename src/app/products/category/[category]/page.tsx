// app/products/category/[category]/page.tsx
//
// WHY THIS EXISTS
// ----------------
// /products?cat=<slug> (ProductsSection's client-side filter) was the
// only way to browse a category, and query-string routes don't reliably get
// indexed as distinct pages — sitemap.ts even has a standing TODO flagging
// this exact gap: "If you want category pages indexed, make them real
// routes ... then add them here." This is that route.
//
// Each category now has its own crawlable URL, unique <title>/description,
// a unique H1 and intro paragraph (keyword-targeted at "<category> peptides
// UAE" search intent — not stuffed, just specific and honest), and
// CollectionPage + ItemList structured data. sitemap.ts should list these
// once this ships — see the note added there.
//
// Copy is deliberately kept in the same research-use register as the rest
// of the site: no therapeutic/benefit claims, no usage claims. Same reason
// REVIEWS in data.ts strips fabricated "Dr." credentials and invented
// lab-match quotes — overclaiming here is exactly what UK ASA / ACCC-style
// regulators and Google's own health-content quality raters penalise, which
// works against the ranking goal rather than for it.

import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { getProducts } from '@/lib/shopify'
import { CATEGORIES } from '@/app/data'
import { PRODUCT_CLASSES } from '@/lib/productClasses'
import { productHref } from '@/lib/utils'

const SITE_URL = 'https://www.pepcolab.com'

interface Props {
  params: { category: string }
}

// Per-class SEO copy lives with the class definitions in
// lib/productClasses.ts (Oct 2026: compound classes replaced the old
// health-goal categories; old slugs 301 via next.config.js).
const CATEGORY_CONTENT: Record<
  string,
  { title: string; description: string; h1: string; intro: string; examples: string }
> = Object.fromEntries(PRODUCT_CLASSES.map((c) => [c.slug, c.seo]))

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
    alternates: {
      canonical: `/products/category/${params.category}`,
      languages: {
        'en-GB': `/products/category/${params.category}`,
        'en-AE': `/products/category/${params.category}`,
        'x-default': `/products/category/${params.category}`,
      },
    },
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
    // Unknown or withdrawn class — a real 404, never a 200 "not found" page.
    notFound()
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
        url: `${SITE_URL}${productHref(p.slug ?? p.handle)}`,
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
          <div className="cp-eyebrow">Research Peptides · UAE</div>
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