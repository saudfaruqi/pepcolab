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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pepcolab.com'
    
    const response = await fetch(`${baseUrl}/api/contact.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name, email, company, subject, message }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000),
    })

    // Get response text first
    const responseText = await response.text()
    
    // Try to parse as JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[Contact API] Invalid JSON response:', responseText)
      // Return a user-friendly error
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unable to send email. Please try again later.' 
        },
        { status: 500 }
      )
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[Contact API] Error:', error.message)
    
    // Return a user-friendly error
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unable to send email. Please try again later or contact us directly at hello@pepcolab.com.' 
      },
      { status: 500 }
    )
  }
}