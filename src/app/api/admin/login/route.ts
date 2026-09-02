// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  isAdminAuthConfigured,
  verifyPassword,
  createSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from '@/lib/adminAuth'

// Same shared-secret rate-limit pattern as the rest of the app doesn't
// really apply here (no per-IP limiter wired up yet) — this is a single
// password behind a cookie, not a public-facing form. If this ever gets
// brute-forced in practice, lib/rateLimit.ts already exists and could be
// dropped in here keyed by IP.
export async function POST(req: NextRequest) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: 'Admin login is not configured on the server. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in Vercel.' },
      { status: 500 }
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const password = String(body?.password || '')
  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = createSessionToken()
  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // '/' not '/admin' — the logout route and any future /api/admin/*
    // routes live outside the /admin path prefix and need the cookie too.
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  })

  return NextResponse.json({ success: true })
}