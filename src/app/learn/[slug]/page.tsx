// src/app/learn/[slug]/page.tsx — one guide: what is in it, and the form.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { LEARN_GUIDES, getLearnGuide, RESEARCH_AREAS } from '@/lib/learnGuides'
import LeadForm from './LeadForm'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return LEARN_GUIDES.map((g) => ({ slug: g.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const g = getLearnGuide(params.slug)
  if (!g) return { title: 'Guide not found', robots: { index: false, follow: false } }
  return {
    title: `${g.title} — free guide`,
    description: g.seoDescription,
    alternates: { canonical: `/learn/${g.slug}` },
    openGraph: { title: g.title, description: g.seoDescription, url: `/learn/${g.slug}`, type: 'website' },
  }
}

export default function LearnGuidePage({ params }: Props) {
  const guide = getLearnGuide(params.slug)
  if (!guide) notFound()

  return (
    <section className="lg">
      <style>{`
        .lg { max-width: 1080px; margin: 0 auto; padding: clamp(32px,6vw,80px) 20px clamp(48px,7vw,96px); display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,.9fr); gap: clamp(28px,5vw,64px); align-items: start; }
        @media (max-width: 860px) { .lg { grid-template-columns: minmax(0,1fr); } }
        .lg-eyebrow { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #8a6d2f; font-weight: 700; margin-bottom: 14px; }
        .lg h1 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: clamp(34px,5.4vw,56px); line-height: 1.02; letter-spacing: -.03em; margin: 0 0 18px; }
        .lg-sub { font-size: 16.5px; line-height: 1.75; color: rgba(13,13,13,.62); margin: 0 0 32px; max-width: 560px; }
        .lg-list { list-style: none; padding: 0; margin: 0 0 28px; display: grid; gap: 18px; }
        .lg-list li { display: grid; grid-template-columns: 34px minmax(0,1fr); gap: 14px; }
        .lg-num { width: 34px; height: 34px; border-radius: 50%; background: #0d0d0d; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
        .lg-list strong { display: block; font-size: 15.5px; margin-bottom: 3px; }
        .lg-list span { font-size: 14px; line-height: 1.65; color: rgba(13,13,13,.6); }
        .lg-meta { font-size: 12.5px; color: rgba(13,13,13,.5); }
        .lg-card { background: #fff; border: 1px solid rgba(13,13,13,.08); border-radius: 22px; padding: clamp(22px,3vw,32px); box-shadow: 0 18px 50px -30px rgba(13,13,13,.35); }
        @media (min-width: 861px) { .lg-card { position: sticky; top: 24px; } }
      `}</style>

      <div>
        <div className="lg-eyebrow">Free guide · {guide.pages}-page PDF</div>
        <h1>{guide.headline}</h1>
        <p className="lg-sub">{guide.subhead}</p>
        <ul className="lg-list">
          {guide.bullets.map((b, i) => (
            <li key={b.title}>
              <div className="lg-num">{i + 1}</div>
              <div>
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="lg-meta">Written by the Pepco Lab team. Emailed to you straight away — no account needed.</div>
      </div>

      <div className="lg-card">
        {/* LeadForm reads ?src= with useSearchParams, which needs a Suspense boundary on a static page. */}
        <Suspense fallback={null}>
          <LeadForm guideSlug={guide.slug} guideName={guide.shortName} defaultSource={guide.source} areas={RESEARCH_AREAS} />
        </Suspense>
      </div>
    </section>
  )
}
