'use client'
'use client'
import AnnouncementBar from '@/components/AnnouncementBar'
import Nav from '@/components/Nav'
import BundlesSection from '@/components/BundlesSection'
import Footer from '@/components/Footer'

export default function BundlesPage() {
  return (
    <>
      
      <Nav />
      <main>
        <div className="border-b border-border bg-canvas-warm py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-steel-light mb-2">Stacks</div>
            <h1 className="font-serif text-[44px] tracking-[-1.5px] text-ink">Research Bundles</h1>
            <p className="text-[15px] text-steel font-light mt-2 max-w-xl">
              Pre-matched peptide combinations curated for common research protocols. Save up to 15%.
            </p>
          </div>
        </div>
        <BundlesSection />
      </main>
      <Footer />
    </>
  )
}
