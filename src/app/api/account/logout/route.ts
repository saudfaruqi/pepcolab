// src/app/api/account/logout/route.ts
import { NextResponse } from 'next/server'
import { CUSTOMER_COOKIE_NAME, sessionCookieOptions } from '@/lib/customerAuth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  // maxAge 0 clears it. Same options object as the set path so the cookie
  // actually matches and is removed rather than shadowed by a second one.
  response.cookies.set(CUSTOMER_COOKIE_NAME, '', sessionCookieOptions(0))
  return response
}