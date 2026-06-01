import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AnnouncementBar from '@/components/AnnouncementBar'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      
      <Nav />
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="text-[80px] font-serif text-border mb-4">404</div>
        <h1 className="font-serif text-[32px] tracking-tight text-ink mb-3">Page not found</h1>
        <p className="text-[15px] text-steel font-light max-w-sm mb-8">
          The page you're looking for doesn't exist. It may have moved or been removed.
        </p>
        <div className="flex gap-3">
          <a href="/" className="flex items-center gap-2 bg-ink text-white text-[13px] font-medium px-5 py-3 rounded-[8px] hover:bg-ink-soft transition-colors btn-press group">
            Back to home <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a href="/products" className="text-[13px] text-steel px-5 py-3 rounded-[8px] border border-border hover:bg-canvas-off transition-colors">
            Browse products
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
