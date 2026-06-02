"use client";
import Nav from "@/components/Nav";
import { useState, useEffect, useRef, useId, useCallback, useMemo } from "react"
import { HeroCinematic } from "@/components/HeroSections";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getProducts as DATA_PRODUCTS } from '@/lib/shopify'
import Footer from "@/components/Footer";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

function useIsTablet(breakpoint = 1100) {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isTablet;
}

// ── Image map ─────────────────────────────────────────────────────────────
const IMGS = {
  hero: "/pepco1.png",
  heroVial: "/pepco2.png",
  spotlight:
    "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80&auto=format&fit=crop",
  consultLeft: "pepco4.png",
  consultRight: "pepco5.png",
  lab1: "pepco6.png",
  lab2: "pepco7.png",
  concern1:
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=70&auto=format&fit=crop",
  concern2:
    "https://images.unsplash.com/photo-1595475884562-073c30d45670?w=300&q=70&auto=format&fit=crop",
  concern3:
    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=300&q=70&auto=format&fit=crop",
  concern4:
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&q=70&auto=format&fit=crop",
  concern5:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=70&auto=format&fit=crop",
  concern6:
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=70&auto=format&fit=crop",
  social1:
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=70&auto=format&fit=crop",
  social2:
    "https://images.unsplash.com/photo-1554244933-d876deb6b2ff?w=400&q=70&auto=format&fit=crop",
  social3:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70&auto=format&fit=crop",
  social4:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=70&auto=format&fit=crop",
  newsletter:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=70&auto=format&fit=crop",
};

