'use client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
FileText,
ShieldCheck,
AlertTriangle,
Scale,
Truck,
ArrowRight,
} from 'lucide-react'

export default function TermsPage() {
const highlights = [
{
icon: FileText,
title: 'Research Use Only',
text: 'All products sold by PepcoLab are supplied exclusively for laboratory research purposes and are not intended for human or veterinary use.',
},
{
icon: ShieldCheck,
title: 'Compliance & Eligibility',
text: 'Customers are responsible for ensuring compliance with all applicable local laws, regulations, and import requirements.',
},
{
icon: AlertTriangle,
title: 'Liability Limitations',
text: 'PepcoLab shall not be liable for misuse, improper handling, unauthorized applications, or regulatory non-compliance.',
},
{
icon: Scale,
title: 'Legal Agreement',
text: 'By accessing this website or placing an order, you agree to be legally bound by these Terms and Conditions.',
},
]

return (
<> <Nav />

  <main className="bg-white">
    {/* Hero */}
    <section className="border-b border-neutral-200 bg-[#f7f6f3]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-500 mb-4">
          Legal Information
        </div>

        <h1 className="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[-0.06em] text-neutral-950 mb-8">
          Terms &
          <br />
          Conditions
        </h1>

        <p className="max-w-3xl text-neutral-600 text-lg leading-8">
          These Terms and Conditions govern access to and use of the
          PepcoLab website, products, services, and related materials.
          By accessing this website, creating an account, or placing an
          order, you acknowledge that you have read, understood, and
          agree to be bound by these Terms.
        </p>

        <div className="mt-8 text-sm text-neutral-500">
          Last Updated: July 2026
        </div>
      </div>
    </section>

    {/* Highlights */}
    <section className="border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20 grid md:grid-cols-2 gap-6">
        {highlights.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="rounded-3xl border border-neutral-200 bg-white p-8"
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
    </section>

    {/* Terms Content */}
    <section>
      <div className="max-w-5xl mx-auto px-6 py-16 lg:py-24">

        <div className="space-y-16">

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              1. Acceptance of Terms
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                These Terms and Conditions constitute a legally binding
                agreement between you ("Customer", "User", "Researcher")
                and PepcoLab ("Company", "we", "our", "us").
              </p>

              <p>
                By accessing our website, browsing our catalog, creating
                an account, submitting inquiries, or purchasing products,
                you agree to comply with these Terms and all applicable
                laws and regulations.
              </p>

              <p>
                If you do not agree with any portion of these Terms,
                you must discontinue use of the website immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              2. Research Use Only
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                All products sold by PepcoLab are supplied strictly for
                laboratory research, analytical testing, educational,
                and scientific investigation purposes only.
              </p>

              <p>
                Products are not intended for:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Human consumption or administration</li>
                <li>Veterinary use</li>
                <li>Medical treatment or therapeutic applications</li>
                <li>Diagnostic procedures</li>
                <li>Food, cosmetic, or agricultural use</li>
              </ul>

              <p>
                Customers acknowledge that all products must be handled
                exclusively by qualified professionals operating within
                appropriate research environments.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              3. Eligibility & Compliance
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                By placing an order, you represent and warrant that:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>You are at least 18 years of age.</li>
                <li>You are legally permitted to purchase research materials.</li>
                <li>You understand the intended use restrictions.</li>
                <li>You will comply with all applicable local laws and regulations.</li>
                <li>You possess the necessary expertise to handle research compounds safely.</li>
              </ul>

              <p>
                Customers are solely responsible for determining whether
                products may be legally imported, possessed, stored, or
                utilized within their jurisdiction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              4. Product Information & Specifications
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                Product descriptions, specifications, purity values,
                analytical data, batch information, and Certificates of
                Analysis are provided for informational purposes only.
              </p>

              <p>
                While we strive to ensure accuracy, PepcoLab does not
                guarantee that all website content is error-free,
                complete, or continuously available.
              </p>

              <p>
                Product specifications may change without prior notice
                due to manufacturing, testing, or regulatory updates.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              5. Orders, Pricing & Payments
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                All orders are subject to review, acceptance, and stock
                availability.
              </p>

              <p>
                PepcoLab reserves the right to:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Refuse or cancel any order.</li>
                <li>Limit quantities purchased.</li>
                <li>Correct pricing or website errors.</li>
                <li>Request additional verification before fulfillment.</li>
              </ul>

              <p>
                Prices displayed on the website may be modified at any
                time without notice.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              6. Shipping & Delivery
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                Shipping estimates are provided for convenience only and
                do not constitute guaranteed delivery dates.
              </p>

              <p>
                Ownership and risk of loss transfer to the customer upon
                delivery of products to the shipping carrier.
              </p>

              <p>
                PepcoLab shall not be responsible for delays caused by
                customs authorities, courier disruptions, weather events,
                regulatory actions, or other circumstances beyond our
                reasonable control.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              7. Returns & Refunds
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                Due to the specialized nature of research materials,
                opened, used, or improperly stored products cannot be
                returned.
              </p>

              <p>
                Customers must report damaged, missing, or incorrect
                shipments within 48 hours of delivery.
              </p>

              <p>
                Approved refunds or replacements will be processed in
                accordance with applicable consumer protection laws.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              8. Limitation of Liability
            </h2>

            <div className="space-y-5 text-neutral-600 leading-8">
              <p>
                To the maximum extent permitted by law, PepcoLab shall
                not be liable for any indirect, incidental, consequential,
                special, or punitive damages arising from:
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>Use or misuse of products.</li>
                <li>Research outcomes.</li>
                <li>Loss of profits or business interruption.</li>
                <li>Data loss or operational failures.</li>
                <li>Regulatory or compliance issues.</li>
              </ul>

              <p>
                Our total liability shall not exceed the amount paid by
                the customer for the relevant order.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              9. Intellectual Property
            </h2>

            <p className="text-neutral-600 leading-8">
              All website content, branding, graphics, product imagery,
              analytical reports, software, text, and intellectual
              property are owned by or licensed to PepcoLab and may not
              be reproduced, copied, distributed, or modified without
              prior written permission.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-4xl text-neutral-950 mb-5">
              10. Changes to These Terms
            </h2>

            <p className="text-neutral-600 leading-8">
              PepcoLab reserves the right to amend, modify, or replace
              these Terms and Conditions at any time. Continued use of
              the website following publication of updated Terms
              constitutes acceptance of those changes.
            </p>
          </section>

        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="bg-neutral-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-20 lg:py-24 text-center">
        <Truck className="mx-auto mb-6" size={34} />

        <h2 className="font-serif text-4xl lg:text-5xl mb-6">
          Questions About Our Terms?
        </h2>

        <p className="max-w-2xl mx-auto text-white/70 leading-8 mb-10">
          If you require clarification regarding product compliance,
          ordering policies, shipping procedures, or legal obligations,
          our team is available to assist.
        </p>

        <Link
          href="/contact"
          className="inline-flex items-center gap-3 bg-white text-neutral-950 px-8 py-4 rounded-full font-medium hover:bg-neutral-100 transition"
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
