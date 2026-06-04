"use client";
import Nav from "@/components/Nav";
import { useState, useEffect, useRef, useId, useCallback, useMemo } from "react";
import HeroCinematic from "@/components/HeroSections";
import ProductCard from "@/components/ProductCard";
import { getProducts as DATA_PRODUCTS } from "@/lib/shopify";
import { useCart } from "@/lib/cartContext";
import Footer from "@/components/Footer";
import Link from "next/link";

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

type NormalisedProduct = {
  id: string; shopifyId: string; handle: string; slug: string; title: string;
  name: string; shortName: string; mg: string; variantId: string; price: number;
  oldPrice?: number; inStock: boolean; stockCount: number; image?: string; imageAlt: string;
  badge?: "popular" | "new" | "sale" | "bestseller"; tags: string[];
  category: string; categorySlug: string; description: string; testDate: string;
  purity?: number; lot?: string; sequence?: string; longDesc?: string;
  color: { bg: string; accent: string; pill: string; pillText: string; purityBar: string; btn: string; vialFrom: string; vialTo: string };
  [key: string]: any;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  "HPLC-Verified Purity", "Eurofins UK Tested", "Cold-Chain Dispatch",
  "Batch COA Published", "Carbon Neutral Shipping", "Next-Day UK Delivery",
  "99%+ Purity Guaranteed", "Free Tracked Shipping Over AED80",
];

const BUNDLE_CONFIGS = [
  { name: "Recovery Stack",      desc: "A widely studied regeneration-focused combination. Each compound independently tested with published COA.",          indices: [0, 1] },
  { name: "Skin Research Stack", desc: "Compounds frequently selected for skin repair and metabolic research. Batch-verified, cold-chain dispatched.",        indices: [1, 2] },
  { name: "Performance Stack",   desc: "Nootropic compounds studied for cognitive and neurological research. Full traceability on every order.",              indices: [0, 2] },
];

const REVIEWS = [
  { author: "Dr. Sarah M.",  role: "Pharmacology Research, UCL",  initials: "SM", text: "Batch COA published on the site for every single product. This level of transparency is rare in the UK peptide space.",                                              sub: "Verified · BPC-157 5mg"  },
  { author: "James T.",      role: "Sports Science, Edinburgh",    initials: "JT", text: "Cold-chain packaging intact on arrival. Eurofins result matches what they advertise — 99.3% on my BPC-157 batch.",                                                   sub: "Verified · TB-500 5mg"   },
  { author: "Dr. Priya K.", role: "Independent Researcher",       initials: "PK", text: "Finally a supplier that treats researchers like professionals. Ordered 4 compounds — all delivered next day, all with QR-coded COAs.",                                sub: "Verified · GLP-1 5mg"    },
  { author: "Marcus R.",    role: "Performance Coach, London",    initials: "MR", text: "The GHK-Cu results have been remarkable for my skin research protocols. Will be a repeat customer.",                                                                   sub: "Verified · GHK-Cu 200mg" },
  { author: "Dr. Lena W.",  role: "Biochemistry, Oxford",         initials: "LW", text: "Third-party testing and batch traceability are exactly what researchers need. PepcoLab delivers both without compromise.",                                            sub: "Verified · Selank 5mg"   },
  { author: "Tom H.",       role: "Exercise Physiologist",        initials: "TH", text: "Ordered on Friday, arrived Monday in perfect condition. The QR-code on the vial linking directly to the COA is a brilliant touch.",                                   sub: "Verified · TB-500 10mg"  },
];

// Compound research areas — abstract gradient tiles, no stock photos
const AREAS = [
  { label: "Tissue Repair",     sub: "BPC-157, TB-500",         from: "#000", to: "#111" },
  { label: "Metabolic Health",  sub: "GLP-1, Semaglutide",      from: "#000", to: "#111" },
  { label: "Skin & Collagen",   sub: "GHK-Cu, Epithalon",       from: "#000", to: "#111" },
  { label: "Cognitive Support", sub: "Selank, Semax",           from: "#000", to: "#111" },
  { label: "Longevity",         sub: "Epithalon, Thymosin",     from: "#000", to: "#111" },
  { label: "Pain & Inflammation",sub: "BPC-157, Thymosin β4",   from: "#000", to: "#111" },
];

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

