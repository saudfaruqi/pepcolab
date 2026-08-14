// app/api/contact/route.ts - Simplified version
import { NextRequest, NextResponse } from 'next/server'

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

    // Send to PHP backend
    const response = await fetch('https://www.pepcolab.com/api/contact.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, company, subject, message }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[Contact API] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to send email. Please try again later.' },
      { status: 500 }
    )
  }
}