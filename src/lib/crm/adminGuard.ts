// src/lib/crm/adminGuard.ts
// Staff session + role for the CRM routes (brief B6 roles).
import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession, ADMIN_COOKIE_NAME, type AdminUser, type AdminRole } from '@/lib/adminAuth'

export function staffFrom(req: NextRequest): AdminUser | null {
  try {
    return getAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value)
  } catch {
    return null
  }
}

/** The staff member if their role is allowed, otherwise a 401/403 response. */
export function requireStaff(req: NextRequest, roles: AdminRole[] = ['owner', 'admin', 'agent']): AdminUser | NextResponse {
  const s = staffFrom(req)
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!roles.includes(s.role)) return NextResponse.json({ error: 'Your role cannot do this.' }, { status: 403 })
  return s
}

export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse
}
