// src/lib/heardFromOptions.ts
// Answers for "How did you hear about us?". Client-safe (no server imports):
// used by /checkout/success and the admin orders table. See lib/heardFrom.ts.

export const HEARD_FROM_OPTIONS: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google search' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'friend', label: 'A friend or colleague' },
  { value: 'forum', label: 'Reddit or a forum' },
  { value: 'returning', label: 'I have ordered before' },
  { value: 'other', label: 'Somewhere else' },
]

export function heardFromLabel(value: string | undefined): string {
  return HEARD_FROM_OPTIONS.find((o) => o.value === value)?.label || value || ''
}
