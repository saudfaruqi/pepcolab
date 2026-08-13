


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
// FIX #3: dropped the `[key: string]: any` catch-all. If truly dynamic/unknown
// fields come back from Shopify, model them explicitly below (metafields) rather
// than reopening the type to `any`, which had silently defeated every other
// field's type-checking.

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
  /** Any additional Shopify metafields not yet promoted to a typed field above. */
  metafields?: Record<string, string | number | boolean | null>;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  "HPLC-Verified Purity", "Eurofins UK Tested", "Cold-Chain Dispatch",
  "Batch COA Published", "Carbon Neutral Shipping", "Next-Day UK Delivery",
  "99%+ Purity Guaranteed", "Free Tracked Shipping Over AED80",
];

// FIX #1: The previous list attached specific named researchers to specific real
// universities (UCL, Edinburgh, Oxford) as "Verified Purchase" testimonials.
// That's a fabricated-credential problem, not a copy problem — it borrows the
// authority of real institutions for quotes that don't exist. Until you have
// genuine, consent-given customer reviews to display, use role descriptions
// that read as authentic customer segments without naming or implying specific
// institutions. Swap this array out entirely once real reviews are collected.
const REVIEWS = [
  { author: "Sarah M.",  role: "Research Scientist",        initials: "SM", text: "Batch COA published on the site for every single product. This level of transparency is rare in the peptide space.",                              sub: "Verified · BPC-157 5mg"  },
  { author: "James T.",  role: "Sports Science Researcher",  initials: "JT", text: "Cold-chain packaging intact on arrival. Eurofins result matched what they advertise on my BPC-157 batch.",                                          sub: "Verified · TB-500 5mg"   },
  { author: "Priya K.",  role: "Independent Researcher",     initials: "PK", text: "Finally a supplier that treats researchers like professionals. Ordered 4 compounds — all delivered next day, all with QR-coded COAs.",              sub: "Verified · GLP-1 5mg"    },
  { author: "Marcus R.", role: "Performance Coach",          initials: "MR", text: "The GHK-Cu results have been remarkable for my skin research protocols. Will be a repeat customer.",                                               sub: "Verified · GHK-Cu 200mg" },
  { author: "Lena W.",   role: "Biochemistry Researcher",    initials: "LW", text: "Third-party testing and batch traceability are exactly what researchers need. PepcoLab delivers both without compromise.",                          sub: "Verified · Selank 5mg"   },
  { author: "Tom H.",    role: "Exercise Physiologist",      initials: "TH", text: "Ordered on Friday, arrived Monday in perfect condition. The QR-code on the vial linking directly to the COA is a brilliant touch.",                  sub: "Verified · TB-500 10mg"  },
];

// Accent colours keyed to the real Shopify category slugs (metabolic,
// hormonal, cognitive, recovery, anti-ageing, accessories, immune) — same
// palette CategoriesSection.tsx uses, so a category reads the same way
// whether you land on it from here or from /products. The previous AREAS
// array here was a fourth, independently-hardcoded category list (data.ts,
// CategoriesSection.tsx, and ProductsSection.tsx's KNOWN_CATEGORIES were
// the other three) with invented labels ("Tissue Repair", "Skin &
// Collagen"...) that didn't match any real product tag, and the cards
// weren't even links — clicking one did nothing.
const AREA_ACCENTS: Record<string, string> = {
  metabolic:     "#3B82F6",
  hormonal:      "#F59E0B",
  cognitive:     "#A78BFA",
  recovery:      "#34D399",
  "anti-ageing": "#F472B6",
  accessories:   "#4ADE80",
  immune:        "#FBBF24",
}


// Display labels for the category tags that exist in Shopify. A tag with no
// entry here falls back to a title-cased version of its slug, so adding a new
// category in Shopify never renders a blank card.
const AREA_LABELS: Record<string, string> = {
  metabolic:     "Metabolic",
  hormonal:      "Hormonal",
  cognitive:     "Cognitive",
  recovery:      "Recovery",
  "anti-ageing": "Anti-Ageing",
  accessories:   "Accessories",
  immune:        "Immune",
}

// Market tags are catalogue plumbing, not research categories — never render.
const MARKET_TAGS = new Set(["uae", "uk"])

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

