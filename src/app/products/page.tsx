import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ProductsSection from '@/components/ProductsSection'

export const metadata: Metadata = {
  title: 'Research Peptides — PepcoLab',
  description: 'Research-grade peptides independently verified and publicly certified.',
}

const IMGS = {
  hero: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=2000&q=80&auto=format&fit=crop',
  lab:  'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1400&q=80&auto=format&fit=crop',
}

const TRUST_ITEMS = [
  { n: '01', title: 'Independent Verification', desc: 'Purity and identity testing documented for every lot.' },
  { n: '02', title: 'Cold-Chain Dispatch',       desc: 'Temperature-conscious packaging and rapid fulfilment.' },
  { n: '03', title: 'Public COA Library',        desc: 'Batch certificates searchable by product and lot number.' },
]

export default function ProductsPage() {
  return (
    <>
      <Nav />

      <style>{`
        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Hero ── */
        .pp-hero {
          position: relative;
          min-height: 92svh;
          background: #090909;
          display: flex;
          align-items: flex-end;
          padding: clamp(32px,6vw,80px) clamp(16px,4vw,60px);
          overflow: hidden;
        }
        .pp-hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: .18;
        }
        .pp-hero-grad {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 60%, transparent 100%);
        }
        .pp-hero-content {
          position: relative;
          z-index: 2;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }
        .pp-hero-eyebrow {
          font-size: 10px;
          letter-spacing: .24em;
          text-transform: uppercase;
          color: rgba(255,255,255,.4);
          font-weight: 700;
          margin-bottom: clamp(16px,3vw,28px);
        }
        .pp-hero-h1 {
          font-family: Georgia, serif;
          font-size: clamp(52px,11vw,120px);
          line-height: .88;
          letter-spacing: -.07em;
          color: #fff;
          margin-bottom: clamp(16px,3vw,24px);
        }
        .pp-hero-body {
          font-size: clamp(14px,2vw,17px);
          line-height: 1.85;
          color: rgba(255,255,255,.52);
          max-width: 540px;
          margin-bottom: clamp(28px,4vw,44px);
        }
        .pp-hero-btns {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pp-btn-primary {
          display: inline-flex;
          align-items: center;
          background: #fff;
          color: #000;
          text-decoration: none;
          padding: 14px 24px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: background .15s, transform .15s;
        }
        .pp-btn-primary:hover { background: #e8e8e8; transform: translateY(-1px); }
        .pp-btn-ghost {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(255,255,255,.14);
          color: rgba(255,255,255,.8);
          text-decoration: none;
          padding: 14px 24px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: border-color .15s, color .15s;
        }
        .pp-btn-ghost:hover { border-color: rgba(255,255,255,.35); color: #fff; }

        /* ── Trust strip ── */
        .pp-trust {
          background: #fff;
          border-bottom: 1px solid rgba(13,13,13,.08);
        }
        .pp-trust-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }
        @media(max-width: 640px) {
          .pp-trust-inner { grid-template-columns: 1fr; }
        }
        .pp-trust-item {
          padding: clamp(20px,3vw,32px) clamp(16px,3vw,32px);
          border-right: 1px solid rgba(13,13,13,.07);
          position: relative;
        }
        .pp-trust-item:last-child { border-right: none; }
        @media(max-width: 640px) {
          .pp-trust-item { border-right: none; border-bottom: 1px solid rgba(13,13,13,.07); }
          .pp-trust-item:last-child { border-bottom: none; }
        }
        .pp-trust-n {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .14em;
          color: rgba(13,13,13,.25);
          margin-bottom: 12px;
        }
        .pp-trust-title {
          font-size: clamp(15px,2vw,17px);
          font-weight: 700;
          color: #0d0d0d;
          margin-bottom: 8px;
          letter-spacing: -.02em;
        }
        .pp-trust-desc {
          font-size: 13px;
          line-height: 1.75;
          color: rgba(13,13,13,.52);
        }

        /* ── Products section ── */
        .pp-products {
          background: #f7f7f5;
          padding: clamp(40px,5vw,64px) 0;
        }

        /* ── Research Standards ── */
        .pp-standards {
          background: #0b0b0b;
          color: #fff;
          overflow: hidden;
        }
        .pp-standards-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 560px;
        }
        @media(max-width: 860px) {
          .pp-standards-inner { grid-template-columns: 1fr; min-height: auto; }
        }
        .pp-standards-text {
          padding: clamp(48px,7vw,100px) clamp(20px,5vw,72px);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .pp-standards-eyebrow {
          font-size: 10px;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: rgba(255,255,255,.3);
          font-weight: 700;
          margin-bottom: 18px;
        }
        .pp-standards-h2 {
          font-family: Georgia, serif;
          font-size: clamp(36px,5vw,68px);
          line-height: .92;
          letter-spacing: -.06em;
          margin-bottom: 20px;
        }
        .pp-standards-body {
          font-size: clamp(13px,1.6vw,15px);
          line-height: 1.9;
          color: rgba(255,255,255,.52);
          max-width: 460px;
          margin-bottom: 36px;
        }
        .pp-standards-img {
          position: relative;
          overflow: hidden;
          min-height: clamp(280px,40vw,600px);
        }
        @media(max-width: 860px) {
          .pp-standards-img { min-height: 260px; }
        }
        .pp-standards-img img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        /* Gradient overlay on image */
        .pp-standards-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(11,11,11,.4), transparent);
        }
        @media(max-width: 860px) {
          .pp-standards-img::after {
            background: linear-gradient(to bottom, rgba(11,11,11,.3), transparent);
          }
        }

        /* ── Standards list inside text col ── */
        .pp-std-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 36px;
        }
        .pp-std-list-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .pp-std-list-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,.3);
          flex-shrink: 0;
          margin-top: 7px;
        }
        .pp-std-list-text {
          font-size: 14px;
          line-height: 1.65;
          color: rgba(255,255,255,.55);
        }
        .pp-std-list-text strong {
          display: block;
          color: rgba(255,255,255,.85);
          font-weight: 600;
          margin-bottom: 2px;
        }
      `}</style>

      <main style={{ background: '#fff', overflowX: 'hidden' }}>

        {/* ── Hero ── */}
        <section className="pp-hero">
          <img className="pp-hero-bg" src={IMGS.hero} alt="" />
          <div className="pp-hero-grad" />
          <div className="pp-hero-content">
            <div style={{ maxWidth: 700 }}>
              <div className="pp-hero-eyebrow">Research Catalogue</div>
              <h1 className="pp-hero-h1">Research<br />Peptides</h1>
              <p className="pp-hero-body">
                Independently verified peptide compounds manufactured for laboratory and scientific research. Every batch includes public purity documentation and certificate verification.
              </p>
              <div className="pp-hero-btns">
                <a href="#catalogue" className="pp-btn-primary">Browse Catalogue</a>
                <a href="/certificates" className="pp-btn-ghost">View Certificates</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="pp-trust">
          <div className="pp-trust-inner">
            {TRUST_ITEMS.map(item => (
              <div key={item.n} className="pp-trust-item">
                <div className="pp-trust-n">{item.n}</div>
                <div className="pp-trust-title">{item.title}</div>
                <div className="pp-trust-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Products ── */}
        <section id="catalogue" className="pp-products">
          <ProductsSection showAll />
        </section>

        {/* ── Research Standards ── */}
        <section className="pp-standards">
          <div className="pp-standards-inner">

            {/* Text */}
            <div className="pp-standards-text">
              <div className="pp-standards-eyebrow">Research Standards</div>
              <h2 className="pp-standards-h2">Built around<br />transparency.</h2>

              <div className="pp-std-list">
                {[
                  { title: 'Batch Documentation',     desc: 'Every lot linked to analytical records and purity certificates.' },
                  { title: 'Lab Verification',        desc: 'Third-party testing on every production run before release.'     },
                  { title: 'Independent Review',      desc: 'Researchers can verify every lot independently before purchase.' },
                ].map(item => (
                  <div key={item.title} className="pp-std-list-item">
                    <div className="pp-std-list-dot" />
                    <div className="pp-std-list-text">
                      <strong>{item.title}</strong>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>

              <a href="/certificates" className="pp-btn-primary" style={{ alignSelf: 'flex-start' }}>
                Explore COA Library
              </a>
            </div>

            {/* Image */}
            <div className="pp-standards-img">
              <img src={IMGS.lab} alt="Laboratory research environment" />
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}