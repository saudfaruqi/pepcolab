'use client'
import { useState } from 'react'
import AnnouncementBar from '@/components/AnnouncementBar'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'What does "research use only" mean?',
    a: 'All peptides sold by PepcoLab are intended solely for in-vitro laboratory research and scientific study. They are not approved for human or veterinary use, consumption, or household purposes. They must only be handled by qualified researchers in appropriate laboratory settings.',
  },
  {
    q: 'How is purity tested and verified?',
    a: 'Every batch is tested by Eurofins Scientific UK, an independent accredited third-party laboratory. We use High-Performance Liquid Chromatography (HPLC) for purity analysis and mass spectrometry (MS) to confirm the peptide sequence. Results are published publicly — no selective disclosure.',
  },
  {
    q: 'What is a Certificate of Analysis (COA)?',
    a: 'A COA is a document issued by the testing laboratory confirming the identity, purity, and quality of a specific batch. Our COAs include: HPLC chromatogram, mass spec confirmation, endotoxin levels, moisture content, and test date. Every batch COA is publicly searchable via our COA Library.',
  },
  {
    q: 'How are peptides shipped?',
    a: 'All peptides are dispatched cold-chain using pharmaceutical-grade insulated packaging with cold packs. Orders placed before 2pm Monday–Friday are dispatched the same day via tracked UK courier. We do not ship internationally at this time.',
  },
  {
    q: 'What is your return policy?',
    a: 'Due to the research-grade nature of our products, we cannot accept returns of opened products. If you receive a damaged or incorrect order, please contact us within 48 hours of delivery with photographs and we will arrange a replacement.',
  },
  {
    q: 'How should peptides be stored?',
    a: 'Lyophilised (freeze-dried) peptides should be stored at -20°C in a sealed, dry environment away from light. Once reconstituted, peptides in bacteriostatic water can typically be stored at 4°C for up to 4 weeks, or at -20°C for longer periods. Always refer to the product-specific storage guide.',
  },
  {
    q: 'Do you offer custom synthesis?',
    a: 'We are exploring custom peptide synthesis for research institutions. If you are a qualified research organisation with specific requirements, please contact us at research@pepcolab.co.uk with your specifications.',
  },
  {
    q: 'Is PepcoLab UK registered?',
    a: 'Yes, PepcoLab Ltd is a registered UK company. All products are dispatched from within the United Kingdom and comply with UK research chemical regulations.',
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      
      <Nav />
      <main>
        <div className="border-b border-border bg-canvas-warm py-12 px-6 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-steel-light mb-2">Help</div>
            <h1 className="font-serif text-[44px] tracking-[-1.5px] text-ink">Frequently Asked Questions</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12">
          <div className="flex flex-col divide-y divide-border">
            {FAQS.map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  className="w-full flex items-center justify-between gap-4 text-left"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="text-[15px] font-medium text-ink">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-steel-light flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {open === i && (
                  <p className="text-[14px] text-steel font-light leading-[1.8] mt-4">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
