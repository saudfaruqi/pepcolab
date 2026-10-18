// src/app/learn/page.tsx — index of the free guides.
import type { Metadata } from 'next'
import Link from 'next/link'
import { LEARN_GUIDES } from '@/lib/learnGuides'

export const metadata: Metadata = {
  title: 'Free laboratory guides',
  description:
    'Free guides from Pepco Lab: reading a certificate of analysis, judging a laboratory supplier, and storing lyophilised peptides.',
  alternates: { canonical: '/learn' },
}

export default function LearnIndexPage() {
  return (
    <section className="li">
      <style>{`
        .li { max-width: 1080px; margin: 0 auto; padding: clamp(40px,7vw,88px) 20px clamp(48px,7vw,96px); }
        .li-eyebrow { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #8a6d2f; font-weight: 700; margin-bottom: 14px; }
        .li h1 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: clamp(36px,6vw,60px); line-height: 1; letter-spacing: -.03em; margin: 0 0 16px; }
        .li-lead { max-width: 620px; font-size: 16px; line-height: 1.75; color: rgba(13,13,13,.6); margin: 0 0 40px; }
        .li-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .li-card { display: flex; flex-direction: column; background: #fff; border: 1px solid rgba(13,13,13,.08); border-radius: 20px; padding: 26px; text-decoration: none; color: inherit; transition: border-color .15s, transform .15s; }
        .li-card:hover { border-color: rgba(13,13,13,.3); transform: translateY(-2px); }
        .li-pages { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: rgba(13,13,13,.45); font-weight: 600; margin-bottom: 14px; }
        .li-card h2 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 25px; line-height: 1.12; margin: 0 0 10px; }
        .li-card p { font-size: 14px; line-height: 1.65; color: rgba(13,13,13,.6); margin: 0 0 22px; flex: 1; }
        .li-go { font-size: 13px; font-weight: 600; }
      `}</style>
      <div className="li-eyebrow">Free guides</div>
      <h1>Know what you are buying.</h1>
      <p className="li-lead">
        Short, practical guides on the paperwork, testing and handling behind laboratory compounds. Free, emailed to
        you as a PDF.
      </p>
      <div className="li-grid">
        {LEARN_GUIDES.map((g) => (
          <Link key={g.slug} href={`/learn/${g.slug}`} className="li-card">
            <div className="li-pages">{g.pages}-page PDF</div>
            <h2>{g.title}</h2>
            <p>{g.seoDescription.replace(/^Free (one-page )?(guide|checklist): /i, '').replace(/^./, (c) => c.toUpperCase())}</p>
            <span className="li-go">Get the guide →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
