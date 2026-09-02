// src/app/admin/(protected)/subscribers/page.tsx
//
// Read-only for now. Storage lives in lib/newsletterStore.ts (shared with
// the signup route and the CSV export) — see that file for the
// self-healing migration that fixed a WRONGTYPE key issue found in
// production. Sending campaigns from here is the next piece — it'll need
// a compose/send UI plus a real transactional-email-at-scale setup (the
// current lib/mailer.ts is a single SMTP account, fine for one-off
// alerts, not a broadcast to hundreds of subscribers at once) before it's
// safe to wire up.
import { listSubscribers } from '@/lib/newsletterStore'

export const dynamic = 'force-dynamic'

export default async function AdminSubscribersPage() {
  let subscribers: Awaited<ReturnType<typeof listSubscribers>> = []
  let loadError: string | null = null

  try {
    subscribers = await listSubscribers()
  } catch (err) {
    console.error('[admin/subscribers] Failed to load subscribers:', err)
    loadError = 'Could not load subscribers — check the server logs for details.'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#0D0D0D]">Subscribers</h1>
        <p className="text-sm text-[#0D0D0D]/50">
          {subscribers.length} newsletter subscriber{subscribers.length === 1 ? '' : 's'}. Sending
          campaigns from here isn't built yet — for now, export via the CSV link below.
        </p>
      </div>

      {/* Deliberately not building the export link with the real token filled
          in — that would mean shipping your NEWSLETTER_EXPORT_TOKEN to the
          browser in page HTML, which defeats the point of it being a secret. */}
      <a
        href="/api/newsletter/export"
        className="mb-4 inline-block text-xs font-medium text-[#8A6A1E] hover:underline"
      >
        Download CSV — append ?token=YOUR_NEWSLETTER_EXPORT_TOKEN to the URL
      </a>

      {loadError ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      ) : subscribers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#0D0D0D]/15 py-16 text-center text-sm text-[#0D0D0D]/50">
          No subscribers yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#0D0D0D]/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#0D0D0D]/10 text-xs text-[#0D0D0D]/50">
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.email} className="border-b border-[#0D0D0D]/5 last:border-0">
                  <td className="px-4 py-2.5 text-[#0D0D0D]">{s.email}</td>
                  <td className="px-4 py-2.5 text-xs text-[#0D0D0D]/60">
                    {new Date(s.subscribedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}