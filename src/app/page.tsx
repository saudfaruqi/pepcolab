"use client";
import Nav from "@/components/Nav";
import { useState, useEffect, useRef, useId, useCallback } from "react";
import { HeroCinematic } from "@/components/HeroSections";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS as DATA_PRODUCTS } from "@/app/data";
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

// ── Products data ─────────────────────────────────────────────────────────
const PAGE_PRODUCTS = [
  {
    id: 1,
    name: "BPC-157",
    mg: "5mg",
    price: 44.99,
    category: "Recovery",
    from: "#EEF2FD",
    to: "#3B82F6",
    badge: "bestseller",
    desc: "Gut lining & tendon repair peptide.",
  },
  {
    id: 2,
    name: "TB-500",
    mg: "5mg",
    price: 52.99,
    category: "Recovery",
    from: "#F0FAF4",
    to: "#16A34A",
    badge: "popular",
    desc: "Thymosin Beta-4 wound healing complex.",
  },
  {
    id: 3,
    name: "GLP-1 (Tera)",
    mg: "5mg",
    price: 62.99,
    category: "Metabolic",
    from: "#FDF4FF",
    to: "#A855F7",
    badge: "new",
    desc: "Eurofins verified 99.1% purity — new formula.",
  },
  {
    id: 4,
    name: "GHK-Cu",
    mg: "200mg",
    price: 38.99,
    category: "Skin",
    from: "#FFF7ED",
    to: "#EA580C",
    badge: null,
    desc: "Copper peptide for skin regeneration.",
  },
  {
    id: 5,
    name: "CJC-1295",
    mg: "2mg",
    price: 49.99,
    category: "HGH",
    from: "#F0F9FF",
    to: "#0EA5E9",
    badge: "sale",
    desc: "Growth hormone releasing peptide.",
    oldPrice: 59.99,
  },
  {
    id: 6,
    name: "Ipamorelin",
    mg: "5mg",
    price: 46.99,
    category: "HGH",
    from: "#FFF1F2",
    to: "#E11D48",
    badge: null,
    desc: "Clean GH pulse with minimal side-effects.",
  },
  {
    id: 7,
    name: "PT-141",
    mg: "10mg",
    price: 55.99,
    category: "Libido",
    from: "#F5F3FF",
    to: "#7C3AED",
    badge: "new",
    desc: "Melanocortin receptor agonist peptide.",
  },
  {
    id: 8,
    name: "Semax",
    mg: "30mg",
    price: 48.99,
    category: "Cognitive",
    from: "#ECFDF5",
    to: "#059669",
    badge: null,
    desc: "Nootropic & neuroprotective peptide.",
  },
];

// ── Bundle data ───────────────────────────────────────────────────────────
const BUNDLES = [
  {
    id: 101,
    name: "Recovery Stack",
    desc: "BPC-157 + TB-500 — the most researched combination for tissue repair, gut integrity, and systemic recovery.",
    products: [PAGE_PRODUCTS[0], PAGE_PRODUCTS[1]],
    price: 89.99,
    rrp: 97.98,
    badge: "Save £8",
    from: "#EEF2FD",
    to: "#16A34A",
    highlight: true,
  },
  {
    id: 102,
    name: "HGH Pulse Stack",
    desc: "CJC-1295 + Ipamorelin — synergistic growth hormone secretagogues for clean GH pulsatility.",
    products: [PAGE_PRODUCTS[4], PAGE_PRODUCTS[5]],
    price: 87.99,
    rrp: 96.98,
    badge: "Save £9",
    from: "#F0F9FF",
    to: "#E11D48",
    highlight: false,
  },
  {
    id: 103,
    name: "Cognitive & Metabolic",
    desc: "Semax + GLP-1 — neuroprotection paired with metabolic regulation for peak research outcomes.",
    products: [PAGE_PRODUCTS[7], PAGE_PRODUCTS[2]],
    price: 104.99,
    rrp: 111.98,
    badge: "Save £7",
    from: "#ECFDF5",
    to: "#A855F7",
    highlight: false,
  },
];

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
const STEPS = [
  {
    num: "01 — Synthesis",
    title: "GMP-Grade Synthesis",
    desc: "Every compound is synthesised to pharmaceutical-grade standards before entering our verification pipeline.",
  },
  {
    num: "02 — Verification",
    title: "HPLC + Eurofins UK",
    desc: "Independent HPLC mass-spec analysis by Eurofins UK confirms purity and identity. Every single batch, no exceptions.",
  },
  {
    num: "03 — Dispatch",
    title: "Cold-Chain to Your Door",
    desc: "Temperature-controlled packaging, tracked next-day delivery, with the batch COA QR code on every order.",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────
type Product = (typeof PAGE_PRODUCTS)[0];
type CartItem = { product: Product; qty: number };

// ── Button styles ─────────────────────────────────────────────────────────
const darkBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "#0d0d0d",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: ".05em",
  padding: "10px 22px",
  borderRadius: 40,
  border: "1.5px solid #0d0d0d",
  cursor: "pointer",
  fontFamily: "inherit",
};
const ghostBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "transparent",
  color: "#0d0d0d",
  fontSize: 12,
  fontWeight: 500,
  padding: "9px 20px",
  borderRadius: 40,
  border: "1.5px solid rgba(13,13,13,.2)",
  cursor: "pointer",
  fontFamily: "inherit",
};

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

