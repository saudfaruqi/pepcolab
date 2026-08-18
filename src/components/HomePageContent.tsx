// components/HomePageContent.tsx

"use client";
import Nav from "@/components/Nav";
import { useState, useEffect, useRef, useId, useCallback, useMemo } from "react";
import HeroCinematic from "@/components/HeroSections";
import ProductCard from "@/components/ProductCard";
import { getProducts as DATA_PRODUCTS } from "@/lib/shopify";
import { useCart } from "@/lib/cartContext";
import { formatPrice } from "@/lib/utils";
import Footer from "@/components/Footer";
import Link from "next/link";
import { BUNDLES as CURATED_BUNDLES } from "@/app/data";
import { isPaymentLinkOnlyProduct, getPaymentLinkForVariant, isPlaceholderLink } from "@/lib/restrictedCheckout";


import { useCountry } from '@/lib/countryContext'
import BestSellersSection from "./BestSellersSection";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useIsMobile(bp = 768) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const fn = () => setV(window.innerWidth < bp);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return v;
}

function useInView(rootMargin = "0px 0px -60px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductColor = {
  bg: string; accent: string; pill: string; pillText: string;
  purityBar: string; btn: string; vialFrom: string; vialTo: string;
};

type NormalisedProduct = {
  id: string; shopifyId: string; handle: string; slug: string; title: string;
  name: string; shortName: string; mg: string; variantId: string; price: number;
  currencyCode: string;
  oldPrice?: number; inStock: boolean; stockCount: number; image?: string; imageAlt: string;
  badge?: "popular" | "new" | "sale" | "bestseller"; tags: string[];
  category: string; categorySlug: string; description: string; testDate: string;
  purity?: number; lot?: string; sequence?: string; longDesc?: string;
  color: ProductColor;
  metafields?: Record<string, string | number | boolean | null>;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  "HPLC-Verified Purity", "Freedom Diagnostics Tested", "Cold-Chain Dispatch",
  "Batch COA Published", "Carbon Neutral Shipping", "Next-Day UK Delivery",
  "99%+ Purity Guaranteed", "Free Tracked Shipping Over AED80",
];

interface RealReview {
  id: string
  productTitle: string
  authorName: string
  rating: number
  text: string
  createdAt: string
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('')
}

const AREA_ACCENTS: Record<string, string> = {
  metabolic:     "#3B82F6",
  hormonal:      "#F59E0B",
  cognitive:     "#A78BFA",
  recovery:      "#34D399",
  "anti-ageing": "#F472B6",
  accessories:   "#4ADE80",
  immune:        "#FBBF24",
}

const AREA_LABELS: Record<string, string> = {
  metabolic:     "Metabolic",
  hormonal:      "Hormonal",
  cognitive:     "Cognitive",
  recovery:      "Recovery",
  "anti-ageing": "Anti-Ageing",
  accessories:   "Accessories",
  immune:        "Immune",
}

const MARKET_TAGS = new Set(["uae", "uk"])

// ─── Typography System ──────────────────────────────────────────────────────

const TYPOGRAPHY = {
  label: {
    fontSize: "clamp(10px, 0.8vw, 11px)",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "rgba(13,13,13,0.3)",
  },
  labelLight: {
    fontSize: "clamp(10px, 0.8vw, 11px)",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
  },
  heading: {
    fontSize: "clamp(32px, 5vw, 52px)",
    fontWeight: 600,
    letterSpacing: "-0.03em",
    lineHeight: "1.1",
    color: "#0D0D0D",
  },
  headingLight: {
    fontSize: "clamp(32px, 5vw, 52px)",
    fontWeight: 600,
    letterSpacing: "-0.03em",
    lineHeight: "1.1",
    color: "#FFFFFF",
  },
  subheading: {
    fontSize: "clamp(13px, 1.1vw, 15px)",
    fontWeight: 400,
    lineHeight: "1.6",
    color: "rgba(13,13,13,0.4)",
  },
  subheadingLight: {
    fontSize: "clamp(13px, 1.1vw, 15px)",
    fontWeight: 400,
    lineHeight: "1.6",
    color: "rgba(255,255,255,0.4)",
  },
  cardTitle: {
    fontSize: "clamp(16px, 1.5vw, 20px)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: "1.2",
    color: "#0D0D0D",
  },
  cardTitleLight: {
    fontSize: "clamp(16px, 1.5vw, 20px)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: "1.2",
    color: "#FFFFFF",
  },
  cardMeta: {
    fontSize: "clamp(10px, 0.8vw, 11px)",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "rgba(13,13,13,0.3)",
  },
  cardMetaLight: {
    fontSize: "clamp(10px, 0.8vw, 11px)",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
  },
  cardDesc: {
    fontSize: "clamp(12px, 1vw, 13px)",
    fontWeight: 400,
    lineHeight: "1.6",
    color: "rgba(13,13,13,0.4)",
  },
  cardDescLight: {
    fontSize: "clamp(12px, 1vw, 13px)",
    fontWeight: 400,
    lineHeight: "1.6",
    color: "rgba(255,255,255,0.4)",
  },
  price: {
    fontSize: "clamp(18px, 1.8vw, 22px)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#0D0D0D",
  },
  priceLight: {
    fontSize: "clamp(18px, 1.8vw, 22px)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#FFFFFF",
  },
  button: {
    fontSize: "clamp(11px, 0.9vw, 12px)",
    fontWeight: 500,
    letterSpacing: "0.04em",
  },
  small: {
    fontSize: "clamp(9px, 0.7vw, 10px)",
    fontWeight: 400,
    lineHeight: "1.5",
    color: "rgba(13,13,13,0.2)",
  },
  smallLight: {
    fontSize: "clamp(9px, 0.7vw, 10px)",
    fontWeight: 400,
    lineHeight: "1.5",
    color: "rgba(255,255,255,0.2)",
  },
} as const;

