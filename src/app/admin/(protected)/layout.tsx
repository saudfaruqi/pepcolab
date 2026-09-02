// src/app/admin/(protected)/layout.tsx
//
// Everything under this route group requires a valid admin session. The
// login page lives at app/admin/login/page.tsx — a sibling, NOT inside
// this group — specifically so it isn't wrapped by this check (otherwise
// visiting /admin/login while logged out would redirect to /admin/login,
// forever).
//
// Reads the session cookie directly rather than going through middleware.
// Calling cookies() here opts this route group into dynamic rendering,
// same as certificates/page.tsx does — correct for an admin dashboard
// (it should never be statically cached) and avoids the edge-runtime
// crypto constraints middleware.ts would otherwise impose on
// lib/adminAuth.ts's use of node:crypto.
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import AdminShell from './AdminShell'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE_NAME)?.value
  if (!verifySessionToken(token)) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}