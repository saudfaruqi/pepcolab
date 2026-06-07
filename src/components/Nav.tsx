'use client'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/lib/cartContext'
import { getProducts } from '@/lib/shopify'
import { formatPrice } from '@/lib/utils'

type Product = {
  shopifyId: string; handle: string; title: string; mg: string;
  description: string; descriptionHtml: string | undefined; tags: string[];
  variantId: string; price: number; oldPrice: number | undefined;
  longDesc: string; id: string; slug: string; name: string; category: string;
  color?: { bg: string; accent: string }
}

// ── Icons ─────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const BagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ArrowRight = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform .2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function Nav() {
  const { totalQuantity, openCart } = useCart()

  const [mobileOpen,     setMobileOpen]     = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [searchOpen,     setSearchOpen]     = useState(false)
  const [activeDrop,     setActiveDrop]     = useState<string | null>(null)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [scrolled,       setScrolled]       = useState(false)
  const [products,       setProducts]       = useState<Product[]>([])

  const searchRef  = useRef<HTMLInputElement>(null)
  const dropTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getProducts().then(raw =>
      setProducts(raw.map(p => ({ ...p, id: p.shopifyId, slug: p.handle, name: p.title, category: p.tags[0] ?? '' })))
    )
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 60)
  }, [searchOpen])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setMobileOpen(false) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 1024) { setMobileOpen(false); setMobileExpanded(null) } }
    window.addEventListener('resize', fn, { passive: true })
    return () => window.removeEventListener('resize', fn)
  }, [])

  const openDrop  = (l: string) => { if (dropTimer.current) clearTimeout(dropTimer.current); setActiveDrop(l) }
  const closeDrop = ()          => { dropTimer.current = setTimeout(() => setActiveDrop(null), 130) }

  const categoryCounts = products.reduce<Record<string, number>>((acc, p) => {
    const c = p.category.toLowerCase(); acc[c] = (acc[c] ?? 0) + 1; return acc
  }, {})

  const searchResults = searchQuery.length > 1
    ? products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : []

  const CATEGORY_LABELS: Record<string, string> = {
    metabolic: 'Metabolic', recovery: 'Recovery', cognitive: 'Cognitive', hormonal: 'Hormonal',
  }

  const NAV_LINKS = [
    {
      label: 'Products', href: '/products', hasDrop: true,
      items: [
        { label: 'All Compounds',   href: '/products',  sub: products.length > 0 ? `${products.length} compounds` : 'Browse catalogue' },
        ...Object.entries(CATEGORY_LABELS).map(([slug, label]) => ({
          label, href: `/products?cat=${slug}`,
          sub: categoryCounts[slug] != null ? `${categoryCounts[slug]} product${categoryCounts[slug] !== 1 ? 's' : ''}` : undefined,
        })),
        { label: 'Bundles & Stacks', href: '/bundles', sub: 'Save 10% on combinations' },
      ] as { label: string; href: string; sub?: string }[],
    },
    {
      label: 'Research', href: '/research', hasDrop: true,
      items: [
        { label: 'Research Hub',        href: '/research',      sub: 'Protocols & references'  },
        { label: 'Guides',              href: '/guides',        sub: 'In-depth usage guides'   },
        { label: 'Lab Certificates',    href: '/certificates',  sub: 'Batch COAs & testing'    },
        { label: 'Reconstitution Calc', href: '/tools',         sub: 'Dosage calculator tool'  },
      ] as { label: string; href: string; sub?: string }[],
    },
    {
      label: 'About', href: '/about', hasDrop: false,
      items: [] as { label: string; href: string; sub?: string }[],
    },
    {
      label: 'Support', href: '/faq', hasDrop: true,
      items: [
        { label: 'FAQ',           href: '/faq',      sub: 'Common questions'         },
        { label: 'Contact Us',    href: '/contact',  sub: 'Get in touch'             },
        { label: 'Shipping Info', href: '/shipping', sub: 'Delivery & tracking'      },
      ] as { label: string; href: string; sub?: string }[],
    },
  ]

  return (
    <>
      <style>{`
        .nav-root {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #fff;
          transition: box-shadow .25s ease, border-color .25s ease;
        }
        .nav-root.scrolled {
          box-shadow: 0 1px 0 rgba(13,13,13,.07), 0 4px 24px rgba(13,13,13,.06);
        }
        .nav-root:not(.scrolled) {
          border-bottom: 1px solid rgba(13,13,13,.08);
        }
        .nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 clamp(16px,3vw,40px);
          height: 60px;
          display: flex;
          align-items: center;
          gap: 0;
        }
        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
          margin-right: 32px;
        }
        .nav-logo img { height: 44px; width: auto; display: block; }

        /* Desktop links */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
        }
        .nav-link-wrap { position: relative; }
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 13px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(13,13,13,.56);
          border-radius: 8px;
          border: none;
          background: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background .15s, color .15s;
          letter-spacing: -.01em;
        }
        .nav-link:hover, .nav-link.active {
          background: #f4f3f0;
          color: #0d0d0d;
        }

        /* Dropdown */
        .nav-drop {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: #fff;
          border: 1px solid rgba(13,13,13,.09);
          border-radius: 16px;
          overflow: hidden;
          min-width: 220px;
          box-shadow: 0 8px 32px rgba(13,13,13,.1), 0 2px 8px rgba(13,13,13,.05);
          padding: 6px;
          z-index: 60;
          animation: dropIn .18s cubic-bezier(.16,1,.3,1) forwards;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-drop-item {
          display: flex;
          flex-direction: column;
          padding: 9px 12px;
          border-radius: 10px;
          text-decoration: none;
          transition: background .12s;
          cursor: pointer;
        }
        .nav-drop-item:hover { background: #f4f3f0; }
        .nav-drop-item-label { font-size: 13px; font-weight: 600; color: #0d0d0d; }
        .nav-drop-item-sub   { font-size: 11px; color: rgba(13,13,13,.42); margin-top: 2px; }

        /* Right actions */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .nav-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: none;
          cursor: pointer;
          color: rgba(13,13,13,.55);
          position: relative;
          transition: background .15s, color .15s;
          flex-shrink: 0;
        }
        .nav-icon-btn:hover { background: #f4f3f0; color: #0d0d0d; }
        .nav-cart-badge {
          position: absolute;
          top: 2px; right: 2px;
          min-width: 16px; height: 16px;
          background: #0d0d0d;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          border: 1.5px solid #fff;
        }
        .nav-search-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12.5px;
          font-weight: 500;
          color: rgba(13,13,13,.42);
          border: 1px solid rgba(13,13,13,.1);
          padding: 7px 13px;
          border-radius: 8px;
          background: #faf9f7;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color .15s, color .15s, background .15s;
        }
        .nav-search-btn:hover {
          border-color: rgba(13,13,13,.22);
          color: rgba(13,13,13,.7);
          background: #f4f3f0;
        }
        .nav-cta {
          display: inline-flex;
          align-items: center;
          background: #0d0d0d;
          color: #fff;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: .03em;
          padding: 9px 18px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background .15s, transform .15s;
        }
        .nav-cta:hover { background: #222; transform: translateY(-1px); }
        .nav-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(13,13,13,.1);
          background: none;
          cursor: pointer;
          color: #0d0d0d;
          flex-shrink: 0;
          gap: 0;
          flex-direction: column;
          padding: 0;
        }
        .ham-line {
          display: block;
          width: 16px;
          height: 1.5px;
          background: #0d0d0d;
          border-radius: 2px;
          transition: transform .25s ease, opacity .25s ease;
          margin: 2.5px 0;
        }

        /* Mobile menu */
        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.3);
          z-index: 90;
          backdrop-filter: blur(4px);
          opacity: 0;
          pointer-events: none;
          transition: opacity .3s ease;
        }
        .mobile-menu-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .mobile-menu {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: min(88vw, 360px);
          background: #fff;
          z-index: 100;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform .35s cubic-bezier(.16,1,.3,1);
          overflow-y: auto;
          overflow-x: hidden;
        }
        .mobile-menu.open { transform: translateX(0); }

        .mob-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 60px;
          border-bottom: 1px solid rgba(13,13,13,.07);
          flex-shrink: 0;
        }
        .mob-logo {

        }
        .mob-search {
          margin: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border: 1px solid rgba(13,13,13,.1);
          border-radius: 10px;
          background: #faf9f7;
          cursor: pointer;
          flex-shrink: 0;
        }
        .mob-search span { font-size: 13px; color: rgba(13,13,13,.4); }
        .mob-links { flex: 1; padding: 4px 0; }
        .mob-link-row {
          border-bottom: 1px solid rgba(13,13,13,.05);
        }
        .mob-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          font-size: 15px;
          font-weight: 600;
          color: #0d0d0d;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background .12s;
        }
        .mob-link:hover { background: #faf9f7; }
        .mob-sub-links {
          background: #faf9f7;
          border-top: 1px solid rgba(13,13,13,.05);
          overflow: hidden;
          transition: max-height .28s ease, opacity .28s ease;
        }
        .mob-sub-link {
          display: flex;
          flex-direction: column;
          padding: 11px 28px;
          text-decoration: none;
          transition: background .12s;
        }
        .mob-sub-link:hover { background: #f0efe9; }
        .mob-sub-label { font-size: 13.5px; font-weight: 600; color: #0d0d0d; }
        .mob-sub-sub   { font-size: 11px; color: rgba(13,13,13,.42); margin-top: 2px; }
        .mob-footer {
          padding: 16px;
          border-top: 1px solid rgba(13,13,13,.07);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
        }
        .mob-cta-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0d0d;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          padding: 15px;
          border-radius: 12px;
          text-decoration: none;
          letter-spacing: .02em;
        }
        .mob-cta-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: #0d0d0d;
          font-size: 13.5px;
          font-weight: 500;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid rgba(13,13,13,.12);
          cursor: pointer;
        }
        .mob-disclaimer {
          font-size: 10.5px;
          color: rgba(13,13,13,.3);
          text-align: center;
          line-height: 1.6;
          font-style: italic;
        }

        /* Search overlay */
        .search-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13,13,13,.45);
          z-index: 200;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: clamp(56px,10vh,100px) 16px 0;
          backdrop-filter: blur(3px);
        }
        .search-panel {
          background: #fff;
          border-radius: 18px;
          width: 100%;
          max-width: 560px;
          border: 1px solid rgba(13,13,13,.09);
          box-shadow: 0 24px 64px rgba(13,13,13,.18);
          overflow: hidden;
          animation: dropIn .2s cubic-bezier(.16,1,.3,1) forwards;
        }
        .search-input-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(13,13,13,.08);
        }
        .search-input {
          flex: 1;
          font-size: 14px;
          outline: none;
          border: none;
          background: transparent;
          color: #0d0d0d;
          min-width: 0;
        }
        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 18px;
          text-decoration: none;
          transition: background .12s;
        }
        .search-result-item:hover { background: #f4f3f0; }
        .search-chip {
          font-size: 12px;
          color: rgba(13,13,13,.6);
          border: 1px solid rgba(13,13,13,.11);
          padding: 6px 13px;
          border-radius: 999px;
          background: none;
          cursor: pointer;
          transition: border-color .15s, color .15s, background .15s;
        }
        .search-chip:hover {
          border-color: #0d0d0d;
          color: #0d0d0d;
          background: #f4f3f0;
        }

        /* Responsive */
        @media (min-width: 1024px) {
          .nav-hamburger { display: none !important; }
          .nav-links     { display: flex !important; }
          .nav-cta       { display: inline-flex !important; }
          .nav-search-btn { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .nav-links      { display: none !important; }
          .nav-search-btn { display: none !important; }
          .nav-cta        { display: none !important; }
          .nav-hamburger  { display: flex !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-panel" onClick={e => e.stopPropagation()}>
            <div className="search-input-row">
              <span style={{ color: 'rgba(13,13,13,.35)', flexShrink: 0 }}><SearchIcon /></span>
              <input
                ref={searchRef}
                className="search-input"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search peptides…"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(13,13,13,.4)', display: 'flex', padding: 4 }}>
                  <CloseIcon />
                </button>
              ) : (
                <kbd style={{ fontSize: 10, fontWeight: 600, color: 'rgba(13,13,13,.35)', border: '1px solid rgba(13,13,13,.12)', padding: '2px 7px', borderRadius: 5 }}>ESC</kbd>
              )}
            </div>

            {searchResults.length > 0 ? (
              <div style={{ paddingBottom: 6 }}>
                {searchResults.map(p => (
                  <a key={p.id} href={`/products/${p.slug}`} className="search-result-item" onClick={() => setSearchOpen(false)}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: p.color?.bg ?? '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: p.color?.accent ?? '#0d0d0d', flexShrink: 0 }}>
                      {p.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0d0d' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(13,13,13,.4)' }}>{p.category}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0d0d', flexShrink: 0 }}>
                      {formatPrice(p.price, (p as any).currencyCode ?? 'AED')}
                    </div>
                  </a>
                ))}
                <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(13,13,13,.07)' }}>
                  <a href={`/products?q=${searchQuery}`} onClick={() => setSearchOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none' }}>
                    All results for "{searchQuery}" <ArrowRight />
                  </a>
                </div>
              </div>
            ) : searchQuery.length > 1 ? (
              <div style={{ padding: '36px 18px', textAlign: 'center', fontSize: 13, color: 'rgba(13,13,13,.4)' }}>
                No results for "{searchQuery}"
              </div>
            ) : (
              <div style={{ padding: '14px 18px 18px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(13,13,13,.32)', marginBottom: 12 }}>Popular</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {['BPC-157', 'GLP-1', 'TB-500', 'GHK-Cu', 'Selank', 'Semaglutide'].map(q => (
                    <button key={q} className="search-chip" onClick={() => setSearchQuery(q)}>{q}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile menu overlay ── */}
      <div className={`mobile-menu-overlay${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* ── Mobile slide-in panel ── */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <div className="mob-header">
          <a href="/" className="mob-logo" onClick={() => setMobileOpen(false)}>
            <img src="/pepcologo.png" className='h-10 w-auto' alt="" />
          </a>
          <button className="nav-icon-btn" onClick={() => setMobileOpen(false)}><CloseIcon /></button>
        </div>

        <button className="mob-search" onClick={() => { setMobileOpen(false); setSearchOpen(true) }}>
          <span style={{ color: 'rgba(13,13,13,.4)' }}><SearchIcon /></span>
          <span>Search peptides…</span>
        </button>

        <div className="mob-links">
          {NAV_LINKS.map(link => (
            <div key={link.label} className="mob-link-row">
              {link.hasDrop ? (
                <>
                  <button className="mob-link" onClick={() => setMobileExpanded(mobileExpanded === link.label ? null : link.label)}>
                    {link.label}
                    <ChevronDown open={mobileExpanded === link.label} />
                  </button>
                  <div className="mob-sub-links" style={{ maxHeight: mobileExpanded === link.label ? link.items.length * 80 : 0, opacity: mobileExpanded === link.label ? 1 : 0 }}>
                    {link.items.map(item => (
                      <a key={item.label} href={item.href} className="mob-sub-link" onClick={() => setMobileOpen(false)}>
                        <span className="mob-sub-label">{item.label}</span>
                        {item.sub && <span className="mob-sub-sub">{item.sub}</span>}
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <a href={link.href} className="mob-link" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mob-footer">
          <a href="/products" className="mob-cta-primary" onClick={() => setMobileOpen(false)}>Shop All Compounds</a>
          <button className="mob-cta-secondary" onClick={() => { setMobileOpen(false); openCart() }}>
            <BagIcon /> View Cart {totalQuantity > 0 && `(${totalQuantity})`}
          </button>
          <p className="mob-disclaimer">For research use only · Not for human consumption</p>
        </div>
      </div>

      {/* ── Main nav bar ── */}
      <nav className={`nav-root${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">

          {/* Logo */}
          <a href="/" className="nav-logo">
            <img src="/pepcologo.png" alt="PepcoLab" />
          </a>

          {/* Desktop links */}
          <div className="nav-links">
            {NAV_LINKS.map(link => (
              <div key={link.label} className="nav-link-wrap"
                onMouseEnter={() => { if (link.hasDrop) openDrop(link.label) }}
                onMouseLeave={() => { if (link.hasDrop) closeDrop() }}
              >
                <a href={link.href} className={`nav-link${activeDrop === link.label ? ' active' : ''}`}>
                  {link.label}
                  {link.hasDrop && <ChevronDown open={activeDrop === link.label} />}
                </a>

                {link.hasDrop && activeDrop === link.label && (
                  <div className="nav-drop"
                    onMouseEnter={() => openDrop(link.label)}
                    onMouseLeave={closeDrop}
                  >
                    {link.items.map(item => (
                      <a key={item.label} href={item.href} className="nav-drop-item">
                        <span className="nav-drop-item-label">{item.label}</span>
                        {item.sub && <span className="nav-drop-item-sub">{item.sub}</span>}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="nav-actions">
            {/* Search */}
            <button className="nav-search-btn" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
              <span>Search</span>
              <kbd style={{ fontSize: 10, fontWeight: 600, border: '1px solid rgba(13,13,13,.1)', padding: '2px 6px', borderRadius: 5, lineHeight: 1.4, color: 'rgba(13,13,13,.35)' }}>⌘K</kbd>
            </button>

            {/* Cart */}
            <button className="nav-icon-btn" onClick={openCart} aria-label={`Cart (${totalQuantity})`}>
              <BagIcon />
              {totalQuantity > 0 && (
                <span className="nav-cart-badge">{totalQuantity > 9 ? '9+' : totalQuantity}</span>
              )}
            </button>

            {/* CTA */}
            <a href="/products" className="nav-cta">Shop Now</a>

            {/* Hamburger */}
            <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              <span className="ham-line" style={{ transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span className="ham-line" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="ham-line" style={{ transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>

        </div>
      </nav>
    </>
  )
}