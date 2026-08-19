'use client'
import { ArrowRight, Calculator, FileSearch, BookOpen, FlaskConical } from 'lucide-react'

// FIX: three of the five cards here linked to routes that don't exist
// (/tools/calculator, /tools/batch-verifier, /tools/compare,
// /tools/dosage-reference — none of them present under app/tools). Only
// the dedicated reconstitution-calculator route and /research were real.
// The batch verifier, dose calculator, and purity calculator are all real
// tools, but they live as widgets on the /tools hub page
// (components/ToolWidgets.tsx), not on their own URLs — so those cards
// now point there instead of 404ing. The unbuilt "Peptide Comparator" and
// standalone "Dosage Reference" cards are removed rather than left as
// dead links; add them back once those pages actually exist.
const TOOLS = [
  {
    icon: Calculator,
    name: 'Reconstitution Calculator',
    desc: 'Instantly compute exact dilution volumes for any peptide. Enter your vial size, concentration target, and solvent — get precise measurements.',
    href: '/tools/reconstitution-calculator',
    tag: 'Interactive',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: FileSearch,
    name: 'Batch Verifier',
    desc: 'Look up any PepcoLab lot number and retrieve the full Certificate of Analysis and HPLC purity data instantly.',
    href: '/tools#batch-verifier',
    tag: 'Live data',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: FlaskConical,
    name: 'Dose & Purity Calculators',
    desc: 'Additional reference calculators for common peptide parameters, alongside the full reconstitution tool.',
    href: '/tools',
    tag: 'Reference',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: BookOpen,
    name: 'Research Hub',
    desc: 'Curated guides, storage protocols, reconstitution methods, and links to published research for each peptide in our catalogue.',
    href: '/research',
    tag: 'Education',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
]

export default function ToolsSection() {
  return (
    <section className="py-16 px-6 lg:px-12 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-steel-light mb-2">
              Research tools
            </div>
            <h2 className="font-serif text-[38px] lg:text-[44px] leading-[1.05] tracking-[-1.2px] text-ink mb-3">
              Built for <em className="text-blue-600">serious</em> researchers.
            </h2>
            <p className="text-[15px] text-steel font-light leading-[1.75] max-w-[500px]">
              We built a suite of tools that goes beyond a product catalogue — calculators, batch verification, and a full research library.
            </p>
          </div>
          <div className="flex-shrink-0">
            {/* FIX: was a non-interactive <div> styled as a button — looked
               clickable, went nowhere. */}
            <a
              href="/tools"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-[13px] font-medium px-5 py-2.5 rounded-[8px] hover:bg-blue-700 transition-colors btn-press cursor-pointer"
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
                className="research-card bg-white border border-border rounded-[14px] p-6 flex flex-col gap-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 ${tool.bg} rounded-[10px] flex items-center justify-center flex-shrink-0`}>
                    <Icon size={19} className={tool.color} strokeWidth={1.5} />
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${tool.bg} ${tool.color}`}>
                    {tool.tag}
                  </span>
                </div>
                <div>
                  <div className="text-[15px] font-semibold tracking-tight text-ink mb-2 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </div>
                  <p className="text-[13px] text-steel font-light leading-[1.7]">
                    {tool.desc}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-[12px] font-medium mt-auto ${tool.color} group-hover:gap-2 transition-all`}>
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
