// src/components/ContentBlocks.tsx
//
// Renders the shared ContentBlock[] shape used by both guides-data.ts and
// research-data.ts. Deliberately has NO 'use client' directive and uses no
// hooks — it's a pure presentational function, so it renders on the server
// as part of the page's initial HTML wherever it's used. Keep it that way;
// if you need interactivity (e.g. copy-to-clipboard on a code block), wrap
// just that piece in its own small client component rather than converting
// this whole file.

import type { ContentBlock } from '@/lib/guides-data'

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
            {block.text}
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
            {block.text}
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
                {item}
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
              {block.text}
            </p>
          </div>
        )

        return null
      })}
    </div>
  )
}

/** Flattens ContentBlock[] into a plain-text word count, for readTime sanity checks. */
export function wordCount(content: ContentBlock[]): number {
  return content.reduce((sum, b) => {
    const text = b.type === 'list' ? b.items!.join(' ') : b.text
    return sum + text.split(/\s+/).filter(Boolean).length
  }, 0)
}
