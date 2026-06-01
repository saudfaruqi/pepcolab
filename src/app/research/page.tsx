'use client'
'use client'
import AnnouncementBar from '@/components/AnnouncementBar'
import Nav from '@/components/Nav'
import ToolsSection from '@/components/ToolsSection'
import Footer from '@/components/Footer'
import { BookOpen, ExternalLink } from 'lucide-react'

const ARTICLES = [
  { title: 'BPC-157: Mechanisms of Action and Research Applications', date: 'May 2025', tag: 'Recovery', readTime: '8 min' },
  { title: 'Understanding GLP-1 Receptor Agonists in Metabolic Research', date: 'Apr 2025', tag: 'Metabolic', readTime: '12 min' },
  { title: 'Peptide Storage: Best Practices for Research Integrity', date: 'Apr 2025', tag: 'Guide', readTime: '5 min' },
  { title: 'Epithalon and Telomere Biology: A Research Overview', date: 'Mar 2025', tag: 'Anti-Ageing', readTime: '10 min' },
  { title: 'Semax and Cognitive Enhancement Research: Current Evidence', date: 'Mar 2025', tag: 'Cognitive', readTime: '9 min' },
  { title: 'Reconstitution Guide: Preparing Peptides for In Vitro Research', date: 'Feb 2025', tag: 'Guide', readTime: '6 min' },
]

const TAG_COLORS: Record<string, string> = {
  Recovery: 'bg-green-50 text-green-600',
  Metabolic: 'bg-blue-50 text-blue-600',
  Guide: 'bg-amber-50 text-amber-600',
  'Anti-Ageing': 'bg-violet-50 text-violet-600',
  Cognitive: 'bg-rose-50 text-rose-600',
}

export default function ResearchPage() {
  return (
    <>
      
      <Nav />
      <main>
        <div className="border-b border-border bg-canvas-warm py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-steel-light mb-2">Knowledge base</div>
              <h1 className="font-serif text-[44px] tracking-[-1.5px] text-ink">Research Hub</h1>
              <p className="text-[15px] text-steel font-light mt-2 max-w-xl">
                Guides, storage protocols, and links to published peer-reviewed studies. Built for serious researchers.
              </p>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <h2 className="font-serif text-[28px] tracking-tight text-ink mb-6">Research Articles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {ARTICLES.map((a) => (
              <a key={a.title} href="#" className="research-card bg-white border border-border rounded-[14px] p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${TAG_COLORS[a.tag] || 'bg-gray-50 text-gray-600'}`}>
                    {a.tag}
                  </span>
                  <span className="text-[11px] text-steel-light">{a.readTime} read</span>
                </div>
                <div className="text-[14px] font-semibold text-ink leading-[1.4] tracking-tight">{a.title}</div>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-light">
                  <span className="text-[11px] text-steel-light">{a.date}</span>
                  <ExternalLink size={12} className="text-steel-light" />
                </div>
              </a>
            ))}
          </div>
        </div>

        <ToolsSection />
      </main>
      <Footer />
    </>
  )
}