// ─── Vial SVG ─────────────────────────────────────────────────────────────────

function Vial({ fromColor = "#EEF2FD", toColor = "#3B82F6", mg = "5mg", size = "md" }: {
  fromColor?: string; toColor?: string; mg?: string; size?: "sm"|"md"|"lg"|"xl"
}) {
  const uid = useId().replace(/:/g, "");
  const s = ({ sm:{w:28,h:56,cH:11,cW:18,bR:10}, md:{w:36,h:72,cH:14,cW:24,bR:13}, lg:{w:48,h:96,cH:18,cW:30,bR:17}, xl:{w:64,h:128,cH:24,cW:40,bR:22} })[size] ?? {w:36,h:72,cH:14,cW:24,bR:13};
  return (
    <svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`} aria-hidden>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={fromColor}/><stop offset="100%" stopColor={toColor}/>
        </linearGradient>
      </defs>
      <rect x={(s.w-s.cW)/2} y={0} width={s.cW} height={s.cH} rx="3" fill={`url(#g${uid})`}/>
      <rect x={(s.w-s.cW)/2+3} y={2} width={4} height={s.cH-4} rx="2" fill="rgba(255,255,255,.5)"/>
      <rect x={(s.w-s.bR*2)/2} y={s.cH} width={s.bR*2} height={s.h-s.cH-s.bR} fill={`url(#g${uid})`}/>
      <ellipse cx={s.w/2} cy={s.h-s.bR} rx={s.bR} ry={s.bR} fill={toColor}/>
      <rect x={(s.w-s.bR*2)/2+4} y={s.cH+6} width={5} height={s.h-s.cH-s.bR-16} rx="2.5" fill="rgba(255,255,255,.4)"/>
      <rect x={(s.w-s.bR*2)/2+3} y={s.cH+(s.h-s.cH)*.3} width={s.bR*2-6} height={(s.h-s.cH)*.28} rx="2" fill="rgba(255,255,255,.25)"/>
      <text x={s.w/2} y={s.h-6} textAnchor="middle" fontSize={size==="xl"?10:size==="lg"?8:7} fontWeight="600" fill="rgba(255,255,255,.9)" fontFamily="system-ui,sans-serif">{mg}</text>
    </svg>
  );
}

// ─── Product skeleton ─────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div style={{ borderRadius: 20, overflow: "hidden", background: "#f0f0ee", animation: "pulse 1.6s ease infinite" }}>
      <div style={{ paddingTop: "100%", background: "#e8e8e5" }} />
      <div style={{ padding: "20px 18px 22px" }}>
        <div style={{ height: 10, width: "40%", background: "#e0e0dc", borderRadius: 6, marginBottom: 10 }} />
        <div style={{ height: 18, width: "75%", background: "#e0e0dc", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 14, width: "30%", background: "#e0e0dc", borderRadius: 6, marginBottom: 20 }} />
        <div style={{ height: 44, background: "#e0e0dc", borderRadius: 12 }} />
      </div>
    </div>
  );
}

function ProductLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 14, padding: "48px 24px", textAlign: "center",
      background: "#faf7f2", borderRadius: 20, border: "1px solid rgba(13,13,13,.08)",
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0d0d0d" }}>Couldn't load products</div>
      <div style={{ fontSize: 13, color: "rgba(13,13,13,.55)", maxWidth: 360 }}>
        Something went wrong reaching the catalogue. Check your connection and try again.
      </div>
      <button
        onClick={onRetry}
        style={{ height: 40, padding: "0 20px", borderRadius: 999, border: "none", background: "#0d0d0d", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        Retry
      </button>
    </div>
  );
}

