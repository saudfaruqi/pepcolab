'use client'
'use client'
import { Download, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'

const COA_ROWS = [
  { label: 'Lot number', value: 'PEP-2412-07', type: 'badge' },
  { label: 'Peptide', value: 'GLP-1 (Tera) 5mg', type: 'normal' },
  { label: 'Purity (HPLC)', value: '99.1%', type: 'good' },
  { label: 'Mass spec', value: 'Confirmed ✓', type: 'good' },
  { label: 'Endotoxin', value: '<1 EU/mg', type: 'good' },
  { label: 'Moisture', value: '4.2%', type: 'normal' },
  { label: 'Test date', value: 'April 2025', type: 'normal' },
  { label: 'Testing lab', value: 'Eurofins UK (3rd party)', type: 'normal' },
]

export default function COASection() {
  return (
    <section className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <div>
            <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-blue-400 mb-4">
              Full transparency
            </div>
            <h2 className="font-serif text-[42px] lg:text-[50px] leading-[1.05] tracking-[-1.5px] text-white mb-5">
              Every certificate.<br />
              <em className="text-blue-400">Publicly searchable.</em>
            </h2>
            <p className="text-[15px] leading-[1.8] text-gray-400 font-light max-w-[420px] mb-8">
              We publish full Certificates of Analysis for every single batch. Search by lot number, verify purity independently, download the full HPLC trace and mass spec report. No black boxes — ever.
            </p>

            {/* What's included */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {[
                'Full HPLC chromatogram',
                'Mass spectrometry report',
                'Endotoxin test results',
                'Moisture content data',
                'Storage conditions log',
                'Chain of custody record',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-[13px] text-gray-400 font-light">
                  <CheckCircle2 size={13} className="text-blue-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/certificates"
                className="flex items-center gap-2 text-[13px] font-medium bg-white text-ink px-5 py-3 rounded-[8px] hover:bg-gray-100 transition-colors btn-press"
              >
                Search COA Library
              </a>
              <a
                href="/certificates/download"
                className="flex items-center gap-2 text-[13px] text-gray-400 px-5 py-3 rounded-[8px] border border-gray-800 hover:border-gray-600 hover:text-white transition-colors btn-press"
              >
                <Download size={14} />
                Download Lab Files
              </a>
            </div>

            {/* Stat bar */}
            <div className="flex gap-8 mt-12 pt-10 border-t border-gray-800">
              {[
                { num: '847', label: 'Certificates published' },
                { num: '100%', label: 'Batches with public COA' },
                { num: '0', label: 'Failed purity tests' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-[26px] font-semibold tracking-tight text-white">{s.num}</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — COA terminal */}
          <div>
            <div className="bg-[#0d0d0d] border border-gray-800 rounded-[16px] overflow-hidden">

              {/* Terminal top bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-800 bg-[#111]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[11px] text-gray-600 font-mono">coa-viewer · PEP-2412-07</span>
              </div>

              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] tracking-[1px] uppercase text-gray-600 mb-1 font-mono">Certificate of Analysis</div>
                    <div className="text-[15px] font-medium text-white">GLP-1 (Tera) 5mg</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] text-green-400 bg-green-950 px-2.5 py-1 rounded-full border border-green-900">
                    <CheckCircle2 size={11} />
                    Pass
                  </span>
                </div>
              </div>

              {/* Data rows */}
              <div className="px-5 py-2">
                {COA_ROWS.map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-gray-800/50 last:border-none">
                    <span className="text-[12px] text-gray-500 font-light">{row.label}</span>
                    <span className={`text-[12px] font-medium ${
                      row.type === 'good' ? 'text-green-400'
                      : row.type === 'badge' ? 'text-blue-400 font-mono text-[11px] bg-blue-950 px-2 py-0.5 rounded border border-blue-900'
                      : 'text-gray-300'
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Downloads */}
              <div className="px-5 pt-3 pb-5">
                <div className="bg-[#111] rounded-[10px] p-4 border border-gray-800">
                  <div className="text-[10px] tracking-[0.8px] uppercase text-gray-600 mb-3 font-medium">
                    Download documents
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Full COA PDF', 'HPLC Trace', 'MS Report', 'Endotoxin'].map(doc => (
                      <button
                        key={doc}
                        className="flex items-center gap-1 text-[11px] text-blue-400 bg-blue-950/50 border border-blue-900/50 px-2.5 py-1.5 rounded-[6px] hover:bg-blue-900/50 transition-colors"
                      >
                        <Download size={10} />
                        {doc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <div className="px-5 pb-4 flex items-start gap-2">
                <AlertCircle size={11} className="text-gray-700 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-700 leading-[1.6]">
                  All testing conducted by Eurofins Scientific UK, an independent accredited laboratory. PepcoLab has no influence over test results.
                </p>
              </div>
            </div>

            {/* Batch search */}
            <div className="mt-4 bg-[#0d0d0d] border border-gray-800 rounded-[12px] p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[10px] text-gray-600 mb-1 font-mono tracking-wide">SEARCH BY LOT NUMBER</div>
                <input
                  type="text"
                  placeholder="e.g. PEP-2412-07"
                  className="w-full bg-transparent text-[13px] text-gray-300 placeholder:text-gray-700 font-mono focus:outline-none"
                />
              </div>
              <button className="text-[12px] font-medium bg-blue-600 text-white px-4 py-2 rounded-[7px] hover:bg-blue-700 transition-colors flex-shrink-0">
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
