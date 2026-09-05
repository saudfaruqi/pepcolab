// src/app/admin/(protected)/emails/page.tsx
//
// Every email the site has sent, newest first.
//
// This answers the questions that previously had no answer: did the customer
// actually get their order confirmation, did the reorder cron run last night,
// why hasn't this person had their sign-in link, is SMTP working at all.
// Before this, a failed send logged to a server console nobody reads and a
// successful one left no trace whatsoever.
import { listEmailLog } from '@/lib/emailLog'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

/**
 * Group by what the email IS, from its subject. The subjects are written in
 * this codebase and are stable, so matching on them is reliable enough for a
 * count — and far more useful than a flat list when you're trying to see
 * whether a whole category stopped sending.
 */
function categorise(subject: string): string {
  const s = subject.toLowerCase()
  if (s.includes('order confirmed')) return 'Order confirmation'
  if (s.includes('sign-in link')) return 'Sign-in link'
  if (s.includes('back in stock')) return 'Back in stock'
  if (s.includes('uk launch')) return 'UK launch interest'
  if (s.includes('how was your order')) return 'Review request'
  if (s.includes('fresh batch') || s.includes('reorder')) return 'Reorder reminder'
  if (s.includes('cart') || s.includes('still there') || s.includes('forget')) return 'Abandoned cart'
  if (s.includes('payment')) return 'Payment issue'
  if (s.includes('review pending')) return 'Review moderation'
  if (s.includes('chat')) return 'Chat'
  if (s.includes('contact') || s.includes('received your message')) return 'Contact form'
  return 'Other'
}

export default async function AdminEmailsPage() {
  let entries: Awaited<ReturnType<typeof listEmailLog>> = []
  let loadError: string | null = null

  try {
    entries = await listEmailLog(300)
  } catch (err) {
    console.error('[admin/emails] Failed to load:', err)
    loadError = 'Could not load the email log — check the server logs.'
  }

  const failed = entries.filter(e => e.status === 'failed')
  const last24h = entries.filter(e => Date.now() - new Date(e.sentAt).getTime() < 864e5)

  const byType = entries.reduce<Record<string, { sent: number; failed: number }>>((acc, e) => {
    const k = categorise(e.subject)
    acc[k] ||= { sent: 0, failed: 0 }
    if (e.status === 'sent') acc[k].sent++
    else acc[k].failed++
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Emails</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          {entries.length} recorded &mdash; {last24h.length} in the last 24 hours
          {failed.length > 0 && <>, <span className="font-semibold text-red-700">{failed.length} failed</span></>}.
          Keeps the most recent 300.
        </p>
      </div>

      {failed.length > 0 && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-[13px] font-semibold text-red-900">
            {failed.length} email{failed.length === 1 ? '' : 's'} failed to send
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-red-800">
            Most recent: {failed[0].subject} to {failed[0].to} &mdash; {failed[0].error || 'no error recorded'}.
            A repeated failure across every type usually means SMTP credentials; failures on one
            type only usually mean bad data on those records.
          </p>
        </div>
      )}

      {Object.keys(byType).length > 0 && (
        <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byType)
            .sort((a, b) => (b[1].sent + b[1].failed) - (a[1].sent + a[1].failed))
            .map(([type, counts]) => (
              <div key={type} className="rounded-lg border border-[#0D0D0D]/10 bg-white px-4 py-3">
                <div className="text-[13px] font-semibold text-[#0D0D0D]">{type}</div>
                <div className="text-xs text-[#0D0D0D]/50">
                  {counts.sent} sent
                  {counts.failed > 0 && <span className="text-red-700"> · {counts.failed} failed</span>}
                </div>
              </div>
            ))}
        </div>
      )}

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-[#0D0D0D]/10 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#0D0D0D]">No emails recorded yet</p>
          <p className="mt-1 text-sm text-[#0D0D0D]/50">
            Logging starts from the deploy that added it &mdash; anything sent before then
            isn&apos;t here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#0D0D0D]/10 bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[#0D0D0D]/10 text-[11px] font-bold uppercase tracking-wider text-[#0D0D0D]/45">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-[#0D0D0D]/5 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#0D0D0D]/55">
                    {new Date(e.sentAt).toLocaleString('en-GB', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-[#0D0D0D]">
                    {categorise(e.subject)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#0D0D0D]/70">{e.to}</td>
                  <td className="px-4 py-3 text-[13px] text-[#0D0D0D]/70">
                    {e.subject}
                    {e.preview && (
                      <div className="mt-0.5 text-xs text-[#0D0D0D]/35">{e.preview}</div>
                    )}
                    {e.error && (
                      <div className="mt-0.5 text-xs text-red-700">{e.error}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {e.status === 'sent' ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700">
                        <CheckCircle2 size={13} /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-700">
                        <AlertTriangle size={13} /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[#0D0D0D]/40">
        Full message bodies aren&apos;t stored &mdash; only a short preview, with sign-in links
        stripped. Those links grant access to a customer&apos;s account, and keeping them in a
        second readable place would turn this log into a way to take one over.
      </p>
    </div>
  )
}