export default function PepcoLabPage() {
  const [email, setEmail]     = useState("");
  const [subbed, setSubbed]   = useState(false);
  const [products, setProducts] = useState<NormalisedProduct[]>([]);
  const [loaded, setLoaded]   = useState(false);

  const { addItem } = useCart();
  const isMobile = useIsMobile();

  useEffect(() => {
    DATA_PRODUCTS().then((raw) => {
      setProducts(raw.map((p) => ({
        ...p,
        badge: (p.badge && ["popular","new","sale","bestseller"].includes(p.badge) ? p.badge : undefined) as NormalisedProduct["badge"],
      })));
      setLoaded(true);
    }).catch(console.error);
  }, []);

  const addToCart = useCallback((product: NormalisedProduct) => {
    addItem(product.variantId, product.title, product.mg ?? "5mg", product.price, product.slug, product.image);
  }, [addItem]);

  const BUNDLES = useMemo(() => {
    if (products.length < 3) return [];
    return BUNDLE_CONFIGS.map((config, i) => {
      const bp = config.indices.map(idx => products[idx]).filter(Boolean)
        .map(p => ({ ...p, from: p.color?.vialFrom ?? "#3b82f6", to: p.color?.vialTo ?? "#8b5cf6" }));
      const total = bp.reduce((s, p) => s + p.price, 0);
      return { id: i + 1, name: config.name, desc: config.desc, price: (total * 0.9).toFixed(2), originalPrice: total.toFixed(2), products: bp };
    });
  }, [products]);

  const addBundleToCart = useCallback((bundle: typeof BUNDLES[0]) => {
    bundle.products.forEach(p => addItem(p.variantId, p.title, p.mg ?? "5mg", p.price, p.slug, p.image));
  }, [addItem, BUNDLES]);

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
        ::-webkit-scrollbar { display:none; }
        @media(prefers-reduced-motion:reduce) {
          *,*::before,*::after { animation-duration:.01ms !important; transition-duration:.01ms !important; }
        }
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
      <div style={{ background: "#0d0d0d", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
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
      <section style={{ background: "#fff", padding: "clamp(48px,6vw,80px) 0", borderBottom: "1px solid rgba(13,13,13,.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(16px,1vw,32px)" }}>
          <FadeUp style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(13,13,13,.4)", marginBottom: 10 }}>Catalogue</div>
              <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 700, letterSpacing: "-.05em", lineHeight: 1, color: "#0d0d0d" }}>Verified compounds.<br />Published data.</h2>
            </div>
            <Link href="/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#0d0d0d", textDecoration: "none", borderBottom: "1px solid rgba(13,13,13,.2)", paddingBottom: 2 }}>
              View full catalogue →
            </Link>
          </FadeUp>
          <div className="products-grid">
            {loaded
              ? products.slice(0, 4).map((p) => <ProductCard key={p.shopifyId || p.id} product={p} />)
              : [0,1,2,3].map(i => <ProductSkeleton key={i} />)
            }
          </div>
        </div>
      </section>


      {/* ── Research Stacks ── */}
      <section style={{ background: "#0A0A0A", padding: "clamp(60px,8vw,140px) 0" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(16px,4vw,60px)" }}>
          <FadeUp style={{ maxWidth: 680, marginBottom: "clamp(40px,6vw,90px)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.35)", marginBottom: 16 }}>Research Stacks</div>
            <h2 style={{ fontSize: "clamp(36px,6vw,84px)", lineHeight: ".92", letterSpacing: "-.07em", color: "#fff", fontWeight: 700, margin: "0 0 16px" }}>Purpose-built<br />compound stacks.</h2>
            <p style={{ fontSize: "clamp(14px,2vw,17px)", lineHeight: 1.85, color: "rgba(255,255,255,.55)", maxWidth: 520 }}>Curated combinations, independently tested, bundled for specific research objectives. 10% saving versus individual pricing.</p>
          </FadeUp>

          {products.length < 3 ? (
            <div className="stacks-grid">
              {[0,1,2].map(i => <div key={i} style={{ background:"#111", borderRadius:28, height:420, animation:"pulse 1.6s ease infinite", animationDelay:`${i*.15}s` }} />)}
            </div>
          ) : (
            <div className="stacks-grid">
              {BUNDLES.map((b, bi) => (
                <FadeUp key={b.id} delay={bi * 0.1}>
                  <div className="stack-card" style={{ background: "#111111", border: "1px solid rgba(255,255,255,.07)", borderRadius: 24, overflow: "hidden" }}>

                    {/* Visual — uniform square tiles, no size mismatch */}
                    <div style={{
                      background: "#161616",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 20,
                      padding: "32px 24px",
                      minHeight: 180,
                      position: "relative",
                      overflow: "hidden",
                    }}>
                      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 110%, ${b.products[0]?.from ?? "#3b82f6"}28, transparent 65%)` }} />
                      {b.products.map((p, pi) => (
                        <div key={p.id} style={{
                          width: 72, height: 72,
                          borderRadius: 14,
                          overflow: "hidden",
                          background: "rgba(255,255,255,.06)",
                          flexShrink: 0,
                          position: "relative", zIndex: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          animation: `floatVial 3s ease ${pi * .4}s infinite`,
                        }}>
                          {p.image
                            ? <img src={p.image} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"contain", padding:6 }} />
                            : <Vial fromColor={p.from} toColor={p.to} mg={p.mg} size="md" />
                          }
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: "22px 22px 26px" }}>
                      {/* Compound pills */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                        {b.products.map(p => (
                          <span key={p.id} style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", background:"rgba(255,255,255,.07)", color:"rgba(255,255,255,.45)", padding:"3px 9px", borderRadius:999 }}>{p.shortName}</span>
                        ))}
                        <span style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", background:"rgba(200,153,42,.15)", color:"#C8992A", padding:"3px 9px", borderRadius:999 }}>Save 10%</span>
                      </div>

                      <h3 style={{ fontSize:"clamp(20px,4vw,26px)", lineHeight:1.05, letterSpacing:"-.04em", color:"#fff", margin:"0 0 10px", fontWeight:700 }}>{b.name}</h3>
                      <p style={{ color:"rgba(255,255,255,.5)", lineHeight:1.75, fontSize:13, margin:"0 0 20px" }}>{b.desc}</p>

                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, paddingTop:18, borderTop:"1px solid rgba(255,255,255,.07)" }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"baseline", gap:7, flexWrap:"wrap" }}>
                            <span style={{ fontSize:"clamp(22px,4vw,28px)", fontWeight:700, color:"#fff", letterSpacing:"-.04em" }}>AED {b.price}</span>
                            <span style={{ fontSize:13, color:"rgba(255,255,255,.28)", textDecoration:"line-through" }}>AED {b.originalPrice}</span>
                          </div>
                          <div style={{ fontSize:11, color:"rgba(255,255,255,.28)", marginTop:2 }}>{b.products.length} compounds · COA included</div>
                        </div>
                        <button
                          onClick={() => addBundleToCart(b)}
                          style={{ height:40, padding:"0 16px", borderRadius:999, border:"1px solid rgba(255,255,255,.14)", background:"rgba(255,255,255,.06)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:".04em", transition:".2s ease", whiteSpace:"nowrap", flexShrink:0 }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                        >
                          Add Stack →
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
                { n:"01", title:"HPLC-Verified",    desc:"Every compound tested by Eurofins UK. COA downloadable per batch."                              },
                { n:"02", title:"COA Published",     desc:"Download the certificate of analysis for every product, every batch."                           },
                { n:"03", title:"Cold-Chain",        desc:"Temperature-controlled packaging on every UK order, without exception."                         },
                { n:"04", title:"Next-Day UK",       desc:"Order by 3pm for next-day tracked delivery across the United Kingdom."                          },
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

      {/* ── Reviews — marquee strip + featured ── */}
      <section style={{ background: "#fff", padding: "clamp(80px,9vw,130px) 0", borderBottom: "1px solid rgba(13,13,13,.06)", overflow: "hidden" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ maxWidth:680, marginBottom:60 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(13,13,13,.38)", marginBottom:16 }}>Trusted By Researchers</div>
            <h2 style={{ fontSize:"clamp(40px,5.5vw,80px)", lineHeight:".92", letterSpacing:"-.07em", fontWeight:700, color:"#0D0D0D" }}>Trusted by over<br />2,400 researchers.</h2>
          </FadeUp>
        </div>

        {/* Scrolling review strip */}
        <div style={{ overflow:"hidden", marginBottom:56 }}>
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

        {/* Featured quote */}
        <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 clamp(20px,5vw,60px)" }}>
          <FadeUp>
            <div style={{ background:"#0d0d0d", borderRadius:32, padding:"clamp(32px,4vw,56px)" }}>
              <div style={{ display:"flex", gap:4, marginBottom:24 }}>{"★★★★★".split("").map((s,i) => <span key={i} style={{ color:"#C8992A", fontSize:16 }}>{s}</span>)}</div>
              <p style={{ fontSize:"clamp(20px,2.8vw,36px)", lineHeight:1.35, letterSpacing:"-.03em", color:"#fff", margin:"0 0 32px", maxWidth:900 }}>
                "Batch COA published on the site for every single product. This level of transparency is rare in the UK peptide space."
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div style={{ width:50, height:50, borderRadius:"50%", background:"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff" }}>SM</div>
                <div>
                  <div style={{ fontWeight:700, color:"#fff", marginBottom:3 }}>Dr. Sarah M.</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.45)" }}>Pharmacology Research, UCL</div>
                </div>
                <div style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color:"#0A7B45", background:"rgba(10,123,69,.15)", padding:"7px 14px", borderRadius:999, letterSpacing:".06em" }}>✓ VERIFIED PURCHASE</div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

{/* ── Research Spotlight ── */}
{p1 && p2 && (
  <section style={{ background:"#F7F5F1", padding:"clamp(60px,8vw,140px) 0", borderBottom:"1px solid rgba(13,13,13,.06)" }}>
    <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 clamp(16px,5vw,60px)" }}>

      {/* Label */}
      <FadeUp>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(13,13,13,.35)", marginBottom:14 }}>Research Spotlight</div>
        <h2 style={{ fontSize:"clamp(32px,6vw,80px)", lineHeight:".92", letterSpacing:"-.06em", fontWeight:700, color:"#0D0D0D", margin:"0 0 clamp(32px,5vw,60px)" }}>
          {p1.shortName} &amp;<br />{p2.shortName}
        </h2>
      </FadeUp>

      {/* Product cards — stacked on mobile, side by side on desktop */}
      <FadeUp delay={0.05} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"clamp(12px,2vw,20px)", marginBottom:"clamp(28px,4vw,48px)" }}>
        {[p1, p2].map((p, i) => (
          <div key={p.id} style={{
            background:"#fff",
            border:"1px solid rgba(13,13,13,.07)",
            borderRadius:"clamp(16px,2vw,24px)",
            overflow:"hidden",
          }}>
            {/* Image */}
            <div style={{
              aspectRatio:"1/1",
              background:"linear-gradient(145deg,#FCFBF8,#EDE9E0)",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden",
              padding: 16,
            }}>
              <div style={{ position:"absolute", width:"70%", height:"70%", borderRadius:"50%", background:`radial-gradient(circle,${p.color.vialFrom}20,transparent 65%)`, top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
              {p.image ? (
                <img src={p.image} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"contain", position:"relative", zIndex:1 }} />
              ) : (
                <div style={{ position:"relative", zIndex:1, animation:`floatVial ${3+i*.4}s ease ${i*.3}s infinite` }}>
                  <Vial fromColor={p.color.vialFrom} toColor={p.color.vialTo} mg={p.mg} size={isMobile?"md":"lg"} />
                </div>
              )}
              {p.purity && (
                <div style={{ position:"absolute", top:10, right:10, background:"rgba(255,255,255,.95)", backdropFilter:"blur(8px)", padding:"4px 8px", borderRadius:8, border:"1px solid #eee" }}>
                  <div style={{ fontSize:7, color:"#aaa", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>Purity</div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#0d0d0d", lineHeight:1 }}>{p.purity}%</div>
                </div>
              )}
            </div>
            {/* Info */}
            <div style={{ padding:"clamp(12px,2vw,20px)" }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(13,13,13,.35)", marginBottom:6 }}>{p.category || "Research Compound"}</div>
              <div style={{ fontSize:"clamp(13px,2.5vw,18px)", fontWeight:700, letterSpacing:"-.03em", color:"#0d0d0d", marginBottom:8, lineHeight:1.1 }}>{p.shortName}</div>
              <div style={{ fontSize:"clamp(16px,3vw,22px)", fontWeight:700, color:"#0d0d0d", marginBottom:12 }}>AED {p.price.toFixed(2)}</div>
              <button
                onClick={() => addToCart(p)}
                disabled={!p.inStock}
                style={{
                  width:"100%", height:"clamp(38px,5vw,46px)",
                  borderRadius:999, border:"none",
                  background: p.inStock ? "#0d0d0d" : "rgba(13,13,13,.08)",
                  color: p.inStock ? "#fff" : "rgba(13,13,13,.3)",
                  fontSize:"clamp(11px,1.8vw,13px)", fontWeight:700,
                  cursor: p.inStock ? "pointer" : "not-allowed",
                  letterSpacing:".04em",
                }}
              >
                {p.inStock ? `Add ${p.shortName}` : "Out of Stock"}
              </button>
            </div>
          </div>
        ))}
      </FadeUp>

      {/* Stats row */}
      <FadeUp delay={0.1} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"clamp(12px,3vw,32px)", marginBottom:"clamp(24px,4vw,40px)", paddingTop:"clamp(24px,4vw,40px)", borderTop:"1px solid rgba(13,13,13,.08)" }}>
        {([
          [p1.purity ? `${p1.purity}%` : "99%+", "Purity"],
          ["COA", "Included"],
          ["24hr", "Dispatch"],
        ] as [string,string][]).map(([v,l]) => (
          <div key={l}>
            <div style={{ fontSize:"clamp(22px,4vw,40px)", fontWeight:700, letterSpacing:"-.05em", color:"#0D0D0D", marginBottom:4 }}>{v}</div>
            <div style={{ fontSize:"clamp(9px,1.2vw,11px)", textTransform:"uppercase", letterSpacing:".1em", color:"rgba(13,13,13,.4)" }}>{l}</div>
          </div>
        ))}
      </FadeUp>

      {/* Description + disclaimer */}
      <FadeUp delay={0.15}>
        <p style={{ fontSize:"clamp(14px,2vw,17px)", lineHeight:1.85, color:"rgba(13,13,13,.55)", maxWidth:600, marginBottom:12 }}>
          {p1.description
            ? p1.description.slice(0,180).trim() + (p1.description.length > 180 ? "…" : "")
            : "One of the most widely researched peptide combinations. Independently tested, batch-documented, cold-chain dispatched."}
        </p>
        <div style={{ fontSize:11, color:"rgba(13,13,13,.3)", lineHeight:1.6 }}>For laboratory and research purposes only. Not for human consumption.</div>
      </FadeUp>

    </div>
  </section>
)}

      {/* ── Research Areas — abstract gradient tiles ── */}
      <section style={{ background:"#0A0A0A", padding:"clamp(80px,10vw,140px) 0" }}>
        <div style={{ maxWidth:1440, margin:"0 auto", padding:"0 clamp(20px,5vw,60px)" }}>
          <FadeUp style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:56, flexWrap:"wrap", gap:24 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:16 }}>Research Categories</div>
              <h2 style={{ fontSize:"clamp(40px,5.5vw,80px)", lineHeight:".92", letterSpacing:"-.07em", fontWeight:700, color:"#fff" }}>Explore research<br />focus areas.</h2>
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.35)", letterSpacing:".06em" }}>{AREAS.length} Categories</span>
          </FadeUp>

          <div className="areas-grid">
            {AREAS.map((a, i) => (
              <FadeUp key={a.label} delay={i * 0.06}>
                <div className="area-card" style={{ background:`linear-gradient(145deg,${a.from},${a.to})`, borderRadius:24, padding:"36px 28px 32px", overflow:"hidden", position:"relative", border:"1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.05)" }} />
                  <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />
                  <div style={{ position:"relative", zIndex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(255,255,255,.4)", marginBottom:40 }}>Research Area</div>
                    <h3 style={{ fontSize:isMobile?26:32, fontWeight:700, letterSpacing:"-.04em", color:"#fff", marginBottom:10, lineHeight:1 }}>{a.label}</h3>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,.55)", marginBottom:28 }}>{a.sub}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Member Benefits — dark ── */}
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

          <FadeUp style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button style={{ height:50, padding:"0 28px", borderRadius:999, border:"none", background:"#fff", color:"#0d0d0d", fontSize:12, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", cursor:"pointer" }}>Create Account</button>
            <button style={{ height:50, padding:"0 24px", borderRadius:999, border:"1px solid rgba(255,255,255,.15)", background:"transparent", color:"rgba(255,255,255,.7)", fontSize:12, fontWeight:700, cursor:"pointer" }}>Member Login</button>
          </FadeUp>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ background: "#FAFAF8", padding: "clamp(48px,6vw,100px) 0" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 clamp(16px,3vw,32px)" }}>
          <FadeUp>
            <div style={{ background: "#0d0d0d", borderRadius: 32, overflow: "hidden" }}>

              {/* Main content */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 0,
              }}>

                {/* LEFT — headline only, tight */}
                <div style={{
                  padding: isMobile ? "36px 28px 24px" : "60px 56px",
                  borderBottom: isMobile ? "1px solid rgba(255,255,255,.07)" : "none",
                  borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,.07)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.28)", marginBottom: 14 }}>
                    Research Updates
                  </div>
                  <h2 style={{ fontSize: isMobile ? 32 : "clamp(32px,3.5vw,52px)", lineHeight: ".95", letterSpacing: "-.06em", fontWeight: 700, color: "#fff", margin: "0 0 14px" }}>
                    Stay ahead of<br />new releases.
                  </h2>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,.4)", margin: 0, maxWidth: 340 }}>
                    Compound launches, COA updates, and fulfilment alerts — direct to your inbox.
                  </p>
                </div>

                {/* RIGHT — form only, no bullet list on mobile */}
                <div style={{
                  padding: isMobile ? "24px 28px 32px" : "60px 56px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 12,
                }}>

                  {/* Bullets — hidden on mobile, shown on desktop */}
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

                  {/* Email row — side by side even on mobile */}
                  <div className="flex lg:flex-row flex-col" style={{ gap: 8 }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        flex: 1,
                        minHeight: 48,
                        width: "100%",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,.1)",
                        padding: "0 18px",
                        fontSize: 13,
                        outline: "none",
                        background: "rgba(255,255,255,.06)",
                        color: "#fff",
                        minWidth: 0,
                      }}
                    />
                    <button
                      onClick={() => { if (email.includes("@")) { setSubbed(true); setEmail(""); } }}
                      style={{
                        height: 48,
                        padding: "0 20px",
                        borderRadius: 999,
                        border: "none",
                        background: subbed ? "#0A7B45" : "#C8992A",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        transition: "background .2s",
                      }}
                    >
                      {subbed ? "✓ Done" : "Subscribe"}
                    </button>
                  </div>

                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.22)", lineHeight: 1.5 }}>
                    No spam. Unsubscribe anytime.
                  </div>
                </div>
              </div>

              {/* Footer bar */}
              <div style={{
                borderTop: "1px solid rgba(255,255,255,.07)",
                padding: "14px 28px",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)" }}>
                  Trusted by 2,400+ researchers across the UK.
                </div>
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