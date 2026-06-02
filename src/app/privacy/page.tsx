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
          <div className="max-w-5xl mx-auto px-6 py-24 space-y-14 text-neutral-600 leading-8">
            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Information We Collect
              </h2>
              <p>
                We may collect personal details such as your name, email
                address, billing information, and order history when you
                interact with our services.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                How We Use Your Information
              </h2>
              <p>
                Your information is used to process orders, provide customer
                support, improve our services, and communicate important
                updates.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Cookies & Tracking
              </h2>
              <p>
                We use cookies to improve user experience, analyze traffic,
                and maintain website functionality. You may disable cookies in
                your browser settings.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Data Protection
              </h2>
              <p>
                We implement appropriate technical and organizational measures
                to protect your data against unauthorized access or misuse.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Third Parties
              </h2>
              <p>
                We may use trusted third-party providers for payment processing,
                shipping, and analytics. These providers are required to handle
                data securely.
              </p>
            </div>

            <div>
              <h2 className="font-serif text-4xl text-neutral-950 mb-4">
                Your Rights
              </h2>
              <p>
                You may request access, correction, or deletion of your personal
                data by contacting our support team.
              </p>
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