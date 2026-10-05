// src/components/ContentBlocks.tsx
//
// Renders the shared ContentBlock[] shape used by both guides-data.ts and
// research-data.ts. Deliberately has NO 'use client' directive and uses no
// hooks — it's a pure presentational function, so it renders on the server
// as part of the page's initial HTML wherever it's used. Keep it that way;
// if you need interactivity (e.g. copy-to-clipboard on a code block), wrap
// just that piece in its own small client component rather than converting
// this whole file.
//
// ─── INLINE LINKS (Oct 2026) ──────────────────────────────────────────────
//
// Until now every block's `text` was rendered as a plain string, which meant
// the cross-references already written into the body copy — "see our storage
// guide", "see our legal-status page", "consult the COA" — were dead text.
// Thirty-plus internal references across guides-data.ts and research-data.ts
// pointed at pages Google had no crawlable path to from the sentence that
// recommended them, so the topic cluster existed in prose and not in the
// link graph.
//
// Rather than change the ContentBlock type (which would mean touching every
// one of ~200 existing blocks), links are written inline with Markdown's
// own syntax and parsed here:
//
//   { type: 'paragraph', text: 'See our [storage guide](/guides/storage-conditions) for the full matrix.' }
//
// This works in paragraphs, intros, callouts and list items identically,
// needs no migration of existing content, and degrades to visible literal
// text if the syntax is malformed rather than throwing.
//
// Links are rendered as real <a>/next-Link elements — NOT via
// dangerouslySetInnerHTML. The label and href are both treated as untrusted
// strings: href is whitelisted to internal paths, mailto: and https:, so a
// typo in a data file cannot become a javascript: URL.

import Link from 'next/link'
import type { ContentBlock } from '@/lib/guides-data'

/** Matches [label](target). Lazy label so two links in one sentence don't merge. */
const LINK_RE = /\[([^\]]+?)\]\(([^)\s]+?)\)/g

/**
 * Only internal paths, https: and mailto: are allowed to become links.
 * Anything else (including protocol-relative "//evil.com" and any
 * javascript:/data: attempt) renders as literal text, so a bad href in a
 * content file is a visible copy bug rather than a live exploit.
 */
function safeHref(raw: string): { href: string; external: boolean } | null {
  const href = raw.trim()
  if (!href) return null
  if (href.startsWith('//')) return null
  if (href.startsWith('/') || href.startsWith('#')) return { href, external: false }
  if (/^https:\/\/[^\s]+$/i.test(href)) return { href, external: true }
  if (/^mailto:[^\s]+@[^\s]+$/i.test(href)) return { href, external: true }
  return null
}

const linkStyle: React.CSSProperties = {
  color: '#3b5bdb',
  textDecoration: 'underline',
  textDecorationThickness: 1,
  textUnderlineOffset: 2,
}

/**
 * Splits a string on [label](href) and returns React children. Plain strings
 * pass through untouched, so the common case costs one regex test.
 */
function withLinks(text: string, keyPrefix: string): React.ReactNode {
  if (!text || !text.includes('](')) return text

  const out: React.ReactNode[] = []
  let last = 0
  let n = 0

  // Fresh lastIndex each call — LINK_RE is module-scoped and /g is stateful.
  LINK_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LINK_RE.exec(text)) !== null) {
    const [full, label, target] = m
    const safe = safeHref(target)

    if (m.index > last) out.push(text.slice(last, m.index))

    if (!safe) {
      // Unrecognised target: emit the original source text verbatim so the
      // problem is visible in review rather than silently swallowed.
      out.push(full)
    } else if (safe.external) {
      out.push(
        <a
          key={`${keyPrefix}-l${n}`}
          href={safe.href}
          style={linkStyle}
          {...(safe.href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {label}
        </a>
      )
    } else {
      out.push(
        <Link key={`${keyPrefix}-l${n}`} href={safe.href} style={linkStyle}>
          {label}
        </Link>
      )
    }

    last = m.index + full.length
    n++
  }

  if (last < text.length) out.push(text.slice(last))
  return out.length === 1 ? out[0] : out
}

export default function ContentBlocks({ content }: { content: ContentBlock[] }) {
  return (
    <div style={{ maxWidth: 720 }}>
      {content.map((block: ContentBlock, i: number) => {
        if (block.type === 'intro') return (
          <p key={i} style={{
            fontSize: 17,
            lineHeight: 1.75,
            color: 'rgba(13,13,13,.75)',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            marginBottom: 32,
            paddingBottom: 28,
            borderBottom: '1px solid rgba(13,13,13,.08)',
          }}>
            {withLinks(block.text, `b${i}`)}
          </p>
        )

        if (block.type === 'heading') return (
          <h2 key={i} style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-.025em',
            marginTop: 40,
            marginBottom: 14,
            color: '#0d0d0d',
          }}>
            {/* Headings stay plain text on purpose — a link inside an <h2>
                splits the heading's anchor text and weakens it as a section
                signal. */}
            {block.text}
          </h2>
        )

        if (block.type === 'paragraph') return (
          <p key={i} style={{
            fontSize: 15.5,
            lineHeight: 1.8,
            color: 'rgba(13,13,13,.72)',
            marginBottom: 18,
          }}>
            {withLinks(block.text, `b${i}`)}
          </p>
        )

        if (block.type === 'list') return (
          <ul key={i} style={{ margin: '0 0 20px 0', paddingLeft: 22 }}>
            {block.items!.map((item: string, j: number) => (
              <li key={j} style={{
                fontSize: 15,
                lineHeight: 1.75,
                color: 'rgba(13,13,13,.7)',
                marginBottom: 8,
              }}>
                {withLinks(item, `b${i}i${j}`)}
              </li>
            ))}
          </ul>
        )

        if (block.type === 'callout') return (
          <div key={i} style={{
            background: '#f0f4ff',
            borderLeft: '3px solid #3b5bdb',
            borderRadius: '0 10px 10px 0',
            padding: '16px 20px',
            margin: '24px 0',
          }}>
            <p style={{
              fontSize: 14.5,
              lineHeight: 1.7,
              color: '#1e3a8a',
              margin: 0,
              fontWeight: 500,
            }}>
              {withLinks(block.text, `b${i}`)}
            </p>
          </div>
        )

        return null
      })}
    </div>
  )
}

/**
 * Strips [label](href) down to its label. Used by the word counter and by
 * FAQ JSON-LD, which must carry clean prose rather than Markdown source —
 * Google reads the answer text literally, and raw brackets in a FAQPage
 * answer are both ugly in a rich result and a quality signal against it.
 */
export function stripInlineLinks(text: string): string {
  return (text || '').replace(LINK_RE, '$1')
}

/** Flattens ContentBlock[] into a plain-text word count, for readTime sanity checks. */
export function wordCount(content: ContentBlock[]): number {
  return content.reduce((sum, b) => {
    const text = b.type === 'list' ? b.items!.join(' ') : b.text
    return sum + stripInlineLinks(text).split(/\s+/).filter(Boolean).length
  }, 0)
}