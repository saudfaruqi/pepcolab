'use client'
import { useRef, useEffect } from 'react'
import { ArrowRight, Clock } from 'lucide-react'

const POSTS = [
  {
    date: 'Apr 20, 2026',
    readTime: '6 min read',
    title: 'Vitamins 101 — What Every Adult Should Take Daily',
    excerpt: 'Understanding the essential vitamins your body needs and how research-grade supplements can support your health journey.',
    tag: 'Wellness',
    img: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80&auto=format&fit=crop',
    color: '#EBF2FF',
    tagColor: '#1A56DB',
  },
  {
    date: 'Apr 18, 2026',
    readTime: '8 min read',
    title: 'Prescription vs OTC: What\'s the Real Difference?',
    excerpt: 'Breaking down how prescription medications differ from over-the-counter options, and why it matters for your health.',
    tag: 'Education',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80&auto=format&fit=crop',
    color: '#E6F5EE',
    tagColor: '#0A7B45',
  },
  {
    date: 'Apr 15, 2026',
    readTime: '5 min read',
    title: 'Top 7 Allergy Relief Medicines That Actually Work',
    excerpt: 'Our pharmacists review the most effective evidence-based allergy treatments available for fast, reliable relief.',
    tag: 'Allergy',
    img: 'https://images.unsplash.com/photo-1576671414121-aa2d60f06f93?w=400&q=80&auto=format&fit=crop',
    color: '#FFF0F5',
    tagColor: '#BE185D',
  },
]

export default function BlogSection() {
  const headRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const animate = (el: HTMLElement | null, delay = 0) => {
      if (!el) return
      el.style.opacity = '0'
      el.style.transform = 'translateY(20px)'
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
            el.style.opacity = '1'
            el.style.transform = 'translateY(0)'
          }, delay)
          obs.disconnect()
        }
      }, { threshold: 0.1 })
      obs.observe(el)
    }
    animate(headRef.current, 0)
    animate(gridRef.current, 100)
  }, [])

  return (
    <section className="py-16 lg:py-22 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        <div ref={headRef} className="flex items-center justify-between mb-9">
          <div>
            <p className="section-label mb-1.5">From the lab</p>
            <h2
              className="text-[clamp(24px,3.2vw,36px)] font-bold tracking-tight text-[var(--ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Everyday Health Blog
            </h2>
          </div>
          <a href="/blog" className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[var(--blue)] hover:text-[var(--blue-dark)] transition-colors">
            See All <ArrowRight size={14} />
          </a>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {POSTS.map((post) => (
            <a
              key={post.title}
              href="/blog"
              className="group card flex flex-col overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-[var(--gray-100)]">
                <img
                  src={post.img}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                  style={{ background: post.color, color: post.tagColor }}
                >
                  {post.tag}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-3 text-[11px] text-[var(--ink-40)] font-medium">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
                </div>

                <h3 className="text-[14.5px] font-bold text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors leading-snug">
                  {post.title}
                </h3>

                <p className="text-[12.5px] text-[var(--ink-60)] leading-relaxed flex-1">{post.excerpt}</p>

                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--blue)] group-hover:gap-2.5 transition-all mt-1">
                  Read more <ArrowRight size={12} />
                </div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}