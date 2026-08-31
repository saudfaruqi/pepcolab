// app/referrals/page.tsx
'use client'

import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ReferralWidget from '@/components/ReferralWidget'
import { UserPlus, Send, PercentCircle } from 'lucide-react'

const STEPS = [
  {
    icon: UserPlus,
    title: '1. Get your link',
    text: 'Enter your name and email below — we generate a unique referral code and link just for you, no account needed.',
  },
  {
    icon: Send,
    title: '2. Share it',
    text: 'Send your link to fellow researchers by WhatsApp, email, or however you prefer.',
  },
  {
    icon: PercentCircle,
    title: '3. You both save',
    text: 'They get 15% off their first order. You get 20% off your next one — automatically, every time someone orders with your code.',
  },
]

const FAQ = [
  {
    q: 'How many friends can I refer?',
    a: 'As many as you like. There\'s no limit on the number of times your code can be used, and you earn a fresh 20%-off reward each time.',
  },
  {
    q: 'When do I get my reward?',
    a: 'As soon as a friend\'s order using your code is confirmed, we email you a one-time 20%-off code, valid for 90 days.',
  },
  {
    q: 'Does my friend need to do anything special?',
    a: 'No — they just use your link or enter your code at checkout like any other discount code.',
  },
  {
    q: 'Can I combine my reward with other offers?',
    a: 'Reward and referral codes work like any standard discount code, so only one code can be applied per order.',
  },
]

export default function ReferralsPage() {
  return (
    <>
      <Nav />

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-[#f7f6f3]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-4">
              Refer &amp; Earn
            </div>

            <h1 className="font-serif text-[clamp(40px,7vw,72px)] tracking-[-0.06em] leading-none text-neutral-950 mb-8">
              Give 15%.
              <br />
              Get 20%.
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-neutral-600">
              Know other researchers ordering peptides? Share your personal link — they save on their first order,
              and you're rewarded every time they do.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-3 lg:px-12 py-20">
            <div className="grid md:grid-cols-3 gap-6">
              {STEPS.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="border border-neutral-200 rounded-3xl p-8">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-5">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-950 mb-3">{step.title}</h3>
                    <p className="text-neutral-600 leading-7">{step.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Widget */}
        <section className="bg-[#f7f6f3]">
          <div className="max-w-2xl mx-auto px-6 py-24">
            <Suspense fallback={<div className="h-64 rounded-3xl bg-white border border-neutral-200 animate-pulse" />}>
              <ReferralWidget />
            </Suspense>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white">
          <div className="max-w-3xl mx-auto px-6 py-24">
            <h2 className="font-serif text-4xl tracking-[-0.04em] text-neutral-950 mb-10">Questions</h2>
            <div className="space-y-8">
              {FAQ.map((item) => (
                <div key={item.q} className="border-b border-neutral-200 pb-8">
                  <h3 className="text-lg font-semibold text-neutral-950 mb-2">{item.q}</h3>
                  <p className="text-neutral-600 leading-7">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
