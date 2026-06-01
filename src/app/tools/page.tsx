'use client'
import { useState } from 'react'
import AnnouncementBar from '@/components/AnnouncementBar'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { Calculator, Search, Bot, GitCompare } from 'lucide-react'

function ReconstitutionCalc() {
  const [peptide, setPeptide] = useState('')
  const [targetConc, setTargetConc] = useState('')
  const [volume, setVolume] = useState<number | null>(null)

  const calculate = () => {
    const mg = parseFloat(peptide)
    const conc = parseFloat(targetConc)
    if (mg && conc) {
      setVolume((mg * 1000) / conc)
    }
  }

  return (
    <div className="bg-white border border-border rounded-[16px] p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-[10px] flex items-center justify-center">
          <Calculator size={19} className="text-blue-600" />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-ink">Reconstitution Calculator</div>
          <div className="text-[12px] text-steel-light">Calculate solvent volume for any concentration</div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-[12px] font-medium text-ink mb-1.5">Peptide amount (mg)</label>
          <input type="number" value={peptide} onChange={e => setPeptide(e.target.value)} placeholder="e.g. 5" className="w-full text-[13px] px-3.5 py-2.5 border border-border rounded-[8px] bg-canvas-off focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-ink mb-1.5">Target concentration (mcg/mL)</label>
          <input type="number" value={targetConc} onChange={e => setTargetConc(e.target.value)} placeholder="e.g. 1000" className="w-full text-[13px] px-3.5 py-2.5 border border-border rounded-[8px] bg-canvas-off focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>
      <button onClick={calculate} className="w-full bg-blue-600 text-white text-[13px] font-medium py-2.5 rounded-[8px] hover:bg-blue-700 transition-colors btn-press mb-5">
        Calculate
      </button>
      {volume !== null && (
        <div className="bg-blue-50 border border-blue-100 rounded-[10px] p-4 text-center">
          <div className="text-[13px] text-blue-600 font-medium mb-1">Add this volume of bacteriostatic water:</div>
          <div className="text-[36px] font-semibold tracking-tight text-blue-700">{volume.toFixed(2)} <span className="text-[18px]">mL</span></div>
          <div className="text-[12px] text-blue-500 mt-1">= {(volume * 1000).toFixed(0)} µL</div>
        </div>
      )}
    </div>
  )
}

export default function ToolsPage() {
  return (
    <>
      
      <Nav />
      <main>
        <div className="border-b border-border bg-canvas-warm py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-steel-light mb-2">Research tools</div>
            <h1 className="font-serif text-[44px] tracking-[-1.5px] text-ink">Tools & Calculators</h1>
            <p className="text-[15px] text-steel font-light mt-2 max-w-xl">Interactive research tools built for lab professionals.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
          <div className="grid lg:grid-cols-2 gap-6">
            <ReconstitutionCalc />
            {/* Batch verifier */}
            <div className="bg-white border border-border rounded-[16px] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-[10px] flex items-center justify-center">
                  <Search size={19} className="text-green-600" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-ink">Batch Verifier</div>
                  <div className="text-[12px] text-steel-light">Look up any lot number instantly</div>
                </div>
              </div>
              <label className="block text-[12px] font-medium text-ink mb-1.5">Lot number</label>
              <input type="text" placeholder="e.g. PEP-2412-07" className="w-full text-[13px] px-3.5 py-2.5 border border-border rounded-[8px] bg-canvas-off mb-4 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
              <button className="w-full bg-green-600 text-white text-[13px] font-medium py-2.5 rounded-[8px] hover:bg-green-700 transition-colors btn-press">
                Verify Batch
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
