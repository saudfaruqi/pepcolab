// src/lib/orderEmails.ts
//
// The order-confirmation and payment-failed customer emails. Split out from
// the webhook route because email markup is noisy and doesn't belong mixed
// into request-handling logic.
//
// Why these exist at all: checkout/success previously told every customer
// "you will receive a confirmation email shortly" — but nothing ever sent
// one. The STRABL order short code (e.g. SOR-A5EVGI) only ever appeared
// transiently on STRABL's own post-checkout page; if the customer didn't
// screenshot it, they had no way to look their order up again. This is the
// actual fix: the order code now reaches them somewhere permanent.
import { sendMailSafe } from '@/lib/mailer'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'
const BLACK = '#0D0D0D'
const PAPER = '#F7F5F1'
const GOLD = '#C8992A'
const GREEN = '#0A7B45'

function emailShell(bodyHtml: string): string {
  // Table-based layout, inline styles only — this is what survives Outlook
  // and Gmail's clipping without a build step; matches the constraints the
  // Shopify order-confirmation template redesign already worked around.
  return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:${PAPER}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}; padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border:1px solid rgba(13,13,13,.08); border-radius:20px; overflow:hidden;">
        <tr><td style="padding:32px 36px 28px;">
          <div style="font-size:18px; font-weight:700; letter-spacing:-.02em; color:${BLACK}; margin-bottom:28px;">Pepco Lab</div>
          ${bodyHtml}
        </td></tr>
      </table>
      <div style="max-width:520px; margin:20px auto 0; font-size:11px; line-height:1.6; color:rgba(13,13,13,.35); text-align:center;">
        For laboratory and research purposes only. Not for human or veterinary use.<br />
        Pepco Lab · <a href="${SITE_URL}" style="color:rgba(13,13,13,.4);">${SITE_URL.replace(/^https?:\/\//, '')}</a>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

function pillBadge(label: string, color: string): string {
  return `<span style="display:inline-block; font-size:11px; font-weight:700; letter-spacing:.04em; color:${color}; background:${color}1A; padding:6px 14px; border-radius:999px;">${label}</span>`
}

function productRows(products: { title: string; price: number; quantity: number }[], currency: string): string {
  return products
    .map(
      (p) => `
    <tr>
      <td style="padding:10px 0; border-top:1px solid rgba(13,13,13,.06); font-size:14px; color:${BLACK};">
        ${p.title}${p.quantity > 1 ? ` <span style="color:rgba(13,13,13,.4);">× ${p.quantity}</span>` : ''}
      </td>
      <td style="padding:10px 0; border-top:1px solid rgba(13,13,13,.06); font-size:14px; color:${BLACK}; text-align:right; white-space:nowrap;">
        ${currency} ${(p.price * p.quantity).toFixed(2)}
      </td>
    </tr>`
    )
    .join('')
}

export async function sendOrderConfirmationEmail(params: {
  to: string
  orderShortCode: string
  products: { title: string; price: number; quantity: number }[]
  total: number
  currency: string
}) {
  const trackUrl = `${SITE_URL}/track-order`
  const html = emailShell(`
    <div style="margin-bottom:24px;">${pillBadge('✓ Order Confirmed', GREEN)}</div>
    <h1 style="font-size:24px; font-weight:700; letter-spacing:-.02em; color:${BLACK}; margin:0 0 8px;">Thanks for your order.</h1>
    <p style="font-size:14px; line-height:1.6; color:rgba(13,13,13,.6); margin:0 0 24px;">
      We're preparing it now — batch-documented and cold-chain dispatched.
    </p>
    <div style="background:${PAPER}; border-radius:12px; padding:16px 20px; margin-bottom:24px;">
      <div style="font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:rgba(13,13,13,.4); margin-bottom:4px;">Order Number</div>
      <div style="font-size:18px; font-weight:700; letter-spacing:.02em; color:${BLACK}; font-family:'SF Mono',Consolas,monospace;">${params.orderShortCode}</div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${productRows(params.products, params.currency)}
      <tr>
        <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${BLACK};">Total</td>
        <td style="padding:14px 0 0; font-size:14px; font-weight:700; color:${BLACK}; text-align:right;">${params.currency} ${params.total.toFixed(2)}</td>
      </tr>
    </table>
    <a href="${trackUrl}" style="display:block; text-align:center; background:${BLACK}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px; border-radius:999px; margin-top:28px;">
      Track Your Order
    </a>
    <p style="font-size:12px; line-height:1.6; color:rgba(13,13,13,.4); margin:16px 0 0; text-align:center;">
      Keep this order number — you'll need it plus this email address to check status at any time.
    </p>
  `)

  await sendMailSafe({
    to: params.to,
    subject: `Order confirmed — ${params.orderShortCode}`,
    text: `Thanks for your order.\n\nOrder number: ${params.orderShortCode}\nTotal: ${params.currency} ${params.total.toFixed(2)}\n\nTrack your order any time at ${trackUrl} using this order number and the email address you checked out with.`,
    html,
  })
}

export async function sendPaymentFailedEmail(params: {
  to: string
  orderShortCode: string
  failureReason?: string
}) {
  const trackUrl = `${SITE_URL}/track-order`
  const html = emailShell(`
    <div style="margin-bottom:24px;">${pillBadge('Payment Not Completed', '#B91C1C')}</div>
    <h1 style="font-size:24px; font-weight:700; letter-spacing:-.02em; color:${BLACK}; margin:0 0 8px;">Your payment didn't go through.</h1>
    <p style="font-size:14px; line-height:1.6; color:rgba(13,13,13,.6); margin:0 0 24px;">
      No charge was made — if your bank shows a pending hold, it will release automatically. You're welcome to try again with the same or a different card.
    </p>
    <div style="background:${PAPER}; border-radius:12px; padding:16px 20px; margin-bottom:28px;">
      <div style="font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:rgba(13,13,13,.4); margin-bottom:4px;">Order Number</div>
      <div style="font-size:18px; font-weight:700; letter-spacing:.02em; color:${BLACK}; font-family:'SF Mono',Consolas,monospace;">${params.orderShortCode}</div>
    </div>
    <a href="${SITE_URL}/products" style="display:block; text-align:center; background:${BLACK}; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:14px; border-radius:999px; margin-bottom:12px;">
      Try Again
    </a>
    <a href="${trackUrl}" style="display:block; text-align:center; color:rgba(13,13,13,.5); font-size:13px; text-decoration:underline; padding:6px;">
      Check order status
    </a>
  `)

  await sendMailSafe({
    to: params.to,
    subject: `Payment not completed — ${params.orderShortCode}`,
    text: `Your payment didn't go through — no charge was made.\n\nOrder number: ${params.orderShortCode}\n\nYou're welcome to try again: ${SITE_URL}/products\nOr check status any time: ${trackUrl}`,
    html,
  })
}