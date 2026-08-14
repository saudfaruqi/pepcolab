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

    // Try GoDaddy SMTP
    let mailSent = false
    let lastError: any = null

    // Attempt 1: SMTP with SSL on port 465
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtpout.secureserver.net',
        port: 465,
        secure: true,
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
      
      mailSent = true
    } catch (error: any) {
      lastError = error
      console.error('[Contact API] SMTP attempt 1 failed:', error.message)
    }

    // Attempt 2: SMTP with TLS on port 587
    if (!mailSent) {
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
        
        mailSent = true
      } catch (error: any) {
        lastError = error
        console.error('[Contact API] SMTP attempt 2 failed:', error.message)
      }
    }

    // Attempt 3: Gmail SMTP (if configured)
    if (!mailSent && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        })

        await transporter.sendMail({
          from: `"PepcoLab" <${process.env.GMAIL_USER}>`,
          to: 'hello@pepcolab.com',
          replyTo: email,
          subject: `Website Contact: ${subject}`,
          text: emailBody,
        })
        
        mailSent = true
      } catch (error: any) {
        lastError = error
        console.error('[Contact API] Gmail SMTP failed:', error.message)
      }
    }

    // Attempt 4: Send to PHP fallback (if available)
    if (!mailSent) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pepcolab.com'
        const response = await fetch(`${baseUrl}/api/contact.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, company, subject, message }),
          signal: AbortSignal.timeout(5000),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            mailSent = true
          }
        }
      } catch (error: any) {
        console.error('[Contact API] PHP fallback failed:', error.message)
      }
    }

    if (!mailSent) {
      console.error('[Contact API] All email methods failed:', lastError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unable to send email. Please try again or contact us at hello@pepcolab.com.' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully.',
    })

  } catch (error: any) {
    console.error('[Contact API] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unable to send email. Please try again or contact us at hello@pepcolab.com.' 
      },
      { status: 500 }
    )
  }
}