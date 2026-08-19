// src/app/api/reviews/moderate/route.ts
//
// Clicked from the "New review pending approval" email. Split into two
// steps on purpose:
//
//   GET  -> renders a confirmation page. Does NOT approve/reject anything.
//   POST -> (from that page's button) actually performs the action.
//
// This exists because email security scanners (Outlook Safe Links, Gmail's
// link-checker, corporate gateways) routinely pre-fetch every link in
// inbound mail to check it's safe — which, when the original version of
// this route approved/rejected on GET, meant a scanner bot could silently
// moderate a review before a human ever opened the email. Moving the
// mutation to POST fixes that, since scanners don't submit forms.
//
// Auth is a single-use, 14-day, per-review token (see
// reviewStore.verifyModerationAccess) rather than one long-lived shared
// secret — a link that leaks (forwarded email, browser history, a proxy
// log) only ever exposes the one review it was minted for, and only until
// it's actioned or expires.
import { NextRequest, NextResponse } from 'next/server'
import { approveReview, rejectReview, verifyModerationAccess } from '@/lib/reviewStore'

function htmlPage(body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<style>
      body { font-family: -apple-system, sans-serif; padding: 60px 24px; text-align: center; color: #0D0D0D; }
      .card { max-width: 420px; margin: 0 auto; }
      blockquote { text-align: left; background: #F8F9FC; border: 1px solid #E5EAF5; border-radius: 10px; padding: 14px 16px; font-size: 14px; color: #333; margin: 20px 0; }
      .meta { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
      button { font-size: 14px; font-weight: 700; padding: 12px 22px; border-radius: 10px; border: none; cursor: pointer; margin: 6px; }
      .approve { background: #0A7B45; color: #fff; }
      .reject { background: #FEE2E2; color: #A32D2D; }
    </style></head>` +
    `<body><div class="card">${body}</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const token = req.nextUrl.searchParams.get('token') || ''

  const review = await verifyModerationAccess(id, token)
  if (!review) {
    return htmlPage(
      `<h2>This link is no longer valid.</h2><p style="color:#6b7280;font-size:14px">The review may have already been moderated, or the link has expired.</p>`,
      404
    )
  }

  return htmlPage(`
    <h2>Review pending approval</h2>
    <div class="meta">${review.verified ? '✅ Verified purchase' : '⚠️ Unverified'} · ${review.rating}/5 · ${review.productTitle}</div>
    <div class="meta">By ${review.authorName}</div>
    <blockquote>${escapeHtml(review.text)}</blockquote>
    <form method="POST" style="display:inline">
      <input type="hidden" name="id" value="${review.id}" />
      <input type="hidden" name="token" value="${review.moderationToken}" />
      <input type="hidden" name="action" value="approve" />
      <button type="submit" class="approve">Approve — publish this review</button>
    </form>
    <form method="POST" style="display:inline">
      <input type="hidden" name="id" value="${review.id}" />
      <input type="hidden" name="token" value="${review.moderationToken}" />
      <input type="hidden" name="action" value="reject" />
      <button type="submit" class="reject">Reject</button>
    </form>
  `)
}

export async function POST(req: NextRequest) {
  let id = ''
  let token = ''
  let action = ''

  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    id = body.id || ''
    token = body.token || ''
    action = body.action || ''
  } else {
    // Submitted from the HTML <form> above
    const form = await req.formData()
    id = String(form.get('id') || '')
    token = String(form.get('token') || '')
    action = String(form.get('action') || '')
  }

  const review = await verifyModerationAccess(id, token)
  if (!review) {
    return htmlPage(
      `<h2>This link is no longer valid.</h2><p style="color:#6b7280;font-size:14px">The review may have already been moderated, or the link has expired.</p>`,
      404
    )
  }

  if (action === 'approve') {
    await approveReview(id)
    return htmlPage(`<h2>✅ Approved</h2><p>The review by ${escapeHtml(review.authorName)} is now live on the site.</p>`)
  }
  if (action === 'reject') {
    await rejectReview(id)
    return htmlPage(`<h2>🚫 Rejected</h2><p>The review by ${escapeHtml(review.authorName)} will not be shown.</p>`)
  }
  return htmlPage(`<h2>Unknown action</h2><p>Use the buttons on the confirmation page.</p>`, 400)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}