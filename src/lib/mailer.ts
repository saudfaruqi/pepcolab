// src/lib/mailer.ts
//
// Shared SMTP sender. Extracted from app/api/contact/route.ts, which had
// this exact config already working in production — reusing it here
// rather than introducing a second email provider/dependency for order
// alerts and the newsletter.
import nodemailer from 'nodemailer'
import { recordEmail } from '@/lib/emailLog'

// TWO SENDING STREAMS (Oct 2026 clean-up brief, B8).
//
// Marketing goes out from its own subdomain (mail.pepcolab.com) and
// transactional mail from orders.pepcolab.com, so a complaint spike on a
// campaign can never block order emails. Each stream reads its own settings
// and falls back to the original single mailbox (SMTP_*) until the
// subdomains are set up:
//   transactional  ORDERS_SMTP_HOST / _PORT / _USER / _PASS / _FROM
//   marketing      MARKETING_SMTP_HOST / _PORT / _USER / _PASS / _FROM
export type MailStream = 'transactional' | 'marketing'

const transporters = new Map<string, ReturnType<typeof nodemailer.createTransport>>()

function streamConfig(stream: MailStream) {
  const p = stream === 'marketing' ? 'MARKETING_SMTP_' : 'ORDERS_SMTP_'
  const own = Boolean(process.env[`${p}USER`] && process.env[`${p}PASS`])
  return {
    host: (own && process.env[`${p}HOST`]) || process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: Number((own && process.env[`${p}PORT`]) || process.env.SMTP_PORT || 465),
    user: own ? process.env[`${p}USER`]! : process.env.SMTP_USER,
    pass: own ? process.env[`${p}PASS`]! : process.env.SMTP_PASS,
    from: (own && process.env[`${p}FROM`]) || process.env.SMTP_FROM,
  }
}

function getTransporter(stream: MailStream) {
  const cfg = streamConfig(stream)
  if (!cfg.user || !cfg.pass) {
    throw new Error('SMTP configuration is missing (SMTP_USER/SMTP_PASS)')
  }
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`
  let t = transporters.get(key)
  if (!t) {
    t = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    })
    transporters.set(key, t)
  }
  return { transporter: t, from: cfg.from }
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
  /**
   * Extra message headers. Marketing campaigns (lib/marketing) set
   * List-Unsubscribe / List-Unsubscribe-Post here: Gmail and Yahoo require a
   * one-click unsubscribe header on bulk mail, and without it campaigns are
   * far more likely to land in spam or be rejected.
   */
  headers?: Record<string, string>
  /** 'marketing' for campaigns, lifecycle and follow-up emails; default 'transactional'. */
  stream?: MailStream
}) {
  const { transporter, from: smtpFrom } = getTransporter(opts.stream ?? 'transactional')
  if (!smtpFrom) throw new Error('SMTP configuration is missing (SMTP_FROM)')

  // EVERY SEND IS LOGGED (Sep 2026), success or failure.
  //
  // Instrumented here rather than at each call site so nothing can be added
  // later and quietly go unrecorded. The log is best-effort and never
  // throws — see lib/emailLog.ts — so it cannot break a send.
  try {
    await transporter.sendMail({
      from: `"PepcoLab" <${smtpFrom}>`,
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      headers: opts.headers,
    })
    await recordEmail({ to: opts.to, subject: opts.subject, status: 'sent', text: opts.text })
  } catch (err) {
    // Recorded BEFORE rethrowing, so a failure is visible in the admin log
    // even when the caller swallows it.
    await recordEmail({
      to: opts.to,
      subject: opts.subject,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      text: opts.text,
    })
    throw err
  }
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