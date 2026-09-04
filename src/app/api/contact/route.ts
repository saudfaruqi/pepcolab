// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

const MAX_SUBMISSIONS = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (isRateLimited('contact', ip, MAX_SUBMISSIONS, WINDOW_MS)) {
      return NextResponse.json(
        { success: false, message: 'Too many messages sent. Please try again later, or email hello@pepcolab.com directly.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { name, email, company, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Please complete all required fields.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address.' },
        { status: 400 }
      )
    }

    // ─── ADMIN EMAIL (plain text) ───
    const adminEmailText = `
New contact form submission

━━━━━━━━━━━━━━━━━━━━━━━━━
Name:    ${name}
Email:   ${email}
Company: ${company || 'Not provided'}
━━━━━━━━━━━━━━━━━━━━━━━━━

Subject:
${subject}

Message:
${message}
━━━━━━━━━━━━━━━━━━━━━━━━━
This message was sent from the PepcoLab contact form.
    `

    // ─── USER CONFIRMATION EMAIL (HTML - Light Theme Only) ───
    const userEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Thank You for Contacting PepcoLab</title>
  <style>
    /* Force light theme */
    :root { color-scheme: light !important; }
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f5f4f0 !important;
      padding: 40px 20px;
      line-height: 1.6;
      color: #1a1a1a !important;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100% !important;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff !important;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 40px rgba(0,0,0,0.04);
    }
    .header {
      /* Was #0d0d0d. The inline style on the element itself is what most
         clients actually honour (many strip <style> blocks entirely), and
         that is already light — but leaving a dark rule in the stylesheet
         means any client that DOES apply it renders dark-on-dark. Both now
         agree. */
      background: #ffffff !important;
      padding: 30px 30px 22px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #2563eb, #7c3aed, #2563eb);
      background-size: 200% 100%;
      animation: shimmer 3s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%, 100% { background-position: 0% 0%; }
      50% { background-position: 100% 0%; }
    }
    .header .check { 
      font-size: 44px; 
      display: block; 
      margin-bottom: 8px; 
      color: #ffffff !important;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff !important;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .header .sub {
      color: rgba(255,255,255,0.4) !important;
      font-size: 13px;
      margin-top: 4px;
    }
    .content { padding: 32px 30px 28px; background: #ffffff !important; }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0d0d0d !important;
      margin-bottom: 8px;
    }
    .greeting span { color: #2563eb !important; }
    .body-text {
      font-size: 15px;
      color: rgba(26,26,26,0.7) !important;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .summary-box {
      background: #f8f7f4 !important;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      border-left: 3px solid #2563eb;
    }
    .summary-box .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(26,26,26,0.3) !important;
    }
    .summary-box .value {
      font-size: 14px;
      color: #1a1a1a !important;
      font-weight: 500;
    }
    .next-steps {
      background: #f0f7ff !important;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .next-steps h4 {
      font-size: 13px;
      font-weight: 700;
      color: #1e40af !important;
      margin: 0 0 8px;
    }
    .next-steps ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .next-steps li {
      padding: 4px 0;
      font-size: 14px;
      color: rgba(26,26,26,0.6) !important;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .next-steps li::before {
      content: "→";
      color: #2563eb !important;
      font-weight: 700;
    }
    .divider {
      height: 1px;
      background: rgba(26,26,26,0.06) !important;
      margin: 24px 0;
    }
    .social-links {
      text-align: center;
      margin: 16px 0 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: rgba(26,26,26,0.3) !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .social-links a:hover {
      color: #2563eb !important;
    }
    .footer {
      background: #f8f7f4 !important;
      padding: 20px 30px 24px;
      text-align: center;
      border-top: 1px solid rgba(26,26,26,0.04);
    }
    .footer p {
      font-size: 13px;
      color: rgba(26,26,26,0.4) !important;
      margin: 0;
    }
    .footer .meta {
      font-size: 11px;
      color: rgba(26,26,26,0.25) !important;
      margin-top: 4px;
    }
    /* Force light background on all elements */
    .container, .content, .summary-box, .next-steps, .footer {
      background-color: #ffffff !important;
    }
    /* Link styles */
    a {
      color: #2563eb !important;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    /* Email client specific fixes */
    .ExternalClass, .ReadMsgBody {
      width: 100%;
      background-color: #f5f4f0 !important;
    }
    .yshortcuts a {
      border-bottom: none !important;
    }
    /* Apple Mail dark mode override.
       NOTE (Sep 2026): this block already forced .header to a white
       background — which, while the header was #0d0d0d with white type, meant
       Apple Mail in dark mode rendered white text on white. The header is
       light now, so the rule and the markup finally agree. */
    @media (prefers-color-scheme: dark) {
      body, .container, .header, .content, .summary-box, .next-steps, .footer {
        background-color: #ffffff !important;
      }
      body, p, h1, h2, h3, h4, div, span, li, .value, .greeting, .sub {
        color: #1a1a1a !important;
      }
    }
    @media (max-width: 480px) {
      .header { padding: 24px 20px 18px; }
      .content { padding: 24px 20px 20px; }
      .footer { padding: 16px 20px 20px; }
    }
  </style>
</head>
<body style="background:#f5f4f0 !important; margin:0; padding:40px 20px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust:100% !important;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f4f0 !important;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <div class="container" style="max-width:580px; margin:0 auto; background:#ffffff !important; border-radius:20px; overflow:hidden; box-shadow:0 4px 40px rgba(0,0,0,0.04);">
          <!-- LIGHT-ONLY (Sep 2026): this header was a solid #0d0d0d banner
               with white type — the only dark block in any customer email, and
               the one most likely to be mangled by a client that re-tints
               backgrounds. Replaced with the gold hairline and light head that
               emailShell uses, so every email the brand sends now looks like it
               came from the same company. -->
          <div style="height:3px; line-height:3px; font-size:0; background:#C8992A;">&nbsp;</div>
          <div class="header" style="background:#ffffff !important; padding:30px 30px 22px; text-align:center;">
            <span class="check" style="font-size:34px; display:block; margin-bottom:10px; color:#0A7B45 !important;">&#10003;</span>
            <h1 style="font-size:23px; font-weight:700; color:#0d0d0d !important; letter-spacing:-0.03em; margin:0;">We&rsquo;ve received your message</h1>
            <div class="sub" style="color:rgba(13,13,13,0.45) !important; font-size:13px; margin-top:5px;">PepcoLab &mdash; research-grade peptides</div>
          </div>
          <div class="content" style="padding:32px 30px 28px; background:#ffffff !important;">
            <div class="greeting" style="font-size:18px; font-weight:600; color:#0d0d0d !important; margin-bottom:8px;">Hi ${name.split(' ')[0]} 👋</div>
            <p class="body-text" style="font-size:15px; color:rgba(26,26,26,0.7) !important; line-height:1.8; margin-bottom:20px;">
              Thank you for reaching out to PepcoLab. We've received your message and
              our team will review it shortly.
            </p>
            <div class="summary-box" style="background:#f8f7f4 !important; border-radius:12px; padding:16px 20px; margin:20px 0; border-left:3px solid #2563eb;">
              <div class="label" style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:rgba(26,26,26,0.3) !important;">📝 Your Message</div>
              <div class="value" style="margin-top:4px; font-size:14px; color:#1a1a1a !important; font-weight:500;">
                <strong>Subject:</strong> ${subject}
              </div>
              <div class="value" style="font-weight:400; color:rgba(26,26,26,0.6) !important; margin-top:2px; font-size:13px;">
                ${message.length > 100 ? message.substring(0, 100) + '...' : message}
              </div>
            </div>
            <div class="next-steps" style="background:#f0f7ff !important; border-radius:12px; padding:16px 20px; margin:20px 0;">
              <h4 style="font-size:13px; font-weight:700; color:#1e40af !important; margin:0 0 8px;">⏳ What Happens Next</h4>
              <ul style="list-style:none; padding:0; margin:0;">
                <li style="padding:4px 0; font-size:14px; color:rgba(26,26,26,0.6) !important; display:flex; align-items:center; gap:8px;">
                  <span style="color:#2563eb !important; font-weight:700;">→</span> Our team will review your inquiry within 1 business day
                </li>
                <li style="padding:4px 0; font-size:14px; color:rgba(26,26,26,0.6) !important; display:flex; align-items:center; gap:8px;">
                  <span style="color:#2563eb !important; font-weight:700;">→</span> We'll respond via email to the address you provided
                </li>
                <li style="padding:4px 0; font-size:14px; color:rgba(26,26,26,0.6) !important; display:flex; align-items:center; gap:8px;">
                  <span style="color:#2563eb !important; font-weight:700;">→</span> For urgent matters, feel free to follow up with us
                </li>
              </ul>
            </div>
            <div class="divider" style="height:1px; background:rgba(26,26,26,0.06) !important; margin:24px 0;"></div>
            <p style="font-size:14px; color:rgba(26,26,26,0.5) !important; text-align:center; margin:0;">
              In the meantime, explore our resources:
            </p>
            <div class="social-links" style="text-align:center; margin:16px 0 0;">
              <a href="https://www.pepcolab.com/products" style="display:inline-block; margin:0 10px; color:rgba(26,26,26,0.3) !important; text-decoration:none; font-size:13px; font-weight:500;">🔬 Products</a>
              <a href="https://www.pepcolab.com/certificates" style="display:inline-block; margin:0 10px; color:rgba(26,26,26,0.3) !important; text-decoration:none; font-size:13px; font-weight:500;">📄 COA Library</a>
              <a href="https://www.pepcolab.com/guides" style="display:inline-block; margin:0 10px; color:rgba(26,26,26,0.3) !important; text-decoration:none; font-size:13px; font-weight:500;">📚 Guides</a>
            </div>
          </div>
          <div class="footer" style="background:#f8f7f4 !important; padding:20px 30px 24px; text-align:center; border-top:1px solid rgba(26,26,26,0.04);">
            <p style="font-size:13px; color:rgba(26,26,26,0.4) !important; margin:0;">PepcoLab — Research-grade peptides for laboratory use only</p>
            <p class="meta" style="font-size:11px; color:rgba(26,26,26,0.25) !important; margin-top:4px;">SEE BEE DEE LIMITED</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // ─── USER CONFIRMATION (plain text fallback) ───
    const userEmailText = `
Hi ${name},

Thank you for contacting PepcoLab. We've received your message and will get back to you within 1 business day.

Subject: ${subject}

Best regards,
PepcoLab Team
    `

    // ─── SEND VIA SHARED MAILER (src/lib/mailer.ts) ───
    // Previously this route built its own nodemailer transporter with an
    // identical GoDaddy SMTP config duplicated from here — lib/mailer.ts
    // was in fact extracted FROM this file for orderEmails.ts/newsletter,
    // but this route itself never got switched over to use it. Doing that
    // now removes the second copy of the SMTP config (one place to update
    // credentials/host, not two that can drift) and gets this route the
    // same error handling as everywhere else.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
      console.error('[Contact API] Missing SMTP configuration')
      return NextResponse.json(
        {
          success: false,
          message: 'Email service is not configured. Please contact support.',
        },
        { status: 500 }
      )
    }

    // Admin email
    await sendMail({
      to: 'hello@pepcolab.com',
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      text: adminEmailText,
    })
    console.log('[Contact API] Admin email sent')

    // User confirmation
    await sendMail({
      to: email,
      subject: `✅ We've Received Your Message - PepcoLab`,
      text: userEmailText,
      html: userEmailHtml,
    })
    console.log('[Contact API] User confirmation sent')

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! Check your email for confirmation.',
    })
  } catch (error: any) {
    console.error('[Contact API] Error:', error)

    let errorMessage = 'Unable to send email. Please try again or contact us at hello@pepcolab.com.'
    
    if (error?.code === 'ETIMEDOUT') {
      errorMessage = 'Connection to email server timed out. Please try again later.'
    } else if (error?.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your email credentials.'
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}