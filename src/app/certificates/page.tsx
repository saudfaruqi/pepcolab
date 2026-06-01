'use client'
'use client'
import AnnouncementBar from '@/components/AnnouncementBar'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { PRODUCTS } from '@/app/data'
import { Download, CheckCircle2, Search } from 'lucide-react'

export default function CertificatesPage() {
  return (
    <>
      
      <Nav />
      <main>
        {/* Hero */}
        <div className="border-b border-border bg-ink text-white py-14 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-blue-400 mb-3">Transparency</div>
            <h1 className="font-serif text-[44px] tracking-[-1.5px] text-white mb-4">COA Library</h1>
            <p className="text-[15px] text-gray-400 font-light max-w-xl mb-8">
              Every batch certificate, publicly searchable. Enter a lot number to retrieve the full Certificate of Analysis, HPLC trace, and mass spec report.
            </p>
            <div className="flex max-w-xl gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  placeholder="Enter lot number, e.g. PEP-2412-07"
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-[8px] text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </div>
              <button className="flex items-center gap-2 bg-blue-600 text-white text-[13px] font-medium px-6 py-3 rounded-[8px] hover:bg-blue-700 transition-colors">
                Verify
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="text-[13px] font-medium text-ink mb-4">{PRODUCTS.length} certificates published</div>
          <div className="border border-border rounded-[14px] overflow-hidden">
            <table className="w-full">
              <thead className="bg-canvas-off border-b border-border">
                <tr>
                  {['Product', 'Lot Number', 'Purity', 'Test Date', 'Lab', 'Status', 'Download'].map(h => (
                    <th key={h} className="text-left text-[11px] font-medium tracking-[0.6px] uppercase text-steel-light px-5 py-3.5 first:rounded-tl-[14px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p, i) => (
                  <tr key={p.id} className={`border-b border-border-light last:border-none ${i % 2 === 0 ? '' : 'bg-canvas-off/50'}`}>
                    <td className="px-5 py-3.5">
                      <div className="text-[13px] font-medium text-ink">{p.name}</div>
                      <div className="text-[11px] text-steel-light">{p.category}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[12px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{p.lot}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-medium text-green-600">{p.purity}%</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-steel">{p.testDate}</td>
                    <td className="px-5 py-3.5 text-[13px] text-steel">Eurofins UK</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                        <CheckCircle2 size={12} /> Pass
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="flex items-center gap-1 text-[12px] text-blue-600 hover:text-blue-700 font-medium">
                        <Download size={13} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
