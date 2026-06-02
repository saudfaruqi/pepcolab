'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
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
      const response = await fetch(
        'https://yourdomain.com/api/contact.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      )

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
    } catch (err: any) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <>
      <Nav />

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-[#f7f6f3]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
            <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 font-semibold mb-4">
              Contact
            </div>

            <h1 className="font-serif text-[clamp(48px,8vw,84px)] tracking-[-0.06em] leading-none mb-6">
              Get in touch.
            </h1>

            <p className="max-w-2xl text-neutral-600 text-lg leading-8">
              Questions about products, batch verification, orders,
              or research documentation? Our team is here to help.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="grid lg:grid-cols-[420px,1fr] gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="font-serif text-4xl tracking-tight mb-8">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <Mail className="mt-1" size={18} />
                  <div>
                    <div className="font-medium">
                      Email
                    </div>
                    <div className="text-neutral-600">
                      support@pepcolab.com
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone className="mt-1" size={18} />
                  <div>
                    <div className="font-medium">
                      Phone
                    </div>
                    <div className="text-neutral-600">
                      +44 20 1234 5678
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <MapPin className="mt-1" size={18} />
                  <div>
                    <div className="font-medium">
                      Office
                    </div>
                    <div className="text-neutral-600">
                      London, United Kingdom
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 lg:p-10">
              <h2 className="font-serif text-3xl mb-8">
                Send us a message
              </h2>

              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 size={18} />
                  Message sent successfully.
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3"
                />

                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3"
                />

                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Company (optional)"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3"
                />

                <input
                  required
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3"
                />

                <textarea
                  required
                  rows={7}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 resize-none"
                />

                <button
                  disabled={loading}
                  className="w-full bg-black text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}