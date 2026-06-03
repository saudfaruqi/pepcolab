'use client'

import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ShieldCheck, Database, Lock, Eye, ArrowRight } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
              Privacy
              <br />
              Policy
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-neutral-600">
              This policy explains how we collect, use, and protect your
              personal information when you use our website and services.
            </p>
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Database,
                title: 'Data Collection',
                text: 'We collect only essential information required to process orders and provide support.',
              },
              {
                icon: Lock,
                title: 'Secure Storage',
                text: 'Your data is stored securely using industry-standard encryption and safeguards.',
              },
              {
                icon: Eye,
                title: 'Limited Access',
                text: 'Access to user data is restricted strictly to authorized personnel.',
              },
              {
                icon: ShieldCheck,
                title: 'No Selling Data',
                text: 'We do not sell, rent, or trade personal information to third parties.',
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
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-neutral-600 leading-7">{item.text}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Policy */}
<section className="bg-white">
  <div className="max-w-5xl mx-auto px-6 lg:px-12 py-20">

    <div className="mb-16">
      <div className="inline-flex items-center rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Last Updated • July 2026
      </div>
    </div>

    <div className="space-y-16">

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          1. Introduction
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            PepcoLab Ltd ("PepcoLab", "we", "us", or "our") is committed
            to protecting and respecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, store, and protect
            personal information obtained through our website, products,
            services, and communications.
          </p>

          <p>
            We process personal information in accordance with applicable
            data protection legislation, including the UK General Data
            Protection Regulation ("UK GDPR"), the Data Protection Act
            2018, and other applicable privacy laws.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          2. Information We Collect
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            We may collect the following categories of information:
          </p>

          <ul className="space-y-3 list-disc pl-6">
            <li>Full name</li>
            <li>Email address</li>
            <li>Billing address</li>
            <li>Shipping address</li>
            <li>Telephone number</li>
            <li>Order and transaction history</li>
            <li>Account and authentication information</li>
            <li>Website usage and analytics data</li>
            <li>Customer service communications</li>
            <li>Technical information including IP address, browser type, device information and log data</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          3. How We Use Personal Information
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>We use personal information for legitimate business purposes including:</p>

          <ul className="space-y-3 list-disc pl-6">
            <li>Processing and fulfilling orders</li>
            <li>Providing customer support</li>
            <li>Responding to enquiries</li>
            <li>Preventing fraud and abuse</li>
            <li>Improving website functionality and performance</li>
            <li>Complying with legal and regulatory obligations</li>
            <li>Maintaining security and platform integrity</li>
            <li>Sending service-related communications</li>
            <li>Sending marketing communications where legally permitted or consented to</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          4. Lawful Basis for Processing
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Under UK GDPR and applicable data protection laws, we process
            personal information on one or more of the following lawful
            bases:
          </p>

          <ul className="space-y-3 list-disc pl-6">
            <li>Performance of a contract</li>
            <li>Compliance with legal obligations</li>
            <li>Legitimate business interests</li>
            <li>Consent where required</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          5. Cookies & Tracking Technologies
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Our website may use cookies, analytics tools, and similar
            technologies to improve functionality, analyse traffic,
            remember preferences, and enhance user experience.
          </p>

          <p>
            You may control cookies through your browser settings.
            Disabling certain cookies may affect website functionality.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          6. Third-Party Service Providers
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            We may engage trusted third-party providers to support our
            operations, including:
          </p>

          <ul className="space-y-3 list-disc pl-6">
            <li>Payment processors</li>
            <li>E-commerce infrastructure providers</li>
            <li>Hosting providers</li>
            <li>Analytics providers</li>
            <li>Shipping and logistics partners</li>
            <li>Email communication platforms</li>
          </ul>

          <p>
            These providers are contractually required to process data in
            accordance with applicable privacy and security requirements.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          7. International Data Transfers
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Some service providers may process information outside the
            United Kingdom or European Economic Area. Where such transfers
            occur, appropriate safeguards will be implemented as required
            by applicable data protection laws.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          8. Data Retention
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Personal information is retained only for as long as
            reasonably necessary to fulfil the purposes described in this
            policy, comply with legal obligations, resolve disputes, and
            enforce agreements.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          9. Security Measures
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            We maintain appropriate technical and organisational measures
            designed to protect personal information against accidental
            loss, unauthorised access, misuse, disclosure, alteration, or
            destruction.
          </p>

          <p>
            No internet transmission or storage system can be guaranteed
            to be completely secure, and we cannot guarantee absolute
            security.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          10. Your Privacy Rights
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Subject to applicable law, you may have the right to:
          </p>

          <ul className="space-y-3 list-disc pl-6">
            <li>Access personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of information</li>
            <li>Restrict processing</li>
            <li>Object to processing</li>
            <li>Request data portability</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          11. Research Use Notice
        </h2>

        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Products offered by PepcoLab are supplied exclusively for
            laboratory research purposes. Product purchases, enquiries,
            and communications may be reviewed for compliance, fraud
            prevention, safety, legal obligations, and operational
            requirements.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          12. Contact Information
        </h2>

        <div className="rounded-3xl border border-neutral-200 p-8">
          <p className="text-neutral-600 leading-8">
            Questions regarding this Privacy Policy or personal data
            requests may be submitted through our Contact page or by
            contacting our support team.
          </p>
        </div>
      </section>

    </div>
  </div>
</section>

        {/* CTA */}
        <section className="bg-neutral-950 text-white">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <h2 className="font-serif text-5xl mb-6">
              Questions about your data?
            </h2>

            <p className="text-white/60 max-w-2xl mx-auto mb-10 leading-8">
              Our support team can help clarify how your information is handled
              and stored.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-3 bg-white text-neutral-950 px-8 py-4 rounded-full"
            >
              Contact Us <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}