// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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

    const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.secureserver.net',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'hello@pepcolab.com',
        pass: process.env.SMTP_PASS || 'pepcolab@1',
    },
    tls: {
        rejectUnauthorized: false,
    },
    })

    // ─── EMAIL CONTENT ───
    const mailOptions = {
      from: `"PepcoLab Website" <hello@pepcolab.com>`,
      to: 'hello@pepcolab.com',
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      text: `
        New contact form submission from PepcoLab website

        ─────────────────────────────
        Contact Details
        ─────────────────────────────
        Name:     ${name}
        Email:    ${email}
        Company:  ${company || 'N/A'}
        ─────────────────────────────
        Subject:
        ${subject}
        ─────────────────────────────
        Message:
        ${message}
        ─────────────────────────────
        Sent from: pepcolab.com
        Date:      ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #1a4d8f; padding-bottom: 12px;">
            New Contact Form Submission
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; width: 100px; background: #f5f5f5;">Name</td>
              <td style="padding: 8px 12px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; background: #f5f5f5;">Email</td>
              <td style="padding: 8px 12px;"><a href="mailto:${email}" style="color: #1a4d8f;">${email}</a></td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; background: #f5f5f5;">Company</td>
              <td style="padding: 8px 12px;">${company}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 12px; font-weight: 600; background: #f5f5f5;">Subject</td>
              <td style="padding: 8px 12px; font-weight: 600;">${subject}</td>
            </tr>
          </table>
          
          <div style="background: #f8f7f4; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Message:</h4>
            <p style="margin: 0; white-space: pre-wrap; color: #555;">${message}</p>
          </div>
          
          <p style="font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 12px; margin-top: 16px;">
            Sent from pepcolab.com on ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })}
          </p>
        </div>
      `,
    }

    // ─── SEND EMAIL ───
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully.',
    })

  } catch (error: any) {
    console.error('Contact form error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Unable to send message. Please try again.'
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your credentials.'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please try again later.'
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Network error. Please check your internet connection.'
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    )
  }
}