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

    // Build email content
    const emailSubject = `Website Contact: ${subject}`
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

    // Try SMTP first
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.secureserver.net',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'hello@pepcolab.com',
          pass: process.env.SMTP_PASS || 'pepcolab@1',
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false,
        },
      })

      await transporter.sendMail({
        from: `"PepcoLab" <${process.env.SMTP_FROM || 'hello@pepcolab.com'}>`,
        to: process.env.SMTP_USER || 'hello@pepcolab.com',
        replyTo: email,
        subject: emailSubject,
        text: emailBody,
      })

      return NextResponse.json({
        success: true,
        message: 'Message sent successfully.',
      })
      
    } catch (smtpError: any) {
      console.error('[Contact API] SMTP Error:', smtpError)

      // Fallback to PHP endpoint
      try {
        const phpResponse = await fetch('https://www.pepcolab.com/api/contact.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, company, subject, message }),
        })

        const phpData = await phpResponse.json()

        if (!phpResponse.ok) {
          throw new Error(phpData.message || 'Failed to send email')
        }

        return NextResponse.json(phpData)
        
      } catch (fallbackError: any) {
        console.error('[Contact API] Fallback failed:', fallbackError)
        
        // Final fallback - log the error but return a user-friendly message
        return NextResponse.json(
          { 
            success: false, 
            message: 'Unable to send email. Please try again later or contact us directly at hello@pepcolab.com.' 
          },
          { status: 500 }
        )
      }
    }

  } catch (error: any) {
    console.error('[Contact API] Error:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}