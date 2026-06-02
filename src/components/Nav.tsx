'use client'
import { useState, useEffect, useRef } from 'react'
import { useCart } from '@/lib/cartContext'
import { getProducts } from '@/lib/shopify'

type Product = {
  shopifyId: string
  handle: string
  title: string
  mg: string
  description: string
  descriptionHtml: string | undefined
  tags: string[]
  variantId: string
  price: number
  oldPrice: number | undefined
  longDesc: string
  id: string
  slug: string
  name: string
  category: string
  color?: { bg: string; accent: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  metabolic: 'Metabolic',
  recovery:  'Recovery',
  cognitive: 'Cognitive',
  hormonal:  'Hormonal',
}

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const BagIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const CloseIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ChevronDown = ({ rotated }: { rotated: boolean }) => (
  <svg
    width="10" height="10" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform .2s', transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.45 }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const ArrowRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

// ── Component ──────────────────────────────────────────────────────────────
export default function Nav() {
  const { totalQuantity, openCart } = useCart()

  const [mobileOpen,     setMobileOpen]     = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [searchOpen,     setSearchOpen]     = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [scrolled,       setScrolled]       = useState(false)
  const [products,       setProducts]       = useState<Product[]>([])

  const searchRef = useRef<HTMLInputElement>(null)
  const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch products on mount
  useEffect(() => {
    getProducts().then(raw =>
      setProducts(
        raw.map(p => ({
          ...p,
          id: p.shopifyId,
          slug: p.handle,
          name: p.title,
          category: p.tags[0] ?? '',
        }))
      )
    )
  }, [])

  // Resize → close mobile menu
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
        setMobileExpanded(null)
      }
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setMobileOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // ── Derived values ─────────────────────────────────────────────────────
  const categoryCounts = products.reduce<Record<string, number>>((acc, p) => {
    const cat = p.category.toLowerCase()
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {})

  const popularSearches: string[] = (() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const p of products) {
      const label = p.name.includes('-')
        ? p.name.split(' ')[0].split('-').slice(0, 2).join('-')
        : p.name.split(' ')[0]
      if (!seen.has(label)) {
        seen.add(label)
        out.push(label)
      }
      if (out.length >= 6) break
    }
    if (out.length < 4) {
      Object.values(CATEGORY_LABELS)
        .filter(l => !seen.has(l))
        .slice(0, 4 - out.length)
        .forEach(l => out.push(l))
    }
    return out.slice(0, 6)
  })()

  const FALLBACK_SEARCHES = ['BPC-157', 'GLP-1', 'TB-500', 'Cognitive', 'Recovery', 'Anti-ageing']

  // ── Nav link definitions (dynamic) ────────────────────────────────────
  const NAV_LINKS = [
    {
      label: 'Products',
      href: '/products',
      hasDropdown: true,
      items: [
        {
          label: 'All Peptides',
          href: '/products',
          sub: products.length > 0 ? `${products.length} compounds` : undefined,
        },
        ...Object.entries(CATEGORY_LABELS).map(([slug, label]) => ({
          label,
          href: `/products?cat=${slug}`,
          sub: categoryCounts[slug] != null
            ? `${categoryCounts[slug]} product${categoryCounts[slug] !== 1 ? 's' : ''}`
            : undefined,
        })),
        { label: 'Bundles & Stacks', href: '/bundles', sub: undefined as string | undefined },
      ],
    },
    {
      label: 'Lab Certificates',
      href: '/certificates',
      hasDropdown: false,
      items: [] as { label: string; href: string; sub?: string }[],
    },
    {
      label: 'Research Hub',
      href: '/research',
      hasDropdown: true,
      items: [
        { label: 'Research Guides',     href: '/research',         sub: 'Protocols & references' },
        { label: 'Guides',              href: '/guides',           sub: 'In-depth usage guides'  },
        { label: 'Published Studies',   href: '/research#studies', sub: 'Peer-reviewed links'    },
        { label: 'Reconstitution Calc', href: '/tools#calculator', sub: 'Instant dosage tool'    },
      ],
    },
    {
      label: 'Tools',
      href: '/tools',
      hasDropdown: false,
      items: [] as { label: string; href: string; sub?: string }[],
    },
    {
      label: 'FAQ',
      href: '/faq',
      hasDropdown: false,
      items: [] as { label: string; href: string; sub?: string }[],
    },
  ]

  // ── Dropdown helpers ──────────────────────────────────────────────────
  const openDrop = (label: string) => {
    if (dropTimer.current) clearTimeout(dropTimer.current)
    setActiveDropdown(label)
  }
  const closeDrop = () => {
    dropTimer.current = setTimeout(() => setActiveDropdown(null), 120)
  }

  // ── Search results ────────────────────────────────────────────────────
  const searchResults =
    searchQuery.length > 1
      ? products
          .filter(
            p =>
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.tags.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
      : []

  // ── Shared styles ────────────────────────────────────────────────────
  const navStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: '#fff',
    borderBottom: scrolled ? 'none' : '1px solid rgba(13,13,13,.09)',
    boxShadow: scrolled ? '0 2px 20px rgba(13,15,20,.08)' : 'none',
    transition: 'box-shadow .2s, border-color .2s',
  }
  const innerStyle: React.CSSProperties = {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 clamp(16px, 3vw, 40px)',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  }
  const logoStyle: React.CSSProperties = {
    fontFamily: 'Georgia, serif',
    fontSize: 20,
    fontWeight: 700,
    color: '#0d0d0d',
    textDecoration: 'none',
    flexShrink: 0,
    letterSpacing: '-.02em',
  }
  const navLinkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 12px',
    fontSize: 13.5,
    fontWeight: 500,
    color: 'rgba(13,13,13,.6)',
    borderRadius: 8,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'background .15s, color .15s',
  }
  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 10,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: 'rgba(13,13,13,.6)',
    position: 'relative',
    transition: 'background .15s, color .15s',
  }
  const shopBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#0d0d0d',
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: '.04em',
    padding: '9px 20px',
    borderRadius: 40,
    border: '1.5px solid #0d0d0d',
    cursor: 'pointer',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }
  const searchBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12.5,
    fontWeight: 500,
    color: 'rgba(13,13,13,.45)',
    border: '1px solid rgba(13,13,13,.12)',
    padding: '8px 14px',
    borderRadius: 8,
    background: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'border-color .15s, color .15s',
  }
  const dropPanelStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid rgba(13,13,13,.09)',
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 230,
    boxShadow: '0 12px 40px rgba(13,15,20,.12)',
    padding: '8px 0',
  }
  const dropItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 16px',
    textDecoration: 'none',
    transition: 'background .12s',
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Search overlay */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,13,13,.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 'clamp(60px, 10vw, 100px) 16px 0',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 560,
              border: '1px solid rgba(13,13,13,.09)',
              boxShadow: '0 24px 64px rgba(13,15,20,.18)',
              overflow: 'hidden',
            }}
          >
            {/* Input row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(13,13,13,.08)' }}>
              <span style={{ color: 'rgba(13,13,13,.35)', flexShrink: 0 }}>
                <SearchIcon />
              </span>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search peptides…'
                style={{ flex: 1, fontSize: 14, outline: 'none', border: 'none', background: 'transparent', color: '#0d0d0d', minWidth: 0 }}
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(13,13,13,.4)', padding: 4, display: 'flex' }}
                >
                  <CloseIcon size={14} />
                </button>
              ) : (
                <kbd style={{ fontSize: 10, fontWeight: 600, color: 'rgba(13,13,13,.35)', border: '1px solid rgba(13,13,13,.12)', padding: '2px 7px', borderRadius: 5 }}>
                  ESC
                </kbd>
              )}
            </div>

            {/* Results */}
            {searchResults.length > 0 ? (
              <div style={{ paddingBottom: 8 }}>
                {searchResults.map(p => (
                  <a
                    key={p.id}
                    href={`/products/${p.slug}`}
                    onClick={() => setSearchOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', textDecoration: 'none', transition: 'background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f3' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: p.color?.bg ?? '#f0ede8', color: p.color?.accent ?? '#0d0d0d' }}>
                      {p.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0d0d0d' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(13,13,13,.4)' }}>
                        {CATEGORY_LABELS[p.category.toLowerCase()] ?? p.category}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0d0d', flexShrink: 0 }}>
                      £{p.price.toFixed(2)}
                    </div>
                  </a>
                ))}
                <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(13,13,13,.07)' }}>
                  <a
                    href={`/products?q=${searchQuery}`}
                    onClick={() => setSearchOpen(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none' }}
                  >
                    View all results for &ldquo;{searchQuery}&rdquo; <ArrowRight />
                  </a>
                </div>
              </div>
            ) : searchQuery.length > 1 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: 'rgba(13,13,13,.4)' }}>
                No peptides found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(13,13,13,.35)', marginBottom: 12 }}>
                  Popular searches
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(popularSearches.length > 0 ? popularSearches : FALLBACK_SEARCHES).map(q => (
                    <button
                      key={q}
                      onClick={() => setSearchQuery(q)}
                      style={{ fontSize: 12, color: 'rgba(13,13,13,.6)', border: '1px solid rgba(13,13,13,.12)', padding: '6px 14px', borderRadius: 40, background: 'none', cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d0d0d'; e.currentTarget.style.color = '#0d0d0d' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(13,13,13,.12)'; e.currentTarget.style.color = 'rgba(13,13,13,.6)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav style={navStyle}>
        <div style={innerStyle}>

          {/* Logo */}
          <a href="/" style={logoStyle}>
            <img src="/pepcologo.png" className='h-12 w-auto' alt="" />
          </a>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }} className="nav-desktop-links">
            {NAV_LINKS.map(link => (
              <div
                key={link.label}
                style={{ position: 'relative' }}
                onMouseEnter={() => { if (link.hasDropdown) openDrop(link.label) }}
                onMouseLeave={() => { if (link.hasDropdown) closeDrop() }}
              >
                <a
                  href={link.href}
                  style={navLinkStyle}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f3'; e.currentTarget.style.color = '#0d0d0d' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(13,13,13,.6)' }}
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown rotated={activeDropdown === link.label} />}
                </a>

                {link.hasDropdown && activeDropdown === link.label && link.items.length > 0 && (
                  <div
                    style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 8, zIndex: 60 }}
                    onMouseEnter={() => openDrop(link.label)}
                    onMouseLeave={closeDrop}
                  >
                    <div style={dropPanelStyle}>
                      {link.items.map(item => (
                        <a
                          key={item.label}
                          href={item.href}
                          style={dropItemStyle}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f3' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0d0d0d' }}>{item.label}</span>
                          {item.sub && (
                            <span style={{ fontSize: 11, color: 'rgba(13,13,13,.4)', marginTop: 2 }}>{item.sub}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setSearchOpen(true)}
              style={searchBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(13,13,13,.25)'; e.currentTarget.style.color = 'rgba(13,13,13,.7)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(13,13,13,.12)'; e.currentTarget.style.color = 'rgba(13,13,13,.45)' }}
              className="nav-search-desktop"
            >
              <SearchIcon />
              <span className="nav-search-label">Search</span>
              <kbd style={{ fontSize: 10, fontWeight: 600, border: '1px solid rgba(13,13,13,.12)', padding: '2px 6px', borderRadius: 5, lineHeight: 1.4 }} className="nav-search-kbd">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={openCart}
              style={iconBtnStyle}
              aria-label={`Cart (${totalQuantity} items)`}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f3'; e.currentTarget.style.color = '#0d0d0d' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(13,13,13,.6)' }}
            >
              <BagIcon />
              {totalQuantity > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 17, height: 17, background: '#0d0d0d', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {totalQuantity > 9 ? '9+' : totalQuantity}
                </span>
              )}
            </button>

            <a href="/products" style={shopBtnStyle} className="nav-shop-btn">
              Shop Now
            </a>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={iconBtnStyle}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="nav-hamburger"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fff',
            zIndex: 100,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform .3s cubic-bezier(.16,1,.3,1)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="mobile-menu"
        >
          {/* Mobile header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 64, borderBottom: '1px solid rgba(13,13,13,.08)', flexShrink: 0 }}>
            <a href="/" style={logoStyle} onClick={() => setMobileOpen(false)}>
              Pepco<em style={{ fontStyle: 'italic', color: 'rgba(13,13,13,.35)' }}>Lab</em>
            </a>
            <button onClick={() => setMobileOpen(false)} style={iconBtnStyle}>
              <CloseIcon />
            </button>
          </div>

          {/* Mobile search bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(13,13,13,.07)' }}>
            <button
              onClick={() => { setMobileOpen(false); setSearchOpen(true) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid rgba(13,13,13,.12)', borderRadius: 10, background: '#f5f5f3', cursor: 'pointer', textAlign: 'left' }}
            >
              <SearchIcon />
              <span style={{ fontSize: 13.5, color: 'rgba(13,13,13,.45)' }}>Search peptides…</span>
            </button>
          </div>

          {/* Mobile nav links */}
          <div style={{ flex: 1 }}>
            {NAV_LINKS.map(link => (
              <div key={link.label} style={{ borderBottom: '1px solid rgba(13,13,13,.06)' }}>
                {link.hasDropdown ? (
                  <>
                    <button
                      onClick={() => setMobileExpanded(mobileExpanded === link.label ? null : link.label)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', fontSize: 15, fontWeight: 600, color: '#0d0d0d', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {link.label}
                      <ChevronDown rotated={mobileExpanded === link.label} />
                    </button>
                    {mobileExpanded === link.label && (
                      <div style={{ background: '#f9f9f8', borderTop: '1px solid rgba(13,13,13,.06)', paddingBottom: 8 }}>
                        {link.items.map(item => (
                          <a
                            key={item.label}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            style={{ display: 'flex', flexDirection: 'column', padding: '12px 24px', textDecoration: 'none' }}
                          >
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0d0d0d' }}>{item.label}</span>
                            {item.sub && (
                              <span style={{ fontSize: 11.5, color: 'rgba(13,13,13,.42)', marginTop: 2 }}>{item.sub}</span>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', fontSize: 15, fontWeight: 600, color: '#0d0d0d', textDecoration: 'none' }}
                  >
                    {link.label}
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Mobile bottom CTAs */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(13,13,13,.08)', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <a
              href="/products"
              onClick={() => setMobileOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', color: '#fff', fontSize: 14, fontWeight: 600, padding: '15px', borderRadius: 40, textDecoration: 'none', letterSpacing: '.03em' }}
            >
              Shop All Peptides
            </a>
            <button
              onClick={() => { setMobileOpen(false); openCart() }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: '#0d0d0d', fontSize: 14, fontWeight: 500, padding: '14px', borderRadius: 40, border: '1.5px solid rgba(13,13,13,.15)', cursor: 'pointer' }}
            >
              <BagIcon /> View Cart {totalQuantity > 0 && `(${totalQuantity})`}
            </button>
            <p style={{ fontSize: 10.5, color: 'rgba(13,13,13,.32)', textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic', marginTop: 4 }}>
              For research use only · Not for human consumption
            </p>
          </div>
        </div>
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .nav-hamburger      { display: none !important; }
          .mobile-menu        { display: none !important; }
          .nav-search-desktop { display: flex !important; }
          .nav-shop-btn       { display: inline-flex !important; }
        }
        @media (max-width: 1023px) {
          .nav-desktop-links  { display: none !important; }
          .nav-search-desktop { display: none !important; }
          .nav-shop-btn       { display: none !important; }
          .nav-hamburger      { display: flex !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .nav-search-desktop { display: flex !important; }
          .nav-search-label   { display: none; }
          .nav-search-kbd     { display: none; }
        }
      `}</style>
    </>
  )
}