'use client'
// The guide request form. Posts to /api/learn/lead, fires the browser Lead
// event (only if the visitor accepted marketing cookies — the Pixel is not
// loaded otherwise), and moves to the thank-you page.
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { hasMarketingConsent } from '@/lib/consent'
import { newEventId, trackMetaLead, readMetaCookies } from '@/lib/metaPixel'

interface Props {
  guideSlug: string
  guideName: string
  defaultSource: string
  areas: { value: string; label: string }[]
}

export default function LeadForm({ guideSlug, guideName, defaultSource, areas }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [source, setSource] = useState(defaultSource)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [area, setArea] = useState('')
  const [optIn, setOptIn] = useState(false)
  const [company, setCompany] = useState('') // honeypot
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const src = (params.get('src') || params.get('source') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
    if (src) setSource(src)
  }, [params])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    const consent = hasMarketingConsent()
    const eventId = newEventId('lead')
    try {
      const res = await fetch('/api/learn/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          guide: guideSlug,
          source,
          researchArea: area,
          emailOptIn: optIn,
          marketingConsent: consent,
          eventId,
          pageUrl: window.location.href.split('#')[0],
          company,
          ...(consent ? readMetaCookies() : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setBusy(false)
        return
      }
      if (consent) trackMetaLead(eventId, { content_name: guideName })
      router.push(`/learn/${guideSlug}/thanks`)
    } catch {
      setError('Could not reach the server. Please check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="lf">
      <style>{`
        .lf h2 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 26px; line-height: 1.12; margin: 0 0 6px; }
        .lf-sub { font-size: 13.5px; color: rgba(13,13,13,.55); margin: 0 0 20px; line-height: 1.6; }
        .lf label { display: block; font-size: 12px; font-weight: 600; color: rgba(13,13,13,.7); margin: 0 0 6px; }
        .lf-field { margin-bottom: 14px; }
        .lf input[type=email], .lf input[type=text], .lf select { width: 100%; box-sizing: border-box; border: 1px solid rgba(13,13,13,.16); border-radius: 12px; padding: 12px 14px; font: inherit; font-size: 15px; background: #fff; color: #0d0d0d; }
        .lf input:focus, .lf select:focus { outline: none; border-color: #0d0d0d; box-shadow: 0 0 0 3px rgba(13,13,13,.08); }
        .lf .lf-opt { display: grid; font-weight: 400; grid-template-columns: 20px minmax(0,1fr); gap: 10px; align-items: start; font-size: 13px; line-height: 1.55; color: rgba(13,13,13,.62); margin: 4px 0 18px; cursor: pointer; }
        .lf .lf-opt input { width: 18px; height: 18px; margin: 1px 0 0; accent-color: #0d0d0d; }
        .lf button { width: 100%; border: 0; border-radius: 999px; background: #0d0d0d; color: #fff; font: inherit; font-size: 15px; font-weight: 600; padding: 15px 20px; cursor: pointer; }
        .lf button:disabled { opacity: .6; cursor: wait; }
        .lf-err { background: #fdf0ef; color: #9b2c22; border-radius: 10px; padding: 10px 12px; font-size: 13px; margin-bottom: 14px; }
        .lf-fine { font-size: 11.5px; line-height: 1.6; color: rgba(13,13,13,.45); margin-top: 14px; }
        .lf-fine a { color: rgba(13,13,13,.6); }
        .lf-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
      `}</style>
      <h2>Get the free guide</h2>
      <p className="lf-sub">We will email {guideName} to you now.</p>

      {error && <div className="lf-err" role="alert">{error}</div>}

      <div className="lf-field">
        <label htmlFor="lf-email">Email address</label>
        <input id="lf-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="lf-field">
        <label htmlFor="lf-name">First name <span style={{ fontWeight: 400, opacity: .6 }}>(optional)</span></label>
        <input id="lf-name" type="text" autoComplete="given-name" maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div className="lf-field">
        <label htmlFor="lf-area">What best describes your work? <span style={{ fontWeight: 400, opacity: .6 }}>(optional)</span></label>
        <select id="lf-area" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">Prefer not to say</option>
          {areas.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <div className="lf-hp" aria-hidden="true">
        <label htmlFor="lf-company">Company</label>
        <input id="lf-company" type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <input type="hidden" name="source" value={source} />

      <label className="lf-opt">
        <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
        <span>Also send me four short follow-up emails over the next two weeks on testing, suppliers and regulation, and future free guides. Unsubscribe any time.</span>
      </label>

      <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me the guide'}</button>

      <p className="lf-fine">
        We use your email to send the guide{optIn ? ' and the follow-ups you asked for' : ''}. See our{' '}
        <a href="/privacy">privacy policy</a>. For laboratory and research use only.
      </p>
    </form>
  )
}
