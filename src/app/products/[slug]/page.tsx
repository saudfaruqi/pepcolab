// src/app/products/[slug]/page.tsx

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductVariantView from '@/components/ProductVariantView'
import ProductCard from '@/components/ProductCard'
import ProductReviews from '@/components/ProductReviews'

import { ChevronRight } from 'lucide-react'
import { getProducts, getProductByHandle } from '@/lib/shopify'
import { stripLeadingName, toNeutralSlug, toShopifyHandle, productHref } from '@/lib/utils'
import { relatedContentForProduct } from '@/lib/contentLinks'
import { getApprovedReviews, type Review } from '@/lib/reviewStore'

const SITE_URL = 'https://www.pepcolab.com'

/** Catalogue plumbing, not research categories — never used for matching. */
const MARKET_TAGS = new Set(['uae', 'uk'])

interface Props {
  params: { slug: string }
}

/**
 * CURRENCY & MARKET
 * -----------------
 * Built with AED prices. ProductActions re-fetches with the visitor's country
 * once useCountry() resolves and normaliseProduct() converts at that point, so
 * the page stays statically rendered — no cookie read on the server.
 *
 * Market gating is client-side for the same reason. While UK_CATALOGUE_LIVE is
 * false (pricing.ts) every product is sold in both markets and MarketGuard is
 * inert. Once it's true, a visitor who lands on a product from the other
 * catalogue gets a notice instead of a buy button.
 *
 * Deliberately NOT a server-side cookie read + notFound(): that would make
 * every product page dynamic, and it would 404 the page for Googlebot, which
 * crawls from US IPs with no market cookie. See isInMarket() in pricing.ts.
 */
export const revalidate = 60

export async function generateStaticParams() {
  // No country argument -> unfiltered, so BOTH catalogues get enumerated.
  // Keep this cap in sync with sitemap.ts.
  //
  // SEO FIX: emit the NEUTRAL slug (no "-uae") as the param Next.js
  // pre-renders — that's what becomes the real, indexed, canonical URL.
  // The legacy "{handle}" path (still "-uae"-suffixed) is no longer
  // statically built; middleware.ts 301-redirects it here instead. See
  // toNeutralSlug() in lib/utils.ts for the full rationale.
  //
  // RESILIENCE FIX (Sep 2026): this was an unguarded await. sitemap.ts and
  // app/page.tsx both wrap their getProducts() calls in try/catch precisely
  // so a Shopify outage cannot take down a route — this one did not, and it
  // is the most fragile place to leave unguarded: a throw here fails
  // `next build` entirely ("Failed to collect page data for /products/[slug]"),
  // so a transient Storefront API error, an expired token, or a rate limit
  // during a Vercel deploy blocks the whole deployment rather than degrading
  // one page.
  //
  // Returning [] is safe: `dynamicParams` defaults to true, so product pages
  // are still rendered on demand and cached by the existing revalidate = 60.
  // The only cost of an empty list is that the first request per product is
  // uncached — a far better outcome than a failed deploy.
  try {
    const products = await getProducts(250)
    return products.map((product) => ({ slug: toNeutralSlug(product.handle) }))
  } catch (err) {
    console.error('[products/[slug]] generateStaticParams: Shopify fetch failed, falling back to on-demand rendering:', err)
    return []
  }
}

