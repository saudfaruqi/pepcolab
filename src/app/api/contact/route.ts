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

    const emailBody = `
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

    // GoDaddy SMTP Configuration
    const transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net', // Try this instead of smtp.secureserver.net
      port: 465, // Try 465 with SSL instead of 587
      secure: true, // true for 465, false for 587
      auth: {
        user: 'hello@pepcolab.com',
        pass: 'pepcolab@1',
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 30000, // 30 seconds timeout
      socketTimeout: 30000,
    })

    await transporter.sendMail({
      from: '"PepcoLab" <hello@pepcolab.com>',
      to: 'hello@pepcolab.com',
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      text: emailBody,
    })

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully.',
    })

  } catch (error: any) {
    console.error('[Contact API] Error:', error)
    
    // Try alternative SMTP port
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 587,
        secure: false,
        auth: {
          user: 'hello@pepcolab.com',
          pass: 'pepcolab@1',
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
      })

      await transporter.sendMail({
        from: '"PepcoLab" <hello@pepcolab.com>',
        to: 'hello@pepcolab.com',
        replyTo: email,
        subject: `Website Contact: ${subject}`,
        text: emailBody,
      })

      return NextResponse.json({
        success: true,
        message: 'Message sent successfully.',
      })
    } catch (fallbackError: any) {
      console.error('[Contact API] Fallback also failed:', fallbackError)
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unable to send email. Please try again or contact us at hello@pepcolab.com.' 
        },
        { status: 500 }
      )
    }
  }
}