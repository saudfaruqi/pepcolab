'use client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Clock3,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react'

const REFUND_INFO = [
  {
    icon: Clock3,
    title: 'Cancellation Window',
    text: 'Orders can be cancelled free of charge before dispatch. Once an order has shipped, it can no longer be cancelled.',
  },
  {
    icon: ShieldAlert,
    title: 'Damaged or Incorrect Items',
    text: 'Items arriving damaged, defective, or different from what was ordered are eligible for a refund or replacement.',
  },
  {
    icon: XCircle,
    title: 'Non-Returnable Items',
    text: 'For safety and integrity reasons, cold-chain research compounds cannot be returned once dispatched, except where damaged or defective.',
  },
  {
    icon: RotateCcw,
    title: 'Refund Method',
    text: 'Approved refunds are issued to the original payment method via our payment processor, STRABL. No cash or alternative-method refunds are offered.',
  },
]

const POLICY_SECTIONS = [
  {
    title: 'Order Cancellations',
    content: [
      'Orders may be cancelled free of charge at any time before they have been dispatched. To request a cancellation, contact our support team as soon as possible with your order reference.',
      'Once an order has been dispatched, it can no longer be cancelled. In this case, the order must instead be handled under the returns and refund terms set out below.',
      'PepcoLab reserves the right to cancel an order prior to dispatch at its own discretion — for example, due to a payment failure, verification concern, or stock unavailability. Where PepcoLab cancels an order, any payment collected will be refunded in full.',
    ],
  },
  {
    title: 'Failed or Incomplete Payments',
    content: [
      'Checkout is processed by our third-party payment processor, STRABL. If a payment attempt fails, is declined, or does not complete for any reason, no order is created and no charge should be applied.',
      'If you believe you were charged for an order that failed to complete, or that shows as pending or unconfirmed, contact our support team with your payment confirmation or bank statement so we can investigate with STRABL and resolve it promptly.',
      'PepcoLab does not fulfil orders that have not been confirmed as successfully paid by STRABL.',
    ],
  },
  {
    title: 'Damaged, Defective, or Incorrect Orders',
    content: [
      'If your order arrives damaged, defective, or does not match what you ordered, you are entitled to a refund or replacement.',
      'Claims must be submitted within 48 hours of delivery, together with photographic evidence of the packaging, shipping label, and affected product.',
      'Once a claim is reviewed and approved, PepcoLab will issue a full refund or dispatch a replacement, at the customer\'s preference where available.',
    ],
  },
  {
    title: 'Non-Returnable Products',
    content: [
      'Given the cold-chain, research-grade nature of our compounds, products that have left dispatch cannot be physically returned for a refund except where they arrive damaged, defective, or incorrect.',
      'Opened, used, or altered products are not eligible for return or refund unless the defect is directly attributable to PepcoLab or the carrier.',
      'This policy exists to protect the integrity and safety of all research materials in circulation and does not affect your rights under the "Damaged, Defective, or Incorrect Orders" section above.',
    ],
  },
  {
    title: 'How Refunds Are Processed',
    content: [
      'All payments are processed through STRABL. Approved refunds are issued back to the original payment method used at checkout — refunds to a different card, account, or payment method are not offered.',
      'Once approved, refunds are typically initiated within 3–5 business days. Depending on your card issuer or bank, it may take an additional 5–10 business days for the refunded amount to appear in your account.',
      'Where a refund relates to a returned or undelivered shipment, original shipping costs, customs charges, or carrier fees may be deducted where legally permitted.',
    ],
  },
  {
    title: 'How to Request a Refund or Cancellation',
    content: [
      'Contact our support team with your order reference number, the reason for your request, and any relevant photographic evidence.',
      'Our team will review your request and respond with a decision, typically within 2–3 business days.',
      'If a refund is approved, you will receive confirmation by email once it has been processed on our end. Processing times with your bank or card issuer are outside our control.',
    ],
  },
  {
    title: 'Research Use Notice',
    content: [
      'Products supplied by PepcoLab are intended exclusively for laboratory research, analytical, and scientific purposes and are not intended for human consumption, therapeutic use, or diagnostic applications.',
      'Refund and cancellation eligibility is governed solely by the terms on this page and does not extend to claims arising from use outside this intended purpose.',
    ],
  },
]

export default function RefundPolicyPage() {
  return (
    <>
      <Nav />

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-[#f7f6f3]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-4">
              Refund & Cancellation Policy
            </div>

            <h1 className="font-serif text-[clamp(48px,8vw,84px)] tracking-[-0.06em] leading-none text-neutral-950 mb-8">
              Refunds &
              <br />
              Cancellations
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-neutral-600">
              How order cancellations, refunds, and payment issues are
              handled for orders placed through PepcoLab.
            </p>
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
            <div className="grid md:grid-cols-2 gap-6">
              {REFUND_INFO.map(item => {
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
            <LifeBuoy
              size={42}
              className="mx-auto mb-8 opacity-70"
            />

            <h2 className="font-serif text-5xl tracking-[-0.05em] mb-6">
              Need a refund or cancellation?
            </h2>

            <p className="max-w-2xl mx-auto text-white/60 leading-8 mb-10">
              Reach out with your order reference and we'll review your
              request as quickly as possible.
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