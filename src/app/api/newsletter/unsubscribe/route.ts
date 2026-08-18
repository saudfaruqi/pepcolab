// src/app/api/newsletter/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken'

const SUBSCRIBERS_KEY = 'newsletter:subscribers'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const email = String(body.email || '').trim().toLowerCase()
  const token = body.token ? String(body.token) : null

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  // Self-serve (typed their own email, no token) is allowed — worst case of
  // someone unsubscribing an email that isn't theirs is that address stops
  // getting marketing mail, which isn't a meaningful harm for an opt-out
  // list. A signed token (from an actual email we sent) is verified when
  // present so one-click links can't be spoofed to unsubscribe someone else
  // just by guessing their address.
  if (token && !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: 'Invalid or expired unsubscribe link.' }, { status: 400 })
  }

  try {
    await redis.zrem(SUBSCRIBERS_KEY, email)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[newsletter unsubscribe] Failed:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}