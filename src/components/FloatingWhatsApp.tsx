// src/components/FloatingWhatsApp.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { isWhatsAppConfigured, whatsAppGeneralLink } from '@/lib/whatsapp'

/** Same hidden-on-checkout rule as FloatingCalculator — a WhatsApp bubble
 *  sitting over the STRABL payment UI is exactly the kind of thing that
 *  causes an abandoned card. */
const HIDDEN_PREFIXES = ['/checkout']

export default function FloatingWhatsApp() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400)
    return () => clearTimeout(t)
  }, [])

  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null
  if (!isWhatsAppConfigured()) return null // no number set yet — render nothing rather than a dead link

  return (
    <>
      <a
        href={whatsAppGeneralLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order via WhatsApp"
        className={`fw-fab${mounted ? ' fw-in' : ''}`}
      >
        <MessageCircle size={20} />
        <span className="fw-fab-label">WhatsApp</span>
      </a>

      <style>{`
        .fw-fab {
          position: fixed;
          left: 20px;
          bottom: calc(20px + env(safe-area-inset-bottom) + var(--fw-offset, 0px));
          z-index: 45;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 48px;
          padding: 0 18px 0 16px;
          border-radius: 999px;
          background: #25D366;
          color: #fff;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -.01em;
          cursor: pointer;
          box-shadow: 0 8px 28px rgba(37,211,102,.35);
          opacity: 0;
          transform: translateY(12px) scale(.96);
          transition: opacity .35s ease, transform .35s ease, box-shadow .25s ease;
        }
        .fw-fab.fw-in { opacity: 1; transform: translateY(0) scale(1); }
        .fw-fab:hover { box-shadow: 0 12px 34px rgba(37,211,102,.45); }
        .fw-fab:focus-visible { outline: 2px solid #0d0d0d; outline-offset: 3px; }

        @media (max-width: 640px) {
          .fw-fab {
            left: 16px;
            width: 52px;
            height: 52px;
            padding: 0;
            justify-content: center;
          }
          .fw-fab-label { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .fw-fab { transition: none; opacity: 1; transform: none; }
        }

        @media print { .fw-fab { display: none !important; } }
      `}</style>
    </>
  )
}
