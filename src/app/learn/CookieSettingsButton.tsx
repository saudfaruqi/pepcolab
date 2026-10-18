'use client'
// Reopens the consent banner (components/ConsentBanner.tsx listens for this).
export default function CookieSettingsButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event('pepcolab:open-consent'))}>
      Cookie settings
    </button>
  )
}