// ── Vial SVG ──────────────────────────────────────────────────────────────
function Vial({
  fromColor = "#EEF2FD",
  toColor = "#3B82F6",
  mg = "5mg",
  size = "md",
}) {
  const uid = useId().replace(/:/g, "");
  const s = {
    sm: { w: 28, h: 56, cH: 11, cW: 18, bR: 10 },
    md: { w: 36, h: 72, cH: 14, cW: 24, bR: 13 },
    lg: { w: 48, h: 96, cH: 18, cW: 30, bR: 17 },
    xl: { w: 64, h: 128, cH: 24, cW: 40, bR: 22 },
  }[size] ?? { w: 36, h: 72, cH: 14, cW: 24, bR: 13 };
  return (
    <svg
      width={s.w}
      height={s.h}
      viewBox={`0 0 ${s.w} ${s.h}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fromColor} stopOpacity=".9" />
          <stop offset="100%" stopColor={toColor} stopOpacity=".7" />
        </linearGradient>
      </defs>
      <rect
        x={(s.w - s.cW) / 2}
        y={0}
        width={s.cW}
        height={s.cH}
        rx="3"
        fill={`url(#g${uid})`}
      />
      <rect
        x={(s.w - s.cW) / 2 + 3}
        y={2}
        width={4}
        height={s.cH - 4}
        rx="2"
        fill="rgba(255,255,255,.5)"
      />
      <rect
        x={(s.w - s.bR * 2) / 2}
        y={s.cH}
        width={s.bR * 2}
        height={s.h - s.cH - s.bR}
        fill={`url(#g${uid})`}
      />
      <ellipse
        cx={s.w / 2}
        cy={s.h - s.bR}
        rx={s.bR}
        ry={s.bR}
        fill={toColor}
      />
      <rect
        x={(s.w - s.bR * 2) / 2 + 4}
        y={s.cH + 6}
        width={5}
        height={s.h - s.cH - s.bR - 16}
        rx="2.5"
        fill="rgba(255,255,255,.4)"
      />
      <rect
        x={(s.w - s.bR * 2) / 2 + 3}
        y={s.cH + (s.h - s.cH) * 0.3}
        width={s.bR * 2 - 6}
        height={(s.h - s.cH) * 0.28}
        rx="2"
        fill="rgba(255,255,255,.25)"
      />
      <text
        x={s.w / 2}
        y={s.h - 6}
        textAnchor="middle"
        fontSize={size === "xl" ? 10 : size === "lg" ? 8 : 7}
        fontWeight="600"
        fill="rgba(255,255,255,.9)"
        fontFamily="system-ui,sans-serif"
      >
        {mg}
      </text>
    </svg>
  );
}




const CONCERNS = [
  { label: "Aging", sub: "Anti-ageing peptides", img: IMGS.concern1 },
  { label: "Congestion", sub: "Detox & metabolic", img: IMGS.concern2 },
  { label: "Texture", sub: "Skin repair", img: IMGS.concern3 },
  { label: "Eye Care", sub: "GHK-Cu complex", img: IMGS.concern4 },
  { label: "Recovery", sub: "BPC & TB-500", img: IMGS.concern5 },
  { label: "Dryness", sub: "Hydration peptides", img: IMGS.concern6 },
];

const REVIEWS = [
  {
    author: "Dr. Sarah M.",
    role: "Pharmacology Research, UCL",
    initials: "SM",
    rating: 5,
    text: "Batch COA published on the site for every single product. This level of transparency is rare in the UK peptide space.",
    sub: "Verified purchase · BPC-157 5mg",
  },
  {
    author: "James T.",
    role: "Sports Science, Edinburgh",
    initials: "JT",
    rating: 5,
    text: "Cold-chain packaging was intact on arrival. Eurofins result matches what they advertise — 99.3% on my BPC-157 batch.",
    sub: "Verified purchase · TB-500 5mg",
  },
  {
    author: "Dr. Priya K.",
    role: "Independent Researcher",
    initials: "PK",
    rating: 5,
    text: "Finally a supplier that treats researchers like professionals. Ordered 4 compounds — all delivered next day, all with QR-coded COAs.",
    sub: "Verified purchase · GLP-1 5mg",
  },
  {
    author: "Marcus R.",
    role: "Performance Coach, London",
    initials: "MR",
    rating: 5,
    text: "The GHK-Cu results have been remarkable for my skin research protocols. Will be a repeat customer.",
    sub: "Verified purchase · GHK-Cu 200mg",
  },
];

const TRUST_ITEMS = [
  "HPLC-Verified Purity",
  "Eurofins UK Tested",
  "Cold-Chain Dispatch",
  "Batch COA Published",
  "Carbon Neutral Shipping",
  "Next-Day UK Delivery",
  "99%+ Purity Guaranteed",
  "Free Tracked Shipping Over £80",
];
const DIFFS = [
  {
    title: "HPLC-Verified Purity",
    desc: "Every compound tested by Eurofins UK. COA downloadable per batch.",
  },
  {
    title: "Batch COA Published",
    desc: "Full transparency. Download the certificate of analysis for every product.",
  },
  {
    title: "Cold-Chain Dispatch",
    desc: "Temperature-controlled packaging on every UK order. Always.",
  },
  {
    title: "Next-Day UK Delivery",
    desc: "Order by 3pm for next-day tracked delivery across the United Kingdom.",
  },
];


type NormalisedProduct = {
  id: string
  shopifyId: string
  handle: string
  slug: string
  title: string
  name: string
  shortName: string
  mg: string
  variantId: string
  price: number
  oldPrice?: number
  inStock: boolean
  stockCount: number
  image?: string
  imageAlt: string
  badge?: string
  tags: string[]
  // ── Add these ──
  category: string
  categorySlug: string
  description: string
  testDate?: string
  purity?: number
  lot?: string
  sequence?: string
  longDesc?: string
  // ────────────
  color: {
    bg: string; accent: string; pill: string; pillText: string
    purityBar: string; btn: string; vialFrom: string; vialTo: string
  }
  [key: string]: any
}


type CartItem = { product: NormalisedProduct; qty: number }


// ── useInView ─────────────────────────────────────────────────────────────
function useInView(rootMargin = "0px 0px -80px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

// ── DiffsSection ──────────────────────────────────────────────────────────
function DiffsSection() {
  const { ref, inView } = useInView("0px 0px -80px 0px");

  return (
    <section
      ref={ref}
      style={{
        background: "#F7F5F1",
        padding: "clamp(90px,10vw,150px) 0",
        borderBottom: "1px solid rgba(13,13,13,.06)",
      }}
    >
      <style>{`
        @keyframes diffFadeUp {
          from {
            opacity:0;
            transform:translateY(30px);
          }
          to {
            opacity:1;
            transform:translateY(0);
          }
        }

        .diff-clean-card {
          transition:
            transform .3s ease,
            box-shadow .3s ease,
            border-color .3s ease;
        }

        .diff-clean-card:hover {
          transform: translateY(-6px);
          border-color: rgba(13,13,13,.12);
          box-shadow: 0 20px 50px rgba(0,0,0,.06);
        }
      `}</style>

      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(20px,5vw,60px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              typeof window !== "undefined" && window.innerWidth < 768
                ? "1fr"
                : "1fr 1fr",
            gap: 40,
            marginBottom: 80,
          }}
        >
          <div
            style={{
              opacity: 0,
              animation: inView ? "diffFadeUp .8s ease forwards" : "none",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "rgba(13,13,13,.45)",
                marginBottom: 18,
              }}
            >
              Why Researchers Choose Pepco
            </div>

            <h2
              style={{
                fontSize: "clamp(44px,6vw,88px)",
                lineHeight: ".92",
                letterSpacing: "-.07em",
                fontWeight: 700,
                color: "#0D0D0D",
                margin: 0,
              }}
            >
              Standards you
              <br />
              can verify.
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              opacity: 0,
              animation: inView ? "diffFadeUp .8s ease .15s forwards" : "none",
            }}
          >
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.9,
                color: "rgba(13,13,13,.58)",
                maxWidth: 520,
                margin: 0,
              }}
            >
              Every batch is independently tested, documented, and handled under
              strict quality-control procedures. No vague claims. Just
              transparent standards and verifiable data.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 24,
          }}
        >
          {DIFFS.map((d, i) => (
            <div
              key={i}
              className="diff-clean-card"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(13,13,13,.06)",
                borderRadius: 28,
                padding: "32px",
                opacity: 0,
                animation: inView
                  ? `diffFadeUp .7s ease ${0.2 + i * 0.1}s forwards`
                  : "none",
              }}
            >
              {/* Number */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(13,13,13,.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                  fontWeight: 700,
                  color: "#0D0D0D",
                  fontSize: 14,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-.03em",
                  color: "#0D0D0D",
                  margin: "0 0 14px",
                  lineHeight: 1.1,
                }}
              >
                {d.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: "rgba(13,13,13,.58)",
                  margin: 0,
                }}
              >
                {d.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div
          style={{
            marginTop: 80,
            paddingTop: 50,
            borderTop: "1px solid rgba(13,13,13,.08)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 30,
          }}
        >
          {[
            ["99%+", "Verified Purity"],
            ["2400+", "Researchers"],
            ["24hr", "Cold Dispatch"],
            ["100%", "Batch Transparency"],
          ].map(([value, label]) => (
            <div key={label}>
              <div
                style={{
                  fontSize: "clamp(34px,4vw,52px)",
                  fontWeight: 700,
                  letterSpacing: "-.06em",
                  color: "#0D0D0D",
                  marginBottom: 6,
                }}
              >
                {value}
              </div>

              <div
                style={{
                  fontSize: 12,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "rgba(13,13,13,.45)",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function PepcoLabPage() {
  const [tab, setTab] = useState("bestsellers")
  const [email, setEmail] = useState("")
  const [subbed, setSubbed] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [products, setProducts] = useState<NormalisedProduct[]>([])
  const carRef = useRef<HTMLDivElement>(null)

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  useEffect(() => {
    DATA_PRODUCTS().then(setProducts).catch(console.error)
  }, [])

  // ── Derived from products — INSIDE component ───────────────────────────
  const PAGE_PRODUCTS = useMemo(() => products, [products])

  const BUNDLES = useMemo(() => {
    if (products.length < 2) return []
    return [
      {
        id: 1,
        name: 'Recovery Stack',
        desc: 'BPC-157 and TB-500 — one of the most widely researched regeneration-focused combinations.',
        price: '89',
        products: products.slice(0, 2).map((p) => ({
          ...p,
          from: p.color?.vialFrom ?? '#3b82f6',
          to:   p.color?.vialTo   ?? '#8b5cf6',
          mg:   p.mg ?? '5mg',
        })),
      },
      {
        id: 2,
        name: 'Skin Research Stack',
        desc: 'GHK-Cu and GLP-1 — compounds frequently selected for skin repair and metabolic research.',
        price: '94',
        products: products.slice(1, 3).map((p) => ({
          ...p,
          from: p.color?.vialFrom ?? '#B08A32',
          to:   p.color?.vialTo   ?? '#D6B86C',
          mg:   p.mg ?? '5mg',
        })),
      },
      {
        id: 3,
        name: 'Performance Stack',
        desc: 'Selank and Semax — nootropic compounds studied for cognitive and neurological research.',
        price: '79',
        products: products.slice(0, 2).map((p) => ({
          ...p,
          from: p.color?.vialFrom ?? '#4F6B9A',
          to:   p.color?.vialTo   ?? '#85A2D4',
          mg:   p.mg ?? '5mg',
        })),
      },
    ]
  }, [products])

  const tabProds = useMemo(() => {
    if (tab === 'bestsellers') return PAGE_PRODUCTS
    if (tab === 'new') return PAGE_PRODUCTS.filter((p) => p.badge === 'new' || p.badge === 'popular')
    return PAGE_PRODUCTS.filter((p) => p.badge === 'sale' || !!p.oldPrice)
  }, [tab, PAGE_PRODUCTS])

  // ── Cart helpers ───────────────────────────────────────────────────────
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const addToCart = useCallback((product: NormalisedProduct, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
        )
      return [...prev, { product, qty }]
    })
  }, [])

  const addBundleToCart = useCallback(
    (bundle: (typeof BUNDLES)[0]) => {
      bundle.products.forEach((p) => addToCart(p, 1))
    },
    [addToCart, BUNDLES]
  )

  const changeQty = useCallback((id: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty } : i))
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== id))
  }, [])


  const scroll = (dir: number) =>
    carRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  return (
    <div
      style={{ background: "#f5f5f3", color: "#0d0d0d", minHeight: "100vh" }}
    >
      {/* ── Trust bar ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(13,13,13,.1)",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "max-content",
            animation: "ticker 38s linear infinite",
          }}
        >
          {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((t, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 36px",
                fontSize: 11.5,
                fontWeight: 500,
                letterSpacing: ".05em",
                color: "rgba(13,13,13,.52)",
                whiteSpace: "nowrap",
                borderRight: "1px solid rgba(13,13,13,.08)",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  background: "rgba(13,13,13,.2)",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              {t}
            </span>
          ))}
        </div>
      </div>

      <Nav />

      {/* ── HERO ── */}
      <HeroCinematic />

      {/* ── Products ── */}
      <section
        style={{ padding: "clamp(20px,4vw,42px) 0", background: "#fff" }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 clamp(12px,3vw,22px)",
          }}
        >
          <div className="products-grid">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.shopifyId || product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── Research Stacks ─────────────────────────────── */}
      <section
        style={{
          background: "#0A0A0A",
          padding: isMobile ? "50px 0" : "140px 0",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 clamp(20px,4vw,60px)",
          }}
        >
          {/* Header */}
          <div
            style={{
              maxWidth: 760,
              marginBottom: isMobile ? 50 : 90,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.45)",
                marginBottom: 18,
              }}
            >
              Research Stacks
            </div>

            <h2
              style={{
                fontSize: "clamp(44px,6vw,90px)",
                lineHeight: ".92",
                letterSpacing: "-.07em",
                color: "#fff",
                fontWeight: 700,
                margin: "0 0 24px",
              }}
            >
              Purpose-built
              <br />
              compound stacks.
            </h2>

            <p
              style={{
                fontSize: isMobile ? 15 : 18,
                lineHeight: 1.8,
                color: "rgba(255,255,255,.65)",
                maxWidth: 580,
                margin: 0,
              }}
            >
              Curated combinations of complementary compounds, independently
              tested and bundled for specific research objectives.
            </p>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3,minmax(0,1fr))",
              gap: isMobile ? 20 : 32,
            }}
          >
            {BUNDLES.map((b) => (
              <div
                key={b.id}
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 28,
                  overflow: "hidden",
                  transition: "transform .25s ease, border-color .25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.06)";
                }}
              >
                {/* Product Visual */}
                <div
                  style={{
                    height: isMobile ? 220 : 260,
                    background: "#171717",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 30,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: isMobile ? 12 : 24,
                    }}
                  >
                    {b.products.map((p) => (
                      <Vial
                        key={p.id}
                        fromColor={p.from}
                        toColor={p.to}
                        mg={p.mg}
                        size="lg"
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: isMobile ? 24 : 32,
                  }}
                >
                  <h3
                    style={{
                      fontSize: isMobile ? 28 : 34,
                      lineHeight: 1,
                      letterSpacing: "-.05em",
                      color: "#fff",
                      margin: "0 0 14px",
                      fontWeight: 700,
                    }}
                  >
                    {b.name}
                  </h3>

                  <p
                    style={{
                      color: "rgba(255,255,255,.65)",
                      lineHeight: 1.8,
                      fontSize: isMobile ? 14 : 15,
                      margin: "0 0 30px",
                      minHeight: isMobile ? "auto" : 72,
                    }}
                  >
                    {b.desc}
                  </p>

                  {/* Metadata */}
                  <div
                    style={{
                      display: "flex",
                      gap: 28,
                      marginBottom: 30,
                      paddingBottom: 24,
                      borderBottom: "1px solid rgba(255,255,255,.06)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: 18,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {b.products.length}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: ".12em",
                          color: "rgba(255,255,255,.45)",
                        }}
                      >
                        Compounds
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: 18,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Verified
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: ".12em",
                          color: "rgba(255,255,255,.45)",
                        }}
                      >
                        Batch Tested
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: 18,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Cold
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: ".12em",
                          color: "rgba(255,255,255,.45)",
                        }}
                      >
                        Chain
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: ".12em",
                          color: "rgba(255,255,255,.45)",
                          marginBottom: 6,
                        }}
                      >
                        Bundle Price
                      </div>

                      <div
                        style={{
                          color: "#fff",
                          fontSize: isMobile ? 28 : 34,
                          fontWeight: 700,
                          letterSpacing: "-.05em",
                        }}
                      >
                        £{b.price}
                      </div>
                    </div>

                    <button
                      onClick={() => addBundleToCart(b)}
                      style={{
                        height: 52,
                        padding: "0 22px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,.12)",
                        background: "transparent",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: ".2s ease",
                      }}
                    >
                      Add Stack →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What Makes Us Different ── */}
      <DiffsSection />

      {/* ─────────────────────────────── Reviews / Trust Section ─────────────────────────────── */}{" "}
      <section
        style={{
          background: "#FCFBF8",
          padding: "clamp(90px,10vw,150px) 0",
          borderBottom: "1px solid rgba(13,13,13,.06)",
        }}
      >
        {" "}
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 clamp(20px,5vw,60px)",
          }}
        >
          {" "}
          {/* Header */}{" "}
          <div style={{ maxWidth: 760, marginBottom: 80 }}>
            {" "}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "rgba(13,13,13,.45)",
                marginBottom: 18,
              }}
            >
              {" "}
              Trusted By Researchers{" "}
            </div>{" "}
            <h2
              style={{
                fontSize: "clamp(44px,6vw,88px)",
                lineHeight: ".92",
                letterSpacing: "-.07em",
                color: "#0D0D0D",
                fontWeight: 700,
                margin: "0 0 24px",
              }}
            >
              {" "}
              Trusted by over <br /> 2,400 researchers.{" "}
            </h2>{" "}
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.9,
                color: "rgba(13,13,13,.58)",
                maxWidth: 560,
                margin: 0,
              }}
            >
              {" "}
              Independent testing, transparent documentation, and consistent
              product quality have made PepcoLab a trusted partner for
              researchers across the UK.{" "}
            </p>{" "}
          </div>{" "}
          {/* Featured Review */}{" "}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(13,13,13,.06)",
              borderRadius: 36,
              padding: "clamp(28px,4vw,50px)",
              marginBottom: 40,
            }}
          >
            {" "}
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
              {" "}
              {"★★★★★".split("").map((star, i) => (
                <span key={i} style={{ color: "#C8992A", fontSize: 18 }}>
                  {" "}
                  {star}{" "}
                </span>
              ))}{" "}
            </div>{" "}
            <p
              style={{
                fontSize: "clamp(24px,3vw,42px)",
                lineHeight: 1.3,
                letterSpacing: "-.04em",
                color: "#0D0D0D",
                margin: "0 0 32px",
                maxWidth: 1000,
              }}
            >
              {" "}
              “Batch COA published on the site for every single product. This
              level of transparency is rare in the UK peptide space.”{" "}
            </p>{" "}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {" "}
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "#F4F1EA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#0D0D0D",
                }}
              >
                {" "}
                SM{" "}
              </div>{" "}
              <div>
                {" "}
                <div
                  style={{ fontWeight: 700, color: "#0D0D0D", marginBottom: 4 }}
                >
                  {" "}
                  Dr. Sarah M.{" "}
                </div>{" "}
                <div style={{ color: "rgba(13,13,13,.55)", fontSize: 14 }}>
                  {" "}
                  Pharmacology Research, UCL{" "}
                </div>{" "}
              </div>{" "}
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0A7B45",
                  background: "#EDF8F1",
                  padding: "8px 14px",
                  borderRadius: 999,
                }}
              >
                {" "}
                ✓ Verified Purchase{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Review Grid */}{" "}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 24,
              marginBottom: 80,
            }}
          >
            {" "}
            {REVIEWS.slice(1).map((r, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(13,13,13,.06)",
                  borderRadius: 28,
                  padding: 28,
                  transition: "transform .25s ease, box-shadow .25s ease",
                }}
              >
                {" "}
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {" "}
                  {"★★★★★".split("").map((star, idx) => (
                    <span key={idx} style={{ color: "#C8992A", fontSize: 13 }}>
                      {" "}
                      {star}{" "}
                    </span>
                  ))}{" "}
                </div>{" "}
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.9,
                    color: "rgba(13,13,13,.72)",
                    margin: "0 0 24px",
                  }}
                >
                  {" "}
                  {r.text}{" "}
                </p>{" "}
                <div
                  style={{
                    paddingTop: 20,
                    borderTop: "1px solid rgba(13,13,13,.06)",
                  }}
                >
                  {" "}
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "#0D0D0D",
                    }}
                  >
                    {" "}
                    {r.author}{" "}
                  </div>{" "}
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(13,13,13,.5)",
                      marginBottom: 10,
                    }}
                  >
                    {" "}
                    {r.role}{" "}
                  </div>{" "}
                  <div style={{ fontSize: 12, color: "rgba(13,13,13,.35)" }}>
                    {" "}
                    {r.sub}{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            ))}
          </div>
        </div>
      </section>


            
      {/* ───────────────────────────────
          Research Spotlight
      ─────────────────────────────── */}
      <section
        style={{
          background: "#F7F5F1",
          padding: "clamp(100px,10vw,160px) 0",
          borderBottom: "1px solid rgba(13,13,13,.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 clamp(20px,5vw,60px)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "1.1fr .9fr",
              gap: isMobile ? 50 : 80,
              alignItems: "center",
            }}
          >
            {/* LEFT */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "rgba(13,13,13,.45)",
                  marginBottom: 18,
                }}
              >
                Research Spotlight
              </div>

              <h2
                style={{
                  fontSize: "clamp(44px,6vw,90px)",
                  lineHeight: ".92",
                  letterSpacing: "-.07em",
                  fontWeight: 700,
                  color: "#0D0D0D",
                  margin: "0 0 28px",
                }}
              >
                BPC-157 &
                <br />
                TB-500
              </h2>

              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.9,
                  color: "rgba(13,13,13,.58)",
                  maxWidth: 560,
                  margin: "0 0 40px",
                }}
              >
                One of the most widely researched peptide
                combinations for regeneration-focused studies.
                Frequently selected by researchers seeking
                complementary compounds with published
                batch verification and transparent testing.
              </p>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 20,
                  marginBottom: 40,
                  maxWidth: 560,
                }}
              >
                {[
                  ["99%+", "Purity"],
                  ["COA", "Included"],
                  ["24hr", "Dispatch"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: isMobile ? 24 : 34,
                        fontWeight: 700,
                        letterSpacing: "-.05em",
                        color: "#0D0D0D",
                        marginBottom: 4,
                      }}
                    >
                      {value}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: ".12em",
                        color: "rgba(13,13,13,.45)",
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => addToCart(PAGE_PRODUCTS[0], 1)}
                  style={{
                    height: 54,
                    padding: "0 30px",
                    borderRadius: 999,
                    border: "none",
                    background: "#0D0D0D",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add BPC-157
                </button>

                <button
                  style={{
                    height: 54,
                    padding: "0 26px",
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid rgba(13,13,13,.08)",
                    color: "#0D0D0D",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View Certificates
                </button>
              </div>

              <div
                style={{
                  marginTop: 24,
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "rgba(13,13,13,.38)",
                }}
              >
                For laboratory and research purposes only.
                Not for human consumption.
              </div>
            </div>

            {/* RIGHT VISUAL */}
            <div>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(13,13,13,.06)",
                  borderRadius: 36,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: isMobile ? 320 : 540,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(180deg,#FCFBF8 0%,#F1EEE7 100%)",
                    position: "relative",
                  }}
                >
                  {/* subtle glow */}
                  <div
                    style={{
                      position: "absolute",
                      width: 320,
                      height: 320,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, rgba(200,153,42,.12), transparent 70%)",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: isMobile ? 18 : 36,
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <Vial
                      fromColor="#B08A32"
                      toColor="#D6B86C"
                      mg="5mg"
                      size="lg"
                    />

                    <Vial
                      fromColor="#4F6B9A"
                      toColor="#85A2D4"
                      mg="5mg"
                      size="lg"
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: "28px 32px",
                    borderTop: "1px solid rgba(13,13,13,.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "rgba(13,13,13,.45)",
                      marginBottom: 10,
                    }}
                  >
                    Featured Combination
                  </div>

                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      letterSpacing: "-.04em",
                      color: "#0D0D0D",
                      marginBottom: 12,
                    }}
                  >
                    BPC-157 + TB-500
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "rgba(13,13,13,.58)",
                    }}
                  >
                    Transparent batch testing,
                    QR-linked certificates,
                    and cold-chain handling standards.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ───────────────────────────────
          Research Areas
      ─────────────────────────────── */}
      <section
        style={{
          background: "#FFFFFF",
          padding: "clamp(100px,10vw,150px) 0",
          borderBottom: "1px solid rgba(13,13,13,.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 clamp(20px,5vw,60px)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "1fr auto",
              gap: 40,
              alignItems: "end",
              marginBottom: 70,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "rgba(13,13,13,.45)",
                  marginBottom: 18,
                }}
              >
                Research Categories
              </div>

              <h2
                style={{
                  fontSize: "clamp(44px,6vw,88px)",
                  lineHeight: ".92",
                  letterSpacing: "-.07em",
                  fontWeight: 700,
                  color: "#0D0D0D",
                  margin: "0 0 20px",
                }}
              >
                Explore research
                <br />
                focus areas.
              </h2>

              <p
                style={{
                  maxWidth: 560,
                  fontSize: 18,
                  lineHeight: 1.9,
                  color: "rgba(13,13,13,.58)",
                  margin: 0,
                }}
              >
                Browse compounds commonly selected for
                specific research objectives and laboratory
                investigation areas.
              </p>
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(13,13,13,.45)",
              }}
            >
              {CONCERNS.length} Research Areas
            </div>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(3,minmax(0,1fr))",
              gap: 28,
            }}
          >
            {CONCERNS.map((c) => (
              <a
                key={c.label}
                href="#"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div
                  style={{
                    background: "#FCFBF8",
                    border: "1px solid rgba(13,13,13,.06)",
                    borderRadius: 32,
                    overflow: "hidden",
                    transition:
                      "transform .25s ease, box-shadow .25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 24px 50px rgba(0,0,0,.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      height: isMobile ? 240 : 280,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={c.img}
                      alt={c.label}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      padding: "28px 30px 32px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        color: "rgba(13,13,13,.4)",
                        marginBottom: 12,
                      }}
                    >
                      Research Area
                    </div>

                    <h3
                      style={{
                        fontSize: isMobile ? 28 : 34,
                        lineHeight: 1,
                        letterSpacing: "-.04em",
                        color: "#0D0D0D",
                        margin: "0 0 14px",
                        fontWeight: 700,
                      }}
                    >
                      {c.label}
                    </h3>

                    <p
                      style={{
                        fontSize: 15,
                        lineHeight: 1.8,
                        color: "rgba(13,13,13,.58)",
                        margin: "0 0 28px",
                      }}
                    >
                      {c.sub}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0D0D0D",
                      }}
                    >
                      Explore Area
                      <span
                        style={{
                          opacity: 0.5,
                        }}
                      >
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Member Benefits (Redesigned Premium) ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(to bottom, #f8f8f6 0%, #f1f1ee 100%)",
          padding: "clamp(64px,8vw,80px) 0",
          borderBottom: "1px solid rgba(13,13,13,.08)",
        }}
      >
        {/* Background Glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "rgba(13,13,13,.03)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 clamp(10px,4vw,20px)",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 30,
              flexWrap: "wrap",
              marginBottom: 52,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".22em",
                  textTransform: "uppercase",
                  color: "rgba(13,13,13,.42)",
                  marginBottom: 16,
                }}
              >
                Member Access
              </div>

              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(30px,4.5vw,60px)",
                  lineHeight: 1.02,
                  letterSpacing: "-.05em",
                  margin: 0,
                  color: "#0d0d0d",
                }}
              >
                The Benefits of
                <br />
                Becoming a Member.
              </h2>
            </div>

            <p
              style={{
                maxWidth: 380,
                fontSize: 14,
                lineHeight: 1.8,
                color: "rgba(13,13,13,.58)",
                margin: 0,
              }}
            >
              Unlock faster ordering, exclusive research access, detailed
              tracking, and priority notifications across every stage of your
              experience.
            </p>
          </div>

          {/* Benefits Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, minmax(0,1fr))"
                : "repeat(4, minmax(0,1fr))",
              gap: 5,
              marginBottom: 46,
            }}
          >
            {[
              {
                title: "Private Consultations",
                desc: "Schedule one-on-one discussions with experienced research specialists.",
              },
              {
                title: "Express Checkout",
                desc: "Securely save your details for faster purchasing and repeat orders.",
              },
              {
                title: "Research Tracking",
                desc: "Access full order history, COAs, and batch verification anytime.",
              },
              {
                title: "Priority Alerts",
                desc: "Receive instant notifications for restocks and new compound releases.",
              },
            ].map((b, i) => (
              <div
                key={b.title}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background: "rgba(255,255,255,.72)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(13,13,13,.07)",
                  borderRadius: 24,
                  padding: "28px 14px",
                  transition:
                    "transform .35s ease, box-shadow .35s ease, border-color .35s ease",
                  boxShadow: "0 10px 30px rgba(0,0,0,.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 50px rgba(0,0,0,.08)";
                  e.currentTarget.style.borderColor = "rgba(13,13,13,.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,.04)";
                  e.currentTarget.style.borderColor = "rgba(13,13,13,.07)";
                }}
              >

                {/* Title */}
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: "-.02em",
                    color: "#0d0d0d",
                    marginBottom: 10,
                  }}
                >
                  {b.title}
                </div>

                {/* Desc */}
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.75,
                    color: "rgba(13,13,13,.56)",
                  }}
                >
                  {b.desc}
                </div>

                {/* Bottom Line */}
                <div
                  style={{
                    marginTop: 24,
                    width: 42,
                    height: 1,
                    background: "rgba(13,13,13,.12)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* CTA Area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              paddingTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "rgba(13,13,13,.48)",
                lineHeight: 1.7,
              }}
            >
              Join thousands of researchers using PepcoLab daily.
            </div>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <button
                style={{
                  height: 52,
                  padding: "0 28px",
                  borderRadius: 999,
                  border: "none",
                  background: "#0d0d0d",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: ".3s ease",
                  boxShadow: "0 12px 30px rgba(0,0,0,.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.background = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = "#0d0d0d";
                }}
              >
                Create Account
              </button>

              <button
                style={{
                  height: 52,
                  padding: "0 24px",
                  borderRadius: 999,
                  border: "1px solid rgba(13,13,13,.1)",
                  background: "rgba(255,255,255,.7)",
                  color: "#0d0d0d",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  cursor: "pointer",
                  transition: ".3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.7)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Member Login
              </button>
            </div>
          </div>
        </div>
      </section>

{/* ───────────────────────────────
    Quality Standards
─────────────────────────────── */}
<section
  style={{
    background: "#FCFBF8",
    padding: "clamp(100px,10vw,160px) 0",
    borderBottom: "1px solid rgba(13,13,13,.06)",
  }}
>
  <div
    style={{
      maxWidth: 1440,
      margin: "0 auto",
      padding: "0 clamp(20px,5vw,60px)",
    }}
  >
    {/* Header */}
    <div
      style={{
        maxWidth: 760,
        marginBottom: 80,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "rgba(13,13,13,.45)",
          marginBottom: 18,
        }}
      >
        Quality Standards
      </div>

      <h2
        style={{
          fontSize: "clamp(44px,6vw,88px)",
          lineHeight: ".92",
          letterSpacing: "-.07em",
          fontWeight: 700,
          color: "#0D0D0D",
          margin: "0 0 24px",
        }}
      >
        Transparency at
        <br />
        every stage.
      </h2>

      <p
        style={{
          fontSize: 18,
          lineHeight: 1.9,
          color: "rgba(13,13,13,.58)",
          maxWidth: 560,
          margin: 0,
        }}
      >
        Every product is backed by documented testing,
        traceable batch records, and controlled fulfilment
        procedures designed for research environments.
      </p>
    </div>

    {/* Standards Grid */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "repeat(2,minmax(0,1fr))",
        gap: 24,
      }}
    >
      {[
        {
          number: "01",
          title: "Independent Lab Testing",
          desc:
            "Every batch undergoes third-party verification before release.",
        },
        {
          number: "02",
          title: "Published Certificates",
          desc:
            "Researchers can review batch-specific COAs directly on the website.",
        },
        {
          number: "03",
          title: "Cold-Chain Fulfilment",
          desc:
            "Temperature-sensitive compounds are handled using controlled shipping procedures.",
        },
        {
          number: "04",
          title: "UK-Based Operations",
          desc:
            "Fast domestic dispatch with transparent documentation and support.",
        },
      ].map((item) => (
        <div
          key={item.number}
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(13,13,13,.06)",
            borderRadius: 32,
            padding: "34px",
            transition:
              "transform .25s ease, box-shadow .25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform =
              "translateY(-4px)";
            e.currentTarget.style.boxShadow =
              "0 20px 50px rgba(0,0,0,.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".14em",
              color: "rgba(13,13,13,.35)",
              marginBottom: 24,
            }}
          >
            {item.number}
          </div>

          <h3
            style={{
              fontSize: isMobile ? 26 : 34,
              lineHeight: 1,
              letterSpacing: "-.04em",
              fontWeight: 700,
              color: "#0D0D0D",
              margin: "0 0 14px",
            }}
          >
            {item.title}
          </h3>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "rgba(13,13,13,.58)",
              margin: 0,
            }}
          >
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* ───────────────────────────────
    Research Standards
