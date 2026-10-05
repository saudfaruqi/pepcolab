// src/components/FaqSection.tsx
//
// NEW FILE (Oct 2026). Shared question-and-answer block plus its FAQPage
// JSON-LD builder, used by /guides/[slug] and /compare/[slug].
//
// WHY THIS EXISTS
//
// SERP review across the ten query clusters this site competes in found that
// in nine of ten, the page holding position 1 carries NO FAQ markup — while
// the pages that do carry it are the ones winning the "People also ask"
// boxes underneath. Every one of those clusters is question-shaped
// ("do peptides need to be refrigerated", "is semax legal in uk", "can I use
// sterile water instead of bacteriostatic water"), which is exactly the
// query shape FAQPage is read for.
//
// So this is not decoration. It is the one structural thing our content can
// do that the incumbent #1 results are not doing.
//
// TWO RULES THAT MUST NOT BE RELAXED
//
// 1. Every answer must also be VISIBLE on the page. Google's structured-data
//    policy requires FAQPage content to be present for the user, not
//    injected into the markup alone. That is why this file exports the
//    renderer and the schema together — so it is impossible to emit the
//    JSON-LD without also rendering the block.
//
// 2. Answers carry no dosing, administration or human-outcome content. These
//    are the most syndicated snippets on the site once they start winning
//    question boxes, so they are the LAST place to put anything that would
//    read as instructional. Research-use framing only, consistent with the
//    rest of guides-data.ts and comparisons-data.ts.
//
// Answers may contain inline [label](/href) links, which render as real
// anchors in the visible block and are flattened to plain text in the
// JSON-LD (raw Markdown brackets in a rich result are both ugly and a
// quality signal against it).

import { stripInlineLinks } from '@/components/ContentBlocks'
import Link from 'next/link'

export type FaqItem = { q: string; a: string }

/** Matches [label](target) — kept in step with ContentBlocks.tsx. */
const LINK_RE = /\[([^\]]+?)\]\(([^)\s]+?)\)/g

function safeHref(raw: string): { href: string; external: boolean } | null {
  const href = raw.trim()
  if (!href) return null
  if (href.startsWith('//')) return null
  if (href.startsWith('/') || href.startsWith('#')) return { href, external: false }
  if (/^https:\/\/[^\s]+$/i.test(href)) return { href, external: true }
  if (/^mailto:[^\s]+@[^\s]+$/i.test(href)) return { href, external: true }
  return null
}

function withLinks(text: string, keyPrefix: string): React.ReactNode {
  if (!text || !text.includes('](')) return text
  const out: React.ReactNode[] = []
  let last = 0
  let n = 0
  LINK_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LINK_RE.exec(text)) !== null) {
    const [full, label, target] = m
    const safe = safeHref(target)
    if (m.index > last) out.push(text.slice(last, m.index))
    if (!safe) {
      out.push(full)
    } else if (safe.external) {
      out.push(
        <a key={`${keyPrefix}-l${n}`} href={safe.href} target="_blank" rel="noopener noreferrer"
           style={{ color: '#3b5bdb', textDecoration: 'underline', textUnderlineOffset: 2 }}>
          {label}
        </a>
      )
    } else {
      out.push(
        <Link key={`${keyPrefix}-l${n}`} href={safe.href}
              style={{ color: '#3b5bdb', textDecoration: 'underline', textUnderlineOffset: 2 }}>
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

/**
 * FAQPage JSON-LD for a set of questions.
 *
 * Returns null for an empty set rather than an empty FAQPage — an FAQPage
 * with a zero-length mainEntity is a structured-data error in Search
 * Console, and every page that has no FAQ would report one.
 */
export function buildFaqJsonLd(faq: FaqItem[] | undefined, pageUrl: string) {
  if (!faq || faq.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: stripInlineLinks(item.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripInlineLinks(item.a),
      },
    })),
  }
}

/**
 * The visible block. Uses <details>/<summary> so answers are expandable
 * without any client JavaScript — the text is in the server-rendered HTML
 * either way, which is what both Google and the FAQPage policy require.
 * `open` on the first item gives the page a visible answer above the fold
 * of the section rather than a wall of closed rows.
 */
export default function FaqSection({
  faq,
  heading = 'Common Questions',
  maxWidth = 720,
}: {
  faq: FaqItem[] | undefined
  heading?: string
  maxWidth?: number
}) {
  if (!faq || faq.length === 0) return null

  return (
    <section style={{ maxWidth, marginTop: 44 }}>
      {/* Inline styles cannot reach pseudo-elements, and Safari still paints
          its own disclosure triangle unless ::-webkit-details-marker is
          suppressed explicitly — listStyle:none alone only covers Firefox
          and modern Chrome. This also swaps the + for a − when open, which
          is otherwise impossible without client JS.
          NOTE: no backticks anywhere inside this template literal. */}
      <style>{`
        .faq-row > summary { list-style: none; }
        .faq-row > summary::-webkit-details-marker { display: none; }
        .faq-row > summary::marker { content: ''; }
        .faq-row[open] > summary .faq-sign { transform: rotate(45deg); }
        .faq-row > summary .faq-sign { transition: transform .18s ease; }
        .faq-row > summary:focus-visible { outline: 2px solid #3b5bdb; outline-offset: 3px; border-radius: 4px; }
      `}</style>

      <h2
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-.025em',
          marginBottom: 18,
          color: '#0d0d0d',
        }}
      >
        {heading}
      </h2>

      <div style={{ borderTop: '1px solid rgba(13,13,13,.1)' }}>
        {faq.map((item, i) => (
          <details
            key={i}
            className="faq-row"
            open={i === 0}
            style={{ borderBottom: '1px solid rgba(13,13,13,.1)', padding: '2px 0' }}
          >
            <summary
              style={{
                // 44px minimum tap target (WCAG 2.5.5 / Apple HIG), matching
                // the .tap-44 convention in globals.css. A 13px summary row
                // with default padding lands around 30px and fails on mobile.
                listStyle: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                minHeight: 44,
                padding: '12px 0',
                fontSize: 15.5,
                fontWeight: 600,
                lineHeight: 1.5,
                color: '#0d0d0d',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span>{item.q}</span>
              <span
                aria-hidden="true"
                className="faq-sign"
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  color: 'rgba(13,13,13,.4)',
                  fontSize: 20,
                  lineHeight: '18px',
                  textAlign: 'center',
                  fontWeight: 400,
                }}
              >
                +
              </span>
            </summary>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.8,
                color: 'rgba(13,13,13,.72)',
                margin: '0 0 16px',
                paddingRight: 32,
              }}
            >
              {withLinks(item.a, `faq${i}`)}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}