/* -------------------------------------------------------------------------- */
/* METADATA                                                                    */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Generated without a market so Googlebot always gets a full, indexable
  // page regardless of which catalogue the product belongs to.
  // params.slug is the NEUTRAL slug; resolve it to the real Shopify handle.
  const product = await getProductByHandle(toShopifyHandle(params.slug))

  if (!product) {
    return { title: 'Product not found', robots: { index: false, follow: false } }
  }

  const canonical = productHref(product.handle)

  // Factual and compound-focused. No effects, benefits, outcomes or
  // indications — the meta description is the most screenshotted surface on
  // the site and the easiest thing for a regulator to quote back.
  const description =
    `${product.title} — research-grade compound with published certificate of analysis` +
    (product.purity ? `, ${product.purity}% HPLC-verified purity` : '') +
    (product.lot ? `, batch ${product.lot}` : '') +
    '. Cold-chain dispatch. For in-vitro research use only.'

  const ogImage = product.images?.[0]?.url

  return {
    title: `${product.title} | Research Grade, COA Published`,
    description,
    // SEO FIX: sitewide hreflang was missing entirely (audit finding —
    // "no hreflang tags sitewide despite dual-market intent"). There's one
    // URL per product serving both the UK and UAE catalogue (currency
    // switches client-side, see lib/pricing.ts), so this is a genuine
    // same-URL, dual-region page — the correct hreflang pattern here is
    // self-referencing annotations for both locales plus x-default, not a
    // second URL. If/when the catalogue splits into real /uk and /ae
    // paths, replace this with distinct URLs per language entry instead.
    alternates: {
      canonical,
      languages: {
        'en-GB': canonical,
        'en-AE': canonical,
        'x-default': canonical,
      },
    },
    openGraph: {
      title: `${product.title} | PepcoLab`,
      description,
      url: `${SITE_URL}${canonical}`,
      type: 'website',
      images: ogImage ? [{ url: ogImage, alt: product.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} | PepcoLab`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * ProductVariantView renders `product.oneLiner`, so it's derived here.
 * Strips a leading repeat of the product name first — Shopify descriptions
 * usually open with the name (e.g. "BPC-157 5mg is a…"), and this one-liner
 * sits directly under the <h1> that already shows it.
 */
function getOneLiner(description?: string, name?: string): string {
  if (!description) return ''
  const body = stripLeadingName(description, name)
  const sentences = body.split(/(?<=[.!?])\s+/)
  for (const s of sentences) {
    const clean = s.trim()
    if (clean.length < 40) continue
    if (clean.includes(' – ') || clean.includes(' - ')) continue
    return clean.endsWith('.') || clean.endsWith('!') || clean.endsWith('?') ? clean : clean + '.'
  }
  return body.slice(0, 120).trim() + '…'
}

/** The research category tag, ignoring market tags. */
function categoryTag(tags: string[] = []): string | undefined {
  return tags.map((t) => t.toLowerCase()).find((t) => !MARKET_TAGS.has(t))
}

/**
 * Related products: same research category first, then anything else to fill
 * the row. The top-up matters — several categories (immune, accessories) have
 * only 2-3 products, so a category-only match would render a lonely single
 * card or an empty section on those pages.
 */
function pickRelated(all: any[], current: any, limit = 4) {
  const cat = categoryTag(current.tags)
  const pool = all.filter((p) => p.handle !== current.handle)

  const sameCategory = cat
    ? pool.filter((p) => (p.tags ?? []).map((t: string) => t.toLowerCase()).includes(cat))
    : []

  const rest = pool.filter((p) => !sameCategory.includes(p))

  return [...sameCategory, ...rest].slice(0, limit)
}

function buildJsonLd(product: any, reviews: Review[] = []) {
  const url = `${SITE_URL}${productHref(product.handle)}`

  const productLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    sku: product.lot ?? product.handle,
    url,
    image: product.images?.map((i: any) => i.url).filter(Boolean) ?? [],
    brand: { '@type': 'Brand', name: 'PepcoLab' },
  }

  // SEO FIX (growth-playbook §08: "AggregateRating/Review once real reviews
  // exist"). This was deliberately withheld while the only reviews on the
  // site were the hardcoded, fabricated arrays in data.ts/HomePageContent —
  // marking those up would have been a Google structured-data policy
  // violation and a DMCC Act 2024 fake-reviews breach. That's no longer the
  // situation: `reviews` here comes exclusively from reviewStore's approved
  // set, which requires manual moderation and ties `verified` to a real,
  // matching order (see reviewStore.ts header comment). Only mark up once at
  // least one real approved review exists for this product — an
  // aggregateRating with reviewCount 0 is itself a schema violation.
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    productLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(avg.toFixed(1)),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    }
    // Cap at 10 in the schema itself — plenty for rich-result eligibility
    // without ballooning page weight as review volume grows.
    productLd.review = reviews.slice(0, 10).map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: r.authorName },
      reviewBody: r.text,
      datePublished: r.createdAt,
    }))
  }

  // Structured data always advertises the CHARGED currency (AED), never the
  // GBP display conversion — Google surfaces this price in search results and
  // it has to match what the customer is actually billed.
  if (product.price != null) {
    productLd.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: product.currencyCode ?? 'AED',
      price: String(product.price),
      availability: product.inStock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'PepcoLab' },
    }
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: product.title, item: url },
    ],
  }

  return [productLd, breadcrumbLd]
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                        */
/* -------------------------------------------------------------------------- */

export default async function ProductPage({ params }: Props) {
  // Built in AED. ProductActions swaps in the visitor's currency client-side.
  // Both calls run in parallel — the related list shouldn't add a serial
  // round-trip to the page's render time.
  const [shopifyProduct, allProducts] = await Promise.all([
    getProductByHandle(toShopifyHandle(params.slug), 'AE'),
    getProducts(40, 'AE').catch(() => [] as any[]),
  ])

  // Real 404 (renders src/app/not-found.tsx) rather than a 200 with a
  // "not found" message, which Google indexes as a thin duplicate page.
  if (!shopifyProduct) {
    notFound()
  }

  // SEO/GEO FIX: reviews used to be fetched entirely client-side in
  // ProductReviews.tsx ('use client' + useEffect), which meant real review
  // text never appeared in the HTML Googlebot/AI crawlers see on first
  // load — a JS-only content block, exactly what growth-playbook §05/§08
  // says to avoid ("Answer-first content blocks rendered in server HTML,
  // not JS-only, so crawlers read them"). Fetched here instead so it can
  // both seed the Review/AggregateRating schema above and hydrate
  // ProductReviews with real markup already in the response.
  // getApprovedReviews() returns null (not []) when the fetch itself
  // failed — see reviewStore.ts. Treating that as "confirmed zero reviews"
  // was the actual bug here: it baked a false empty state into both this
  // page's static HTML and ProductReviews' initialReviews prop, which
  // permanently skips its own client-side re-fetch whenever it's handed a
  // non-null array — including an empty one. `?? []` below is only for
  // buildJsonLd, which already treats an empty array as "don't emit
  // AggregateRating," the same safe behavior whether reviews are genuinely
  // zero or just unknown right now.
  // BUILD-TIME SKIP (Sep 2026)
  //
  // @upstash/redis fetches with `cache: 'no-store'`, which Next 14.2.5 treats
  // as DYNAMIC_SERVER_USAGE inside a statically-generated page. During
  // `next build` this read therefore ALWAYS fails — 37 products × 2 attempts
  // = 74 stack traces per deploy, and roughly 4.5 seconds of retry per page,
  // which is most of a three-minute build.
  //
  // It was never going to succeed, so we no longer try. Skipping it during
  // the build removes the noise and the wasted time; on a real request the
  // ISR revalidate below re-renders the page and the read works normally.
  //
  // WHAT THIS COSTS, STATED PLAINLY: the FIRST build of each product page
  // ships without reviews and without AggregateRating in its schema. The
  // client-side fallback fills reviews in for human visitors, but a crawler
  // hitting a freshly-built page may miss the markup. With revalidate = 60
  // that window is one minute per page, so in practice Google sees the
  // regenerated version — but if you ever want review rich results
  // guaranteed, product pages need to be dynamic rather than prerendered.
  // That is a deliberate trade, not an oversight: 37 static pages are worth
  // more today than review markup on pages that have almost no reviews yet.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
  const approvedReviews = isBuildPhase
    ? null
    : await getApprovedReviews(20, shopifyProduct.handle).catch(() => null)

  // ProductVariantView owns the whole two-column layout and passes
  // selectedVariantId / onSelectVariant down to ProductActions, so the format
  // picker can drive the main image. It reads `oneLiner` off the product, so
  // that gets derived here on the server.
  const product = {
    ...shopifyProduct,
    id: shopifyProduct.shopifyId,
    slug: shopifyProduct.handle,
    name: shopifyProduct.title,
    shortName: shopifyProduct.title,
    oneLiner: getOneLiner(shopifyProduct.description, shopifyProduct.title),
    category: categoryTag(shopifyProduct.tags) || '',
    categorySlug: categoryTag(shopifyProduct.tags) || '',
    badge: undefined as undefined,
    color: {
      bg: '#f5f7fb', accent: '#2563eb', pill: '#dbeafe', pillText: '#1d4ed8',
      purityBar: '#2563eb', btn: '#2563eb', vialFrom: '#2563eb', vialTo: '#7c3aed',
    },
  }

  const jsonLd = buildJsonLd(shopifyProduct, approvedReviews ?? [])
  const related = pickRelated(allProducts, shopifyProduct, 4)
  const relatedCategory = categoryTag(shopifyProduct.tags)
  // SEO FIX: product pages had zero links into /guides or /research (audit
  // finding — 15 articles "orphaned... zero internal links either way").
  // This is the product -> content half of that fix; see
  // relatedContentForProduct() in lib/contentLinks.ts. The content -> product
  // half lives in app/guides/[slug]/page.tsx and app/research/[slug]/page.tsx.
  const relatedContent = relatedContentForProduct(shopifyProduct.title, categoryTag(shopifyProduct.tags))

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <Nav />

      <main style={{ background: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* Breadcrumb */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#9ca3af' }}>
            <a href="/" style={{ color: '#9ca3af', textDecoration: 'none' }}>Home</a>
            <ChevronRight size={12} />
            <a href="/products" style={{ color: '#9ca3af', textDecoration: 'none' }}>Products</a>
            <ChevronRight size={12} />
            <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {shopifyProduct.title}
            </span>
          </div>
        </div>

        <ProductVariantView product={product} />

        {/* Open to anyone — not gated behind proof of purchase. Verified
            badge only appears when the submitted order actually checks out
            server-side (see ProductReviews.tsx / submit/route.ts). */}
        <ProductReviews
          productSlug={shopifyProduct.handle}
          productTitle={shopifyProduct.title}
          // undefined (not []) when approvedReviews is null — this is what
          // makes ProductReviews run its own client-side fetch against
          // /api/reviews instead of trusting a failed build-time fetch that
          // looks identical to "this product really has zero reviews."
          initialReviews={
            approvedReviews
              ? approvedReviews.map((r) => ({
                  id: r.id,
                  productTitle: r.productTitle,
                  authorName: r.authorName,
                  rating: r.rating,
                  text: r.text,
                  verified: r.verified,
                  createdAt: r.createdAt,
                }))
              : undefined
          }
        />

        {/* ── Related products ──────────────────────────────────────────────
            Server-rendered from the same catalogue fetch, so these are real
            internal links in the HTML rather than client-injected ones. That
            matters for SEO: product pages otherwise link only up to
            /products, leaving the deep catalogue thinly connected. */}
        {related.length > 0 && (
          <section
            style={{
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa',
              padding: '48px 0 72px',
            }}
          >
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                      color: '#9ca3af',
                      marginBottom: 8,
                    }}
                  >
                    You may also need
                  </div>
                  <h2
                    style={{
                      fontSize: 'clamp(22px, 3vw, 32px)',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      color: '#0d0d0d',
                      lineHeight: 1.1,
                      margin: 0,
                    }}
                  >
                    Related compounds
                  </h2>
                </div>

                <Link
                  href={relatedCategory ? `/products/category/${relatedCategory}` : '/products'}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0d0d0d',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(13,13,13,.2)',
                    paddingBottom: 2,
                  }}
                >
                  View all →
                </Link>
              </div>

              <div className="pp-related-grid">
                {related.map((p: any) => (
                  <ProductCard key={p.shopifyId || p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Research & Guides — internal linking into the previously-orphaned
            content hub. Kept short and skippable; it's a discovery path for
            crawlers and researchers, not a hard sell. */}
        {relatedContent.length > 0 && (
          <section style={{ borderTop: '1px solid #f0f0f0', padding: '40px 0 56px' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14 }}>
                Research & Guides
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {relatedContent.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 13, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none',
                      border: '1px solid #e5e7eb', borderRadius: 999, padding: '9px 16px',
                    }}
                  >
                    {c.label} <ChevronRight size={13} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Layout classes used by ProductVariantView live here so the grid
            stays with the route rather than being duplicated per component. */}
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          .pp-outer {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px 16px 80px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .pp-image-col { width: 100%; min-width: 0; }

          /* Square image container — padding-top trick for a reliable square
             on all devices. */
          .pp-image-box {
            position: relative;
            width: 100%;
            padding-top: 100%;
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid #f0f0f0;
            background: #fafafa;
          }

          .pp-main-img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 20px;
          }

          .pp-info-col { width: 100%; min-width: 0; }

          .pp-trust-desktop { display: none; }

          .pp-trust-mobile {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-bottom: 4px;
          }

          /* Matches .products-grid on the homepage so cards line up the same
             way across the site. */
          .pp-related-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          @media (min-width: 900px) {
            .pp-outer {
              grid-template-columns: 1fr 1fr;
              gap: 60px;
              align-items: start;
              padding: 28px 32px 100px;
            }

            .pp-image-col { position: sticky; top: 80px; }

            .pp-trust-desktop {
              display: flex;
              flex-direction: column;
              gap: 11px;
              margin-top: 22px;
            }

            .pp-trust-mobile { display: none; }

            .pp-related-grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 20px;
            }
          }

          /* Shopify HTML description */
          .shopify-desc { font-size: 13px; line-height: 1.85; color: #626A85; }
          .shopify-desc p { margin-bottom: 1em; }
          .shopify-desc strong { font-weight: 700; color: #0D0F14; }
          .shopify-desc h2 { font-size: 14px; font-weight: 700; color: #0D0F14; margin: 1.2em 0 0.4em; }
          .shopify-desc h3 { font-size: 13px; font-weight: 700; color: #0D0F14; margin: 1em 0 0.4em; }
          .shopify-desc ul, .shopify-desc ol { padding-left: 1.3em; margin-bottom: 1em; }
          .shopify-desc li { margin-bottom: 0.3em; }
          .shopify-desc table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px; border: 1px solid #E5EAF5; border-radius: 10px; overflow: hidden; }
          .shopify-desc th { text-align: left; padding: 9px 12px; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #AAB3C8; background: #F8F9FC; border-bottom: 1px solid #E5EAF5; }
          .shopify-desc td { padding: 9px 12px; color: #626A85; border-bottom: 1px solid #F3F5FB; vertical-align: top; line-height: 1.6; }
          .shopify-desc td:first-child { font-weight: 600; color: #0D0F14; width: 36%; }
          .shopify-desc tr:last-child td { border-bottom: none; }
        `}</style>
      </main>

      <Footer />
    </>
  )
}