─────────────────────────────── */}
<section
  style={{
    background: "#F9F7F3",
    padding: "clamp(100px,10vw,150px) 0",
    borderBottom: "1px solid rgba(13,13,13,.06)",
    overflow: "hidden",
    position: "relative",
  }}
>
  {/* ambient */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `
        radial-gradient(circle at top right,
        rgba(201,153,42,.06),
        transparent 35%)
      `,
      pointerEvents: "none",
    }}
  />

  <div
    style={{
      maxWidth: 1440,
      margin: "0 auto",
      padding: "0 clamp(20px,5vw,60px)",
      position: "relative",
      zIndex: 2,
    }}
  >
    {/* Header */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "minmax(0,1fr) 420px",
        gap: 40,
        marginBottom: 90,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "rgba(13,13,13,.42)",
            marginBottom: 18,
          }}
        >
          Research Standards
        </div>

        <h2
          style={{
            fontSize: "clamp(44px,6vw,92px)",
            lineHeight: ".92",
            letterSpacing: "-.07em",
            fontWeight: 700,
            color: "#0D0D0D",
            margin: 0,
          }}
        >
          Built around
          <br />
          transparency.
        </h2>
      </div>

      <div
        style={{
          alignSelf: "end",
        }}
      >
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.9,
            color: "rgba(13,13,13,.58)",
            margin: 0,
          }}
        >
          From independent testing to batch
          documentation and temperature-controlled
          fulfilment, every stage is designed to support
          serious research environments.
        </p>
      </div>
    </div>

    {/* Standards */}
    <div
      style={{
        borderTop: "1px solid rgba(13,13,13,.08)",
      }}
    >
      {[
        {
          num: "01",
          title: "Independent Verification",
          desc:
            "Every production batch is reviewed through third-party analytical testing before release.",
        },
        {
          num: "02",
          title: "Published Documentation",
          desc:
            "Certificates of Analysis remain accessible for researchers seeking complete transparency.",
        },
        {
          num: "03",
          title: "Controlled Fulfilment",
          desc:
            "Temperature-sensitive products are dispatched using monitored logistics procedures.",
        },
      ].map((item) => (
        <div
          key={item.num}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "120px 320px 1fr",
            gap: 30,
            padding: "34px 0",
            borderBottom:
              "1px solid rgba(13,13,13,.08)",
            alignItems: "start",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: ".14em",
              color: "rgba(13,13,13,.3)",
            }}
          >
            {item.num}
          </div>

          <div
            style={{
              fontSize: isMobile
                ? 28
                : 38,
              fontWeight: 700,
              letterSpacing: "-.04em",
              color: "#0D0D0D",
              lineHeight: 1,
            }}
          >
            {item.title}
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.9,
              color: "rgba(13,13,13,.58)",
              maxWidth: 520,
            }}
          >
            {item.desc}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


