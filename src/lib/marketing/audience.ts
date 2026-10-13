// src/lib/marketing/audience.ts
//
// Turns an AudienceSpec into a de-duplicated recipient list, built from the
// site's own order records (every STRABL checkout, paid or not) and the
// newsletter list. One row per email address, however many orders it has.
//
// What is NOT decided here: whether someone is unsubscribed, on the global
// exclusion list, or mailed too recently. Those are checked at send time
// (lib/marketing/send.ts) and flagged in the audience preview, so the admin
// sees exactly who will be skipped and why before pressing send.
import { listAllOrders, isPaidOrder, type OrderRecord } from '@/lib/orderStore'
import { listSubscribers } from '@/lib/newsletterStore'
import type { AudienceSpec, Recipient } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function firstNameOf(name: string): string {
  const first = (name || '').trim().split(/\s+/)[0] || ''
  if (!first || first === '—') return ''
  // "ABDULRHMAN" → "Abdulrhman"; "youmna" → "Youmna". Leaves "McKay" alone.
  if (first === first.toUpperCase() || first === first.toLowerCase()) {
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  return first
}

interface Accumulator {
  email: string
  name: string
  paidOrders: number
  totalSpent: number
  currency: string
  lastOrderAt: string | null
  lastPaidAt: string | null
  lastProduct: string
  productTitles: string[]
  hasAnyOrder: boolean
}

function newAcc(email: string): Accumulator {
  return {
    email,
    name: '',
    paidOrders: 0,
    totalSpent: 0,
    currency: 'AED',
    lastOrderAt: null,
    lastPaidAt: null,
    lastProduct: '',
    productTitles: [],
    hasAnyOrder: false,
  }
}

function later(a: string | null, b: string): boolean {
  return !a || new Date(b).getTime() > new Date(a).getTime()
}

/** Every known customer address with its order history rolled up. */
export async function buildCustomerIndex(): Promise<Map<string, Accumulator>> {
  const { orders } = await listAllOrders(5000, 0)
  const byEmail = new Map<string, Accumulator>()

  // Oldest first, so "latest" fields naturally end on the newest order.
  const sorted = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  for (const o of sorted as OrderRecord[]) {
    const email = (o.email || '').trim().toLowerCase()
    if (!EMAIL_RE.test(email)) continue
    const acc = byEmail.get(email) ?? newAcc(email)
    acc.hasAnyOrder = true
    if (o.customerName && o.customerName.trim() && o.customerName.trim() !== '—') acc.name = o.customerName.trim()
    if (later(acc.lastOrderAt, o.createdAt)) acc.lastOrderAt = o.createdAt
    if (isPaidOrder(o)) {
      acc.paidOrders++
      acc.totalSpent += Number(o.total) || 0
      acc.currency = o.currency || acc.currency
      if (later(acc.lastPaidAt, o.createdAt)) {
        acc.lastPaidAt = o.createdAt
        const first = o.products?.[0]?.title
        if (first) acc.lastProduct = first
      }
      for (const p of o.products || []) if (p.title) acc.productTitles.push(p.title)
    }
    byEmail.set(email, acc)
  }
  return byEmail
}

function toRecipient(a: Accumulator): Recipient {
  return {
    email: a.email,
    name: a.name,
    firstName: firstNameOf(a.name),
    paidOrders: a.paidOrders,
    totalSpent: Math.round(a.totalSpent * 100) / 100,
    currency: a.currency,
    lastOrderAt: a.lastOrderAt,
    lastPaidAt: a.lastPaidAt,
    lastProduct: a.lastProduct,
  }
}

export async function resolveAudience(spec: AudienceSpec): Promise<Recipient[]> {
  const customers = await buildCustomerIndex()
  const exclude = new Set((spec.excludeEmails || []).map((e) => e.trim().toLowerCase()))
  const out: Recipient[] = []

  if (spec.segment === 'newsletter') {
    const subs = await listSubscribers()
    for (const s of subs) {
      const email = s.email.trim().toLowerCase()
      if (!EMAIL_RE.test(email) || exclude.has(email)) continue
      out.push(toRecipient(customers.get(email) ?? newAcc(email)))
    }
  } else {
    const now = Date.now()
    const lapsedMs = Math.max(1, Number(spec.lapsedDays) || 45) * 24 * 60 * 60 * 1000
    const q = (spec.productQuery || '').trim().toLowerCase()
    for (const a of customers.values()) {
      if (exclude.has(a.email)) continue
      let include = false
      switch (spec.segment) {
        case 'buyers':
          include = a.paidOrders > 0
          break
        case 'non_buyers':
          include = a.hasAnyOrder && a.paidOrders === 0
          break
        case 'all_customers':
          include = a.hasAnyOrder
          break
        case 'lapsed_buyers':
          include = a.paidOrders > 0 && !!a.lastPaidAt && now - new Date(a.lastPaidAt).getTime() >= lapsedMs
          break
        case 'bought_product':
          include = a.paidOrders > 0 && q.length > 0 && a.productTitles.some((t) => t.toLowerCase().includes(q))
          break
      }
      if (include) out.push(toRecipient(a))
    }
  }

  // Most valuable / most recent first, so a partial send reaches them first.
  return out.sort(
    (x, y) =>
      y.paidOrders - x.paidOrders ||
      new Date(y.lastOrderAt || 0).getTime() - new Date(x.lastOrderAt || 0).getTime()
  )
}
