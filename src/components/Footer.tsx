'use client'
'use client'
import { Phone, Mail, MapPin, Youtube, Instagram, Twitter, Linkedin, Facebook } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
      <footer style={{ background:"#0d0d0d", padding:"clamp(40px,6vw,64px) clamp(20px,5vw,64px) 40px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
              {/* ── Footer ── */}
        <div style={{ maxWidth:1400, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:48, marginBottom:64 }}>
            <div>
              <div style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:"#fff", marginBottom:16 }}>Pepco<em style={{ fontStyle:"italic", color:"rgba(255,255,255,.35)" }}>Lab</em></div>
              <p style={{ fontSize:12.5, color:"rgba(255,255,255,.35)", lineHeight:1.75, maxWidth:280, margin:"0 0 16px" }}>Research-grade peptides, independently verified by Eurofins UK. Every batch, every time.</p>
              {/* Legal disclaimer in footer */}
              <p style={{ fontSize:11, color:"rgba(255,255,255,.2)", lineHeight:1.7, margin:"0 0 16px", fontStyle:"italic" }}>
                All products are sold strictly for research purposes only and are not intended for human consumption, diagnosis, treatment, or prevention of any condition or disease.
              </p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={{ background:"rgba(255,255,255,.07)", color:"rgba(255,255,255,.4)", fontSize:10, fontWeight:600, letterSpacing:".08em", padding:"6px 12px", borderRadius:4 }}>HPLC Verified</span>
                <span style={{ background:"rgba(255,255,255,.07)", color:"rgba(255,255,255,.4)", fontSize:10, fontWeight:600, letterSpacing:".08em", padding:"6px 12px", borderRadius:4 }}>Eurofins UK</span>
              </div>
            </div>
            {[
              { title:"Products", links:["BPC-157","TB-500","GLP-1 (Tera)","GHK-Cu","CJC-1295","Ipamorelin"] },
              { title:"Research", links:["COA Library","Batch Verifier","Research Guides","Lab Reports","HPLC Results"] },
              { title:"Company",  links:["About Us","Contact","Shipping Policy","Returns","Privacy Policy","Terms"] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginBottom:16 }}>{col.title}</div>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ display:"block", fontSize:13, color:"rgba(255,255,255,.45)", textDecoration:"none", marginBottom:8, lineHeight:1.5, transition:"color .15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color="#fff"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,.45)"}>{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,.07)", paddingTop:28, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <span style={{ fontSize:11.5, color:"rgba(255,255,255,.2)" }}>© 2024 PepcoLab Ltd. All rights reserved. For research use only. Not for human consumption.</span>
            <span style={{ fontSize:11.5, color:"rgba(255,255,255,.2)" }}>Registered in England & Wales · UK supplier</span>
          </div>
        </div>
      </footer>
  )
}