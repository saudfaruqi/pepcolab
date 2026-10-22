'use client'
// Required research-use confirmation shown directly above every "pay" button
// (brief A10). The checkout function refuses to proceed without it too
// (lib/useStrablCheckout.ts); this is only the visible half.
//
// `children` renders directly underneath — the optional, unticked
// marketing-consent boxes (components/ConsentBoxes.tsx, brief B4). They are
// never required: only this attestation gates checkout.
import type { ReactNode } from 'react'
import { ATTESTATION_TEXT } from '@/lib/attestationText'

interface Props {
  /** ISO time it was ticked, or null when unticked. */
  attestedAt: string | null
  onChange: (attestedAt: string | null) => void
  /** Highlights the box after a blocked checkout attempt. */
  showError?: boolean
  tone?: 'light' | 'drawer'
  children?: ReactNode
}

export default function CheckoutAttestation({ attestedAt, onChange, showError = false, tone = 'light', children }: Props) {
  const id = tone === 'drawer' ? 'attest-drawer' : 'attest-cart'
  const errorOn = showError && !attestedAt
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        htmlFor={id}
        style={{
          display: 'grid',
          gridTemplateColumns: '20px minmax(0,1fr)',
          gap: 10,
          alignItems: 'start',
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${errorOn ? '#E0A1A1' : 'rgba(13,13,13,.12)'}`,
          background: errorOn ? '#FDF3F3' : '#fff',
          cursor: 'pointer',
          fontSize: 12.5,
          lineHeight: 1.55,
          color: 'rgba(13,13,13,.75)',
          textAlign: 'left',
        }}
      >
        <input
          id={id}
          type="checkbox"
          required
          checked={Boolean(attestedAt)}
          onChange={(e) => onChange(e.target.checked ? new Date().toISOString() : null)}
          aria-invalid={errorOn}
          style={{ width: 18, height: 18, margin: '1px 0 0', accentColor: '#0D0D0D' }}
        />
        <span>
          {ATTESTATION_TEXT} <span aria-hidden="true" style={{ color: '#A32D2D' }}>*</span>
        </span>
      </label>
      {errorOn && (
        <p role="alert" style={{ fontSize: 12, color: '#A32D2D', margin: '6px 2px 0' }}>
          Please tick this box to continue to payment.
        </p>
      )}
      {children}
    </div>
  )
}
