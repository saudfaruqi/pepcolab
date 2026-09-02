// src/app/admin/login/page.tsx
'use client'
import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data.error || 'Incorrect password')
        setStatus('error')
        return
      }
      // Full navigation (not router.push) so the (protected) layout's
      // server-side cookie check runs fresh against the cookie the
      // browser just received, rather than relying on a client-side
      // route transition to pick it up.
      window.location.href = '/admin'
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D0D0D]">
            <Lock size={16} color="#C8992A" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0D0D0D]">PepcoLab Admin</div>
            <div className="text-xs text-[#0D0D0D]/50">Staff access only</div>
          </div>
        </div>

        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[#0D0D0D]/70">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-[#0D0D0D]/15 px-3 py-2.5 text-sm text-[#0D0D0D] outline-none focus:border-[#C8992A]"
          placeholder="••••••••"
        />

        {status === 'error' && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading' || !password}
          className="w-full rounded-full bg-[#0D0D0D] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:opacity-40"
        >
          {status === 'loading' ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}