'use client'
// Optional marketing-consent boxes (clean-up brief B4). Two separate,
// UNTICKED boxes with the exact recorded wording (email-v1, whatsapp-v1 in
// lib/crm/types.ts). Never required for anything. The WhatsApp box is hidden
// when no WhatsApp number is configured.
import { CONSENT_WORDING } from '@/lib/crm/types'
import { isWhatsAppConfigured } from '@/lib/whatsapp'

export interface ConsentChoice {
  email: boolean
  whatsapp: boolean
}

interface Props extends ConsentChoice {
  onChange: (next: ConsentChoice) => void
  idPrefix: string
  disabled?: boolean
  tone?: 'light' | 'card'
}

export default function ConsentBoxes({ email, whatsapp, onChange, idPrefix, disabled = false, tone = 'light' }: Props) {
  const showWa = isWhatsAppConfigured()
  const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '20px minmax(0,1fr)',
    gap: 10,
    alignItems: 'start',
    padding: tone === 'card' ? '4px 0' : '10px 14px',
    borderRadius: 12,
    border: tone === 'card' ? 'none' : '1px solid rgba(13,13,13,.08)',
    background: tone === 'card' ? 'transparent' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 12.5,
    lineHeight: 1.55,
    color: 'rgba(13,13,13,.7)',
    textAlign: 'left',
  }
  const box: React.CSSProperties = { width: 18, height: 18, margin: '1px 0 0', accentColor: '#0D0D0D' }
  return (
    <div role="group" aria-label="Optional updates" style={{ display: 'grid', gap: 8, marginTop: 8 }}>
      <label htmlFor={`${idPrefix}-email`} style={row}>
        <input
          id={`${idPrefix}-email`}
          type="checkbox"
          checked={email}
          disabled={disabled}
          onChange={(e) => onChange({ email: e.target.checked, whatsapp })}
          style={box}
        />
        <span>{CONSENT_WORDING['email-v1']}</span>
      </label>
      {showWa && (
        <label htmlFor={`${idPrefix}-wa`} style={row}>
          <input
            id={`${idPrefix}-wa`}
            type="checkbox"
            checked={whatsapp}
            disabled={disabled}
            onChange={(e) => onChange({ email, whatsapp: e.target.checked })}
            style={box}
          />
          <span>{CONSENT_WORDING['whatsapp-v1']}</span>
        </label>
      )}
    </div>
  )
}
