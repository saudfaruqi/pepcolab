// src/components/ShareButton.tsx
'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Share2, Copy, Check, Mail } from 'lucide-react'

interface Props {
  title: string
  text?: string
  url?: string          // defaults to the current page
  variant?: 'icon' | 'pill'
  size?: number
}

// WhatsApp glyph — matches the brand mark used everywhere else WhatsApp
// appears (FloatingWhatsApp, cart CTAs) rather than lucide's generic
// MessageCircle, so the fallback share menu doesn't look like a different
// product from the rest of the WhatsApp ordering flow.
function WhatsAppGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2m0 18.06h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24a8.2 8.2 0 0 1 5.84 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.25 8.24m4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.24-.64.81-.79.98-.14.17-.29.19-.53.06-.25-.12-1.05-.38-1.99-1.22-.74-.66-1.23-1.46-1.38-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43s.17-.24.25-.41c.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31s-.87.85-.87 2.07.89 2.4 1.02 2.57c.12.16 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.28"/>
    </svg>
  )
}

export default function ShareButton({ title, text, url, variant = 'icon', size = 16 }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  async function handleClick() {
    // Native share sheet — supported on iOS/Android/most modern browsers.
    // Falls through to the popover menu on desktop browsers that lack it.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
      } catch {
        // Cancelled or blocked — no fallback menu needed, this was an
        // intentional user dismissal of the native sheet.
      }
      return
    }
    setOpen((o) => !o)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => { setCopied(false); setOpen(false) }, 1400)
    } catch {
      // Clipboard API unavailable — select-and-copy fallback isn't worth
      // the complexity here; the link is still visible/copyable manually
      // from the address bar.
    }
  }

  const whatsAppShareHref = `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`
  const mailShareHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text ?? ''}\n\n${shareUrl}`)}`

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Share this product"
        aria-expanded={open}
        style={
          variant === 'pill'
            ? {
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, fontWeight: 600, padding: '14px 18px', borderRadius: 12,
                border: '1px solid #DDE3F0', color: '#0D0F14',
                background: '#fff', cursor: 'pointer', transition: 'all .2s',
              }
            : {
                width: 38, height: 38, borderRadius: 10, border: '1px solid #DDE3F0',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#0D0F14', flexShrink: 0, transition: 'all .2s',
              }
        }
      >
        <Share2 size={size} />
        {variant === 'pill' && 'Share'}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 30,
            background: '#fff', border: '1px solid #E5EAF5', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(13,15,20,.12)', padding: 6, minWidth: 190,
            display: 'grid', gap: 2,
          }}
        >
          <a
            href={whatsAppShareHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={shareMenuItemStyle}
          >
            <WhatsAppGlyph size={15} />
            Share on WhatsApp
          </a>
          <a href={mailShareHref} onClick={() => setOpen(false)} style={shareMenuItemStyle}>
            <Mail size={15} />
            Share by email
          </a>
          <button type="button" onClick={copyLink} style={{ ...shareMenuItemStyle, width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
            {copied ? <Check size={15} color="#3B6D11" /> : <Copy size={15} />}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}

const shareMenuItemStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9,
  padding: '9px 10px', borderRadius: 8,
  fontSize: 13, fontWeight: 600, color: '#0D0F14',
  textDecoration: 'none', transition: 'background .12s',
}