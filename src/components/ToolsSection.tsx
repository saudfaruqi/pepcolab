'use client'
import { ArrowRight, Calculator, FileSearch, BookOpen, FlaskConical } from 'lucide-react'

const TOOLS = [
  {
    icon: Calculator,
    name: 'Reconstitution Calculator',
    desc: 'Instantly compute exact dilution volumes for any peptide. Enter your vial size, concentration target, and solvent — get precise measurements.',
    href: '/tools/reconstitution-calculator',
    tag: 'Interactive',
  },
  {
    icon: FileSearch,
    name: 'Batch Verifier',
    desc: 'Look up any PepcoLab lot number and retrieve the full Certificate of Analysis and HPLC purity data instantly.',
    href: '/tools#batch-verifier',
    tag: 'Live data',
  },
  {
    icon: FlaskConical,
    name: 'Dose & Purity Calculators',
    desc: 'Additional reference calculators for common peptide parameters, alongside the full reconstitution tool.',
    href: '/tools',
    tag: 'Reference',
  },
  {
    icon: BookOpen,
    name: 'Research Hub',
    desc: 'Curated guides, storage protocols, reconstitution methods, and links to published research for each peptide in our catalogue.',
    href: '/research',
    tag: 'Education',
  },
]

export default function ToolsSection() {
  return (
    <section className="py-16 px-6 lg:px-12 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <p className="section-label mb-2">Research tools</p>
            <h2
              className="font-serif text-[38px] lg:text-[44px] leading-[1.05] tracking-[-1.2px] text-[var(--ink)] mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Built for <em style={{ fontStyle: 'italic' }}>serious</em> researchers.
            </h2>
            <p className="text-[15px] text-[var(--ink-60)] font-light leading-[1.75] max-w-[500px]">
              We built a suite of tools that goes beyond a product catalogue — calculators, batch verification, and a full research library.
            </p>
          </div>
          <div className="flex-shrink-0">
            <a
              href="/tools"
              className="inline-flex items-center gap-2 text-white text-[13px] font-medium px-5 py-2.5 rounded-[8px] transition-colors btn-press cursor-pointer"
              style={{ background: 'var(--ink)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-80)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--ink)')}
            >
              Explore all tools <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <a
                key={tool.name}
                href={tool.href}
                className="research-card bg-white border border-[var(--border)] rounded-[14px] p-6 flex flex-col gap-4 group hover:border-[var(--ink-40)] hover:shadow-[0_6px_24px_rgba(13,15,20,0.08)] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-200"
                    style={{ background: 'var(--gray-100)' }}
                  >
                    <Icon size={19} className="text-[var(--ink)]" strokeWidth={1.5} />
                  </div>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full text-[var(--ink-60)]"
                    style={{ background: 'var(--gray-100)' }}
                  >
                    {tool.tag}
                  </span>
                </div>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight text-[var(--ink)] mb-2 transition-colors">
                    {tool.name}
                  </div>
                  <p className="text-[13px] text-[var(--ink-60)] font-light leading-[1.7]">
                    {tool.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[12px] font-medium mt-auto text-[var(--ink)] group-hover:gap-2 transition-all">
                  Open tool <ArrowRight size={12} />
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}