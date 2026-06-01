// app/products/[slug]/page.tsx


import { PRODUCTS } from '@/app/data'
import AnnouncementBar from '@/components/AnnouncementBar'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Vial from '@/components/Vial'
import { ShoppingCart, Download, ShieldCheck, Truck, RotateCcw, ChevronRight } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return PRODUCTS.map(p => ({ slug: p.slug }))
}

export default function ProductPage({ params }: Props) {
  const product = PRODUCTS.find(p => p.slug === params.slug) || PRODUCTS[0]

  return (
    <>
      
      <Nav />
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-steel-light mb-8">
          <a href="/" className="hover:text-ink transition-colors">Home</a>
          <ChevronRight size={12} />
          <a href="/products" className="hover:text-ink transition-colors">Products</a>
          <ChevronRight size={12} />
          <span className="text-ink">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">

          {/* Left — Visual */}
          <div>
            <div
              className="rounded-[20px] flex items-center justify-center min-h-[420px] relative overflow-hidden"
              style={{ background: product.color.bg }}
            >
              <div className="flex flex-col items-center gap-4 z-10">
                <Vial fromColor={product.color.vialFrom} toColor={product.color.vialTo} mg={product.mg} size="xl" />
                <div className="text-[13px] font-semibold tracking-wide" style={{ color: product.color.accent }}>
                  {product.shortName} · {product.mg}
                </div>
              </div>

              {/* Purity badge floating */}
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-[12px] p-4 shadow-lg">
                <div className="text-[9px] font-medium tracking-[0.8px] uppercase text-steel-light mb-1">Purity</div>
                <div className="text-[24px] font-semibold tracking-tight text-ink">{product.purity}%</div>
                <div className="text-[10px]" style={{ color: product.color.accent }}>HPLC verified</div>
              </div>
            </div>

            {/* Thumbnail lot info */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Lot number', value: product.lot },
                { label: 'Test date', value: product.testDate },
                { label: 'Testing lab', value: 'Eurofins UK' },
              ].map(item => (
                <div key={item.label} className="bg-canvas-off rounded-[10px] p-3 border border-border">
                  <div className="text-[10px] text-steel-light mb-1">{item.label}</div>
                  <div className="text-[12px] font-medium text-ink">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Info */}
          <div>
            {product.badge && (
              <span
                className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-[5px] mb-4 capitalize"
                style={{ background: product.color.pill, color: product.color.pillText }}
              >
                {product.badge === 'popular' ? '🔥 Popular' : product.badge === 'new' ? '✨ New' : product.badge === 'bestseller' ? '⭐ Bestseller' : '🏷 Sale'}
              </span>
            )}

            <div className="text-[12px] text-steel-light tracking-wide uppercase font-medium mb-2">{product.category}</div>
            <h1 className="font-serif text-[42px] tracking-[-1.2px] text-ink leading-[1.05] mb-4">{product.name}</h1>
            <p className="text-[15px] text-steel font-light leading-[1.8] mb-6">{product.longDesc}</p>

            {/* Purity bar */}
            <div className="mb-6">
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="font-medium" style={{ color: product.color.accent }}>{product.purity}% purity</span>
                <span className="text-steel-light">HPLC verified · {product.testDate}</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${product.purity}%`, background: product.color.purityBar }}
                />
              </div>
            </div>

            {/* Price & stock */}
            <div className="flex items-center gap-4 mb-6">
              <div>
                {product.oldPrice && (
                  <span className="text-[14px] text-steel-light line-through mr-2">£{product.oldPrice.toFixed(2)}</span>
                )}
                <span className="text-[36px] font-semibold tracking-tight text-ink">£{product.price.toFixed(2)}</span>
              </div>
              {product.inStock ? (
                <span className="text-[12px] text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full font-medium">
                  ✓ In stock · {product.stockCount} units
                </span>
              ) : (
                <span className="text-[12px] text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full font-medium">
                  Out of stock
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-8">
              <button
                disabled={!product.inStock}
                className="flex-1 flex items-center justify-center gap-2 text-[14px] font-medium text-white py-3.5 rounded-[10px] transition-colors btn-press disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: product.color.btn }}
              >
                <ShoppingCart size={16} />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <a
                href={`/certificates?lot=${product.lot}`}
                className="flex items-center justify-center gap-2 text-[14px] font-medium text-ink px-5 py-3.5 rounded-[10px] border border-border hover:bg-canvas-off transition-colors btn-press"
              >
                <Download size={16} />
                COA
              </a>
            </div>

            {/* Trust icons */}
            <div className="grid grid-cols-3 gap-3 mb-8 p-4 bg-canvas-off rounded-[12px] border border-border">
              {[
                { icon: ShieldCheck, label: '3rd party tested', sub: 'Eurofins UK', color: 'text-blue-600' },
                { icon: Truck, label: 'Cold-chain dispatch', sub: 'Same day by 2pm', color: 'text-green-600' },
                { icon: RotateCcw, label: 'Verified COA', sub: 'Publicly searchable', color: 'text-violet-600' },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="text-center">
                  <Icon size={18} className={`${color} mx-auto mb-1`} strokeWidth={1.5} />
                  <div className="text-[11px] font-medium text-ink">{label}</div>
                  <div className="text-[10px] text-steel-light">{sub}</div>
                </div>
              ))}
            </div>

            {/* Tabs placeholder */}
            <div className="border-t border-border pt-6">
              <div className="flex gap-6 text-[13px] font-medium border-b border-border mb-4">
                {['Overview', 'Technical Specs', 'COA', 'Storage', 'Research Disclaimer'].map((tab, i) => (
                  <button
                    key={tab}
                    className={`pb-3 ${i === 0 ? 'border-b-2 border-ink text-ink' : 'text-steel-light hover:text-ink transition-colors'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="text-[13px] text-steel leading-[1.8] font-light">
                {product.longDesc}
                {product.sequence && (
                  <div className="mt-4 bg-canvas-off rounded-[10px] px-4 py-3 border border-border">
                    <div className="text-[10px] uppercase tracking-[0.8px] text-steel-light mb-1 font-medium">Sequence</div>
                    <div className="font-mono text-[12px] text-ink">{product.sequence}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