// ─── Animated section wrapper ─────────────────────────────────────────────────

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ opacity: 0, transform: "translateY(28px)", transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`, ...(inView ? { opacity: 1, transform: "translateY(0)" } : {}), ...style }}>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PepcoLabPage({
  initialProducts,
  initialCountry,
}: {
  initialProducts?: NormalisedProduct[]
  initialCountry?: string
}) {
  const [email,       setEmail]       = useState("");
  const [emailError,  setEmailError]  = useState<string | null>(null);
  const [subbed,      setSubbed]      = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [products,    setProducts]    = useState<NormalisedProduct[]>(initialProducts ?? []);
  const [loaded,      setLoaded]      = useState(Boolean(initialProducts && initialProducts.length > 0));
  const [loadError,   setLoadError]   = useState(false);
  const [retryToken,  setRetryToken]  = useState(0);

  const [realReviews, setRealReviews] = useState<RealReview[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRealReviews(Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReviewsLoaded(true);
      });
    return () => { cancelled = true };
  }, []);

  const { addItem } = useCart();
  const isMobile = useIsMobile();

  const { country, ready } = useCountry()

  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!ready) return;

    if (
      !hasHydrated.current &&
      initialProducts && initialProducts.length > 0 &&
      initialCountry && country === initialCountry
    ) {
      hasHydrated.current = true;
      return;
    }
    hasHydrated.current = true;

    let cancelled = false;
    setLoaded(false);
    setLoadError(false);

    DATA_PRODUCTS(40, country)
      .then((raw) => {
        if (cancelled) return;
        setProducts(raw.map((p: any) => ({
          ...p,
          currencyCode: p.currencyCode ?? 'AED',
          badge: (p.badge && ["popular","new","sale","bestseller"].includes(p.badge) ? p.badge : undefined) as NormalisedProduct["badge"],
        })));
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load products:", err);
        setLoadError(true);
        setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [country, ready, retryToken]);

  const storeCurrency = products[0]?.currencyCode ?? 'AED';

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    const samples = new Map<string, string[]>()
    for (const p of products) {
      for (const tag of p.tags ?? []) {
        const slug = tag.toLowerCase()
        if (MARKET_TAGS.has(slug)) continue
        counts.set(slug, (counts.get(slug) ?? 0) + 1)
        const list = samples.get(slug) ?? []
        if (list.length < 3 && p.name) list.push(p.name)
        samples.set(slug, list)
      }
    }
    return [...counts.entries()]
      .map(([slug, count]) => ({
        slug,
        count,
        label:
          AREA_LABELS[slug] ??
          slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        sampleNames: samples.get(slug) ?? [],
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [products])  

  const addToCart = useCallback((product: NormalisedProduct) => {
    // RETA (payment-link-only) can't go through the cart — send the visitor
    // straight to its payment link instead. See lib/restrictedCheckout.ts.
    if (isPaymentLinkOnlyProduct(product.slug)) {
      const link = getPaymentLinkForVariant(product.mg)
      if (!isPlaceholderLink(link)) window.open(link, '_blank', 'noopener,noreferrer')
      return
    }
    addItem(product.variantId, product.title, product.mg ?? "5mg", product.price, product.slug, product.image);
  }, [addItem]);

  const BUNDLES = useMemo(() => {
    return CURATED_BUNDLES.map((bundle) => {
      const bp = bundle.products
        .map((slug) => products.find(p => p.slug === slug))
        .filter((p): p is NormalisedProduct => Boolean(p))
        .map(p => ({ ...p, from: p.color?.vialFrom ?? "#3b82f6", to: p.color?.vialTo ?? "#8b5cf6" }))

      if (bp.length === 0) return null

      const staticTotal = bundle.price + bundle.save
      const discountRatio = staticTotal > 0 ? bundle.save / staticTotal : 0
      const liveTotal = bp.length === bundle.products.length
        ? bp.reduce((s, p) => s + p.price, 0)
        : null
      const discounted = liveTotal != null
        ? Math.round(liveTotal * (1 - discountRatio) * 100) / 100
        : bundle.price
      const total = liveTotal ?? staticTotal

      return {
        id: bundle.id,
        name: bundle.name,
        desc: bundle.desc,
        price: discounted,
        originalPrice: Math.round(total * 100) / 100,
        products: bp,
      }
    }).filter((b): b is NonNullable<typeof b> => b !== null)
  }, [products]);

  const addBundleToCart = useCallback((bundle: typeof BUNDLES[0]) => {
    bundle.products
      .filter(p => !isPaymentLinkOnlyProduct(p.slug)) // RETA can't go through the cart
      .forEach(p => addItem(p.variantId, p.title, p.mg ?? "5mg", p.price, p.slug, p.image));
  }, [addItem]);

  const featuredReview = [...realReviews].sort((a, b) => b.rating - a.rating)[0];

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Enter your email address.");
      return;
    }
    const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!looksValid) {
      setEmailError("That email doesn't look right — check for typos.");
      return;
    }
    setEmailError(null);
    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEmailError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubbed(true);
      setEmail("");
    } catch {
      setEmailError("Something went wrong. Please check your connection and try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const p1 = products[0];
  const p2 = products[1];

  return (
    <div style={{ background: "#FAFAF8", color: "#0d0d0d", minHeight: "100vh" }}>

      <style>{`
        @keyframes ticker    { 0%{transform:translateX(0)}      100%{transform:translateX(-33.33%)} }
        @keyframes marquee   { 0%{transform:translateX(0)}      100%{transform:translateX(-50%)} }
        @keyframes pulse     { 0%,100%{opacity:.5}              50%{opacity:.8} }
        * { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        @media(prefers-reduced-motion:reduce) {
          *,*::before,*::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
        }
        .scrollbar-hidden::-webkit-scrollbar { display:none; }
        .products-grid {
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:20px;
        }
        @media(max-width:768px) {
          .products-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
        }
        .area-row {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:24px;
          padding:26px 4px 26px 20px;
          border-top:1px solid rgba(255,255,255,.09);
          text-decoration:none;
          position:relative;
          transition:padding-left .25s cubic-bezier(.22,1,.36,1);
        }
        .areas-grid-wrap .area-row:last-child { border-bottom:1px solid rgba(255,255,255,.09); }
        .area-row:hover { padding-left:28px; }
        .area-row-accent {
          position:absolute;
          left:0; top:14px; bottom:14px;
          width:3px;
          opacity:.25;
          transition:opacity .25s ease;
        }
        .area-row:hover .area-row-accent { opacity:1; }
        .area-row-arrow { transition:transform .25s cubic-bezier(.22,1,.36,1); }
        .area-row:hover .area-row-arrow { transform:translateX(4px); stroke:rgba(255,255,255,.8); }
        @media(max-width:480px) {
          .area-row { gap:14px; padding:20px 4px 20px 16px; }
          .area-row:hover { padding-left:22px; }
        }
        .review-marquee-track { display:flex; width:max-content; animation:marquee 40s linear infinite; }
        .review-marquee-track:hover { animation-play-state:paused; }
        .diff-grid {
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:1px;
          background:rgba(13,13,13,.08);
          border-radius:24px;
          overflow:hidden;
        }
        @media(max-width:900px) {
          .diff-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media(max-width:480px) {
          .diff-grid { grid-template-columns:1fr; }
        }
      `}</style>

      {/* ── Trust ticker ── */}
      <div className="scrollbar-hidden" style={{ background: "#0d0d0d", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", width: "max-content", animation: "ticker 36s linear infinite" }}>
          {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((t, i) => (
            <span key={i} style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 10, 
              padding: "10px 32px", 
              ...TYPOGRAPHY.labelLight,
              color: "rgba(255,255,255,.45)",
              whiteSpace: "nowrap", 
              borderRight: "1px solid rgba(255,255,255,.06)",
            }}>
              <span style={{ width: 3, height: 3, background: "#C8992A", borderRadius: "50%", flexShrink: 0 }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      <Nav />
      <HeroCinematic />

      {/* ── Products ── */}
      <BestSellersSection products={products} loading={!loaded} />

      {/* ── Research Stacks ── */}
      <section style={{
        background: "#0A0A0A",
        padding: "clamp(48px, 8vw, 100px) 0",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 40px)",
        }}>
          <div style={{
            marginBottom: "clamp(40px, 6vw, 56px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "6px",
          }}>
            <h2 style={TYPOGRAPHY.headingLight}>
              Purpose-built compound stacks
            </h2>
            <p style={TYPOGRAPHY.subheadingLight}>
              Curated combinations of research compounds, bundled for specific study objectives.
              <span style={{ display: "block", color: "rgba(255,255,255,0.2)", fontSize: "0.9em", marginTop: 4 }}>
                Save 10% vs. individual pricing
              </span>
            </p>
          </div>

          {loadError ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "rgba(255,255,255,0.3)",
              fontSize: "14px",
            }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>⚠️</div>
              Could not load stacks. Please refresh the page.
            </div>
          ) : products.length === 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  background: "#111",
                  borderRadius: "16px",
                  height: "340px",
                }} />
              ))}
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}>
              {BUNDLES.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: "#111",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    overflow: "hidden",
                    transition: "border-color 0.2s ease, transform 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    background: "#141414",
                    padding: "24px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "14px",
                    minHeight: "120px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    {b.products.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "12px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                          transition: "transform 0.2s ease",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = "scale(1.06)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            style={{
                              width: "70%",
                              height: "70%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <Vial fromColor={p.from} toColor={p.to} mg={p.mg} size="sm" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: "18px 20px 20px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}>
                    <div style={{
                      display: "flex",
                      gap: "4px",
                      flexWrap: "wrap",
                    }}>
                      {b.products.map(p => (
                        <span
                          key={p.id}
                          style={{
                            ...TYPOGRAPHY.cardMetaLight,
                            fontSize: "9px",
                            color: "rgba(255,255,255,0.3)",
                            background: "rgba(255,255,255,0.04)",
                            padding: "2px 10px",
                            borderRadius: "100px",
                            border: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          {p.shortName}
                        </span>
                      ))}
                    </div>

                    <h3 style={TYPOGRAPHY.cardTitleLight}>
                      {b.name}
                    </h3>

                    <p style={TYPOGRAPHY.cardDescLight}>
                      {b.desc}
                    </p>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      marginTop: "2px",
                    }}>
                      <div>
                        <div style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "6px",
                        }}>
                          <span style={TYPOGRAPHY.priceLight}>
                            {formatPrice(b.price, storeCurrency)}
                          </span>
                          <span style={{
                            ...TYPOGRAPHY.smallLight,
                            textDecoration: "line-through",
                            color: "rgba(255,255,255,0.2)",
                          }}>
                            {formatPrice(b.originalPrice, storeCurrency)}
                          </span>
                        </div>
                        <span style={{
                          ...TYPOGRAPHY.smallLight,
                          fontSize: "10px",
                          color: "rgba(255,255,255,0.2)",
                        }}>
                          {b.products.length} compounds · COA included
                        </span>
                      </div>

                      <button
                        onClick={() => addBundleToCart(b)}
                        style={{
                          height: "36px",
                          padding: "0 18px",
                          borderRadius: "100px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#fff",
                          ...TYPOGRAPHY.button,
                          cursor: "pointer",
                          transition: "background 0.2s ease, border-color 0.2s ease",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                      >
                        Add Stack
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Why Pepco ── */}
      <section style={{ background: "#F7F5F1", padding: "clamp(80px,9vw,130px) 0", borderBottom: "1px solid rgba(13,13,13,.06)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ gap:40, marginBottom:64, alignItems:"end" }}>
            <div>
              <div style={TYPOGRAPHY.label}>Why Researchers Choose Pepco</div>
              <h2 style={TYPOGRAPHY.heading}>Standards you<br />can verify.</h2>
            </div>
            <p style={{ 
              fontSize: "clamp(14px, 1.2vw, 18px)", 
              lineHeight: 1.9, 
              color: "rgba(13,13,13,.55)", 
              maxWidth: 500, 
              alignSelf:"end",
              fontWeight: 400,
            }}>
              Every batch independently tested, documented, and handled under strict quality-control. No vague claims — just transparent, verifiable data.
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="diff-grid">
              {[
                { n:"01", title:"HPLC-Verified",  desc:"Every compound tested by Freedom Diagnostics. COA downloadable per batch." },
                { n:"02", title:"COA Published",   desc:"Download the certificate of analysis for every product, every batch." },
                { n:"03", title:"Cold-Chain",      desc:"Temperature-controlled packaging on every UK order, without exception." },
                { n:"04", title:"Next-Day UK",     desc:"Order by 3pm for next-day tracked delivery across the United Kingdom." },
              ].map((d) => (
                <div key={d.n} style={{ background:"#fff", padding:"36px 32px", position:"relative" }}>
                  <div style={{ ...TYPOGRAPHY.cardMeta, fontSize: "10px", color: "rgba(13,13,13,.25)", marginBottom: 28 }}>{d.n}</div>
                  <h3 style={{ ...TYPOGRAPHY.cardTitle, fontSize: "clamp(18px, 1.5vw, 22px)", marginBottom: 12 }}>{d.title}</h3>
                  <p style={TYPOGRAPHY.cardDesc}>{d.desc}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Reviews ── */}
      {!reviewsLoaded ? null : realReviews.length === 0 ? (
        <section style={{ background: "#fff", padding: "clamp(56px,6vw,80px) 0 0", paddingBottom: "56px" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,5vw,60px)" }}>
            <FadeUp>
              <div style={{ background:"#FAFAF8", border:"1px solid rgba(13,13,13,.07)", borderRadius:24, padding:"clamp(28px,3.5vw,40px)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, flexWrap:"wrap" }}>
                <div>
                  <div style={TYPOGRAPHY.label}>No reviews yet</div>
                  <p style={{ 
                    fontSize: "clamp(14px, 1.1vw, 16px)", 
                    lineHeight: 1.6, 
                    color: "rgba(13,13,13,.65)", 
                    maxWidth: 480, 
                    margin: 0,
                    fontWeight: 400,
                  }}>
                    Every review we publish is tied to a real, verified order — no exceptions. Placed one recently? Be the first to share your experience.
                  </p>
                </div>
                <Link href="/track-order" style={{ 
                  display:"inline-block", 
                  background:"#0D0D0D", 
                  color:"#fff", 
                  padding:"14px 28px", 
                  borderRadius:999, 
                  textDecoration:"none", 
                  ...TYPOGRAPHY.button,
                  fontWeight: 600,
                  whiteSpace:"nowrap" 
                }}>
                  Leave a Verified Review
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>
      ) : (
        <section style={{ background: "#fff", padding: "clamp(80px,9vw,130px) 0", borderBottom: "1px solid rgba(13,13,13,.06)", overflow: "hidden" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,5vw,60px)" }}>
            <FadeUp style={{ maxWidth:680, marginBottom:60 }}>
              <div style={TYPOGRAPHY.label}>Trusted By Researchers</div>
              <h2 style={TYPOGRAPHY.heading}>What verified<br />researchers say.</h2>
            </FadeUp>
          </div>

          <div className="scrollbar-hidden" style={{ overflow:"hidden", marginBottom:56 }}>
            <div className="review-marquee-track">
              {[...realReviews, ...realReviews].map((r, i) => (
                <div key={`${r.id}-${i}`} style={{ background:"#FAFAF8", border:"1px solid rgba(13,13,13,.07)", borderRadius:20, padding:"24px 28px", width:340, flexShrink:0, marginRight:16 }}>
                  <div style={{ display:"flex", gap:3, marginBottom:12 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} style={{ color: j < r.rating ? "#C8992A" : "rgba(13,13,13,.12)", fontSize:13 }}>★</span>
                    ))}
                  </div>
                  <p style={{ 
                    fontSize: "clamp(13px, 1vw, 14px)", 
                    lineHeight: 1.8, 
                    color: "rgba(13,13,13,.7)", 
                    marginBottom: 20,
                    fontWeight: 400,
                  }}>"{r.text}"</p>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#F0EDE6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, color:"#0d0d0d", flexShrink:0 }}>{initialsFor(r.authorName)}</div>
                    <div>
                      <div style={{ fontSize: "clamp(12px, 0.9vw, 13px)", fontWeight: 600, color: "#0d0d0d" }}>{r.authorName}</div>
                      <div style={{ fontSize: "clamp(10px, 0.8vw, 11px)", color: "rgba(13,13,13,.4)" }}>Verified · {r.productTitle}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {featuredReview && (
            <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 clamp(20px,5vw,60px)" }}>
              <FadeUp>
                <div style={{ background:"#0d0d0d", borderRadius:32, padding:"clamp(32px,4vw,56px)" }}>
                  <div style={{ display:"flex", gap:4, marginBottom:24 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < featuredReview.rating ? "#C8992A" : "rgba(255,255,255,.15)", fontSize:16 }}>★</span>
                    ))}
                  </div>
                  <p style={{ 
                    fontSize: "clamp(18px, 2.5vw, 32px)", 
                    lineHeight: 1.35, 
                    letterSpacing: "-0.02em", 
                    color: "#fff", 
                    margin: "0 0 32px", 
                    maxWidth: 900,
                    fontWeight: 500,
                  }}>
                    "{featuredReview.text}"
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                    <div style={{ width:50, height:50, borderRadius:"50%", background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:600, color:"#fff" }}>{initialsFor(featuredReview.authorName)}</div>
                    <div>
                      <div style={{ fontSize: "clamp(14px, 1vw, 16px)", fontWeight: 600, color: "#fff", marginBottom: 3 }}>{featuredReview.authorName}</div>
                      <div style={{ fontSize: "clamp(12px, 0.9vw, 13px)", color: "rgba(255,255,255,.45)" }}>{featuredReview.productTitle}</div>
                    </div>
                    <div style={{ marginLeft:"auto", ...TYPOGRAPHY.label, fontSize: "10px", color:"#0A7B45", background:"rgba(10,123,69,.15)", padding:"7px 14px", borderRadius:999, letterSpacing:".06em" }}>✓ VERIFIED PURCHASE</div>
                  </div>
                </div>
              </FadeUp>
            </div>
          )}
        </section>
      )}

{/* ── Research Spotlight ── */}
{p1 && p2 && (
  <section style={{
    background: "#F7F5F1",
    padding: "clamp(32px, 6vw, 80px) 0",
    borderBottom: "1px solid rgba(13,13,13,.06)",
  }}>
    <div style={{
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 clamp(16px, 4vw, 40px)",
    }}>
      <div style={{
        marginBottom: "clamp(24px, 5vw, 48px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px",
      }}>
        <h2 style={{
          ...TYPOGRAPHY.heading,
          fontSize: "clamp(22px, 4vw, 40px)",
        }}>
          {p1.shortName} &amp; {p2.shortName}
        </h2>
        <p style={{
          ...TYPOGRAPHY.subheading,
          fontSize: "clamp(14px, 1.5vw, 18px)",
        }}>
          Two of our most widely researched compounds, independently tested and batch-documented.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        gap: "clamp(16px, 2vw, 24px)",
        marginBottom: "clamp(32px, 4vw, 48px)",
      }}>
        {[p1, p2].map((p) => (
          <div
            key={p.id}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid rgba(13,13,13,0.06)",
              overflow: "hidden",
              transition: "border-color 0.2s ease, transform 0.2s ease",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: "380px",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(13,13,13,0.15)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(13,13,13,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              background: "#FCFBF8",
              padding: "clamp(20px, 3vw, 32px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "clamp(120px, 20vh, 180px)",
              borderBottom: "1px solid rgba(13,13,13,0.04)",
              position: "relative",
              flexShrink: 0,
            }}>
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.title}
                  style={{
                    height: "clamp(60px, 12vw, 120px)",
                    width: "auto",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Vial
                  fromColor={p.color?.vialFrom ?? "#3B82F6"}
                  toColor={p.color?.vialTo ?? "#8B5CF6"}
                  mg={p.mg}
                  size="lg"
                />
              )}

              {p.purity && (
                <div style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(255,255,255,0.95)",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(13,13,13,0.06)",
                  ...TYPOGRAPHY.cardMeta,
                  fontSize: "clamp(9px, 0.8vw, 10px)",
                  color: "#0D0D0D",
                  whiteSpace: "nowrap",
                }}>
                  {p.purity}% purity
                </div>
              )}
            </div>

            <div style={{
              padding: "clamp(14px, 2vw, 20px)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minHeight: 0,
            }}>
              <div style={{
                ...TYPOGRAPHY.cardMeta,
                fontSize: "clamp(10px, 0.8vw, 11px)",
              }}>
                {p.category || "Research Compound"}
              </div>

              <h3 style={{
                ...TYPOGRAPHY.cardTitle,
                fontSize: "clamp(16px, 1.5vw, 20px)",
                margin: "2px 0",
              }}>
                {p.shortName}
              </h3>

              <p style={{
                ...TYPOGRAPHY.cardDesc,
                fontSize: "clamp(13px, 1vw, 15px)",
                flex: "0 1 auto",
                margin: "2px 0 8px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}>
                {p.description?.slice(0, 100) + (p.description?.length > 100 ? "…" : "") ||
                  "Independently tested research compound with published COA."}
              </p>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "12px",
                borderTop: "1px solid rgba(13,13,13,0.04)",
                marginTop: "auto",
                gap: "8px",
                flexWrap: "wrap",
              }}>
                <span style={{
                  ...TYPOGRAPHY.price,
                  fontSize: "clamp(16px, 1.2vw, 20px)",
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {formatPrice(p.price, p.currencyCode ?? storeCurrency)}
                </span>

                <button
                  onClick={() => addToCart(p)}
                  disabled={!p.inStock}
                  style={{
                    height: "clamp(32px, 3vw, 36px)",
                    padding: "0 clamp(12px, 1.5vw, 18px)",
                    borderRadius: "100px",
                    border: "1px solid rgba(13,13,13,0.08)",
                    background: p.inStock ? "#0D0D0D" : "rgba(13,13,13,0.04)",
                    color: p.inStock ? "#fff" : "rgba(13,13,13,0.25)",
                    ...TYPOGRAPHY.button,
                    cursor: p.inStock ? "pointer" : "not-allowed",
                    transition: "background 0.2s ease, border-color 0.2s ease",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "clamp(11px, 0.9vw, 13px)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    if (p.inStock) {
                      e.currentTarget.style.background = "#2A2A2A";
                    }
                  }}
                  onMouseLeave={e => {
                    if (p.inStock) {
                      e.currentTarget.style.background = "#0D0D0D";
                    }
                  }}
                >
                  {p.inStock ? "Add to Cart" : "Out of Stock"}
                  {p.inStock && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
        gap: "clamp(12px, 2vw, 24px)",
        paddingTop: "clamp(20px, 3vw, 32px)",
        borderTop: "1px solid rgba(13,13,13,0.06)",
      }}>
        {[
          [p1.purity ? `${p1.purity}%` : "99%+", "Purity Verified"],
          ["COA", "Batch Documented"],
          ["24hr", "Dispatch"],
        ].map(([value, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "clamp(18px, 2.5vw, 28px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "#0D0D0D",
            }}>
              {value}
            </div>
            <div style={{
              ...TYPOGRAPHY.cardMeta,
              fontSize: "clamp(9px, 0.8vw, 10px)",
              color: "rgba(13,13,13,0.3)",
              marginTop: "2px",
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)}

      {/* ── Research Areas ── */}
      <section style={{ background:"#0A0A0A", padding:"clamp(72px,9vw,120px) 0" }}>
        <div style={{ maxWidth:1120, margin:"0 auto", padding:"0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48, flexWrap:"wrap", gap:24 }}>
            <div>
              <div style={TYPOGRAPHY.labelLight}>Research Categories</div>
              <h2 style={TYPOGRAPHY.headingLight}>Explore research<br />focus areas.</h2>
            </div>
            <span style={{ 
              fontSize: "clamp(12px, 1vw, 13px)", 
              fontWeight: 500, 
              color: "rgba(255,255,255,.35)", 
              letterSpacing: ".04em" 
            }}>
              {categories.length} Categories
            </span>
          </FadeUp>

          <div className="areas-grid-wrap">
            {categories.map((c, i) => {
              const accent = AREA_ACCENTS[c.slug] ?? "#fff"
              return (
                <FadeUp key={c.slug} delay={i * 0.05}>
                  <Link href={`/products/category/${c.slug}`} className="area-row">
                    <span className="area-row-accent" style={{ background: accent }} />
                    <span style={{ display:"flex", flexDirection:"column", gap:6, minWidth:0 }}>
                      <span style={{ 
                        fontSize: "clamp(20px, 2.2vw, 28px)", 
                        fontWeight: 600, 
                        letterSpacing: "-0.02em", 
                        color: "#fff", 
                        lineHeight: 1.1 
                      }}>
                        {c.label}
                      </span>
                      {c.sampleNames.length > 0 && (
                        <span style={{ 
                          fontSize: "clamp(12px, 0.9vw, 13px)", 
                          color: "rgba(255,255,255,.4)", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          fontWeight: 400,
                        }}>
                          {c.sampleNames.join(' · ')}
                        </span>
                      )}
                    </span>
                    <span style={{ display:"flex", alignItems:"center", gap:20, flexShrink:0 }}>
                      <span style={{ textAlign:"right" }}>
                        <span style={{ 
                          display:"block", 
                          fontSize: "clamp(18px, 1.8vw, 22px)", 
                          fontWeight: 600, 
                          color: "#fff", 
                          fontVariantNumeric:"tabular-nums", 
                          lineHeight:1 
                        }}>
                          {c.count}
                        </span>
                        <span style={{ 
                          display:"block", 
                          fontSize: "clamp(9px, 0.7vw, 10px)", 
                          color: "rgba(255,255,255,.35)", 
                          marginTop: 4, 
                          letterSpacing:".04em",
                          fontWeight: 400,
                        }}>
                          compound{c.count !== 1 ? "s" : ""}
                        </span>
                      </span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="area-row-arrow">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </Link>
                </FadeUp>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Member Benefits ── */}
      <section style={{ background:"#111", padding:"clamp(80px,9vw,120px) 0", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:30, flexWrap:"wrap", marginBottom:52 }}>
            <div>
              <div style={TYPOGRAPHY.labelLight}>Member Access</div>
              <h2 style={{ 
                fontSize: "clamp(28px, 4vw, 48px)", 
                fontWeight: 600, 
                letterSpacing: "-0.03em", 
                lineHeight: 1.05, 
                color: "#fff" 
              }}>
                The benefits of<br />becoming a member.
              </h2>
            </div>
            <p style={{ 
              maxWidth:360, 
              fontSize: "clamp(13px, 1vw, 14px)", 
              lineHeight: 1.7, 
              color: "rgba(255,255,255,.45)", 
              margin: 0,
              fontWeight: 400,
            }}>
              Unlock faster ordering, exclusive research access, full order tracking, and priority notifications.
            </p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:2, background:"rgba(255,255,255,.06)", borderRadius:20, overflow:"hidden", marginBottom:40 }}>
            {[
              { title:"Private Consultations", desc:"One-on-one sessions with experienced research specialists." },
              { title:"Express Checkout",       desc:"Saved details for faster repeat ordering." },
              { title:"Research Tracking",      desc:"Full order history, COAs, batch verification anytime." },
              { title:"Priority Alerts",        desc:"Instant notifications for restocks and new compounds." },
            ].map((b) => (
              <div key={b.title} style={{ background:"#111", padding:"28px 8px" }}>
                <div style={{ 
                  fontSize: "clamp(14px, 1.2vw, 16px)", 
                  fontWeight: 600, 
                  letterSpacing: "-0.02em", 
                  color: "#fff", 
                  marginBottom: 8 
                }}>
                  {b.title}
                </div>
                <div style={{ 
                  fontSize: "clamp(12px, 0.9vw, 13px)", 
                  lineHeight: 1.7, 
                  color: "rgba(255,255,255,.4)",
                  fontWeight: 400,
                }}>
                  {b.desc}
                </div>
                <div style={{ marginTop:24, width:32, height:1, background:"rgba(255,255,255,.1)" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ background: "#FAFAF8", padding: "clamp(48px,6vw,100px) 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 clamp(16px,3vw,32px)" }}>
          <FadeUp>
            <div style={{ background: "#0d0d0d", borderRadius: 32, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}>
                <div style={{ padding: isMobile ? "36px 28px 24px" : "60px 56px", borderBottom: isMobile ? "1px solid rgba(255,255,255,.07)" : "none", borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,.07)" }}>
                  <div style={TYPOGRAPHY.labelLight}>Research Updates</div>
                  <h2 style={{ 
                    fontSize: isMobile ? "clamp(28px, 6vw, 32px)" : "clamp(32px, 3.5vw, 48px)", 
                    lineHeight: ".95", 
                    letterSpacing: "-.04em", 
                    fontWeight: 600, 
                    color: "#fff", 
                    margin: "10px 0 14px" 
                  }}>
                    Stay ahead of<br />new releases.
                  </h2>
                  <p style={{ 
                    fontSize: "clamp(13px, 1vw, 14px)", 
                    lineHeight: 1.7, 
                    color: "rgba(255,255,255,.4)", 
                    margin: 0, 
                    maxWidth: 340,
                    fontWeight: 400,
                  }}>
                    Compound launches, COA updates, and fulfilment alerts — direct to your inbox.
                  </p>
                </div>

                <div style={{ padding: isMobile ? "24px 28px 32px" : "60px 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                  {!isMobile && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
                      {["New compound launches", "Batch-specific COA updates", "Research announcements", "Fulfilment & availability alerts"].map(item => (
                        <div key={item} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 10, 
                          fontSize: "clamp(12px, 0.9vw, 13px)", 
                          color: "rgba(255,255,255,.55)",
                          fontWeight: 400,
                        }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C8992A", flexShrink: 0 }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                      onKeyDown={e => { if (e.key === "Enter") handleSubscribe(); }}
                      aria-invalid={!!emailError}
                      style={{ 
                        flex: 1, 
                        minHeight: 48, 
                        minWidth: "180px",
                        borderRadius: 999, 
                        border: `1px solid ${emailError ? "#D64545" : "rgba(255,255,255,.1)"}`, 
                        padding: "0 18px", 
                        fontSize: "clamp(12px, 0.9vw, 13px)", 
                        outline: "none", 
                        background: "rgba(255,255,255,.06)", 
                        color: "#fff",
                        fontWeight: 400,
                      }}
                    />
                    <button
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      style={{ 
                        height: 48, 
                        padding: "0 24px", 
                        borderRadius: 999, 
                        border: "none", 
                        background: subbed ? "#0A7B45" : "#C8992A", 
                        color: "#fff", 
                        fontSize: "clamp(12px, 0.9vw, 13px)", 
                        fontWeight: 600, 
                        cursor: subscribing ? "not-allowed" : "pointer", 
                        opacity: subscribing ? 0.7 : 1, 
                        whiteSpace: "nowrap", 
                        flexShrink: 0, 
                        transition: "background .2s" 
                      }}
                    >
                      {subbed ? "✓ Done" : subscribing ? "..." : "Subscribe"}
                    </button>
                  </div>

                  <div style={{ 
                    fontSize: "clamp(10px, 0.8vw, 11px)", 
                    color: emailError ? "#E27676" : "rgba(255,255,255,.22)", 
                    lineHeight: 1.5 
                  }}>
                    {emailError ?? (
                      <>No spam. <Link href="/unsubscribe" style={{ color: "rgba(255,255,255,.35)", textDecoration: "underline" }}>Unsubscribe anytime.</Link></>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "14px 28px", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ 
                  fontSize: "clamp(10px, 0.8vw, 11px)", 
                  color: "rgba(255,255,255,.25)",
                  fontWeight: 400,
                }}>
                  Trusted by 2,400+ researchers across the UK.
                </div>
                {!isMobile && (
                  <div style={{ display: "flex", gap: 18 }}>
                    {["Independent Testing", "Published COAs", "Cold-Chain Fulfilment"].map(item => (
                      <span key={item} style={{ 
                        ...TYPOGRAPHY.labelLight,
                        fontSize: "9px",
                        color: "rgba(255,255,255,.2)",
                        letterSpacing: ".08em",
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  );
}