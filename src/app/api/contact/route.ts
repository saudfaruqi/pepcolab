// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
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

    // ─── USER CONFIRMATION EMAIL (HTML) ───
    const userEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting PepcoLab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f5f4f0;
      padding: 40px 20px;
      line-height: 1.6;
      color: #1a1a1a;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 40px rgba(0,0,0,0.04);
    }
    .header {
      background: #0d0d0d;
      padding: 32px 30px 24px;
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
    .header .check { font-size: 44px; display: block; margin-bottom: 8px; }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .header .sub {
      color: rgba(255,255,255,0.4);
      font-size: 13px;
      margin-top: 4px;
    }
    .content { padding: 32px 30px 28px; }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0d0d0d;
      margin-bottom: 8px;
    }
    .greeting span { color: #2563eb; }
    .body-text {
      font-size: 15px;
      color: rgba(26,26,26,0.7);
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .summary-box {
      background: #f8f7f4;
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
      color: rgba(26,26,26,0.3);
    }
    .summary-box .value {
      font-size: 14px;
      color: #1a1a1a;
      font-weight: 500;
    }
    .next-steps {
      background: #f0f7ff;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .next-steps h4 {
      font-size: 13px;
      font-weight: 700;
      color: #1e40af;
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
      color: rgba(26,26,26,0.6);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .next-steps li::before {
      content: "→";
      color: #2563eb;
      font-weight: 700;
    }
    .divider {
      height: 1px;
      background: rgba(26,26,26,0.06);
      margin: 24px 0;
    }
    .social-links {
      text-align: center;
      margin: 16px 0 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: rgba(26,26,26,0.3);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .footer {
      background: #f8f7f4;
      padding: 20px 30px 24px;
      text-align: center;
      border-top: 1px solid rgba(26,26,26,0.04);
    }
    .footer p {
      font-size: 13px;
      color: rgba(26,26,26,0.4);
      margin: 0;
    }
    .footer .meta {
      font-size: 11px;
      color: rgba(26,26,26,0.25);
      margin-top: 4px;
    }
    @media (max-width: 480px) {
      .header { padding: 24px 20px 18px; }
      .content { padding: 24px 20px 20px; }
      .footer { padding: 16px 20px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="check">✓</span>
      <h1>We've Received Your Message</h1>
      <div class="sub">PepcoLab — Research-Grade Peptides</div>
    </div>
    <div class="content">
      <div class="greeting">Hi ${name.split(' ')[0]} 👋</div>
      <p class="body-text">
        Thank you for reaching out to PepcoLab. We've received your message and
        our team will review it shortly.
      </p>
      <div class="summary-box">
        <div class="label">📝 Your Message</div>
        <div class="value" style="margin-top:4px;"><strong>Subject:</strong> ${subject}</div>
        <div class="value" style="font-weight:400;color:rgba(26,26,26,0.6);margin-top:2px;font-size:13px;">
          ${message.length > 100 ? message.substring(0, 100) + '...' : message}
        </div>
      </div>
      <div class="next-steps">
        <h4>⏳ What Happens Next</h4>
        <ul>
          <li>Our team will review your inquiry within 1 business day</li>
          <li>We'll respond via email to the address you provided</li>
          <li>For urgent matters, feel free to follow up with us</li>
        </ul>
      </div>
      <div class="divider"></div>
      <p style="font-size:14px;color:rgba(26,26,26,0.5);text-align:center;margin:0;">
        In the meantime, explore our resources:
      </p>
      <div class="social-links">
        <a href="https://www.pepcolab.com/products">🔬 Products</a>
        <a href="https://www.pepcolab.com/certificates">📄 COA Library</a>
        <a href="https://www.pepcolab.com/guides">📚 Guides</a>
      </div>
    </div>
    <div class="footer">
      <p>PepcoLab — Research-grade peptides for laboratory use only</p>
      <p class="meta">SEE BEE DEE LIMITED • Companies House #17072052</p>
    </div>
  </div>
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

    // ─── EMAIL CONFIGURATION FROM ENV ───
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpFrom = process.env.SMTP_FROM

    if (!smtpUser || !smtpPass || !smtpFrom) {
      console.error('[Contact API] Missing SMTP configuration')
      return NextResponse.json(
        {
          success: false,
          message: 'Email service is not configured. Please contact support.',
        },
        { status: 500 }
      )
    }

    // ─── WORKING SMTP CONFIGURATION (GoDaddy Out SSL 465) ───
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    })

    // Verify connection
    await transporter.verify()
    console.log('[Contact API] SMTP connection verified')

    // Send admin email
    await transporter.sendMail({
      from: `"PepcoLab" <${smtpFrom}>`,
      to: 'hello@pepcolab.com',
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      text: adminEmailText,
    })
    console.log('[Contact API] Admin email sent')

    // Send user confirmation
    await transporter.sendMail({
      from: `"PepcoLab" <${smtpFrom}>`,
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