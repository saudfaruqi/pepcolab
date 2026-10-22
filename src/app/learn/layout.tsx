// src/app/learn/layout.tsx
//
// Stripped layout for the Meta ad landing pages (Meta Ads Strategy, Oct 2026,
// section 3): logo, the guide, a legal footer. No shop navigation, no cart,
// no chat or WhatsApp bubbles (those hide themselves on /learn), so the page
// is about one thing — the free guide the ad promised.
import Link from 'next/link'
import Image from 'next/image'
import CookieSettingsButton from './CookieSettingsButton'

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="learn-root">
      <style>{`
        .learn-root { min-height: 100vh; display: flex; flex-direction: column; background: #f7f6f3; color: #0d0d0d; font-family: 'DM Sans', system-ui, sans-serif; }
        .learn-head { border-bottom: 1px solid rgba(13,13,13,.08); background: #fff; }
        .learn-head-inner { max-width: 1080px; margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .learn-head img { height: 36px; width: auto; display: block; }
        .learn-head-tag { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: rgba(13,13,13,.45); font-weight: 600; }
        .learn-main { flex: 1; }
        .learn-foot { border-top: 1px solid rgba(13,13,13,.08); background: #fff; }
        .learn-foot-inner { max-width: 1080px; margin: 0 auto; padding: 24px 20px 32px; font-size: 12px; line-height: 1.75; color: rgba(13,13,13,.5); }
        .learn-foot-inner a { color: rgba(13,13,13,.65); }
        .learn-foot-links { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; }
        .learn-foot-links button { background: none; border: 0; padding: 0; font: inherit; color: rgba(13,13,13,.65); text-decoration: underline; cursor: pointer; }
        @media (max-width: 520px) { .learn-head-tag { display: none; } }
      `}</style>

      <header className="learn-head">
        <div className="learn-head-inner">
          <Link href="/learn" aria-label="PepcoLab free guides">
            <Image src="/pepcologo.png" alt="PepcoLab" width={144} height={36} priority />
          </Link>
          <span className="learn-head-tag">Free laboratory guides</span>
        </div>
      </header>

      <main className="learn-main">{children}</main>

      <footer className="learn-foot">
        <div className="learn-foot-inner">
          <div>
            All PepcoLab materials are supplied for laboratory and research use only. They are not medicines and are
            not for human or veterinary use. Our guides cover testing, documentation and storage — never use in or on a body.
          </div>
          <div style={{ marginTop: 8 }}>
            SEE BEE DEE LIMITED, trading as PepcoLab · Registered in England and Wales, company no. 17072052
          </div>
          <div className="learn-foot-links">
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
            <CookieSettingsButton />
          </div>
        </div>
      </footer>
    </div>
  )
}

