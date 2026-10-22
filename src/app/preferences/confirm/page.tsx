// src/app/preferences/confirm/page.tsx
//
// Landing page for the "Yes, email me updates" link at the bottom of order
// emails (clean-up brief B5). It shows the exact wording and records the
// consent only when the customer presses Confirm — a page rather than a bare
// link, so mail scanners that pre-open links cannot opt anyone in.
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ConfirmUpdates from './ConfirmUpdates'

export const metadata: Metadata = {
  title: 'Confirm research updates',
  robots: { index: false, follow: false },
}

export default function ConfirmPreferencesPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F5F1' }}>
      <Nav />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#fff', border: '1px solid rgba(13,13,13,.08)', borderRadius: 20, padding: '36px 32px' }}>
          <Suspense fallback={<p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(13,13,13,.5)' }}>Loading…</p>}>
            <ConfirmUpdates />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
