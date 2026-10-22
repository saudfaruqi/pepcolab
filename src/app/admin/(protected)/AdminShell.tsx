// src/app/admin/(protected)/AdminShell.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Mail, LogOut, Star, ShoppingCart, Send, Users, Megaphone, Contact } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Orders', icon: ClipboardList },
  { href: '/admin/contacts', label: 'Contacts', icon: Contact },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/abandoned', label: 'Abandoned', icon: ShoppingCart },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/emails', label: 'Emails', icon: Send },
  { href: '/admin/affiliates', label: 'Affiliates', icon: Users },
]

export default function AdminShell({
  children,
  role = 'owner',
  userName,
}: {
  children: React.ReactNode
  role?: 'owner' | 'admin' | 'agent'
  userName?: string
}) {
  // Agents see the Contacts area only (brief B6).
  const nav = role === 'agent' ? NAV.filter((n) => n.href === '/admin/contacts') : NAV
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } finally {
      window.location.href = '/admin/login'
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <header className="border-b border-[#0D0D0D]/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold text-[#0D0D0D]">
            PepcoLab Admin
            {userName && <span className="ml-2 text-xs font-normal text-[#0D0D0D]/45">{userName} · {role}</span>}
          </div>
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'bg-[#0D0D0D] text-white'
                      : 'text-[#0D0D0D]/60 hover:bg-[#0D0D0D]/5'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-2 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-[#0D0D0D]/60 transition hover:bg-[#0D0D0D]/5 disabled:opacity-40"
            >
              <LogOut size={13} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}