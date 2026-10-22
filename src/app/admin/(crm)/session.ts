// src/app/admin/(crm)/session.ts — the signed-in staff member for CRM server pages.
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAdminSession, ADMIN_COOKIE_NAME, type AdminUser } from '@/lib/adminAuth'

export async function requirePageStaff(): Promise<AdminUser> {
  const store = await cookies()
  const session = getAdminSession(store.get(ADMIN_COOKIE_NAME)?.value)
  if (!session) redirect('/admin/login')
  return session
}
