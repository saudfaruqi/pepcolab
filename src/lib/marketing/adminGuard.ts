// src/lib/marketing/adminGuard.ts
// Same admin session cookie as every other /api/admin route.
import type { NextRequest } from 'next/server'
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

export function isAdmin(req: NextRequest): boolean {
  try {
    return verifySessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch {
    return false
  }
}
