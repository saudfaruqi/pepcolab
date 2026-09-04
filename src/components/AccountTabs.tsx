'use client'
// src/components/AccountTabs.tsx
//
// Navigation across the account area.
//
// Added September 2026 alongside /account/profile. Until now "the account"
// was a single page of orders, so there was nothing to navigate between and
// no signal that anything else existed. As soon as there is more than one
// page, a customer needs to see the whole shape of what's theirs — otherwise
// the profile page is functionally invisible.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/account', label: 'Orders' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/wishlist', label: 'Saved' },
  { href: '/certificates', label: 'Certificates' },
]

export default function AccountTabs() {
  const pathname = usePathname() || ''

  return (
    <nav aria-label="Account sections" style={{ marginBottom: 26 }}>
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto',
        borderBottom: '1px solid rgba(13,13,13,.1)', paddingBottom: 0,
      }}>
        {TABS.map(tab => {
          // Exact match for /account so it isn't left active on every child page.
          const active = tab.href === '/account'
            ? pathname === '/account'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              style={{
                padding: '10px 14px 12px',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? '#0D0D0D' : 'rgba(13,13,13,.5)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                borderBottom: active ? '2px solid #0D0D0D' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}