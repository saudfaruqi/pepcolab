// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, subject, message } = body

    // ─── VALIDATION ───
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please complete all required fields.' 
        },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid email address.' 
        },
        { status: 400 }
      )
    }

    // ─── LOG THE MESSAGE ───
    console.log('📧 Contact Form Submission:')
    console.log('─────────────────────────────')
    console.log('Name:    ', name)
    console.log('Email:   ', email)
    console.log('Company: ', company || 'N/A')
    console.log('Subject: ', subject)
    console.log('Message: ')
    console.log(message)
    console.log('─────────────────────────────')
    console.log('Timestamp:', new Date().toISOString())

    // ─── TRY TO SEND EMAIL USING SMTP ───
    // This will try to send email but won't fail if it can't
    let emailSent = false
    let emailError = null

    try {
      // Dynamically import nodemailer only if available
      let nodemailer
      try {
        nodemailer = await import('nodemailer')
      } catch (importError) {
        console.log('📦 nodemailer not installed - skipping email send')
        // Continue without email - user gets success response
      }

      if (nodemailer) {
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
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
        })

        await transporter.sendMail({
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
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
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
        })
        emailSent = true
        console.log('✅ Email sent successfully')
      }
    } catch (err: any) {
      emailError = err.message
      console.error('❌ Email send error:', err.message)
      // Don't fail - just log the error
    }

    // ─── RETURN SUCCESS ───
    // Always return success to the user, even if email fails
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Message sent successfully! We\'ll get back to you soon.' 
        : 'Message received! We\'ll get back to you soon.',
    })

  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unable to process request. Please try again.' 
      },
      { status: 500 }
    )
  }
}