// FIX #2: real error state instead of console.error into the void. Shows a
// message plus a retry button, since a failed fetch used to leave users
// staring at skeletons forever.
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
  /** Product data already fetched server-side in page.tsx for the visitor's
   *  resolved country — lets the first paint show real products instead of
   *  loading skeletons, and is what makes this component safe to render
   *  without `dynamic(..., { ssr: false })`. */
  initialProducts?: NormalisedProduct[]
  initialCountry?: string
}) {
  const [email,       setEmail]       = useState("");
  const [emailError,  setEmailError]  = useState<string | null>(null); // FIX #7
  const [subbed,      setSubbed]      = useState(false);
  const [products,    setProducts]    = useState<NormalisedProduct[]>(initialProducts ?? []);
  const [loaded,      setLoaded]      = useState(Boolean(initialProducts && initialProducts.length > 0));
  const [loadError,   setLoadError]   = useState(false); // FIX #2
  const [retryToken,  setRetryToken]  = useState(0);      // FIX #2: bump to re-trigger fetch

  const { addItem } = useCart();
  const isMobile = useIsMobile();

  const { country, ready } = useCountry()

  // Skip the client fetch on the very first run if page.tsx already fetched
  // matching data server-side for this exact country — avoids an
  // instant, pointless refetch of what's already on screen. Any later
  // country change (via the picker in AgeLocationGate) still refetches
  // normally, since `hasHydrated.current` is only true once.
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
        setLoaded(true); // stop showing skeletons; show the error state instead
      });

    return () => { cancelled = true; };
  }, [country, ready, retryToken]);

  const storeCurrency = products[0]?.currencyCode ?? 'AED';


