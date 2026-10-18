// src/app/learn/[slug]/thanks/page.tsx — after the guide form.
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LEARN_GUIDES, getLearnGuide, YOUTUBE_URL } from '@/lib/learnGuides'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return LEARN_GUIDES.map((g) => ({ slug: g.slug }))
}

export const metadata: Metadata = {
  title: 'Check your inbox',
  robots: { index: false, follow: false },
}

export default function LearnThanksPage({ params }: Props) {
  const guide = getLearnGuide(params.slug)
  if (!guide) notFound()
  const others = LEARN_GUIDES.filter((g) => g.slug !== guide.slug)

  return (
    <section className="lt">
      <style>{`
        .lt { max-width: 720px; margin: 0 auto; padding: clamp(48px,8vw,104px) 20px clamp(56px,8vw,104px); text-align: center; }
        .lt-tick { width: 56px; height: 56px; border-radius: 50%; background: #0d0d0d; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 22px; }
        .lt h1 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: clamp(34px,5.5vw,52px); line-height: 1.04; letter-spacing: -.03em; margin: 0 0 14px; }
        .lt-p { font-size: 16px; line-height: 1.75; color: rgba(13,13,13,.6); margin: 0 auto 12px; max-width: 520px; }
        .lt-small { font-size: 13px; color: rgba(13,13,13,.5); margin-bottom: 40px; }
        .lt-more { text-align: left; background: #fff; border: 1px solid rgba(13,13,13,.08); border-radius: 20px; padding: 22px 24px; }
        .lt-more h2 { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: rgba(13,13,13,.45); margin: 0 0 12px; font-weight: 700; }
        .lt-more a { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px solid rgba(13,13,13,.07); color: #0d0d0d; text-decoration: none; font-weight: 600; font-size: 15px; }
        .lt-more a:first-of-type { border-top: 0; }
      `}</style>
      <div className="lt-tick" aria-hidden="true">✓</div>
      <h1>Check your inbox</h1>
      <p className="lt-p">
        {guide.title} is on its way. It usually arrives within a minute — if it does not, check your spam or promotions
        folder for an email from Pepco Lab.
      </p>
      <p className="lt-small">Nothing to wait for? Reply to any of our emails and a person will help.</p>

      <div className="lt-more">
        <h2>While you wait</h2>
        {others.map((g) => (
          <Link key={g.slug} href={`/learn/${g.slug}`}>
            <span>{g.title}</span>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
        <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
          <span>Watch the explainers on YouTube</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  )
}
