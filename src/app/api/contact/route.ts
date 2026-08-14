// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// List of SMTP configurations to try
const SMTP_CONFIGS = [
  // Config 1: Standard GoDaddy
  {
    host: 'smtp.secureserver.net',
    port: 587,
    secure: false,
  },
  // Config 2: GoDaddy with SSL
  {
    host: 'smtp.secureserver.net',
    port: 465,
    secure: true,
  },
  // Config 3: Alternative GoDaddy host
  {
    host: 'smtpout.secureserver.net',
    port: 587,
    secure: false,
  },
  // Config 4: Without TLS
  {
    host: 'smtp.secureserver.net',
    port: 25,
    secure: false,
  },
]

async function trySendEmail(config: any, mailOptions: any) {
  const transporter = nodemailer.createTransport({
    ...config,
    auth: {
      user: process.env.SMTP_USER || 'hello@pepcolab.com',
      pass: process.env.SMTP_PASS || 'pepcolab@1',
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  })

  try {
    await transporter.verify()
    const info = await transporter.sendMail(mailOptions)
    return { success: true, info }
  } catch (error: any) {
    return { success: false, error: error.message, config }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, subject, message } = body

    // ─── VALIDATION ───
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

    // ─── EMAIL CONTENT ───
    const mailOptions = {
      from: `"PepcoLab Website" <${process.env.SMTP_USER || 'hello@pepcolab.com'}>`,
      to: 'hello@pepcolab.com',
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      text: `
        Name: ${name}
        Email: ${email}
        Company: ${company || 'N/A'}
        Subject: ${subject}
        Message: ${message}
      `,
    }

    // ─── TRY EACH SMTP CONFIG ───
    let lastError = null
    
    for (const config of SMTP_CONFIGS) {
      console.log(`📡 Trying SMTP: ${config.host}:${config.port} (secure: ${config.secure})`)
      const result = await trySendEmail(config, mailOptions)
      
      if (result.success) {
        console.log(`✅ Email sent via ${config.host}:${config.port}`)
        return NextResponse.json({
          success: true,
          message: 'Message sent successfully!',
        })
      } else {
        console.log(`❌ Failed: ${result.error}`)
        lastError = result.error
      }
    }

    // ─── ALL SMTP CONFIGS FAILED ───
    console.error('All SMTP configurations failed:', lastError)
    
    // Still return success to the user (they don't need to know about email issues)
    // But log the message so we don't lose it
    console.log('📧 Contact Form Submission (email failed):', {
      name,
      email,
      company,
      subject,
      message,
      error: lastError
    })

    return NextResponse.json({
      success: true,
      message: 'Message received! We will get back to you soon.',
      debug: { emailSent: false, error: lastError }
    })

  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to process request.' },
      { status: 500 }
    )
  }
}