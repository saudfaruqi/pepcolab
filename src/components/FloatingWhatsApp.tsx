// src/components/FloatingWhatsApp.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { isWhatsAppConfigured, whatsAppGeneralLink, whatsAppCartLink } from '@/lib/whatsapp'
import { useCart } from '@/lib/cartContext'

/** Same hidden-on-checkout rule as FloatingCalculator — a WhatsApp bubble
 *  sitting over the STRABL payment UI is exactly the kind of thing that
 *  causes an abandoned card. */
// /learn: ad landing pages carry no shop furniture (Meta ads plan, Oct 2026).
const HIDDEN_PREFIXES = ['/checkout', '/learn']

/**
 * Round WhatsApp button on the right edge, vertically centred (Nov 2026).
 * Customers can drag it anywhere; on release it snaps to the nearer side and
 * the spot is remembered in this browser. The bottom corners are left to the
 * Calculator (left) and Support chat (right) buttons.
 */
const SIZE = 52
const EDGE = 12
const DRAG_THRESHOLD = 6
const STORAGE_KEY = 'pl_fw_pos'

type Side = 'left' | 'right'
interface Pos { side: Side; /** centre of the button, as a share of the viewport height */ yRatio: number }

const DEFAULT_POS: Pos = { side: 'right', yRatio: 0.5 }

function readPos(): Pos {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_POS
    const p = JSON.parse(raw) as Partial<Pos>
    if ((p.side === 'left' || p.side === 'right') && typeof p.yRatio === 'number' && p.yRatio >= 0 && p.yRatio <= 1) {
      return { side: p.side, yRatio: p.yRatio }
    }
  } catch {
    /* storage unavailable — use the default */
  }
  return DEFAULT_POS
}

function savePos(pos: Pos): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    /* storage unavailable — position lasts for this visit only */
  }
}

/** Keeps the button clear of the top bar and the bottom-corner buttons. */
function clampTop(top: number): number {
  const minTop = 72
  const maxTop = window.innerHeight - SIZE - 96
  return Math.min(Math.max(top, minTop), Math.max(minTop, maxTop))
}

export default function FloatingWhatsApp() {
  const pathname = usePathname()
  const { lines, currencyCode } = useCart()
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<Pos>(DEFAULT_POS)
  const [viewportH, setViewportH] = useState(0)
  /** Live position while dragging (px from the viewport's top-left). */
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)

  const start = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  useEffect(() => {
    setPos(readPos())
    setViewportH(window.innerHeight)
    const onResize = () => setViewportH(window.innerHeight)
    window.addEventListener('resize', onResize)
    const t = setTimeout(() => setMounted(true), 400)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const restingTop = viewportH ? clampTop(pos.yRatio * viewportH - SIZE / 2) : null

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    start.current = { px: e.clientX, py: e.clientY, ox: e.clientX - rect.left, oy: e.clientY - rect.top, moved: false }
    suppressClick.current = false
    // Capture now, so a fast drag that leaves the button keeps reporting here.
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLAnchorElement>) => {
    const s = start.current
    if (!s) return
    if (!s.moved) {
      if (Math.hypot(e.clientX - s.px, e.clientY - s.py) < DRAG_THRESHOLD) return
      s.moved = true
    }
    e.preventDefault()
    const x = Math.min(Math.max(e.clientX - s.ox, 0), window.innerWidth - SIZE)
    const y = Math.min(Math.max(e.clientY - s.oy, 0), window.innerHeight - SIZE)
    setDrag({ x, y })
  }, [])

  const endDrag = useCallback((e: React.PointerEvent<HTMLAnchorElement>) => {
    const s = start.current
    start.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (!s?.moved) return
    suppressClick.current = true
    const rect = e.currentTarget.getBoundingClientRect()
    const centreX = rect.left + rect.width / 2
    const top = clampTop(rect.top)
    const next: Pos = {
      side: centreX < window.innerWidth / 2 ? 'left' : 'right',
      yRatio: (top + SIZE / 2) / window.innerHeight,
    }
    setDrag(null)
    setPos(next)
    savePos(next)
  }, [])

  const onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // The click that ends a drag must not open WhatsApp.
    if (suppressClick.current) {
      e.preventDefault()
      suppressClick.current = false
    }
  }, [])

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null
  if (!isWhatsAppConfigured()) return null // no number set yet — render nothing rather than a dead link

  // WhatsApp is a service channel (brief C5): the pre-filled message is a
  // question, never a list of products or a total. lib/whatsapp.ts builds
  // both variants without item names or prices.
  const href = lines.length > 0 ? whatsAppCartLink(lines, currencyCode) : whatsAppGeneralLink()

  const style: React.CSSProperties = drag
    ? { left: drag.x, top: drag.y, right: 'auto', transition: 'none' }
    : {
        top: restingTop ?? undefined,
        left: pos.side === 'left' ? EDGE : 'auto',
        right: pos.side === 'right' ? EDGE : 'auto',
      }

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message us on WhatsApp"
        title="Message us on WhatsApp"
        className={`fw-fab${mounted ? ' fw-in' : ''}${drag ? ' fw-dragging' : ''}`}
        style={style}
        draggable={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onClick}
      >
        <MessageCircle size={24} strokeWidth={2.2} aria-hidden="true" />
      </a>

      <style dangerouslySetInnerHTML={{ __html: `
        .fw-fab {
          position: fixed;
          top: calc(50% - ${SIZE / 2}px);
          right: ${EDGE}px;
          z-index: 45;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${SIZE}px;
          height: ${SIZE}px;
          padding: 0;
          border-radius: 999px;
          background: #25D366;
          color: #fff;
          text-decoration: none;
          cursor: grab;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          box-shadow: 0 4px 14px rgba(37,211,102,.35);
          opacity: 0;
          transform: scale(.9);
          transition: opacity .35s ease, transform .2s ease, box-shadow .25s ease, top .25s ease;
        }
        .fw-fab.fw-in { opacity: 1; transform: scale(1); }
        .fw-fab:hover { box-shadow: 0 8px 20px rgba(37,211,102,.45); }
        .fw-fab:focus-visible { outline: 2px solid #0d0d0d; outline-offset: 3px; }
        .fw-fab.fw-dragging {
          cursor: grabbing;
          transform: scale(1.08);
          box-shadow: 0 10px 26px rgba(0,0,0,.22);
        }

        @media (prefers-reduced-motion: reduce) {
          .fw-fab { transition: none; opacity: 1; transform: none; }
        }

        @media print { .fw-fab { display: none !important; } }
      ` }} />
    </>
  )
}