// ── Bundle Card ───────────────────────────────────────────────────────────
function BundleCard({
  bundle,
  onAdd,
}: {
  bundle: (typeof BUNDLES)[0];
  onAdd: () => void;
}) {
  const [added, setAdded] = useState(false);
  const saving = (bundle.rrp - bundle.price).toFixed(2);

  return (
    <div
      style={{
        border: bundle.highlight
          ? "2px solid #0d0d0d"
          : "1px solid rgba(13,13,13,.1)",
        background: "#fff",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow .22s, transform .22s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.1)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {bundle.highlight && (
        <div
          style={{
            background: "#0d0d0d",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            padding: "5px 14px",
            display: "inline-block",
          }}
        >
          Most Popular
        </div>
      )}
      {/* Vials preview */}
      <div
        style={{
          background: `linear-gradient(135deg, ${bundle.from}44, ${bundle.to}33)`,
          padding: "28px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {bundle.products.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Vial fromColor={p.from} toColor={p.to} mg={p.mg} size="lg" />
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "rgba(13,13,13,.45)",
              }}
            >
              {p.name}
            </span>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "rgba(13,13,13,.32)",
            marginBottom: 6,
          }}
        >
          Bundle
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-.02em",
            marginBottom: 8,
          }}
        >
          {bundle.name}
        </div>
        <p
          style={{
            fontSize: 12.5,
            color: "rgba(13,13,13,.55)",
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          {bundle.desc}
        </p>
        <div
          style={{
            fontSize: 10,
            color: "rgba(13,13,13,.35)",
            fontStyle: "italic",
            marginBottom: 12,
          }}
        >
          For research use only
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(13,13,13,.08)",
            paddingTop: 14,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                £{bundle.price.toFixed(2)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(13,13,13,.35)",
                  textDecoration: "line-through",
                }}
              >
                £{bundle.rrp.toFixed(2)}
              </span>
            </div>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#0A7B45",
                background: "#EDFAF3",
                padding: "2px 8px",
                borderRadius: 10,
                display: "inline-block",
                marginTop: 4,
              }}
            >
              {bundle.badge}
            </span>
          </div>
          <button
            onClick={() => {
              onAdd();
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            style={{
              ...darkBtnStyle,
              background: added ? "#0A7B45" : "#0d0d0d",
              fontSize: 12,
            }}
          >
            {added ? "✓ Added" : "+ Add Bundle"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DiffsSection ──────────────────────────────────────────────────────────
function DiffsSection() {
  const { ref, inView } = useInView("0px 0px -80px 0px");
  return (
    <section
      style={{
        background: "#0d0d0d",
        padding: "clamp(60px,10vw,120px) 0",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes d-fadeUp   { from{opacity:0;transform:translateY(44px)} to{opacity:1;transform:translateY(0)} }
        @keyframes d-fadeLeft { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes d-scaleIn  { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
        @keyframes d-lineX    { from{width:0} to{width:100%} }
        .diff-card:hover .diff-card-inner { background: #1a1a1a !important; }
        .diff-card:hover .diff-num        { color: #fff !important; }
        .diff-card:hover .diff-arrow      { transform: translate(3px,-3px); }
        .diff-arrow { transition: transform .3s cubic-bezier(.16,1,.3,1); display:inline-block; }
      `}</style>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 clamp(20px,5vw,48px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 48,
            alignItems: "flex-end",
            marginBottom: 80,
          }}
        >
          <div
            style={{
              opacity: 0,
              animation: inView
                ? "d-fadeLeft 0.8s cubic-bezier(.16,1,.3,1) 0s forwards"
                : "none",
            }}
          >
            <h2
              style={{
                fontFamily: "Georgia,serif",
                fontSize: "clamp(30px,4.5vw,68px)",
                fontWeight: 700,
                letterSpacing: "-.04em",
                lineHeight: 0.95,
                color: "#fff",
                margin: 0,
              }}
            >
              What Makes
              <br />
              <em
                style={{ fontStyle: "italic", color: "rgba(255,255,255,.28)" }}
              >
                Us Different?
              </em>
            </h2>
          </div>
          <div
            style={{
              opacity: 0,
              animation: inView
                ? "d-fadeUp 0.8s cubic-bezier(.16,1,.3,1) 0.15s forwards"
                : "none",
            }}
          >
            <p
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,.38)",
                lineHeight: 1.8,
                maxWidth: 380,
                margin: "0 0 28px",
              }}
            >
              Every claim we make is backed by independent laboratory
              verification. Not marketing. Science.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  height: 1,
                  width: 40,
                  background: "rgba(255,255,255,.15)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.25)",
                }}
              >
                4 core standards
              </span>
            </div>
          </div>
        </div>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,.08)",
            marginBottom: 2,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              background: "rgba(255,255,255,.25)",
              width: 0,
              animation: inView
                ? "d-lineX 1s cubic-bezier(.16,1,.3,1) 0.2s forwards"
                : "none",
            }}
          />
        </div>
        <div
          ref={ref}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          }}
        >
          {DIFFS.map((d, i) => (
            <div
              key={i}
              className="diff-card"
              style={{
                borderRight:
                  i < DIFFS.length - 1
                    ? "1px solid rgba(255,255,255,.06)"
                    : "none",
                opacity: 0,
                animation: inView
                  ? `d-scaleIn 0.65s cubic-bezier(.16,1,.3,1) ${0.25 + i * 0.1}s forwards`
                  : "none",
              }}
            >
              <div
                className="diff-card-inner"
                style={{
                  padding: "clamp(24px,3vw,40px) clamp(16px,2.5vw,32px)",
                  transition: "background .25s",
                  height: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="diff-num"
                  style={{
                    fontFamily: "Georgia,serif",
                    fontSize: "clamp(48px,5vw,72px)",
                    fontWeight: 700,
                    lineHeight: 1,
                    color: "rgba(255,255,255,.06)",
                    letterSpacing: "-.04em",
                    marginBottom: 32,
                    transition: "color .25s",
                    userSelect: "none",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "-.02em",
                    lineHeight: 1.25,
                    marginBottom: 14,
                  }}
                >
                  {d.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,.35)",
                    lineHeight: 1.8,
                    marginBottom: 36,
                  }}
                >
                  {d.desc}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.25)",
                    cursor: "pointer",
                  }}
                >
                  <span>Learn more</span>
                  <span className="diff-arrow" style={{ fontSize: 14 }}>
                    ↗
                  </span>
                </div>
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
  const [tab, setTab] = useState("bestsellers");
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const carRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i,
        );
      return [...prev, { product, qty }];
    });
  }, []);

  const addBundleToCart = useCallback(
    (bundle: (typeof BUNDLES)[0]) => {
      bundle.products.forEach((p) => addToCart(p, 1));
    },
    [addToCart],
  );

  const changeQty = useCallback((id: number, qty: number) => {
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const removeItem = useCallback((id: number) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const scroll = (dir: number) =>
    carRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  const tabProds =
    tab === "bestsellers"
      ? PAGE_PRODUCTS
      : tab === "new"
        ? PAGE_PRODUCTS.filter(
          (p) => p.badge === "new" || p.badge === "popular",
        )
        : PAGE_PRODUCTS.filter((p) => p.badge === "sale" || !!p.oldPrice);

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

      {/* ── Products ── */}
      <section
        style={{ padding: "clamp(40px,6vw,72px) 0", background: "#fff" }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 clamp(16px,3vw,32px)",
          }}
        >
          <div className="products-grid">
            {DATA_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Research Stacks / Editorial Layout ── */}
      <section
        style={{
          position: "relative",
          background: "#f6f4ef",
          padding: "clamp(70px,8vw,130px) 0",
          overflow: "hidden",
          borderBottom: "1px solid rgba(13,13,13,.06)",
        }}
      >
        {/* ambient background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(circle at top left, rgba(255,255,255,.9), transparent 30%),
              radial-gradient(circle at bottom right, rgba(201,153,42,.06), transparent 40%)
            `,
            pointerEvents: "none",
          }}
        />

        {/* massive faded text */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: isMobile ? "72px" : "clamp(90px,14vw,240px)",
            fontWeight: 700,
            letterSpacing: "-.08em",
            color: "rgba(13,13,13,.03)",
            whiteSpace: "nowrap",
            userSelect: "none",
            pointerEvents: "none",
            lineHeight: 1,
          }}
        >
          STACKS
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1480,
            margin: "0 auto",
            padding: "0 clamp(20px,4vw,60px)",
          }}
        >
          {/* top layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr" // mobile → 2 rows (stacked)
                : "minmax(280px,420px) 1fr", // laptop → 1 row
              gap: 40,
              alignItems: "end",
              marginBottom: 54,
            }}
          >
            {/* left */}
            <div>
              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(42px,6vw,84px)",
                  lineHeight: ".92",
                  letterSpacing: "-.07em",
                  fontWeight: 700,
                  color: "#0d0d0d",
                  margin: "0 0 22px",
                }}
              >
                Synergistic
                <br />
                Compound
                <br />
                Stacks.
              </h2>
            </div>

            {/* right */}
            <div
              style={{
                maxWidth: 620,
                marginLeft: "auto",
                paddingBottom: 10,
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: "rgba(13,13,13,.58)",
                  margin: "0 0 28px",
                }}
              >
                Precision-designed research bundles combining complementary
                compounds for advanced protocol optimization, cleaner workflows,
                and higher-value purchasing.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 30,
                  flexWrap: "wrap",
                }}
              >
                {[
                  ["Save More", "Bundle pricing"],
                  ["Lab Verified", "Batch-tested"],
                  ["Cold Chain", "Temperature controlled"],
                ].map(([title, text]) => (
                  <div key={title}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0d0d0d",
                        marginBottom: 4,
                      }}
                    >
                      {title}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(13,13,13,.45)",
                      }}
                    >
                      {text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit,minmax(340px,1fr))",
              gap: isMobile ? 18 : 26,
            }}
          >
            {BUNDLES.map((b, i) => (
              <div
                key={b.id}
                style={{
                  position: "relative",
                  borderRadius: isMobile ? 24 : 34,
                  overflow: "hidden",
                  background: "rgba(255,255,255,.72)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(13,13,13,.06)",
                  boxShadow: "0 10px 40px rgba(0,0,0,.04)",
                  transition:
                    "transform .45s cubic-bezier(.22,1,.36,1), box-shadow .45s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform =
                    "translateY(-10px) scale(1.01)";
                  e.currentTarget.style.boxShadow =
                    "0 30px 70px rgba(0,0,0,.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 40px rgba(0,0,0,.04)";
                }}
              >
                {/* number */}
                <div
                  style={{
                    position: "absolute",
                    top: 22,
                    right: 24,
                    fontSize: 52,
                    fontWeight: 700,
                    letterSpacing: "-.08em",
                    color: "rgba(13,13,13,.05)",
                    lineHeight: 1,
                  }}
                >
                  0{i + 1}
                </div>

                {/* top image area */}
                <div
                  style={{
                    position: "relative",
                    height: isMobile ? 190 : 280,
                    overflow: "hidden",
                    background:
                      "linear-gradient(135deg,#f1ede6 0%,#f7f5f1 100%)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: isMobile ? 10 : 20,
                      padding: isMobile ? 18 : 28,
                    }}
                  >
                    {b.products.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Vial
                          fromColor={p.from}
                          toColor={p.to}
                          mg={p.mg}
                          size="lg"
                        />
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: ".06em",
                            textTransform: "uppercase",
                            color: "rgba(13,13,13,.45)",
                          }}
                        >
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* glow */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(circle at top right, rgba(255,255,255,.9), transparent 40%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* content */}
                <div
                  style={{
                    padding: isMobile ? "20px 18px 22px" : "30px 30px 32px",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: isMobile ? 20 : 34,
                      lineHeight: 1,
                      letterSpacing: "-.05em",
                      color: "#0d0d0d",
                      margin: "0 0 14px",
                    }}
                  >
                    {b.name}
                  </h3>

                  <p
                    style={{
                      fontSize: isMobile ? 12 : 14,
                      lineHeight: 1.8,
                      color: "rgba(13,13,13,.58)",
                      margin: "0 0 26px",
                    }}
                  >
                    {b.desc}
                  </p>

                  {/* bottom */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "stretch" : "center",
                      justifyContent: "space-between",
                      gap: 18,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(13,13,13,.4)",
                          marginBottom: 3,
                        }}
                      >
                        Bundle Price
                      </div>

                      <div
                        style={{
                          fontSize: isMobile ? 18 : 28,
                          fontWeight: 700,
                          letterSpacing: "-.05em",
                          color: "#0d0d0d",
                        }}
                      >
                        £ {b.price}
                      </div>
                    </div>

                    <button
                      onClick={() => addBundleToCart(b)}
                      style={{
                        height: isMobile ? 46 : 52,
                        padding: isMobile ? "0 18px" : "0 26px",
                        borderRadius: 999,
                        border: "none",
                        background: "#0d0d0d",
                        color: "#fff",
                        fontSize: isMobile ? 12 : 14,
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        boxShadow: "0 14px 30px rgba(0,0,0,.12)",
                      }}
                    >
                      Add Stack
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

      {/* ── Reviews ── */}
      <section
        style={{
          background: "#fff",
          borderBottom: "1px solid rgba(13,13,13,.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "clamp(40px,6vw,60px) clamp(16px,3vw,32px) 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 32,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "rgba(13,13,13,.45)",
                  marginBottom: 8,
                }}
              >
                Verified Purchasers
              </span>
              <h2
                style={{
                  fontFamily: "Georgia,serif",
                  fontSize: "clamp(20px,2.5vw,36px)",
                  fontWeight: 700,
                  letterSpacing: "-.04em",
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                What Our Community Says
              </h2>
            </div>
            <a
              href="#"
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                color: "#0d0d0d",
                textDecoration: "none",
                borderBottom: "1.5px solid #0d0d0d",
                paddingBottom: 2,
              }}
            >
              All Reviews
            </a>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            paddingBottom: 60,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 120,
              height: "100%",
              background: "linear-gradient(to right, #fff, transparent)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 120,
              height: "100%",
              background: "linear-gradient(to left, #fff, transparent)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              width: "max-content",
              animation: "reviewMarquee 32s linear infinite",
            }}
          >
            {[...REVIEWS, ...REVIEWS, ...REVIEWS].map((r, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 340px",
                  width: 340,
                  marginRight: 20,
                  border: "1px solid rgba(13,13,13,.09)",
                  padding: "28px 28px 24px",
                  background: i % 2 === 0 ? "#fff" : "#fafaf9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", gap: 2 }}>
                    {"★★★★★"
                      .split("")
                      .slice(0, r.rating)
                      .map((_, j) => (
                        <span
                          key={j}
                          style={{ color: "#c8992a", fontSize: 13 }}
                        >
                          ★
                        </span>
                      ))}
                  </div>
                  <span style={{ fontSize: 22, color: "rgba(13,13,13,.08)" }}>
                    "
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.75,
                    color: "rgba(13,13,13,.72)",
                    fontStyle: "italic",
                    margin: "0 0 20px",
                  }}
                >
                  "{r.text}"
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "#f0ede8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "rgba(13,13,13,.45)",
                      flexShrink: 0,
                    }}
                  >
                    {r.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "-.01em",
                      }}
                    >
                      {r.author}
                    </div>
                    <div
                      style={{ fontSize: 11.5, color: "rgba(13,13,13,.42)" }}
                    >
                      {r.role}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".04em",
                      color: "#0A7B45",
                      background: "#EDFAF3",
                      border: "1px solid rgba(10,123,69,.15)",
                      padding: "3px 9px",
                      borderRadius: 20,
                    }}
                  >
                    ✓ Verified
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(13,13,13,.32)",
                    fontWeight: 600,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(13,13,13,.06)",
                  }}
                >
                  {r.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 clamp(16px,3vw,32px) 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              padding: "28px clamp(16px,3vw,32px)",
              background: "#f5f5f3",
              border: "1px solid rgba(13,13,13,.08)",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "rgba(13,13,13,.65)",
                flex: 1,
                minWidth: 200,
              }}
            >
              Join 2,400+ researchers who trust PepcoLab.
            </span>
            <button style={darkBtnStyle} onClick={() => setCartOpen(true)}>
              Shop All Peptides
            </button>
            <button style={ghostBtnStyle}>View Certificates</button>
          </div>
        </div>
      </section>

      {/* ── Spotlight ── */}
      {/* ── Spotlight / Featured Stack (Redesigned Premium) ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#0b0b0b",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "grid",

            minHeight: "min(920px, 88vh)",
          }}
        >
          {/* LEFT CONTENT */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              padding: "clamp(34px,5vw,86px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background:
                "radial-gradient(circle at top left, rgba(255,255,255,.06), transparent 40%), #0b0b0b",
            }}
          >
            {/* label */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 1,
                  background: "rgba(255,255,255,.2)",
                }}
              />

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.42)",
                }}
              >
                Research Spotlight
              </span>
            </div>

            {/* heading */}
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(42px,6vw,88px)",
                lineHeight: 0.94,
                letterSpacing: "-.06em",
                color: "#fff",
                margin: "0 0 24px",
              }}
            >
              BPC-157
              <span style={{ color: "rgba(255,255,255,.28)" }}> +</span>
              <br />
              TB-500
              <br />
              Recovery Stack
            </h2>

            {/* desc */}
            <p
              style={{
                maxWidth: 480,
                fontSize: 15,
                lineHeight: 1.9,
                color: "rgba(255,255,255,.54)",
                margin: "0 0 26px",
              }}
            >
              Designed for advanced recovery and regeneration research. Trusted
              by laboratories and independent researchers seeking transparent
              verification and premium-grade peptide compounds.
            </p>

            {/* quote card */}
            <div
              style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.06)",
                backdropFilter: "blur(12px)",
                borderRadius: 22,
                padding: "24px 24px",
                maxWidth: 440,
                marginBottom: 34,
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "#fff",
                  marginBottom: 16,
                  letterSpacing: "-.02em",
                }}
              >
                “Finally a UK supplier that publishes their actual lab
                verification data.”
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,.72)",
                      fontWeight: 600,
                    }}
                  >
                    S. Lowe
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,.35)",
                      marginTop: 4,
                    }}
                  >
                    Pharmacology Research
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    color: "#fff",
                    fontSize: 13,
                  }}
                >
                  ★★★★★
                </div>
              </div>
            </div>

            {/* disclaimer */}
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.7,
                color: "rgba(255,255,255,.28)",
                marginBottom: 34,
                maxWidth: 420,
              }}
            >
              For laboratory and research purposes only. Not for human
              consumption.
            </div>

            {/* CTA row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => addToCart(PAGE_PRODUCTS[0], 1)}
                style={{
                  height: 56,
                  padding: "0 32px",
                  borderRadius: 999,
                  border: "none",
                  background: "#fff",
                  color: "#0b0b0b",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: ".3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.opacity = ".92";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                Add BPC-157
              </button>

              <button
                style={{
                  height: 56,
                  padding: "0 26px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.12)",
                  background: "transparent",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: ".3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                View Research Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Research Areas ── */}
      <section
        style={{
          padding: "clamp(40px,6vw,72px) 0",
          borderBottom: "1px solid rgba(13,13,13,.1)",
          background: "#fff",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 clamp(16px,3vw,32px)",
          }}
        >
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: "Georgia,serif",
                fontSize: "clamp(22px,3vw,44px)",
                fontWeight: 700,
                letterSpacing: "-.04em",
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Common Research Areas
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "rgba(13,13,13,.55)",
                marginTop: 8,
              }}
            >
              Not sure where to begin? Here are some common research
              applications.
            </p>
          </div>
          <div
            className="concerns-grid"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${CONCERNS.length}, minmax(130px, 1fr))`,
              gap: "clamp(12px, 3vw, 16px)",
              overflowX: "auto",
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
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector(
                    "img",
                  ) as HTMLImageElement;
                  if (img) {
                    img.style.transform = "scale(1.04)";
                    img.style.filter = "grayscale(0%)";
                  }
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector(
                    "img",
                  ) as HTMLImageElement;
                  if (img) {
                    img.style.transform = "scale(1)";
                    img.style.filter = "grayscale(100%)";
                  }
                }}
              >
                <div
                  style={{
                    aspectRatio: ".85",
                    overflow: "hidden",
                    marginBottom: 14,
                    background: "#e8e4dc",
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
                      filter: "grayscale(100%)",
                      transition: "transform .5s ease, filter .5s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "-.01em",
                    color: "#0d0d0d",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 4,
                  }}
                >
                  {c.label}{" "}
                  <span style={{ opacity: 0.4, fontSize: 11 }}>→</span>
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(13,13,13,.45)" }}>
                  {c.sub}
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
          padding: "clamp(64px,8vw,110px) 0",
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
            padding: "0 clamp(18px,4vw,40px)",
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
              gap: 18,
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
                  padding: "28px 24px",
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
                {/* Top Number */}
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    right: 18,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(13,13,13,.16)",
                    letterSpacing: ".14em",
                  }}
                >
                  0{i + 1}
                </div>

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

      {/* ── Premium Consultation Experience Banner ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #f8f5ef 0%, #ffffff 45%, #f3efe7 100%)",
          borderBottom: "1px solid rgba(13,13,13,.08)",
        }}
      >
        {/* Background Glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "-120px",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(201, 169, 110, 0.12)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr minmax(340px, 560px) 1fr",
            alignItems: "stretch",
            minHeight: 520,
          }}
        >
          {/* Left Image */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img
              src={IMGS.consultLeft}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scale(1.03)",
                transition: "transform .7s ease",
              }}
            />

            {/* Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(0,0,0,.18), rgba(0,0,0,.02))",
              }}
            />
          </div>

          {/* Center Content */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "clamp(50px,6vw,90px)",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 460,
                textAlign: "center",
              }}
            >
              {/* Heading */}
              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(34px,5vw,62px)",
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-.06em",
                  margin: "0 0 22px",
                  color: "#0d0d0d",
                }}
              >
                Personal Styling
                <br />
                Consultations
              </h2>

              {/* Description */}
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: "rgba(13,13,13,.62)",
                  maxWidth: 400,
                  margin: "0 auto 38px",
                }}
              >
                Experience tailored recommendations, expert advice, and
                one-on-one guidance curated around your personal style and
                preferences.
              </p>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  style={{
                    height: isMobile ? 46 : 52,
                    padding: isMobile ? "0 18px" : "0 26px",
                    width: isMobile ? "100%" : "auto",
                    borderRadius: 999,
                    border: "1px solid rgba(13,13,13,.12)",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: ".02em",
                    cursor: "pointer",
                    transition: ".25s ease",
                  }}
                >
                  Explore Services
                </button>

                <button
                  style={{
                    height: 52,
                    padding: "0 30px",
                    borderRadius: 999,
                    border: "none",
                    background: "#111",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: ".02em",
                    cursor: "pointer",
                    boxShadow: "0 12px 30px rgba(0,0,0,.18)",
                    transition: ".25s ease",
                  }}
                >
                  Book Consultation
                </button>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <img
              src={IMGS.consultRight}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scale(1.03)",
              }}
            />

            {/* Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to left, rgba(0,0,0,.18), rgba(0,0,0,.02))",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Lab Stats (Mobile Responsive Redesign) ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(255,255,255,.06), transparent 60%), #0b0b0b",
          padding: isMobile
            ? "72px 18px"
            : "clamp(64px,8vw,120px) clamp(20px,5vw,72px)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        {/* ambient glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,.04), transparent 30%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1400,
            margin: "0 auto",
          }}
        >
          {/* label */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.35)",
              marginBottom: isMobile ? 16 : 18,
            }}
          >
            Verified Lab Pipeline
          </div>

          {/* header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.3fr .7fr",
              gap: isMobile ? 28 : 40,
              alignItems: "end",
              marginBottom: isMobile ? 40 : 56,
            }}
          >
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: isMobile ? "42px" : "clamp(30px,4.5vw,64px)",
                lineHeight: isMobile ? 1 : 1.05,
                letterSpacing: "-.05em",
                color: "#fff",
                margin: 0,
              }}
            >
              Every Compound.
              <br />
              Every Batch.
              <br />
              <span style={{ color: "rgba(255,255,255,.35)" }}>
                Independently Verified.
              </span>
            </h2>

            <p
              style={{
                fontSize: isMobile ? 13 : 13,
                lineHeight: 1.9,
                color: "rgba(255,255,255,.45)",
                margin: 0,
                maxWidth: isMobile ? "100%" : 320,
              }}
            >
              Every product undergoes multi-stage verification, including
              synthesis validation, purity analysis, and third-party lab
              confirmation before release.
            </p>
          </div>

          {/* images */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(2, minmax(0,1fr))",
              gap: isMobile ? 14 : 18,
              marginBottom: isMobile ? 18 : 26,
            }}
          >
            {[
              { src: IMGS.lab1, label: "Synthesis Lab" },
              { src: IMGS.lab2, label: "HPLC Analysis" },
            ].map((l) => (
              <div
                key={l.label}
                style={{
                  position: "relative",
                  height: isMobile ? 220 : 320,
                  overflow: "hidden",
                  borderRadius: isMobile ? 16 : 22,
                  cursor: "pointer",
                  transform: "translateZ(0)",
                }}
                onMouseEnter={(e) => {
                  if (isMobile) return;

                  const img = e.currentTarget.querySelector(
                    "img",
                  ) as HTMLImageElement;

                  if (img) img.style.transform = "scale(1.06)";
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector(
                    "img",
                  ) as HTMLImageElement;

                  if (img) img.style.transform = "scale(1)";
                }}
              >
                <img
                  src={l.src}
                  alt={l.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform .7s ease",
                    filter: "contrast(1.05) brightness(.75)",
                  }}
                />

                {/* overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,.78), transparent 60%)",
                  }}
                />

                {/* label */}
                <div
                  style={{
                    position: "absolute",
                    left: isMobile ? 14 : 18,
                    bottom: isMobile ? 14 : 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: ".18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,.55)",
                      marginBottom: 6,
                      fontWeight: 700,
                    }}
                  >
                    Laboratory
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 18 : 22,
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "-.03em",
                    }}
                  >
                    {l.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* steps */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                  ? "repeat(2,minmax(0,1fr))"
                  : "repeat(3,minmax(0,1fr))",
              gap: isMobile ? 12 : 14,
            }}
          >
            {STEPS.map((step) => (
              <div
                key={step.num}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: isMobile ? 16 : 20,
                  padding: isMobile ? "22px 18px" : "28px 22px",
                  transition: "all .3s ease",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  if (isMobile) return;

                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.06)";
                }}
              >
                {/* glow */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(400px 120px at 20% 0%, rgba(255,255,255,.06), transparent 60%)",
                    pointerEvents: "none",
                  }}
                />

                {/* number */}
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    letterSpacing: ".18em",
                    color: "rgba(255,255,255,.25)",
                    marginBottom: 18,
                  }}
                >
                  {step.num}
                </div>

                {/* title */}
                <div
                  style={{
                    fontSize: isMobile ? 14 : 15,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                    letterSpacing: "-.02em",
                  }}
                >
                  {step.title}
                </div>

                {/* desc */}
                <div
                  style={{
                    fontSize: isMobile ? 12 : 12.5,
                    color: "rgba(255,255,255,.42)",
                    lineHeight: 1.8,
                  }}
                >
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social / Community (Mobile Responsive Redesign) ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: isMobile ? "72px 0" : "clamp(56px,7vw,100px) 0",
          background: "linear-gradient(to bottom, #f8f8f6 0%, #f1f1ee 100%)",
          borderBottom: "1px solid rgba(13,13,13,.08)",
        }}
      >
        {/* ambient glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(255,255,255,.9), transparent 35%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1440,
            margin: "0 auto",
            padding: isMobile ? "0 18px" : "0 clamp(18px,4vw,40px)",
          }}
        >
          {/* header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
              gap: isMobile ? 28 : 24,
              alignItems: "end",
              marginBottom: isMobile ? 32 : 42,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "rgba(13,13,13,.45)",
                  marginBottom: 12,
                }}
              >
                Community & Research
              </div>

              <h2
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: isMobile ? "40px" : "clamp(28px,4vw,56px)",
                  lineHeight: 1,
                  letterSpacing: "-.05em",
                  margin: 0,
                  color: "#0d0d0d",
                }}
              >
                As Seen
                <br />
                on Social
              </h2>

              <p
                style={{
                  marginTop: 16,
                  maxWidth: 560,
                  fontSize: isMobile ? 13 : 14,
                  lineHeight: 1.8,
                  color: "rgba(13,13,13,.58)",
                }}
              >
                Real researchers, real protocols, real discussions around
                peptide innovation and performance optimization.
              </p>
            </div>

            {/* CTA */}
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: isMobile ? "100%" : "auto",
                padding: isMobile ? "15px 18px" : "14px 22px",
                borderRadius: 999,
                background: "#0d0d0d",
                color: "#fff",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                transition: ".3s ease",
                boxShadow: "0 10px 30px rgba(0,0,0,.08)",
              }}
              onMouseEnter={(e) => {
                if (isMobile) return;

                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.background = "#1b1b1b";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "#0d0d0d";
              }}
            >
              Follow Community →
            </a>
          </div>

          {/* grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                  ? "repeat(2,minmax(0,1fr))"
                  : "repeat(4,minmax(0,1fr))",
              gap: isMobile ? 16 : "clamp(14px,2vw,22px)",
            }}
          >
            {[
              {
                img: IMGS.social1,
                handle: "@peptide_research_uk",
                caption: "This changes everything for my recovery protocol.",
              },
              {
                img: IMGS.social2,
                handle: "@lab_diary",
                caption:
                  "6 months of consistent BPC-157 research — data update.",
              },
              {
                img: IMGS.social3,
                handle: "@biohacker_joe",
                caption: "Morning peptide stack ft. PepcoLab compounds.",
              },
              {
                img: IMGS.social4,
                handle: "@science_skin",
                caption: "GHK-Cu transformed our skin regeneration testing.",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: isMobile ? 22 : 28,
                  background: "#ddd",
                  aspectRatio: isMobile ? "1 / 1.15" : ".78",
                  cursor: "pointer",
                  boxShadow: "0 20px 40px rgba(0,0,0,.08)",
                  transition: "transform .45s ease, box-shadow .45s ease",
                }}
                onMouseEnter={(e) => {
                  if (isMobile) return;

                  e.currentTarget.style.transform = "translateY(-6px)";

                  e.currentTarget.style.boxShadow =
                    "0 30px 60px rgba(0,0,0,.14)";

                  const img = e.currentTarget.querySelector("img");

                  if (img) {
                    img.style.transform = "scale(1.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";

                  e.currentTarget.style.boxShadow =
                    "0 20px 40px rgba(0,0,0,.08)";

                  const img = e.currentTarget.querySelector("img");

                  if (img) {
                    img.style.transform = "scale(1)";
                  }
                }}
              >
                {/* image */}
                <img
                  src={s.img}
                  alt={s.handle}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform .8s ease",
                  }}
                />

                {/* overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,.82) 8%, rgba(0,0,0,.12) 50%, transparent 75%)",
                  }}
                />

                {/* badge */}
                <div
                  style={{
                    position: "absolute",
                    top: isMobile ? 14 : 16,
                    left: isMobile ? 14 : 16,
                    padding: isMobile ? "7px 10px" : "8px 12px",
                    borderRadius: 999,
                    backdropFilter: "blur(10px)",
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.14)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                  }}
                >
                  Featured
                </div>

                {/* content */}
                <div
                  style={{
                    position: "absolute",
                    left: isMobile ? 16 : 20,
                    right: isMobile ? 16 : 20,
                    bottom: isMobile ? 16 : 20,
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: ".02em",
                      marginBottom: 10,
                    }}
                  >
                    {s.handle}
                  </div>

                  <div
                    style={{
                      color: "rgba(255,255,255,.78)",
                      fontSize: isMobile ? 12 : 13,
                      lineHeight: 1.7,
                      marginBottom: 18,
                    }}
                  >
                    {s.caption}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 14,
                        color: "rgba(255,255,255,.8)",
                        fontSize: 11,
                      }}
                    >
                      <span>♥ 2.1k</span>
                      <span>↻ 184</span>
                    </div>

                    <div
                      style={{
                        width: isMobile ? 30 : 34,
                        height: isMobile ? 30 : 34,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 14,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={IMGS.newsletter}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(.18)",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "rgba(13,13,13,.7)",
            padding: "clamp(48px,8vw,88px) 32px",
          }}
        >
          <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
            <span
              style={{
                display: "block",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.35)",
                marginBottom: 18,
              }}
            >
              Stay In Touch
            </span>
            <h2
              style={{
                fontFamily: "Georgia,serif",
                fontSize: "clamp(26px,4vw,54px)",
                fontWeight: 700,
                lineHeight: 1.06,
                letterSpacing: "-.045em",
                color: "#fff",
                margin: "0 0 16px",
              }}
            >
              Stay In Touch.
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,.45)",
                lineHeight: 1.75,
                margin: "0 0 40px",
              }}
            >
              Research updates, new compound launches, and batch COA alerts. No
              spam, ever.
            </p>
            <div
              style={{
                display: "flex",
                border: "1px solid rgba(255,255,255,.14)",
                borderRadius: 40,
                overflow: "hidden",
                maxWidth: 460,
                margin: "0 auto",
              }}
            >
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  padding: "15px 24px",
                  fontSize: 13.5,
                  color: "#fff",
                  minWidth: 0,
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
                  background: "#fff",
                  color: "#0d0d0d",
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  padding: "13px 20px",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 40,
                  margin: 3,
                  flexShrink: 0,
                }}
              >
                {subbed ? "✓ Subscribed!" : "Subscribe →"}
              </button>
            </div>
            <p
              style={{
                fontSize: 10.5,
                color: "rgba(255,255,255,.2)",
                marginTop: 18,
                lineHeight: 1.7,
              }}
            >
              By providing your email address you are agreeing to receive email
              communications from PepcoLab.
            </p>
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