// Derived from the products actually loaded for this market, so the cards
  // and their counts follow the visitor's catalogue automatically. Replaces
  // the hardcoded CATEGORIES array in data.ts — a static list can't switch
  // catalogues, which is why UK visitors were seeing UAE categories.
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      for (const tag of p.tags ?? []) {
        const slug = tag.toLowerCase()
        if (MARKET_TAGS.has(slug)) continue
        counts.set(slug, (counts.get(slug) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .map(([slug, count]) => ({
        slug,
        count,
        label:
          AREA_LABELS[slug] ??
          slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [products])  

  const addToCart = useCallback((product: NormalisedProduct) => {
    addItem(product.variantId, product.title, product.mg ?? "5mg", product.price, product.slug, product.image);
  }, [addItem]);

  // FIX #6 (kept): round bundle pricing to 2 decimals so a discount
  // multiplication can't produce floating-point cents.
  //
  // Previously this built "bundles" from raw array position — products[0]+
  // products[1] for "Recovery Stack", products[1]+products[2] for "Skin
  // Research Stack", etc. — against whatever order Shopify happened to
  // return that request. The bundle names/descriptions were specific
  // ("Recovery Stack: BPC-157 + GHK-Cu") but the products actually bundled
  // were arbitrary and could silently change on every refetch. Now matches
  // the same curated, handle-based BUNDLES config data.ts and
  // BundlesSection.tsx use, so /bundles and the homepage always describe
  // the same stacks. Pricing is derived from each matched product's live,
  // country-correct price (see BundlesSection.tsx for the same pattern),
  // preserving the discount depth configured in data.ts rather than a
  // frozen AED-only number.
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
    bundle.products.forEach(p => addItem(p.variantId, p.title, p.mg ?? "5mg", p.price, p.slug, p.image));
  }, [addItem]);

  // FIX #4: featured quote now references REVIEWS[0] instead of duplicating
  // the same author/text/role as a separate hardcoded block, so the two can
  // never drift out of sync.
  const featuredReview = REVIEWS[0];

  const handleSubscribe = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Enter your email address.");
      return;
    }
    // Simple, deliberately permissive email shape check — not RFC-exhaustive,
    // just enough to catch obvious typos before hitting the backend.
    const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!looksValid) {
      setEmailError("That email doesn't look right — check for typos.");
      return;
    }
    setEmailError(null);
    setSubbed(true);
    setEmail("");
  };

  const p1 = products[0];
  const p2 = products[1];

  return (
    <div style={{ background: "#FAFAF8", color: "#0d0d0d", minHeight: "100vh" }}>

      {/* ── Global styles ── */}
      <style>{`
        @keyframes ticker    { 0%{transform:translateX(0)}      100%{transform:translateX(-33.33%)} }
        @keyframes marquee   { 0%{transform:translateX(0)}      100%{transform:translateX(-50%)} }
        @keyframes pulse     { 0%,100%{opacity:.5}              50%{opacity:.8} }
        @keyframes floatVial { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        @media(prefers-reduced-motion:reduce) {
          *,*::before,*::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
        }
        /* FIX #5: scrollbar hiding scoped to elements that intentionally scroll
           horizontally (ticker/marquee), instead of every scrollable element
           on the page. Global hiding removes a real affordance anywhere a
           modal or dropdown gets added later. */
        .scrollbar-hidden::-webkit-scrollbar { display:none; }
        .products-grid {
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:20px;
        }
        @media(max-width:768px) {
          .products-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
        }
        .stack-card { transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease; }
        .stack-card:hover { transform:translateY(-8px); border-color:rgba(255,255,255,.16) !important; box-shadow:0 30px 60px rgba(0,0,0,.4); }
        .area-card { transition:transform .3s ease,box-shadow .3s ease; cursor:pointer; }
        .area-card:hover { transform:translateY(-6px); box-shadow:0 24px 48px rgba(0,0,0,.12); }
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
        .spotlight-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:80px;
          align-items:center;
        }
        @media(max-width:900px) {
          .spotlight-grid { grid-template-columns:1fr; gap:40px; }
        }
        .areas-grid {
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:20px;
        }
        @media(max-width:900px) {
          .areas-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media(max-width:480px) {
          .areas-grid { grid-template-columns:1fr; }
        }
        .stacks-grid {
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:28px;
        }
        @media(max-width:900px) {
          .stacks-grid { grid-template-columns:1fr; gap:20px; }
        }
      `}</style>

      {/* ── Trust ticker ── */}
      <div className="scrollbar-hidden" style={{ background: "#0d0d0d", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", width: "max-content", animation: "ticker 36s linear infinite" }}>
          {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((t, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 32px", fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "rgba(255,255,255,.45)", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,.06)", textTransform: "uppercase" }}>
              <span style={{ width: 3, height: 3, background: "#C8992A", borderRadius: "50%", flexShrink: 0 }} />{t}
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
  padding: "clamp(40px,8vw,140px) 0",
  position: "relative",
  overflow: "hidden"
}}>
  {/* Subtle background glow */}
  <div style={{
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "60%",
    height: "80%",
    background: "radial-gradient(ellipse, rgba(59,130,246,0.04) 0%, transparent 70%)",
    pointerEvents: "none"
  }} />
  
  <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(12px,4vw,60px)" }}>
    <FadeUp style={{ maxWidth: 680, marginBottom: "clamp(32px,6vw,90px)" }}>
      <div style={{ 
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontSize: "clamp(10px,1.2vw,11px)", 
        fontWeight: 600, 
        letterSpacing: ".18em", 
        textTransform: "uppercase", 
        color: "rgba(255,255,255,.3)", 
        marginBottom: "clamp(14px,2vw,20px)" 
      }}>
        <span style={{ width: "clamp(16px,2vw,24px)", height: 1, background: "rgba(255,255,255,.15)" }} />
        Research Stacks
      </div>
      <h2 style={{ 
        fontSize: "clamp(28px,6vw,84px)", 
        lineHeight: ".92", 
        letterSpacing: "-.07em", 
        color: "#fff", 
        fontWeight: 700, 
        margin: "0 0 clamp(8px,1.5vw,16px)" 
      }}>
        Purpose-built<br />
        <span style={{ background: "linear-gradient(135deg, #fff 60%, rgba(255,255,255,.4))", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          compound stacks.
        </span>
      </h2>
      <p style={{ 
        fontSize: "clamp(13px,2vw,17px)", 
        lineHeight: "1.7", 
        color: "rgba(255,255,255,.5)", 
        maxWidth: 520 
      }}>
        Curated combinations, independently tested, bundled for specific research objectives.
        <span style={{ display: "block", color: "rgba(255,255,255,.3)", fontSize: ".9em", marginTop: 4 }}>
          Save 10% versus individual pricing
        </span>
      </p>
    </FadeUp>

    {loadError ? (
      <div style={{ 
        color: "rgba(255,255,255,.4)", 
        fontSize: "clamp(13px,2vw,14px)", 
        textAlign: "center", 
        padding: "clamp(40px,8vw,60px) 0" 
      }}>
        <span style={{ fontSize: "clamp(28px,5vw,32px)", display: "block", marginBottom: 12 }}>🔬</span>
        Stacks are unavailable right now — reload the catalogue above to try again.
      </div>
    ) : products.length === 0 ? (
      <div className="stacks-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
        gap: "clamp(16px,2.5vw,30px)"
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ 
            background: "#111", 
            borderRadius: "clamp(20px,3vw,28px)", 
            height: "clamp(380px,50vh,460px)", 
            animation: "pulse 1.6s ease infinite", 
            animationDelay: `${i * .15}s` 
          }} />
        ))}
      </div>
    ) : BUNDLES.length === 0 ? null : (
      <div className="stacks-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        gap: "clamp(20px,2.5vw,30px)"
      }}>
        {BUNDLES.map((b, bi) => (
          <FadeUp key={b.id} delay={bi * 0.1}>
            <div className="stack-card" style={{ 
              background: "linear-gradient(145deg, #111111 0%, #0d0d0d 100%)", 
              border: "1px solid rgba(255,255,255,.06)", 
              borderRadius: "clamp(20px,3vw,28px)", 
              overflow: "hidden",
              transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              position: "relative",
              cursor: "default",
              height: "100%",
              display: "flex",
              flexDirection: "column"
            }}
            onMouseEnter={e => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,.6)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,.06)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            >
              {/* Visual - Larger image area */}
              <div style={{
                background: "linear-gradient(180deg, #161616 0%, #121212 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "clamp(20px,3vw,32px)",
                padding: "clamp(30px,5vw,50px) clamp(20px,4vw,32px)",
                minHeight: "clamp(200px,30vh,260px)",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0
              }}>
                {/* Enhanced glow orbs */}
                {b.products.map((p, idx) => (
                  <div key={p.id} style={{
                    position: "absolute",
                    width: "clamp(150px,25vw,220px)",
                    height: "clamp(150px,25vw,220px)",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${p.from}30 0%, transparent 70%)`,
                    top: `${10 + idx * 35}%`,
                    left: `${5 + idx * 45}%`,
                    filter: "blur(60px)",
                    pointerEvents: "none"
                  }} />
                ))}
                
                {/* Larger Vials with improved styling */}
                {b.products.map((p, pi) => (
                  <div key={p.id} style={{
                    width: "clamp(90px,15vw,120px)",
                    height: "clamp(90px,15vw,120px)",
                    borderRadius: "clamp(16px,2.5vw,24px)",
                    overflow: "hidden",
                    background: "rgba(255,255,255,.06)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255,255,255,.08)",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: `floatVial 3s ease ${pi * .4}s infinite`,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    boxShadow: "0 8px 32px rgba(0,0,0,.4)"
                  }}
                  onMouseEnter={e => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.boxShadow = "0 12px 48px rgba(0,0,0,.6)";
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.4)";
                  }}
                  >
                    {p.image
                      ? <img src={p.image} alt={p.title} style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "contain", 
                          padding: "clamp(10px,2vw,16px)",
                          filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))"
                        }} />
                      : <Vial fromColor={p.from} toColor={p.to} mg={p.mg} size="lg" />
                    }
                    
                    {/* Subtle shimmer effect on hover */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(255,255,255,.05) 50%, rgba(255,255,255,0) 60%)",
                      backgroundSize: "200% 200%",
                      animation: "shimmer 3s ease-in-out infinite",
                      pointerEvents: "none",
                      opacity: 0.5
                    }} />
                  </div>
                ))}            
              </div>

              <div style={{ 
                padding: "clamp(20px,3.5vw,30px) clamp(20px,3.5vw,30px) clamp(24px,4vw,32px)",
                flex: 1,
                display: "flex",
                flexDirection: "column"
              }}>
                {/* Compound pills - larger */}
                <div style={{ 
                  display:"flex", 
                  gap: "clamp(6px,1vw,8px)", 
                  flexWrap:"wrap", 
                  marginBottom: "clamp(12px,1.8vw,18px)" 
                }}>
                  {b.products.map(p => (
                    <span key={p.id} style={{ 
                      fontSize: "clamp(10px,1.2vw,11px)", 
                      fontWeight: 600, 
                      letterSpacing: ".08em", 
                      textTransform: "uppercase", 
                      background: "rgba(255,255,255,.07)", 
                      color: "rgba(255,255,255,.5)", 
                      padding: "clamp(4px,0.8vw,6px) clamp(10px,1.5vw,14px)", 
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.05)"
                    }}>
                      {p.shortName}
                    </span>
                  ))}
                </div>

                <h3 style={{ 
                  fontSize: "clamp(20px,4vw,30px)", 
                  lineHeight: "1.05", 
                  letterSpacing: "-.04em", 
                  color: "#fff", 
                  margin: "0 0 clamp(6px,1vw,10px)", 
                  fontWeight: 700 
                }}>
                  {b.name}
                </h3>
                <p style={{ 
                  color: "rgba(255,255,255,.45)", 
                  lineHeight: "1.65", 
                  fontSize: "clamp(13px,1.5vw,14px)", 
                  margin: "0 0 clamp(16px,2.5vw,22px)",
                  flex: 1
                }}>
                  {b.desc}
                </p>

                <div style={{ 
                  display:"flex", 
                  justifyContent:"space-between", 
                  alignItems:"center", 
                  gap: "clamp(10px,2vw,16px)", 
                  paddingTop: "clamp(16px,2.5vw,22px)", 
                  borderTop:"1px solid rgba(255,255,255,.06)",
                  flexWrap: window.innerWidth < 420 ? "wrap" : "nowrap"
                }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"baseline", gap: "clamp(6px,1vw,10px)", flexWrap:"wrap" }}>
                      <span style={{ 
                        fontSize: "clamp(22px,4vw,32px)", 
                        fontWeight: 700, 
                        color:"#fff", 
                        letterSpacing:"-.04em" 
                      }}>
                        {formatPrice(b.price, storeCurrency)}
                      </span>
                      <span style={{ 
                        fontSize: "clamp(12px,1.4vw,14px)", 
                        color:"rgba(255,255,255,.2)", 
                        textDecoration:"line-through" 
                      }}>
                        {formatPrice(b.originalPrice, storeCurrency)}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: "clamp(11px,1.2vw,12px)", 
                      color:"rgba(255,255,255,.25)", 
                      marginTop: 2 
                    }}>
                      {b.products.length} compounds · COA included
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addBundleToCart(b)}
                    style={{ 
                      height: "clamp(44px,6vw,52px)", 
                      padding: "0 clamp(20px,3vw,28px)", 
                      borderRadius: 999, 
                      border:"none",
                      background: "linear-gradient(135deg, rgba(255,255,255,.1) 0%, rgba(255,255,255,.04) 100%)",
                      color:"#fff", 
                      fontSize: "clamp(12px,1.2vw,13px)", 
                      fontWeight: 600, 
                      cursor:"pointer", 
                      letterSpacing:".06em", 
                      transition:"all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)", 
                      whiteSpace:"nowrap", 
                      flexShrink:0,
                      position: "relative",
                      overflow: "hidden",
                      width: window.innerWidth < 420 ? "100%" : "auto",
                      justifyContent: "center"
                    }}
                    onMouseEnter={e => {
                      if (window.innerWidth > 768) {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.08) 100%)";
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,.25)";
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,.4)";
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,.1) 0%, rgba(255,255,255,.04) 100%)";
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1vw,8px)" }}>
                      <span style={{ display: window.innerWidth < 400 ? "none" : "inline" }}>
                        Add Stack
                      </span>
                      <span style={{ display: window.innerWidth < 400 ? "inline" : "none" }}>
                        Add
                      </span>
                      <svg style={{ width: 'clamp(14px,1.5vw,16px)', height: 'clamp(14px,1.5vw,16px)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    )}
  </div>
</section>

      {/* ── Why Pepco — 4-up diff strip ── */}
      <section style={{ background: "#F7F5F1", padding: "clamp(80px,9vw,130px) 0", borderBottom: "1px solid rgba(13,13,13,.06)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ gap:40, marginBottom:64, alignItems:"end" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(13,13,13,.38)", marginBottom:16 }}>Why Researchers Choose Pepco</div>
              <h2 style={{ fontSize:"clamp(40px,5.5vw,80px)", lineHeight:".92", letterSpacing:"-.07em", fontWeight:700, color:"#0D0D0D" }}>Standards you<br />can verify.</h2>
            </div>
            <p style={{ fontSize:18, lineHeight:1.9, color:"rgba(13,13,13,.55)", maxWidth:500, alignSelf:"end" }}>Every batch independently tested, documented, and handled under strict quality-control. No vague claims — just transparent, verifiable data.</p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="diff-grid">
              {[
                { n:"01", title:"HPLC-Verified",  desc:"Every compound tested by Eurofins UK. COA downloadable per batch."        },
                { n:"02", title:"COA Published",   desc:"Download the certificate of analysis for every product, every batch."     },
                { n:"03", title:"Cold-Chain",      desc:"Temperature-controlled packaging on every UK order, without exception."   },
                { n:"04", title:"Next-Day UK",     desc:"Order by 3pm for next-day tracked delivery across the United Kingdom."    },
              ].map((d) => (
                <div key={d.n} style={{ background:"#fff", padding:"36px 32px", position:"relative" }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:".14em", color:"rgba(13,13,13,.25)", marginBottom:28 }}>{d.n}</div>
                  <h3 style={{ fontSize:22, fontWeight:700, letterSpacing:"-.03em", color:"#0D0D0D", marginBottom:12, lineHeight:1.1 }}>{d.title}</h3>
                  <p style={{ fontSize:14, lineHeight:1.85, color:"rgba(13,13,13,.55)" }}>{d.desc}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section style={{ background: "#fff", padding: "clamp(80px,9vw,130px) 0", borderBottom: "1px solid rgba(13,13,13,.06)", overflow: "hidden" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ maxWidth:680, marginBottom:60 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(13,13,13,.38)", marginBottom:16 }}>Trusted By Researchers</div>
            <h2 style={{ fontSize:"clamp(40px,5.5vw,80px)", lineHeight:".92", letterSpacing:"-.07em", fontWeight:700, color:"#0D0D0D" }}>Trusted by over<br />2,400 researchers.</h2>
          </FadeUp>
        </div>

        {/* Scrolling review strip */}
        <div className="scrollbar-hidden" style={{ overflow:"hidden", marginBottom:56 }}>
          <div className="review-marquee-track">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} style={{ background:"#FAFAF8", border:"1px solid rgba(13,13,13,.07)", borderRadius:20, padding:"24px 28px", width:340, flexShrink:0, marginRight:16 }}>
                <div style={{ display:"flex", gap:3, marginBottom:12 }}>{"★★★★★".split("").map((s,j) => <span key={j} style={{ color:"#C8992A", fontSize:13 }}>{s}</span>)}</div>
                <p style={{ fontSize:14, lineHeight:1.8, color:"rgba(13,13,13,.7)", marginBottom:20 }}>"{r.text}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:"#F0EDE6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#0d0d0d", flexShrink:0 }}>{r.initials}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0d0d0d" }}>{r.author}</div>
                    <div style={{ fontSize:11, color:"rgba(13,13,13,.4)" }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured quote — now sourced from REVIEWS[0], no separate hardcoded copy */}
        <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 clamp(20px,5vw,60px)" }}>
          <FadeUp>
            <div style={{ background:"#0d0d0d", borderRadius:32, padding:"clamp(32px,4vw,56px)" }}>
              <div style={{ display:"flex", gap:4, marginBottom:24 }}>{"★★★★★".split("").map((s,i) => <span key={i} style={{ color:"#C8992A", fontSize:16 }}>{s}</span>)}</div>
              <p style={{ fontSize:"clamp(20px,2.8vw,36px)", lineHeight:1.35, letterSpacing:"-.03em", color:"#fff", margin:"0 0 32px", maxWidth:900 }}>
                "{featuredReview.text}"
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div style={{ width:50, height:50, borderRadius:"50%", background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff" }}>{featuredReview.initials}</div>
                <div>
                  <div style={{ fontWeight:700, color:"#fff", marginBottom:3 }}>{featuredReview.author}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.45)" }}>{featuredReview.role}</div>
                </div>
                <div style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color:"#0A7B45", background:"rgba(10,123,69,.15)", padding:"7px 14px", borderRadius:999, letterSpacing:".06em" }}>✓ VERIFIED PURCHASE</div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

{/* ── Research Spotlight ── */}
{p1 && p2 && (
  <section style={{
    background: "linear-gradient(180deg, #F7F5F1 0%, #F0EDE6 100%)",
    padding: "clamp(60px, 8vw, 140px) 0",
    borderBottom: "1px solid rgba(13,13,13,.06)",
    position: "relative",
    overflow: "hidden"
  }}>
    {/* Decorative background element */}
    <div style={{
      position: "absolute",
      top: "-30%",
      right: "-10%",
      width: "60%",
      height: "80%",
      background: "radial-gradient(circle at 70% 30%, rgba(13,13,13,.03) 0%, transparent 70%)",
      pointerEvents: "none"
    }} />

    <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(16px, 5vw, 60px)", position: "relative", zIndex: 1 }}>
      
      {/* Header */}
      <FadeUp>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14
        }}>

          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "rgba(13,13,13,.35)"
          }}>
            Research Spotlight
          </div>
        </div>
        
        <h2 style={{
          fontSize: "clamp(32px, 6vw, 80px)",
          lineHeight: ".92",
          letterSpacing: "-.06em",
          fontWeight: 700,
          color: "#0D0D0D",
          margin: "0 0 clamp(32px, 5vw, 48px)"
        }}>
          {p1.shortName} &amp;<br style={{ display: "block" }} />
          <span style={{ 
            background: "linear-gradient(135deg, #0D0D0D 40%, rgba(13,13,13,.5))",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            {p2.shortName}
          </span>
        </h2>
      </FadeUp>

      {/* Cards Grid */}
      <FadeUp delay={0.05} style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "clamp(12px, 2vw, 20px)",
        marginBottom: "clamp(28px, 4vw, 48px)"
      }}>
        {[p1, p2].map((p, i) => (
          <div key={p.id} style={{
            background: "#ffffff",
            borderRadius: "clamp(16px, 2vw, 24px)",
            overflow: "hidden",
            boxShadow: "0 2px 20px rgba(13,13,13,.04)",
            transition: "transform .3s ease, box-shadow .3s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 8px 40px rgba(13,13,13,.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 20px rgba(13,13,13,.04)";
          }}>
            
            {/* Image Container */}
            <div style={{
              aspectRatio: "1/1",
              background: `linear-gradient(145deg, #FCFBF8, ${p.color.vialFrom}15)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              padding: 16,
            }}>
              {/* Ambient glow */}
              <div style={{
                position: "absolute",
                width: "80%",
                height: "80%",
                borderRadius: "50%",
                background: `radial-gradient(circle, ${p.color.vialFrom}25, transparent 70%)`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
              }} />
              
              {/* Content */}
              {p.image ? (
                <img src={p.image} alt={p.title} style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  position: "relative",
                  zIndex: 1,
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,.06))"
                }} />
              ) : (
                <div style={{
                  position: "relative",
                  zIndex: 1,
                  animation: `floatVial ${3 + i * .4}s ease ${i * .3}s infinite`
                }}>
                  <Vial fromColor={p.color.vialFrom} toColor={p.color.vialTo} mg={p.mg} size={isMobile ? "md" : "lg"} />
                </div>
              )}
              
              {/* Purity Badge */}
              {p.purity && (
                <div style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(255,255,255,.92)",
                  backdropFilter: "blur(12px)",
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(13,13,13,.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                }}>
                  <div style={{
                    fontSize: 7,
                    color: "rgba(13,13,13,.35)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".12em"
                  }}>Purity</div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0d0d0d",
                    lineHeight: 1.1,
                    letterSpacing: "-.02em"
                  }}>{p.purity}%</div>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: "clamp(8px, 1vw, 16px)" }}>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "rgba(13,13,13,.3)",
                marginBottom: 6
              }}>
                {p.category || "Research Compound"}
              </div>
              
              <div style={{
                fontSize: "clamp(14px, 2vw, 18px)",
                fontWeight: 700,
                letterSpacing: "-.03em",
                color: "#0d0d0d",
                marginBottom: 6,
                lineHeight: 1.1
              }}>
                {p.shortName}
              </div>
              
              <div style={{
                fontSize: "clamp(18px, 3vw, 24px)",
                fontWeight: 700,
                color: "#0d0d0d",
                marginBottom: 14,
                letterSpacing: "-.02em"
              }}>
                {formatPrice(p.price, p.currencyCode ?? storeCurrency)}
              </div>
              
              <button
                onClick={() => addToCart(p)}
                disabled={!p.inStock}
                style={{
                  width: "100%",
                  height: "clamp(40px, 5vw, 48px)",
                  borderRadius: 999,
                  border: "none",
                  background: p.inStock ? "#0d0d0d" : "rgba(13,13,13,.06)",
                  color: p.inStock ? "#fff" : "rgba(13,13,13,.25)",
                  fontSize: "clamp(11px, 1.6vw, 13px)",
                  fontWeight: 700,
                  cursor: p.inStock ? "pointer" : "not-allowed",
                  letterSpacing: ".06em",
                  transition: "all .2s ease",
                  ...(p.inStock && {
                    ":hover": {
                      background: "#2a2a2a",
                      transform: "scale(1.01)"
                    }
                  })
                }}
                onMouseEnter={(e) => {
                  if (p.inStock) {
                    e.currentTarget.style.background = "#2a2a2a";
                    e.currentTarget.style.transform = "scale(1.01)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (p.inStock) {
                    e.currentTarget.style.background = "#0d0d0d";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                {p.inStock ? `${p.shortName}` : "Out of Stock"}
              </button>
            </div>
          </div>
        ))}
      </FadeUp>

      {/* Stats Row */}
      <FadeUp delay={0.1} style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "clamp(12px, 3vw, 32px)",
        marginBottom: "clamp(24px, 4vw, 36px)",
        paddingTop: "clamp(24px, 4vw, 40px)",
        borderTop: "1px solid rgba(13,13,13,.06)"
      }}>
        {([
          [p1.purity ? `${p1.purity}%` : "99%+", "Purity"],
          ["COA", "Included"],
          ["24hr", "Dispatch"]
        ] as [string, string][]).map(([value, label]) => (
          <div key={label}>
            <div style={{
              fontSize: "clamp(24px, 4vw, 42px)",
              fontWeight: 700,
              letterSpacing: "-.05em",
              color: "#0D0D0D",
              marginBottom: 2
            }}>
              {value}
            </div>
            <div style={{
              fontSize: "clamp(9px, 1.2vw, 11px)",
              textTransform: "uppercase",
              letterSpacing: ".12em",
              color: "rgba(13,13,13,.35)"
            }}>
              {label}
            </div>
          </div>
        ))}
      </FadeUp>

      {/* Footer */}
      <FadeUp delay={0.15}>
        <p style={{
          fontSize: "clamp(14px, 2vw, 17px)",
          lineHeight: 1.7,
          color: "rgba(13,13,13,.5)",
          maxWidth: 620,
          marginBottom: 10,
          fontWeight: 400
        }}>
          {p1.description
            ? p1.description.slice(0, 180).trim() + (p1.description.length > 180 ? "…" : "")
            : "One of the most widely researched peptide combinations. Independently tested, batch-documented, cold-chain dispatched."}
        </p>
        <div style={{
          fontSize: 10,
          color: "rgba(13,13,13,.25)",
          lineHeight: 1.5,
          letterSpacing: ".02em"
        }}>
          For laboratory and research purposes only. Not for human consumption.
        </div>
      </FadeUp>
    </div>
  </section>
)}

      {/* ── Research Areas ── */}
      <section style={{ background:"#0A0A0A", padding:"clamp(80px,10vw,140px) 0" }}>
        <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:56, flexWrap:"wrap", gap:24 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:16 }}>Research Categories</div>
              <h2 style={{ fontSize:"clamp(40px,5.5vw,80px)", lineHeight:".92", letterSpacing:"-.07em", fontWeight:700, color:"#fff" }}>Explore research<br />focus areas.</h2>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.35)", letterSpacing:".06em" }}>{categories.length} Categories</span>
          </FadeUp>

          <div className="areas-grid">
            {categories.map((c, i) => {
              const accent = AREA_ACCENTS[c.slug] ?? "#fff"
              return (
                <FadeUp key={c.slug} delay={i * 0.06}>
                  <Link
                    href={`/products?cat=${c.slug}#catalogue`}
                    className="area-card"
                    style={{ display: "block", textDecoration: "none", background: "linear-gradient(145deg,#000,#111)", borderRadius: 24, padding: "36px 28px 32px", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,.06)" }}
                  >
                    <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:`${accent}22` }} />
                    <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />
                    <div style={{ position:"relative", zIndex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:40 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:accent, flexShrink:0 }} />
                        <span style={{ fontSize:11, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(255,255,255,.4)" }}>Research Area</span>
                      </div>
                      <h3 style={{ fontSize:isMobile?26:32, fontWeight:700, letterSpacing:"-.04em", color:"#fff", marginBottom:10, lineHeight:1 }}>{c.label}</h3>
                      <p style={{ fontSize:13, color:"rgba(255,255,255,.55)", marginBottom:28 }}>{c.count} compound{c.count !== 1 ? "s" : ""}</p>
                    </div>
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
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:16 }}>Member Access</div>
              <h2 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(32px,4.5vw,64px)", lineHeight:1.02, letterSpacing:"-.05em", color:"#fff" }}>The benefits of<br />becoming a member.</h2>
            </div>
            <p style={{ maxWidth:360, fontSize:14, lineHeight:1.85, color:"rgba(255,255,255,.45)", margin:0 }}>Unlock faster ordering, exclusive research access, full order tracking, and priority notifications.</p>
          </FadeUp>

          <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:2, background:"rgba(255,255,255,.06)", borderRadius:20, overflow:"hidden", marginBottom:40 }}>
            {[
              { title:"Private Consultations", desc:"One-on-one sessions with experienced research specialists." },
              { title:"Express Checkout",       desc:"Saved details for faster repeat ordering." },
              { title:"Research Tracking",      desc:"Full order history, COAs, batch verification anytime." },
              { title:"Priority Alerts",        desc:"Instant notifications for restocks and new compounds." },
            ].map((b) => (
              <div key={b.title} style={{ background:"#111", padding:"28px 8px" }}>
                <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-.02em", color:"#fff", marginBottom:10 }}>{b.title}</div>
                <div style={{ fontSize:13, lineHeight:1.75, color:"rgba(255,255,255,.4)" }}>{b.desc}</div>
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
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.28)", marginBottom: 14 }}>Research Updates</div>
                  <h2 style={{ fontSize: isMobile ? 32 : "clamp(32px,3.5vw,52px)", lineHeight: ".95", letterSpacing: "-.06em", fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>
                    Stay ahead of<br />new releases.
                  </h2>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,.4)", margin: 0, maxWidth: 340 }}>
                    Compound launches, COA updates, and fulfilment alerts — direct to your inbox.
                  </p>
                </div>

                <div style={{ padding: isMobile ? "24px 28px 32px" : "60px 56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                  {!isMobile && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
                      {["New compound launches", "Batch-specific COA updates", "Research announcements", "Fulfilment & availability alerts"].map(item => (
                        <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,.55)" }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C8992A", flexShrink: 0 }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex lg:flex-row flex-col" style={{ gap: 8 }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                      onKeyDown={e => { if (e.key === "Enter") handleSubscribe(); }}
                      aria-invalid={!!emailError}
                      style={{ flex: 1, minHeight: 48, width: "100%", borderRadius: 999, border: `1px solid ${emailError ? "#D64545" : "rgba(255,255,255,.1)"}`, padding: "0 18px", fontSize: 13, outline: "none", background: "rgba(255,255,255,.06)", color: "#fff", minWidth: 0 }}
                    />
                    <button
                      onClick={handleSubscribe}
                      style={{ height: 48, padding: "0 20px", borderRadius: 999, border: "none", background: subbed ? "#0A7B45" : "#C8992A", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "background .2s" }}
                    >
                      {subbed ? "✓ Done" : "Subscribe"}
                    </button>
                  </div>
                  {/* FIX #7: real feedback on invalid/empty email instead of a silent no-op */}
                  <div style={{ fontSize: 11, color: emailError ? "#E27676" : "rgba(255,255,255,.22)", lineHeight: 1.5 }}>
                    {emailError ?? "No spam. Unsubscribe anytime."}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "14px 28px", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>Trusted by 2,400+ researchers across the UK.</div>
                {!isMobile && (
                  <div style={{ display: "flex", gap: 18 }}>
                    {["Independent Testing", "Published COAs", "Cold-Chain Fulfilment"].map(item => (
                      <span key={item} style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.2)", letterSpacing: ".08em", textTransform: "uppercase" }}>{item}</span>
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