{/* ───────────────────────────────
    Research Updates
─────────────────────────────── */}
<section
  style={{
    background: "#FFFFFF",
    padding: "clamp(50px,5vw,100px) 0",
    borderBottom: "1px solid rgba(13,13,13,.06)",
  }}
>
  <div
    style={{
      maxWidth: 1240,
      margin: "0 auto",
      padding: "0 clamp(10px,3vw,30px)",
    }}
  >
    <div
      style={{
        background: "#F8F5EF",
        borderRadius: 40,
        border: "1px solid rgba(13,13,13,.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "1.1fr .9fr",
          gap: 20,
          padding: isMobile
            ? "40px 14px"
            : "70px 70px",
        }}
      >
        {/* LEFT */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "rgba(13,13,13,.45)",
              marginBottom: 18,
            }}
          >
            Research Updates
          </div>

          <h2
            style={{
              fontSize: "clamp(38px,5vw,72px)",
              lineHeight: ".92",
              letterSpacing: "-.06em",
              fontWeight: 700,
              color: "#0D0D0D",
              margin: "0 0 20px",
            }}
          >
            Stay informed on
            <br />
            new releases.
          </h2>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.9,
              color: "rgba(13,13,13,.58)",
              maxWidth: 520,
              margin: 0,
            }}
          >
            Receive updates on newly available compounds,
            published Certificates of Analysis,
            batch releases, and research announcements.
          </p>
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {[
              "New compound launches",
              "Batch-specific COA updates",
              "Research announcements",
              "Fulfilment & availability alerts",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                  color: "#0D0D0D",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#C8992A",
                    flexShrink: 0,
                  }}
                />

                {item}
              </div>
            ))}
          </div>

          {/* Form */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile
                ? "column"
                : "row",
              gap: 12,
            }}
          >
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              style={{
                flex: 1,
                height: 58,
                borderRadius: 999,
                border:
                  "1px solid rgba(13,13,13,.08)",
                padding: "0 24px",
                fontSize: 14,
                outline: "none",
                background: "#fff",
              }}
            />

            <button
              onClick={() => {
                if (email.includes("@")) {
                  setSubbed(true);
                  setEmail("");
                }
              }}
              style={{
                height: 58,
                padding: "0 28px",
                borderRadius: 999,
                border: "none",
                background: "#C8992A",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: ".06em",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {subbed
                ? "✓ Subscribed"
                : "Join Updates"}
            </button>
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 11,
              lineHeight: 1.8,
              color: "rgba(13,13,13,.38)",
            }}
          >
            No spam. Only relevant research updates,
            product releases, and documentation alerts.
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop:
            "1px solid rgba(13,13,13,.06)",
          background: "#FCFBF8",
          padding: "22px 14px",
          display: "flex",
          gap: 30,
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "rgba(13,13,13,.55)",
          }}
        >
          Trusted by 2,400+ researchers across the UK.
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            "Independent Testing",
            "Published COAs",
            "Cold-Chain Fulfilment",
          ].map((item) => (
            <span
              key={item}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(13,13,13,.45)",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>
      
      <Footer />
      <style>
        {`
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-33.33%)} }
  @keyframes reviewMarquee { 0%{transform:translateX(0)} 100%{transform:translateX(-33.33%)} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { display: none; }
  input::placeholder { color: rgba(255,255,255,.38); }
  .concerns-grid { grid-template-columns: repeat(${CONCERNS.length}, minmax(130px, 1fr)); }
  @media (max-width: 768px) {
    .concerns-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .diff-card { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,.06); }
  }
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

`}
      </style>
    </div>
  );
}
