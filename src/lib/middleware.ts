// middleware.ts (at project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const country = request.geo?.country ?? 
    request.headers.get('x-vercel-ip-country') ?? 
    'AE'
  
  const response = NextResponse.next()
  response.headers.set('x-buyer-country', country)
  return response
}

export const config = {
  matcher: ['/((?!_next|favicon|api).*)'],
}