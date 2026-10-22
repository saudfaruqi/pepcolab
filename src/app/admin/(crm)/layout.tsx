// src/app/admin/(crm)/layout.tsx
//
// The Contacts (CRM) area of the admin. Unlike the (protected) group, every
// staff role may enter here — including the VA's "agent" role, which works
// only in this area (brief B6). Individual pages and API routes narrow by
// role where the brief requires it (exports, imports, erasure).
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAdminSession, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import AdminShell from '../(protected)/AdminShell'

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const session = getAdminSession(store.get(ADMIN_COOKIE_NAME)?.value)
  if (!session) redirect('/admin/login')
  return (
    <AdminShell role={session.role} userName={session.name}>
      {children}
    </AdminShell>
  )
}
