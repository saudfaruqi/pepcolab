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
          <div className="max-w-7xl mx-auto px-3 lg:px-12 py-20 grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Database,
                title: 'Data Collection',
                text: 'We collect what we need to take and deliver your order, and nothing for advertising.',
              },
              {
                icon: Lock,
                title: 'Secure Storage',
                text: 'Customer records are kept in our own systems with access limited to the people who run your order.',
              },
              {
                icon: Eye,
                title: 'Limited Access',
                text: 'Access to user data is restricted strictly to authorized personnel.',
              },
              {
                icon: ShieldCheck,
                title: 'Marketing Only by Opt-in',
                text: 'Email and WhatsApp marketing go only to people who ticked the box for that channel.',
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
        Last Updated • October 2026
      </div>
    </div>

    <div className="space-y-16">

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          1. Who we are
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            PepcoLab is a trading name of SEE BEE DEE LIMITED, a company
            registered in England and Wales (company number 17072052),
            registered office: Dalveen, Sweetloves Lane, Bolton, England,
            BL1 7EU. We are the controller of your personal data. Contact:{' '}
            <a href="mailto:privacy@pepcolab.com" className="underline">privacy@pepcolab.com</a>.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          2. Information we collect
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>We collect the information you give us and the information needed to run the site:</p>
          <ul className="space-y-3 list-disc pl-6">
            <li>Name, email address, telephone number, billing and delivery address</li>
            <li>Order and transaction history</li>
            <li>Account sign-in information</li>
            <li>Your research-use confirmation at checkout, with its date and time</li>
            <li>Your marketing choices for email and WhatsApp, with the wording you agreed to and when</li>
            <li>Messages you send us by email, the contact form or WhatsApp</li>
            <li>Technical information such as IP address, browser and device type, and, if you allow it, analytics data</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          3. What we use your data for
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <ol className="space-y-3 list-decimal pl-6">
            <li>To take, deliver and support your orders. This is necessary for our contract with you.</li>
            <li>To keep tax, accounting and order records. This is a legal obligation.</li>
            <li>To confirm research-use attestations and prevent fraud. This is our legitimate interest.</li>
            <li>
              To send you marketing by email or WhatsApp, but <strong>only if you have opted in</strong> to
              that channel. This is your consent.
            </li>
          </ol>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          4. Email and WhatsApp marketing
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            We send marketing only to people who have ticked the opt-in box for that channel or joined our
            WhatsApp updates by messaging us. Each email has an unsubscribe link, and you can reply STOP on
            WhatsApp at any time. Order and delivery messages are not marketing and are sent as part of your
            order. We comply with the UK GDPR, the Data Protection Act 2018 and the Privacy and Electronic
            Communications Regulations 2003, and for customers in the UAE, Federal Decree-Law No. 45 of 2021 on
            the Protection of Personal Data.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          5. WhatsApp
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            If you message us on WhatsApp, WhatsApp (part of Meta Platforms) processes the message under its own
            terms. We copy your name, number and opt-in status into our own customer records so that we can reach
            you if our WhatsApp number changes.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          6. Cookies
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            We use essential storage to run the site: your cart, sign-in, age and market confirmation, and your
            cookie choice. With your permission we also use Google Analytics to understand which pages are used;
            until you accept, it runs in a cookieless mode that stores nothing on your device. We do not use
            advertising cookies or advertising pixels. You can change your choice at any time with &ldquo;Cookie
            settings&rdquo; at the bottom of every page.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          7. Who we share data with
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>We share only what each provider needs to do its job:</p>
          <ul className="space-y-3 list-disc pl-6">
            <li>Our payment processor, to take payment</li>
            <li>Our e-commerce and hosting providers, to run the shop and the site</li>
            <li>Our delivery partners, to deliver your order</li>
            <li>Our email provider, to send order emails and any marketing you opted in to</li>
            <li>Google, for site analytics if you allow it</li>
          </ul>
          <p>We do not sell, rent or trade personal data.</p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          8. International transfers
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Some providers process data outside the United Kingdom. Where they do, we rely on the safeguards
            required by UK data protection law, such as adequacy regulations or the international data transfer
            agreement.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          9. How long we keep data
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            Order and invoice records: 6 years from the end of the financial year, to meet HMRC requirements.
            Marketing consent records: for as long as you are subscribed, plus 2 years after you withdraw, as
            proof of consent. After you unsubscribe we keep only a scrambled (hashed) copy of your email address or
            number, so that we never message you again.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          10. Security
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            We use technical and organisational measures to protect personal data against loss, unauthorised
            access, misuse or disclosure. No system is completely secure, but access to customer data is limited to
            the people who need it to run your order.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          11. Your rights
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            You can ask for a copy of your data, its correction or deletion, or object to marketing, by emailing{' '}
            <a href="mailto:privacy@pepcolab.com" className="underline">privacy@pepcolab.com</a>. We reply within one
            month. UK customers can complain to the Information Commissioner&apos;s Office (
            <a href="https://ico.org.uk" className="underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a>).
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-4xl text-neutral-950 mb-6">
          12. Research use
        </h2>
        <div className="space-y-5 text-neutral-600 leading-8">
          <p>
            PepcoLab supplies materials for in-vitro laboratory research only. Orders and enquiries may be reviewed
            for compliance, fraud prevention and legal obligations.
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
              Email privacy@pepcolab.com and we will reply within one month.
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