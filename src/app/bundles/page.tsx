// app/bundles/page.tsx

'use client'
import AnnouncementBar from '@/components/AnnouncementBar'
import Nav from '@/components/Nav'
import BundlesSection from '@/components/BundlesSection'
import Footer from '@/components/Footer'
import { MAX_BUNDLE_DISCOUNT } from '@/lib/bundles'

export default function BundlesPage() {
  return (
    <>
      
      <Nav />
      <main>
        <div className="border-b border-border bg-canvas-warm py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-steel-light mb-2">Paired sets</div>
            <h1 className="font-serif text-[44px] tracking-[-1.5px] text-ink">Research Bundles</h1>
            <p className="text-[15px] text-steel font-light mt-2 max-w-xl">
              Pre-matched pairs of research compounds, supplied together for paired in-vitro studies. Save {MAX_BUNDLE_DISCOUNT}% when you buy a set — applied automatically in your cart.
            </p>
          </div>
        </div>
        <BundlesSection />
      </main>
      <Footer />
    </>
  )
}