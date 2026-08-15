// src/lib/mailer.ts
//
// Shared SMTP sender. Extracted from app/api/contact/route.ts, which had
// this exact config already working in production — reusing it here
// rather than introducing a second email provider/dependency for order
// alerts and the newsletter.
import nodemailer from 'nodemailer'

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP configuration is missing (SMTP_USER/SMTP_PASS)')
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    })
  }
  return cachedTransporter
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
}) {
  const smtpFrom = process.env.SMTP_FROM
  if (!smtpFrom) throw new Error('SMTP configuration is missing (SMTP_FROM)')

  const transporter = getTransporter()
  await transporter.sendMail({
    from: `"PepcoLab" <${smtpFrom}>`,
    to: opts.to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
}

// Best-effort — used for internal alerts where a failed notification
// should never throw and break the caller's actual job (creating an
// order, saving a webhook, etc). Logs loudly instead.
export async function sendMailSafe(opts: Parameters<typeof sendMail>[0]) {
  try {
    await sendMail(opts)
  } catch (err) {
    console.error('[mailer] Failed to send email:', opts.subject, err)
  }
}