'use client'
// Google Customer Reviews opt-in, shown once on /checkout/success with the
// real order. Google requires a true order id, email, a two-letter delivery
// country and a YYYY-MM-DD delivery estimate; product GTINs are optional and
// omitted (laboratory products carry none).
//
// The order only exists once STRABL's webhook has run, which is usually
// before the customer lands here but not always — so the details are polled
// for a short while, and the opt-in simply does not appear if they never
// arrive.
import { useEffect } from 'react'

const MERCHANT_ID = 5843635708
const ATTEMPTS = 6
const INTERVAL_MS = 4000

interface Props {
  checkoutRef: string
  items: { name: string; quantity: number }[]
}

declare global {
  interface Window {
    renderOptIn?: () => void
    gapi?: any
  }
}

export default function GoogleCustomerReviews({ checkoutRef, items }: Props) {
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function attempt(n: number) {
      if (cancelled) return
      try {
        const res = await fetch('/api/checkout/survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref: checkoutRef, items }),
        })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) render(data)
          return
        }
      } catch {
        // network blip — retry below
      }
      if (n + 1 < ATTEMPTS) timer = setTimeout(() => attempt(n + 1), INTERVAL_MS)
    }

    function render(d: { orderId: string; email: string; deliveryCountry: string; estimatedDeliveryDate: string }) {
      window.renderOptIn = () => {
        window.gapi?.load('surveyoptin', () => {
          window.gapi.surveyoptin.render({
            merchant_id: MERCHANT_ID,
            order_id: d.orderId,
            email: d.email,
            delivery_country: d.deliveryCountry,
            estimated_delivery_date: d.estimatedDeliveryDate,
          })
        })
      }
      if (document.getElementById('gcr-platform')) return
      const s = document.createElement('script')
      s.id = 'gcr-platform'
      s.src = 'https://apis.google.com/js/platform.js?onload=renderOptIn'
      s.async = true
      document.body.appendChild(s)
    }

    attempt(0)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [checkoutRef, items])

  return null
}
