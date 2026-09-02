// src/app/admin/layout.tsx
//
// Parent of both app/admin/login (public) and app/admin/(protected)/*
// (session-gated). Only job: keep this whole section out of search
// engines. robots.ts also disallows /admin for crawlers that respect it,
// but a page-level noindex covers ones that don't and covers the page
// even if it's ever linked to directly.
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}