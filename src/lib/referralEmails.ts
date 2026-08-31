// src/lib/referralEmails.ts
//
// Two customer-facing emails for the referral program, built on the same
// table-based emailShell approach as lib/orderEmails.ts (this is what
// survives Outlook/Gmail clipping without a build step).
import { sendMailSafe } from '@/lib/mailer'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || 'https://www.pepcolab.com'
const BLACK = '#0D0F14'
const BLUE = '#1A56DB'
const PAPER = '#F7F8FA'

function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:${PAPER}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}; padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#ffffff; border:1px solid rgba(13,15,20,.08); border-radius:20px; overflow:hidden;">
        <tr><td style="padding:32px 36px 28px;">
          <div style="font-size:18px; font-weight:700; letter-spacing:-.02em; color:${BLACK}; margin-bottom:28px;">PepcoLab</div>
          ${bodyHtml}
        </td></tr>
      </table>
      <div style="max-width:520px; margin:20px auto 0; font-size:11px; line-height:1.6; color:rgba(13,15,20,.35); text-align:center;">
        For laboratory and research purposes only. Not for human or veterinary use.<br />
        PepcoLab · <a href="${SITE_URL}" style="color:rgba(13,15,20,.4);">${SITE_URL.replace(/^https?:\/\//, '')}</a>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

function codeBlock(code: string): string {
  return `<div style="background:${PAPER}; border:1px dashed rgba(26,86,219,.4); border-radius:12px; padding:16px 20px; text-align:center; margin:20px 0;">
    <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:rgba(13,15,20,.4);">Your code</div>
    <div style="font-size:22px; font-weight:800; letter-spacing:.04em; color:${BLUE}; font-family:'SF Mono',Consolas,monospace; margin-top:4px;">${code}</div>
  </div>`
}

export async function sendReferralWelcomeEmail(params: {
  to: string
  name: string
  code: string
  friendDiscountPercent: number
  rewardPercent: number
}) {
  const referralUrl = `${SITE_URL}/referrals?ref=${encodeURIComponent(params.code)}`
  const firstName = params.name.split(' ')[0] || 'there'

  await sendMailSafe({
    to: params.to,
    subject: `Your PepcoLab referral link is ready`,
    text: `Hi ${firstName},\n\nYour referral code: ${params.code}\nShare link: ${referralUrl}\n\nFriends get ${params.friendDiscountPercent}% off their first order. You get ${params.rewardPercent}% off your next one every time someone orders using your code.\n\n— PepcoLab Team`,
    html: emailShell(`
      <h1 style="font-size:20px; color:${BLACK}; margin:0 0 8px;">You're in, ${firstName} 🎉</h1>
      <p style="font-size:14px; color:rgba(13,15,20,.65); line-height:1.7; margin:0 0 4px;">
        Share your code — every friend who orders gets <strong>${params.friendDiscountPercent}% off</strong> their first order, and you get <strong>${params.rewardPercent}% off</strong> your next one.
      </p>
      ${codeBlock(params.code)}
      <p style="font-size:13px; color:rgba(13,15,20,.5); text-align:center; word-break:break-all;">
        <a href="${referralUrl}" style="color:${BLUE};">${referralUrl}</a>
      </p>
      <div style="text-align:center; margin-top:22px;">
        <a href="${referralUrl}" style="display:inline-block; background:${BLACK}; color:#fff; font-size:13px; font-weight:700; padding:12px 22px; border-radius:999px; text-decoration:none;">Go to your referral page</a>
      </div>
    `),
  })
}

export async function sendReferralRewardEmail(params: {
  to: string
  name: string
  rewardCode: string
  rewardPercent: number
}) {
  const firstName = params.name.split(' ')[0] || 'there'
  await sendMailSafe({
    to: params.to,
    subject: `You earned ${params.rewardPercent}% off — someone just used your PepcoLab code`,
    text: `Hi ${firstName},\n\nSomeone just placed an order using your referral code. As a thank-you, here's a one-time ${params.rewardPercent}% off code for your next order:\n\n${params.rewardCode}\n\nValid for 90 days. Apply it at checkout.\n\n— PepcoLab Team`,
    html: emailShell(`
      <h1 style="font-size:20px; color:${BLACK}; margin:0 0 8px;">Nice — you just earned a reward 🎁</h1>
      <p style="font-size:14px; color:rgba(13,15,20,.65); line-height:1.7; margin:0 0 4px;">
        Someone placed an order using your referral code. Here's <strong>${params.rewardPercent}% off</strong> your next order, on us.
      </p>
      ${codeBlock(params.rewardCode)}
      <p style="font-size:12.5px; color:rgba(13,15,20,.45); text-align:center;">Valid for 90 days · one-time use · applied at checkout</p>
      <div style="text-align:center; margin-top:18px;">
        <a href="${SITE_URL}/products" style="display:inline-block; background:${BLUE}; color:#fff; font-size:13px; font-weight:700; padding:12px 22px; border-radius:999px; text-decoration:none;">Shop now</a>
      </div>
    `),
  })
}
