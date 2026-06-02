'use client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { FileText, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react'

export default function TermsPage() {
  return (
    <>
      <Nav />

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-[#f7f6f3]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-4">
              Legal
            </div>

            <h1 className="font-serif text-[clamp(48px,8vw,84px)] tracking-[-0.06em] leading-none text-neutral-950 mb-8">
              Terms &
              <br />
              Conditions
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-neutral-600">
              These terms govern the use of our website, services, and
              products. By accessing our platform, you agree to these terms.
            </p>
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 grid md:grid-cols-2 gap-6">
            {[
              {
                icon: FileText,
                title: 'User Agreement',
                text: 'By using this site, you agree to comply with all applicable terms and conditions.',
              },
              {
                icon: ShieldCheck,
                title: 'Responsible Use',
                text: 'Products are intended strictly for laboratory and research purposes only.',
              },
              {
                icon: AlertTriangle,
                title: 'Limitation of Liability',
                text: 'We are not liable for misuse, improper handling, or unauthorized application of products.',
              },
              {
                icon: FileText,
                title: 'Policy Updates',
                text: 'We may update these terms at any time without prior notice.',
              },
            ].map(item => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="border border-neutral-200 rounded-3xl p-8"
                >
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                    <Icon size={20} />
                  </div>

                  <h3 className="text-xl font-semibold mb-3">
                    {item.title}
                  </h3>

                  <p className="text-neutral-600 leading-7">
                    {item.text}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Terms content */}
        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-6 py-24 space-y-14 text-neutral-600 leading-8">
            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Research Use Only
              </h2>
              <p>
                All products are intended strictly for laboratory research
                purposes only. They are not intended for human or veterinary use.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Eligibility
              </h2>
              <p>
                By purchasing from this site, you confirm that you are at least
                18 years of age and legally permitted to purchase research
                materials in your jurisdiction.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Orders & Payments
              </h2>
              <p>
                We reserve the right to refuse or cancel orders at our
                discretion. Pricing and availability are subject to change
                without notice.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Shipping & Risk
              </h2>
              <p>
                Risk transfers to the buyer once the order is handed to the
                shipping carrier. Delivery times are estimates only.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Intellectual Property
              </h2>
              <p>
                All website content, branding, and materials are owned by us and
                may not be copied or redistributed without permission.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Changes to Terms
              </h2>
              <p>
                We may update these Terms & Conditions at any time. Continued
                use of the website constitutes acceptance of any changes.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-neutral-950 text-white">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <h2 className="font-serif text-5xl mb-6">
              Need clarification?
            </h2>

            <p className="text-white/60 max-w-2xl mx-auto mb-10 leading-8">
              If you have questions about our terms, compliance, or usage
              policies, our team is available to help.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-white text-neutral-950 px-8 py-4 rounded-full"
            >
              Contact Support <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}