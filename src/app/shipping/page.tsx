'use client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Truck,
  Globe,
  Clock3,
  Package,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'

const SHIPPING_INFO = [
{
icon: Clock3,
title: 'Fast Dispatch',
text: 'Most orders are processed and dispatched within 1 business day following payment confirmation and verification.',
},
{
icon: Truck,
title: 'Tracked Delivery',
text: 'All eligible shipments include tracking information, allowing customers to monitor delivery progress in real time.',
},
{
icon: Globe,
title: 'International Shipping',
text: 'International availability varies by jurisdiction. Customers remain responsible for import compliance and local regulations.',
},
{
icon: ShieldCheck,
title: 'Secure Packaging',
text: 'Orders are packaged using protective shipping materials designed to maintain product integrity throughout transit.',
},
]

const POLICY_SECTIONS = [
{
title: 'Order Processing & Dispatch',
content: [
'Orders are generally processed within one (1) business day following successful payment authorization and order verification.',
'Orders placed after business hours, during weekends, or on public holidays will be processed on the next available business day.',
'During periods of unusually high demand, promotional events, inventory audits, severe weather conditions, or carrier disruptions, processing times may be extended.',
'PepcoLab reserves the right to conduct additional order verification procedures prior to dispatch where necessary for fraud prevention or compliance purposes.',
],
},
{
title: 'Shipping Methods & Tracking',
content: [
'Orders are shipped using reputable domestic and international courier partners selected based on destination, service availability, and operational reliability.',
'Tracking details are provided via email once an order has been dispatched.',
'Delivery estimates displayed during checkout are provided for guidance only and do not constitute guaranteed delivery dates.',
'Shipping timelines begin upon dispatch, not at the time an order is placed.',
],
},
{
title: 'International Shipping & Customs',
content: [
'Customers are solely responsible for ensuring products may be legally imported, possessed, stored, and used within their jurisdiction.',
'Any customs duties, import taxes, VAT, brokerage fees, inspection fees, or other governmental charges are the responsibility of the recipient unless explicitly stated otherwise.',
'PepcoLab cannot guarantee customs clearance and accepts no responsibility for delays, inspections, holds, confiscations, or refusals imposed by customs authorities.',
'Failure to comply with local import regulations does not qualify an order for refund or replacement.',
],
},
{
title: 'Delivery Estimates',
content: [
'Estimated delivery windows vary depending on destination, shipping service selected, customs procedures, and carrier performance.',
'Delivery estimates should not be interpreted as guaranteed arrival dates.',
'Unexpected events including weather conditions, transportation disruptions, customs inspections, public holidays, labor disputes, or force majeure events may affect transit times.',
],
},
{
title: 'Address Accuracy',
content: [
'Customers are responsible for providing complete and accurate shipping information at checkout.',
'PepcoLab shall not be responsible for delays, losses, or additional shipping costs arising from incorrect addresses, incomplete information, or failed delivery attempts.',
'Orders that have already entered the shipping process may not be eligible for address modifications.',
],
},
{
title: 'Lost, Damaged, or Missing Shipments',
content: [
'Customers must notify our support team promptly if a shipment appears lost, damaged, incomplete, or delivered in unsatisfactory condition.',
'Photographic evidence of packaging, shipping labels, and product contents may be required to initiate an investigation.',
'Claims are subject to review and carrier verification procedures.',
'Resolution timeframes vary depending on courier investigations and claim processing requirements.',
],
},
{
title: 'Failed Deliveries & Returned Packages',
content: [
'Packages returned due to failed delivery attempts, refusal of delivery, customs rejection, or incorrect address information may be subject to additional shipping charges.',
'Refunds for returned shipments may be reduced by original shipping costs, carrier fees, customs charges, or administrative expenses where legally permitted.',
'PepcoLab reserves the right to determine eligibility for reshipment on a case-by-case basis.',
],
},
{
title: 'Research Use Notice',
content: [
'Products supplied by PepcoLab are intended exclusively for laboratory research, analytical, and scientific purposes.',
'Products are not intended for human consumption, therapeutic use, veterinary use, medical procedures, or diagnostic applications.',
'Customers are responsible for ensuring products are handled, stored, and utilized in accordance with applicable regulations and accepted laboratory practices.',
],
},
{
title: 'Force Majeure',
content: [
'PepcoLab shall not be liable for delays, interruptions, or failures in shipment resulting from circumstances beyond our reasonable control.',
'Such events may include natural disasters, severe weather, pandemics, governmental actions, customs inspections, transportation disruptions, cyber incidents, labor disputes, supply chain interruptions, or carrier service failures.',
],
},
]


export default function ShippingPolicyPage() {
  return (
    <>
      <Nav />

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-[#f7f6f3]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-4">
              Shipping Policy
            </div>

            <h1 className="font-serif text-[clamp(48px,8vw,84px)] tracking-[-0.06em] leading-none text-neutral-950 mb-8">
              Shipping &
              <br />
              Delivery
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-neutral-600">
              Information regarding order processing, dispatch times,
              delivery estimates, tracking, and international shipping.
            </p>
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
            <div className="grid md:grid-cols-2 gap-6">
              {SHIPPING_INFO.map(item => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="border border-neutral-200 rounded-3xl p-8"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                      <Icon size={20} />
                    </div>

                    <h3 className="text-xl font-semibold text-neutral-950 mb-3">
                      {item.title}
                    </h3>

                    <p className="text-neutral-600 leading-7">
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Policy Sections */}
        <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-24">
            <div className="space-y-20">
            {POLICY_SECTIONS.map((section) => (
                <div key={section.title}>
                <h2 className="font-serif text-4xl tracking-[-0.04em] text-neutral-950 mb-6">
                    {section.title}
                </h2>

                <div className="space-y-5">
                    {section.content.map((paragraph, index) => (
                    <p
                        key={index}
                        className="text-neutral-600 leading-8 text-[15px]"
                    >
                        {paragraph}
                    </p>
                    ))}
                </div>
                </div>
            ))}
            </div>
        </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950 text-white">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <Package
              size={42}
              className="mx-auto mb-8 opacity-70"
            />

            <h2 className="font-serif text-5xl tracking-[-0.05em] mb-6">
              Need shipping assistance?
            </h2>

            <p className="max-w-2xl mx-auto text-white/60 leading-8 mb-10">
              If you have questions about delivery times, tracking,
              international shipping, or a current order, our support
              team is available to help.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-white text-neutral-950 px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition"
            >
              Contact Support
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}