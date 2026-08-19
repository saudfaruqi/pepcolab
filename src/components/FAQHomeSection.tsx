'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowRight } from 'lucide-react'

// New: the homepage previously sent every objection ("is this legal to
// buy", "how is it shipped", "what happens if customs holds it") straight
// to a bounce, because none of that was answered until a visitor found
// their own way to /faq. This is the same content as app/faq/page.tsx,
// trimmed to the five questions that most affect purchase decisions,
// answered right where the doubt shows up. Full list stays linked out
// rather than duplicated, so the two never drift out of sync in wording —
// if you edit an answer, update it in app/faq/page.tsx and mirror it here.
const HOME_FAQS = [
  {
    q: 'What does "research use only" mean?',
    a: 'All peptides sold by PepcoLab are intended solely for in-vitro laboratory research and scientific study. They are not approved for human or veterinary use, consumption, or household purposes, and must only be handled by qualified researchers in appropriate laboratory settings.',
  },
  {
    q: 'How is purity tested and verified?',
    a: 'Every batch is independently tested using validated analytical methods including HPLC and Mass Spectrometry. Results are published publicly through our Certificate Library, not just asserted on the product page.',
  },
  {
    q: 'How are orders shipped, and how fast?',
    a: 'Orders are dispatched in temperature-controlled, insulated packaging using tracked courier services. Orders placed before the daily cut-off are processed the same working day, across both the UK and UAE.',
  },
  {
    q: 'What is your return policy?',
    a: 'Due to the specialist nature of research products, opened products cannot be returned. Damaged or incorrect orders should be reported within 48 hours of delivery.',
  },
  {
    q: 'Is PepcoLab a registered business?',
    a: 'Yes. PepcoLab operates as a registered UK business (SEE BEE DEE LIMITED) and supplies research materials intended solely for laboratory use.',
  },
]

export default function FAQHomeSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="py-16 lg:py-22 border-b border-[var(--border)] bg-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-10">
          <p className="section-label mb-2">Common questions</p>
          <h2
            className="text-[clamp(26px,3.5vw,42px)] font-bold tracking-tight text-[var(--ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Before you order.
          </h2>
        </div>

        <div className="flex flex-col divide-y divide-[var(--border)] border-t border-b border-[var(--border)] mb-8">
          {HOME_FAQS.map((item, i) => {
            const open = openIdx === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[14.5px] font-semibold text-[var(--ink)]">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className="flex-shrink-0 text-[var(--ink-60)] transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                  />
                </button>
                {open && (
                  <p className="text-[13.5px] text-[var(--ink-60)] leading-relaxed pb-5 pr-8">
                    {item.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--blue)] hover:gap-2.5 transition-all"
          >
            See the full FAQ <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
