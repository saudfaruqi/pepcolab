// app/contact/page.tsx (or wherever your contact page is)
'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import {
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  FileCheck,
} from 'lucide-react'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      setSuccess(true)
      setForm({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
      })

      // Auto-dismiss success after 5 seconds
      setTimeout(() => setSuccess(false), 5000)

    } catch (err: any) {
      setError(err.message || 'Unable to send message. Please try again.')
    }

    setLoading(false)
  }

  return (
    <>
      <Nav />

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-[#f7f6f3] relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, #2563eb 0%, transparent 50%), radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 50%)',
            }} />
          </div>
          
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-medium text-neutral-600 tracking-[0.06em] uppercase">
                  Support Available
                </span>
              </div>

              <h1 className="font-serif text-[clamp(48px,8vw,84px)] tracking-[-0.06em] leading-[0.95] text-neutral-950 mb-6">
                Get in touch.
              </h1>

              <p className="max-w-2xl text-neutral-600 text-lg leading-8">
                Questions about products, batch verification, orders,
                or research documentation? Our team is here to help.
              </p>

              <div className="flex flex-wrap gap-6 mt-8">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Clock size={16} className="text-neutral-400" />
                  <span>Response within 24 hours</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Shield size={16} className="text-neutral-400" />
                  <span>Secure & confidential</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid lg:grid-cols-[420px,1fr] gap-12">
            {/* Contact Info */}
            <div>
              <div className="mb-8">
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-2">
                  Contact Information
                </div>
                <h2 className="font-serif text-4xl tracking-tight text-neutral-950">
                  Let's talk.
                </h2>
                <p className="text-neutral-500 mt-2 text-sm">
                  We're here to help with any questions you have.
                </p>
              </div>

              <div className="space-y-6">
                <div className="group flex gap-4 p-4 -mx-4 rounded-2xl hover:bg-neutral-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors flex-shrink-0">
                    <Mail className="text-neutral-600" size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-500">Email</div>
                    <div className="text-neutral-900 font-medium">hello@pepcolab.com</div>
                  </div>
                </div>

                <div className="group flex gap-4 p-4 -mx-4 rounded-2xl hover:bg-neutral-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors flex-shrink-0">
                    <MapPin className="text-neutral-600" size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-500">Office</div>
                    <div className="text-neutral-900 font-medium">United Kingdom</div>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-10 border-t border-neutral-100 pt-8">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <FileCheck size={16} className="text-emerald-600" />
                    <span>UK Registered Company #17072052</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-600">
                    <Shield size={16} className="text-emerald-600" />
                    <span>Research-grade quality assurance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 lg:p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-serif text-3xl tracking-tight">Send us a message</h2>
                <span className="text-xs text-neutral-400 font-medium">* Required</span>
              </div>

              {success && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium">Message sent!</div>
                    <div className="text-sm text-emerald-600/80 mt-0.5">
                      We'll get back to you within 24 hours. Check your email for confirmation.
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle size={16} className="text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">Something went wrong</div>
                    <div className="text-sm text-red-600/80 mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full border bg-white border-neutral-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition placeholder:text-neutral-400 text-neutral-900"
                    style={{ fontSize: '16px' }} /* Fix iOS zoom */
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full border bg-white border-neutral-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition placeholder:text-neutral-400 text-neutral-900"
                    style={{ fontSize: '16px' }} /* Fix iOS zoom */
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1.5">
                    Company (optional)
                  </label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Your company name"
                    className="w-full border bg-white border-neutral-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition placeholder:text-neutral-400 text-neutral-900"
                    style={{ fontSize: '16px' }} /* Fix iOS zoom */
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Brief subject line"
                    className="w-full border bg-white border-neutral-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition placeholder:text-neutral-400 text-neutral-900"
                    style={{ fontSize: '16px' }} /* Fix iOS zoom */
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={7}
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className="w-full border bg-white border-neutral-200 rounded-xl px-4 py-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition placeholder:text-neutral-400 text-neutral-900"
                    style={{ fontSize: '16px' }} /* Fix iOS zoom */
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send size={16} />
                    </>
                  )}
                </button>

                <p className="text-xs text-neutral-400 text-center mt-4">
                  By submitting this form, you agree to our privacy policy.
                  We'll never share your information with third parties.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}