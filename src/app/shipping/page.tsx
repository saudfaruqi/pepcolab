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
    title: 'Order Processing',
    text: 'Orders are typically processed within 1 business day. Orders placed on weekends or public holidays are processed on the next business day.',
  },
  {
    icon: Truck,
    title: 'Tracked Delivery',
    text: 'All shipments are dispatched using tracked courier services. Tracking information is provided once your order has been fulfilled.',
  },
  {
    icon: Globe,
    title: 'International Shipping',
    text: 'Shipping availability varies by destination. Customers are responsible for ensuring products can be legally imported into their jurisdiction.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Packaging',
    text: 'Orders are packaged securely to help protect product integrity during transit.',
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
            <div className="space-y-16">
              <div>
                <h2 className="font-serif text-4xl tracking-tight text-neutral-950 mb-6">
                  Processing Times
                </h2>

                <div className="space-y-5 text-neutral-600 leading-8">
                  <p>
                    Orders are normally processed within one business day
                    after payment confirmation.
                  </p>

                  <p>
                    During periods of increased demand, product launches,
                    or public holidays, processing times may be extended.
                  </p>

                  <p>
                    Orders are not processed or dispatched on weekends or
                    public holidays.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-serif text-4xl tracking-tight text-neutral-950 mb-6">
                  Shipping Methods
                </h2>

                <div className="space-y-5 text-neutral-600 leading-8">
                  <p>
                    We use reputable courier and postal services depending
                    on destination and service availability.
                  </p>

                  <p>
                    Once your order has been dispatched, you will receive
                    tracking information where applicable.
                  </p>

                  <p>
                    Delivery estimates are provided as guidelines only and
                    are not guaranteed.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-serif text-4xl tracking-tight text-neutral-950 mb-6">
                  International Orders
                </h2>

                <div className="space-y-5 text-neutral-600 leading-8">
                  <p>
                    International customers are responsible for ensuring
                    that products can legally be imported into their country
                    or region.
                  </p>

                  <p>
                    Customs duties, taxes, import fees, and regulatory
                    charges are the responsibility of the customer unless
                    otherwise stated.
                  </p>

                  <p>
                    We are not responsible for delays caused by customs
                    inspections, local postal services, or import authorities.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-serif text-4xl tracking-tight text-neutral-950 mb-6">
                  Delivery Delays
                </h2>

                <div className="space-y-5 text-neutral-600 leading-8">
                  <p>
                    Delivery estimates may be affected by severe weather,
                    customs processing, transportation disruptions, public
                    holidays, or carrier delays.
                  </p>

                  <p>
                    While we work closely with shipping partners, we cannot
                    guarantee delivery timelines once a package has entered
                    the courier network.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-serif text-4xl tracking-tight text-neutral-950 mb-6">
                  Lost or Damaged Shipments
                </h2>

                <div className="space-y-5 text-neutral-600 leading-8">
                  <p>
                    If your order arrives damaged or appears lost in transit,
                    please contact our support team as soon as possible.
                  </p>

                  <p>
                    Claims may require photographs of packaging, shipping
                    labels, and product contents for investigation.
                  </p>

                  <p>
                    Resolution timelines depend on the shipping carrier's
                    claims process.
                  </p>
                </div>
              </div>
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